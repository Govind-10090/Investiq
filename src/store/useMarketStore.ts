import { create } from "zustand";
import { Asset } from "../types";
import { 
  getStockData, 
  getCryptoPrices, 
  getForexPrices, 
  getMutualFundsData 
} from "../api/clients";
import { wsManager, ConnectionStatus } from "../websocket/manager";
import { useAlertStore } from "./useAlertStore";
import { dbService } from "../firebase/config";

// Debounce timer for continuous asset persistence to Firestore
let syncTimer: any = null;
const debouncedSyncToFirebase = (assets: Asset[]) => {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    dbService.saveMarketAssets(assets);
  }, 4000);
};

export interface MarketState {
  assets: Asset[];
  loading: boolean;
  error: string | null;
  connectionStatus: ConnectionStatus;
  latency: number;
  lastUpdated: Date;
  fetchPrices: () => Promise<void>;
  updatePricesFromWS: () => () => void;
}

export const useMarketStore = create<MarketState>((set, get) => ({
  assets: [],
  loading: false,
  error: null,
  connectionStatus: "disconnected",
  latency: 0,
  lastUpdated: new Date(),

  fetchPrices: async () => {
    try {
      const [stocks, cryptos, forex, mutualFunds] = await Promise.all([
        getStockData(),
        getCryptoPrices(),
        getForexPrices(),
        getMutualFundsData()
      ]);

      const combinedAssets = [...stocks, ...cryptos, ...forex, ...mutualFunds];
      set({ 
        assets: combinedAssets, 
        loading: false,
        lastUpdated: new Date()
      });

      // Continuously persist latest asset data to Firebase database in background
      try {
        dbService.saveMarketAssets(combinedAssets);
      } catch (_) {}
    } catch (e: any) {
      set({ error: "Failed to fetch market rates", loading: false });
    }
  },

  updatePricesFromWS: () => {
    const unsubStatus = wsManager.onStatusChange((status) => {
      set({ 
        connectionStatus: status,
        latency: wsManager.getLatency()
      });
    });

    const unsubMsg = wsManager.onMessage((data: any) => {
      set((state) => {
        let assets = [...state.assets];
        let hasChanges = false;

        if (data.type === "ticker-batch" && data.updates) {
          const updatesMap = new Map<string, { price: number }>();
          data.updates.forEach((u: any) => {
            updatesMap.set(u.symbol, u);
          });

          assets = assets.map(asset => {
            const update = updatesMap.get(asset.symbol);
            if (update) {
              hasChanges = true;
              const newPrice = asset.price * (1 + update.price);
              const changePct = asset.change + update.price * 100;
              return {
                ...asset,
                price: Number(newPrice.toFixed(asset.type === "forex" ? 4 : 2)),
                change: Number(changePct.toFixed(2))
              };
            }
            return asset;
          });
        } else if (data.symbol && data.price !== undefined) {
          assets = assets.map(asset => {
            if (asset.symbol === data.symbol) {
              hasChanges = true;
              const newPrice = asset.price * (1 + data.price);
              const changePct = asset.change + data.price * 100;
              return {
                ...asset,
                price: Number(newPrice.toFixed(asset.type === "forex" ? 4 : 2)),
                change: Number(changePct.toFixed(2))
              };
            }
            return asset;
          });
        }

        if (!hasChanges) return {};

        // Trigger continuous asset persistence to Firebase database
        debouncedSyncToFirebase(assets);

        setTimeout(() => {
          useAlertStore.getState().checkAlerts(assets);
        }, 0);

        return {
          assets,
          lastUpdated: new Date(),
          latency: wsManager.getLatency()
        };
      });
    });

    return () => {
      unsubStatus();
      unsubMsg();
    };
  }
}));
