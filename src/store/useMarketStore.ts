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

export const INITIAL_MARKET_ASSETS: Asset[] = [
  // Stocks
  { symbol: "RELIANCE", name: "Reliance Industries", type: "stock", price: 2456.75, change: 1.01, volume: "2.4M", marketCap: "16.6L Cr", sector: "Energy" },
  { symbol: "TCS", name: "Tata Consultancy Services", type: "stock", price: 3542.30, change: 0.54, volume: "1.2M", marketCap: "13.2L Cr", sector: "Technology" },
  { symbol: "INFY", name: "Infosys Ltd", type: "stock", price: 1456.85, change: 2.26, volume: "1.8M", marketCap: "6.2L Cr", sector: "Technology" },
  { symbol: "HDFCBANK", name: "HDFC Bank Ltd", type: "stock", price: 1685.40, change: -0.74, volume: "3.5M", marketCap: "9.8L Cr", sector: "Financial Services" },
  { symbol: "ICICIBANK", name: "ICICI Bank Ltd", type: "stock", price: 942.60, change: -0.57, volume: "4.1M", marketCap: "6.6L Cr", sector: "Financial Services" },
  { symbol: "SBIN", name: "State Bank of India", type: "stock", price: 598.45, change: -1.24, volume: "6.2M", marketCap: "5.3L Cr", sector: "Financial Services" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel Ltd", type: "stock", price: 1350.20, change: 0.85, volume: "1.9M", marketCap: "8.1L Cr", sector: "Telecommunication" },
  { symbol: "ITC", name: "ITC Ltd", type: "stock", price: 430.50, change: -0.15, volume: "4.8M", marketCap: "5.4L Cr", sector: "Consumer Goods" },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever Ltd", type: "stock", price: 2350.60, change: -0.92, volume: "1.1M", marketCap: "5.5L Cr", sector: "Consumer Goods" },
  { symbol: "LT", name: "Larsen & Toubro Ltd", type: "stock", price: 3450.40, change: 1.15, volume: "1.4M", marketCap: "4.8L Cr", sector: "Construction" },
  { symbol: "TATASTEEL", name: "Tata Steel Ltd", type: "stock", price: 165.20, change: 2.45, volume: "8.5M", marketCap: "2.1L Cr", sector: "Metals" },
  { symbol: "MARUTI", name: "Maruti Suzuki India Ltd", type: "stock", price: 12450.80, change: 0.35, volume: "0.3M", marketCap: "3.9L Cr", sector: "Automotive" },
  { symbol: "TATAMOTORS", name: "Tata Motors Ltd", type: "stock", price: 950.40, change: 1.82, volume: "3.1M", marketCap: "3.2L Cr", sector: "Automotive" },
  { symbol: "WIPRO", name: "Wipro Ltd", type: "stock", price: 460.70, change: -0.45, volume: "2.2M", marketCap: "2.4L Cr", sector: "Technology" },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank Ltd", type: "stock", price: 1720.50, change: -0.85, volume: "1.6M", marketCap: "3.4L Cr", sector: "Financial Services" },
  { symbol: "AXISBANK", name: "Axis Bank Ltd", type: "stock", price: 1050.40, change: 0.12, volume: "2.9M", marketCap: "3.2L Cr", sector: "Financial Services" },
  { symbol: "ASIANPAINT", name: "Asian Paints Ltd", type: "stock", price: 2850.60, change: -1.05, volume: "0.8M", marketCap: "2.7L Cr", sector: "Consumer Goods" },
  { symbol: "BAJFINANCE", name: "Bajaj Finance Ltd", type: "stock", price: 6850.20, change: 0.95, volume: "0.9M", marketCap: "4.2L Cr", sector: "Financial Services" },
  { symbol: "SUNPHARMA", name: "Sun Pharmaceutical Industries Ltd", type: "stock", price: 1540.30, change: 1.25, volume: "1.2M", marketCap: "3.7L Cr", sector: "Healthcare" },
  { symbol: "ADANIENT", name: "Adani Enterprises Ltd", type: "stock", price: 3120.40, change: -2.15, volume: "2.5M", marketCap: "3.5L Cr", sector: "Conglomerate" },
  { symbol: "HCLTECH", name: "HCL Technologies Ltd", type: "stock", price: 1320.50, change: 0.65, volume: "1.5M", marketCap: "3.6L Cr", sector: "Technology" },
  { symbol: "NIFTY_50", name: "NIFTY 50", type: "stock", price: 22450.30, change: 0.65, volume: "N/A", marketCap: "N/A", sector: "Index" },
  { symbol: "SENSEX", name: "SENSEX", type: "stock", price: 73850.50, change: 0.58, volume: "N/A", marketCap: "N/A", sector: "Index" },
  { symbol: "BANK_NIFTY", name: "BANK NIFTY", type: "stock", price: 47850.80, change: -0.15, volume: "N/A", marketCap: "N/A", sector: "Index" },

  // Crypto
  { symbol: "BTC", name: "Bitcoin", type: "crypto", price: 67450.00, change: 2.45, volume: "$32.4B", marketCap: "$1.3T" },
  { symbol: "ETH", name: "Ethereum", type: "crypto", price: 3510.50, change: 1.82, volume: "$18.1B", marketCap: "$420B" },
  { symbol: "SOL", name: "Solana", type: "crypto", price: 165.20, change: 5.64, volume: "$3.8B", marketCap: "$75B" },
  { symbol: "XRP", name: "Ripple", type: "crypto", price: 0.52, change: -1.05, volume: "$850M", marketCap: "$28B" },
  { symbol: "DOGE", name: "Dogecoin", type: "crypto", price: 0.14, change: -3.20, volume: "$1.2B", marketCap: "$20B" },
  { symbol: "BNB", name: "Binance Coin", type: "crypto", price: 585.60, change: 0.45, volume: "$1.6B", marketCap: "$86B" },

  // Forex
  { symbol: "USD/INR", name: "US Dollar / Indian Rupee", type: "forex", price: 83.42, change: 0.05, volume: "N/A" },
  { symbol: "EUR/INR", name: "Euro / Indian Rupee", type: "forex", price: 90.25, change: -0.12, volume: "N/A" },
  { symbol: "GBP/INR", name: "Pound Sterling / Indian Rupee", type: "forex", price: 106.12, change: 0.18, volume: "N/A" },
  { symbol: "JPY/INR", name: "Japanese Yen / Indian Rupee", type: "forex", price: 0.53, change: -0.45, volume: "N/A" },

  // Mutual Funds
  { symbol: "AXIS_BLUE", name: "Axis Bluechip Fund", type: "mutual_fund", price: 52.3, change: 0.12, volume: "N/A", marketCap: "45,234 Cr", sector: "Large Cap" },
  { symbol: "SBI_SMALL", name: "SBI Small Cap Fund", type: "mutual_fund", price: 96.8, change: 0.45, volume: "N/A", marketCap: "28,456 Cr", sector: "Small Cap" },
  { symbol: "ICICI_TECH", name: "ICICI Prudential Technology Fund", type: "mutual_fund", price: 145.6, change: -0.22, volume: "N/A", marketCap: "15,678 Cr", sector: "Sectoral" },
  { symbol: "HDFC_MID", name: "HDFC Mid-Cap Opportunities Fund", type: "mutual_fund", price: 178.4, change: 0.08, volume: "N/A", marketCap: "32,890 Cr", sector: "Mid Cap" },
  { symbol: "MIRAE_LARGE", name: "Mirae Asset Large Cap Fund", type: "mutual_fund", price: 85.2, change: 0.15, volume: "N/A", marketCap: "38,567 Cr", sector: "Large Cap" },
  { symbol: "PP_FLEXI", name: "Parag Parikh Flexi Cap Fund", type: "mutual_fund", price: 65.8, change: 0.31, volume: "N/A", marketCap: "52,123 Cr", sector: "Flexi Cap" },
  { symbol: "KOTAK_EMERG", name: "Kotak Emerging Equity Fund", type: "mutual_fund", price: 72.3, change: -0.05, volume: "N/A", marketCap: "18,234 Cr", sector: "Mid Cap" },
  { symbol: "SBI_HYBRID", name: "SBI Equity Hybrid Fund", type: "mutual_fund", price: 198.5, change: 0.02, volume: "N/A", marketCap: "42,567 Cr", sector: "Hybrid" }
];

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
  assets: INITIAL_MARKET_ASSETS,
  loading: false,
  error: null,
  connectionStatus: "connected",
  latency: 18,
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

          if (hasChanges) {
            useAlertStore.getState().checkAlerts(assets);
          }
        }

        return {
          assets,
          lastUpdated: new Date()
        };
      });
    });

    return () => {
      unsubStatus();
      unsubMsg();
    };
  }
}));
