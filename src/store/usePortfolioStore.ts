import { create } from "zustand";
import { PortfolioHolding, Asset, Transaction } from "../types";
import { dbService } from "../firebase/config";
import { getMockDB } from "../services/mockDb";

export interface PortfolioState {
  holdings: PortfolioHolding[];
  transactions: Transaction[];
  loading: boolean;
  activeSubscription: (() => void) | null;
  fetchHoldings: (uid: string) => Promise<void>;
  addHolding: (uid: string, asset: Asset, shares: number, price: number) => Promise<void>;
  sellHolding: (uid: string, symbol: string, shares: number, price: number) => Promise<void>;
  deleteHolding: (uid: string, holdingId: string) => Promise<void>;
  fetchTransactions: (uid: string) => Promise<void>;
}

// Get initial cached holdings for any active session
const getInitialHoldingsAndTxs = () => {
  try {
    const cachedUserStr = localStorage.getItem("investiq_cached_user") || localStorage.getItem("investiq_mock_current_user");
    const cachedUser = cachedUserStr ? JSON.parse(cachedUserStr) : null;
    const db = getMockDB();
    
    // Check by UID, Email, or Guest
    const uid = cachedUser?.uid;
    const email = cachedUser?.email;

    const holdings = (uid && db.holdings[uid]) || (email && db.holdings[email]) || db.holdings["guest"] || [];
    const transactions = (uid && db.transactions[uid]) || (email && db.transactions[email]) || db.transactions["guest"] || [];

    return { holdings, transactions };
  } catch {
    return { holdings: [], transactions: [] };
  }
};

export const usePortfolioStore = create<PortfolioState>((set, get) => {
  const initial = getInitialHoldingsAndTxs();

  return {
    holdings: initial.holdings,
    transactions: initial.transactions,
    loading: false,
    activeSubscription: null,

    fetchHoldings: async (uid) => {
      if (!uid) return;
      set({ loading: true });

      // Clean up any existing realtime listener
      if (get().activeSubscription) {
        get().activeSubscription!();
      }

      try {
        // 1. Initial fetch from local DB + Firestore
        const [holdings, transactions] = await Promise.all([
          dbService.getHoldings(uid),
          dbService.getTransactions(uid)
        ]);

        if (holdings && holdings.length > 0) {
          set({ holdings, transactions, loading: false });
        } else {
          // If empty, keep existing cached holdings if present
          set((state) => ({
            holdings: state.holdings.length > 0 ? state.holdings : (holdings || []),
            transactions: state.transactions.length > 0 ? state.transactions : (transactions || []),
            loading: false
          }));
        }

        // 2. Set up continuous real-time Firestore synchronization
        const unsubHoldings = dbService.subscribeHoldings(uid, (newHoldings) => {
          if (newHoldings && newHoldings.length > 0) {
            set({ holdings: newHoldings });
          }
        });

        const unsubTx = dbService.subscribeTransactions(uid, (newTx) => {
          if (newTx && newTx.length > 0) {
            set({ transactions: newTx });
          }
        });

        set({
          activeSubscription: () => {
            unsubHoldings();
            unsubTx();
          }
        });
      } catch (e) {
        set({ loading: false });
      }
    },

    fetchTransactions: async (uid) => {
      if (!uid) return;
      try {
        const transactions = await dbService.getTransactions(uid);
        if (transactions && transactions.length > 0) {
          set({ transactions });
        }
      } catch (e) {
        // Handled
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

      // Create a transaction audit entry
      const newTransaction: Transaction = {
        id: `tx-buy-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        type: "buy",
        symbol: asset.symbol,
        name: asset.name,
        assetType: asset.type,
        shares,
        price,
        date: new Date().toISOString()
      };

      // 1. Instant optimistic state update
      const newHoldings = existing
        ? get().holdings.map(h => (h.symbol === asset.symbol ? updatedHolding : h))
        : [...get().holdings, updatedHolding];

      set({ 
        holdings: newHoldings,
        transactions: [newTransaction, ...get().transactions]
      });

      // 2. Continuously persist holding and transaction to Firebase Firestore & local storage
      try {
        await Promise.all([
          dbService.saveHolding(uid, updatedHolding),
          dbService.saveTransaction(uid, newTransaction)
        ]);
      } catch (err) {
        console.error("InvestIQ: Failed to persist holding/transaction to Firebase:", err);
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

      const sellTransaction: Transaction = {
        id: `tx-sell-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        type: "sell",
        symbol: existing.symbol,
        name: existing.name,
        assetType: existing.type,
        shares,
        price,
        date: new Date().toISOString()
      };

      // Instant optimistic state update
      set({ 
        holdings: newHoldings,
        transactions: [sellTransaction, ...get().transactions]
      });

      try {
        const promises: Promise<any>[] = [
          dbService.saveTransaction(uid, sellTransaction)
        ];

        if (isDelete) {
          promises.push(dbService.deleteHolding(uid, existing.id));
        } else if (updatedHolding) {
          promises.push(dbService.saveHolding(uid, updatedHolding));
        }

        await Promise.all(promises);
      } catch (err) {
        console.error("InvestIQ: Failed to persist sell/transaction to Firebase:", err);
      }
    },

    deleteHolding: async (uid, holdingId) => {
      // Instant optimistic state update
      set({ holdings: get().holdings.filter(h => h.id !== holdingId) });
      try {
        await dbService.deleteHolding(uid, holdingId);
      } catch (err) {
        console.error("InvestIQ: Failed to delete holding from Firebase:", err);
      }
    }
  };
});
