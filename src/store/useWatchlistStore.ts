import { create } from "zustand";
import { Watchlist } from "../types";
import { dbService } from "../firebase/config";

export interface WatchlistState {
  watchlists: Watchlist[];
  loading: boolean;
  activeSubscription: (() => void) | null;
  fetchWatchlists: (uid: string) => Promise<void>;
  createWatchlist: (uid: string, name: string) => Promise<void>;
  addAsset: (uid: string, listId: string, symbol: string) => Promise<void>;
  removeAsset: (uid: string, listId: string, symbol: string) => Promise<void>;
  deleteWatchlist: (uid: string, listId: string) => Promise<void>;
  pinWatchlist: (uid: string, listId: string) => Promise<void>;
}

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  watchlists: [],
  loading: false,
  activeSubscription: null,

  fetchWatchlists: async (uid) => {
    set({ loading: true });

    if (get().activeSubscription) {
      get().activeSubscription!();
    }

    try {
      let lists = await dbService.getWatchlists(uid);
      if (lists.length === 0) {
        // Create a default watchlist
        const defaultList: Watchlist = {
          id: `default-${Date.now()}`,
          name: "My Watchlist",
          assets: ["RELIANCE", "BTC", "ETH", "USD/INR"],
          isPinned: true
        };
        await dbService.saveWatchlist(uid, defaultList);
        lists = [defaultList];
      }
      set({ watchlists: lists, loading: false });

      // Continuous Firestore Realtime Synchronization
      const unsub = dbService.subscribeWatchlists(uid, (newLists) => {
        set({ watchlists: newLists });
      });
      set({ activeSubscription: unsub });
    } catch (e) {
      set({ loading: false });
    }
  },

  createWatchlist: async (uid, name) => {
    const newList: Watchlist = {
      id: `watchlist-${Date.now()}`,
      name,
      assets: [],
      isPinned: false
    };
    // Instant optimistic update
    set({ watchlists: [...get().watchlists, newList] });
    // Continuous persistence
    await dbService.saveWatchlist(uid, newList);
  },

  addAsset: async (uid, listId, symbol) => {
    const list = get().watchlists.find(w => w.id === listId);
    if (list && !list.assets.includes(symbol)) {
      const updated = { ...list, assets: [...list.assets, symbol] };
      // Instant optimistic update
      set({ watchlists: get().watchlists.map(w => w.id === listId ? updated : w) });
      // Continuous persistence
      await dbService.saveWatchlist(uid, updated);
    }
  },

  removeAsset: async (uid, listId, symbol) => {
    const list = get().watchlists.find(w => w.id === listId);
    if (list) {
      const updated = { ...list, assets: list.assets.filter(s => s !== symbol) };
      // Instant optimistic update
      set({ watchlists: get().watchlists.map(w => w.id === listId ? updated : w) });
      // Continuous persistence
      await dbService.saveWatchlist(uid, updated);
    }
  },

  deleteWatchlist: async (uid, listId) => {
    // Instant optimistic update
    set({ watchlists: get().watchlists.filter(w => w.id !== listId) });
    // Continuous persistence
    await dbService.deleteWatchlist(uid, listId);
  },

  pinWatchlist: async (uid, listId) => {
    const watchlists = get().watchlists.map(w => {
      if (w.id === listId) {
        const updated = { ...w, isPinned: !w.isPinned };
        dbService.saveWatchlist(uid, updated);
        return updated;
      }
      return w;
    });
    set({ watchlists });
  }
}));
