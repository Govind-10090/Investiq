import { create } from "zustand";
import { Watchlist } from "../types";
import { dbService } from "../firebase/config";

export interface WatchlistState {
  watchlists: Watchlist[];
  loading: boolean;
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
  fetchWatchlists: async (uid) => {
    set({ loading: true });
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
    await dbService.saveWatchlist(uid, newList);
    set({ watchlists: [...get().watchlists, newList] });
  },
  addAsset: async (uid, listId, symbol) => {
    const list = get().watchlists.find(w => w.id === listId);
    if (list && !list.assets.includes(symbol)) {
      const updated = { ...list, assets: [...list.assets, symbol] };
      await dbService.saveWatchlist(uid, updated);
      set({ watchlists: get().watchlists.map(w => w.id === listId ? updated : w) });
    }
  },
  removeAsset: async (uid, listId, symbol) => {
    const list = get().watchlists.find(w => w.id === listId);
    if (list) {
      const updated = { ...list, assets: list.assets.filter(s => s !== symbol) };
      await dbService.saveWatchlist(uid, updated);
      set({ watchlists: get().watchlists.map(w => w.id === listId ? updated : w) });
    }
  },
  deleteWatchlist: async (uid, listId) => {
    await dbService.deleteWatchlist(uid, listId);
    set({ watchlists: get().watchlists.filter(w => w.id !== listId) });
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
