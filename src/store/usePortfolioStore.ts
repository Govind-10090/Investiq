import { create } from "zustand";
import { PortfolioHolding, Asset, Transaction } from "../types";
import { dbService } from "../firebase/config";

export interface PortfolioState {
  holdings: PortfolioHolding[];
  transactions: Transaction[];
  loading: boolean;
  fetchHoldings: (uid: string) => Promise<void>;
  addHolding: (uid: string, asset: Asset, shares: number, price: number) => Promise<void>;
  sellHolding: (uid: string, symbol: string, shares: number, price: number) => Promise<void>;
  deleteHolding: (uid: string, holdingId: string) => Promise<void>;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  holdings: [],
  transactions: [],
  loading: false,
  fetchHoldings: async (uid) => {
    set({ loading: true });
    try {
      const holdings = await dbService.getHoldings(uid);
      set({ holdings, loading: false });
    } catch (e) {
      set({ loading: false });
    }
  },
  addHolding: async (uid, asset, shares, price) => {
    const existing = get().holdings.find(h => h.symbol === asset.symbol);
    let updatedHolding: PortfolioHolding;

    if (existing) {
      const totalShares = existing.shares + shares;
      const totalCost = (existing.shares * existing.avgPrice) + (shares * price);
      updatedHolding = {
        ...existing,
        shares: totalShares,
        avgPrice: Number((totalCost / totalShares).toFixed(2)),
        currentPrice: asset.price,
        value: Number((totalShares * asset.price).toFixed(2))
      };
    } else {
      updatedHolding = {
        id: `${asset.symbol}-${Date.now()}`,
        symbol: asset.symbol,
        name: asset.name,
        type: asset.type,
        shares,
        avgPrice: price,
        currentPrice: asset.price,
        value: Number((shares * asset.price).toFixed(2)),
        sector: asset.sector || "General",
        dateAdded: new Date().toISOString()
      };
    }

    // 1. Optimistic instant state update in memory
    const newHoldings = existing
      ? get().holdings.map(h => (h.symbol === asset.symbol ? updatedHolding : h))
      : [...get().holdings, updatedHolding];

    set({ holdings: newHoldings });

    // 2. Asynchronously persist to Firestore / MockDB without blocking the UI
    try {
      await dbService.saveHolding(uid, updatedHolding);
    } catch (err) {
      console.error("InvestIQ: Failed to persist holding to database:", err);
    }
  },
  sellHolding: async (uid, symbol, shares, price) => {
    const existing = get().holdings.find(h => h.symbol === symbol);
    if (!existing || existing.shares < shares) {
      throw new Error("Insufficient shares");
    }

    let newHoldings: PortfolioHolding[];
    let isDelete = false;
    let updatedHolding: PortfolioHolding | null = null;

    if (existing.shares === shares) {
      newHoldings = get().holdings.filter(h => h.symbol !== symbol);
      isDelete = true;
    } else {
      const remainingShares = existing.shares - shares;
      updatedHolding = {
        ...existing,
        shares: remainingShares,
        value: Number((remainingShares * existing.currentPrice).toFixed(2))
      };
      newHoldings = get().holdings.map(h => (h.symbol === symbol ? updatedHolding! : h));
    }

    // Optimistic instant state update
    set({ holdings: newHoldings });

    try {
      if (isDelete) {
        await dbService.deleteHolding(uid, existing.id);
      } else if (updatedHolding) {
        await dbService.saveHolding(uid, updatedHolding);
      }
    } catch (err) {
      console.error("InvestIQ: Failed to persist sell to database:", err);
    }
  },
  deleteHolding: async (uid, holdingId) => {
    // Optimistic instant state update
    set({ holdings: get().holdings.filter(h => h.id !== holdingId) });
    try {
      await dbService.deleteHolding(uid, holdingId);
    } catch (err) {
      console.error("InvestIQ: Failed to delete holding from database:", err);
    }
  }
}));
