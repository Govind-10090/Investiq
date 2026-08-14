import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  deleteDoc,
  onSnapshot,
  orderBy,
  limit
} from "firebase/firestore";
import { firebaseDb, isLiveFirebase } from "../firebase/config";
import { getMockDB, saveMockDB } from "./mockDb";
import { Asset, PortfolioHolding, Transaction, PriceAlert, Watchlist } from "../types";

export const dbService = {
  // ==========================================
  // 1. WATCHLISTS (Continuous Sync)
  // ==========================================
  getWatchlists: async (userId: string): Promise<Watchlist[]> => {
    if (isLiveFirebase) {
      try {
        const q = query(collection(firebaseDb, "watchlists"), where("userId", "==", userId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Watchlist));
      } catch (e) {
        console.warn("Firestore getWatchlists failed, using local cache:", e);
      }
    }
    const db = getMockDB();
    return db.watchlists[userId] || [];
  },

  saveWatchlist: async (userId: string, watchlist: any): Promise<void> => {
    // 1. Always keep local/mock DB updated
    const db = getMockDB();
    if (!db.watchlists[userId]) db.watchlists[userId] = [];
    const index = db.watchlists[userId].findIndex(w => w.id === watchlist.id);
    if (index >= 0) {
      db.watchlists[userId][index] = watchlist;
    } else {
      db.watchlists[userId].push(watchlist);
    }
    saveMockDB(db);

    // 2. Persist to Firebase Firestore
    if (isLiveFirebase) {
      try {
        const docRef = doc(firebaseDb, "watchlists", watchlist.id);
        await setDoc(docRef, { ...watchlist, userId, updatedAt: new Date().toISOString() });
      } catch (e) {
        console.warn("Firestore saveWatchlist error:", e);
      }
    }
  },

  deleteWatchlist: async (userId: string, watchlistId: string): Promise<void> => {
    const db = getMockDB();
    if (db.watchlists[userId]) {
      db.watchlists[userId] = db.watchlists[userId].filter(w => w.id !== watchlistId);
      saveMockDB(db);
    }

    if (isLiveFirebase) {
      try {
        await deleteDoc(doc(firebaseDb, "watchlists", watchlistId));
      } catch (e) {
        console.warn("Firestore deleteWatchlist error:", e);
      }
    }
  },

  subscribeWatchlists: (userId: string, onUpdate: (watchlists: Watchlist[]) => void): (() => void) => {
    if (isLiveFirebase) {
      try {
        const q = query(collection(firebaseDb, "watchlists"), where("userId", "==", userId));
        return onSnapshot(q, (snapshot) => {
          const lists = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Watchlist));
          if (lists.length > 0) {
            onUpdate(lists);
          }
        }, (error) => {
          console.warn("Watchlists live subscription warning:", error);
        });
      } catch (e) {
        console.warn("Firestore subscribeWatchlists failed:", e);
      }
    }
    return () => {};
  },

  // ==========================================
  // 2. HOLDINGS / PORTFOLIOS (Continuous Sync)
  // ==========================================
  getHoldings: async (userId: string): Promise<PortfolioHolding[]> => {
    if (isLiveFirebase) {
      try {
        const q = query(collection(firebaseDb, "holdings"), where("userId", "==", userId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PortfolioHolding));
      } catch (e) {
        console.warn("Firestore getHoldings failed, using local cache:", e);
      }
    }
    const db = getMockDB();
    return db.holdings[userId] || [];
  },

  saveHolding: async (userId: string, holding: PortfolioHolding): Promise<void> => {
    // 1. Keep local cache updated
    const db = getMockDB();
    if (!db.holdings[userId]) db.holdings[userId] = [];
    const index = db.holdings[userId].findIndex(h => h.id === holding.id || h.symbol === holding.symbol);
    if (index >= 0) {
      db.holdings[userId][index] = holding;
    } else {
      db.holdings[userId].push(holding);
    }
    saveMockDB(db);

    // 2. Persist to Firestore
    if (isLiveFirebase) {
      try {
        const docRef = doc(firebaseDb, "holdings", holding.id);
        await setDoc(docRef, { ...holding, userId, updatedAt: new Date().toISOString() });
      } catch (e) {
        console.warn("Firestore saveHolding error:", e);
      }
    }
  },

  deleteHolding: async (userId: string, holdingId: string): Promise<void> => {
    const db = getMockDB();
    if (db.holdings[userId]) {
      db.holdings[userId] = db.holdings[userId].filter(h => h.id !== holdingId);
      saveMockDB(db);
    }

    if (isLiveFirebase) {
      try {
        await deleteDoc(doc(firebaseDb, "holdings", holdingId));
      } catch (e) {
        console.warn("Firestore deleteHolding error:", e);
      }
    }
  },

  subscribeHoldings: (userId: string, onUpdate: (holdings: PortfolioHolding[]) => void): (() => void) => {
    if (isLiveFirebase) {
      try {
        const q = query(collection(firebaseDb, "holdings"), where("userId", "==", userId));
        return onSnapshot(q, (snapshot) => {
          const holdings = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PortfolioHolding));
          if (holdings.length > 0) {
            onUpdate(holdings);
          }
        }, (error) => {
          console.warn("Holdings live subscription warning:", error);
        });
      } catch (e) {
        console.warn("Firestore subscribeHoldings failed:", e);
      }
    }
    return () => {};
  },

  // ==========================================
  // 3. TRANSACTIONS LOG (Continuous Sync)
  // ==========================================
  getTransactions: async (userId: string): Promise<Transaction[]> => {
    if (isLiveFirebase) {
      try {
        const q = query(
          collection(firebaseDb, "transactions"), 
          where("userId", "==", userId),
          orderBy("date", "desc"),
          limit(100)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
      } catch (e) {
        // Fallback without orderBy in case composite index is building
        try {
          const fallbackQ = query(collection(firebaseDb, "transactions"), where("userId", "==", userId));
          const snap = await getDocs(fallbackQ);
          return snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
        } catch (_) {}
      }
    }
    const db = getMockDB();
    return db.transactions[userId] || [];
  },

  saveTransaction: async (userId: string, transaction: Transaction): Promise<void> => {
    const db = getMockDB();
    if (!db.transactions[userId]) db.transactions[userId] = [];
    db.transactions[userId].unshift(transaction);
    saveMockDB(db);

    if (isLiveFirebase) {
      try {
        const docRef = doc(firebaseDb, "transactions", transaction.id);
        await setDoc(docRef, { ...transaction, userId, recordedAt: new Date().toISOString() });
      } catch (e) {
        console.warn("Firestore saveTransaction error:", e);
      }
    }
  },

  subscribeTransactions: (userId: string, onUpdate: (txs: Transaction[]) => void): (() => void) => {
    if (isLiveFirebase) {
      try {
        const q = query(collection(firebaseDb, "transactions"), where("userId", "==", userId));
        return onSnapshot(q, (snapshot) => {
          const txs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
          onUpdate(txs);
        });
      } catch (e) {
        console.warn("Firestore subscribeTransactions failed:", e);
      }
    }
    return () => {};
  },

  // ==========================================
  // 4. ALERTS (Continuous Sync)
  // ==========================================
  getAlerts: async (userId: string): Promise<PriceAlert[]> => {
    if (isLiveFirebase) {
      try {
        const q = query(collection(firebaseDb, "alerts"), where("userId", "==", userId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PriceAlert));
      } catch (e) {
        console.warn("Firestore getAlerts failed, using local cache:", e);
      }
    }
    const db = getMockDB();
    return db.alerts[userId] || [];
  },

  saveAlert: async (userId: string, alert: any): Promise<void> => {
    const db = getMockDB();
    if (!db.alerts[userId]) db.alerts[userId] = [];
    const index = db.alerts[userId].findIndex(a => a.id === alert.id);
    if (index >= 0) {
      db.alerts[userId][index] = alert;
    } else {
      db.alerts[userId].push(alert);
    }
    saveMockDB(db);

    if (isLiveFirebase) {
      try {
        const docRef = doc(firebaseDb, "alerts", alert.id);
        await setDoc(docRef, { ...alert, userId, updatedAt: new Date().toISOString() });
      } catch (e) {
        console.warn("Firestore saveAlert error:", e);
      }
    }
  },

  deleteAlert: async (userId: string, alertId: string): Promise<void> => {
    const db = getMockDB();
    if (db.alerts[userId]) {
      db.alerts[userId] = db.alerts[userId].filter(a => a.id !== alertId);
      saveMockDB(db);
    }

    if (isLiveFirebase) {
      try {
        await deleteDoc(doc(firebaseDb, "alerts", alertId));
      } catch (e) {
        console.warn("Firestore deleteAlert error:", e);
      }
    }
  },

  subscribeAlerts: (userId: string, onUpdate: (alerts: PriceAlert[]) => void): (() => void) => {
    if (isLiveFirebase) {
      try {
        const q = query(collection(firebaseDb, "alerts"), where("userId", "==", userId));
        return onSnapshot(q, (snapshot) => {
          const alerts = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PriceAlert));
          if (alerts.length > 0) {
            onUpdate(alerts);
          }
        });
      } catch (e) {
        console.warn("Firestore subscribeAlerts failed:", e);
      }
    }
    return () => {};
  },

  // ==========================================
  // 5. USER SETTINGS / PREFERENCES
  // ==========================================
  getSettings: async (userId: string): Promise<any> => {
    if (isLiveFirebase) {
      try {
        const docRef = doc(firebaseDb, "settings", userId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : null;
      } catch (e) {
        console.warn("Firestore getSettings failed:", e);
      }
    }
    const db = getMockDB();
    return db.settings[userId] || null;
  },

  saveSettings: async (userId: string, settings: any): Promise<void> => {
    const db = getMockDB();
    db.settings[userId] = { ...db.settings[userId], ...settings };
    saveMockDB(db);

    if (isLiveFirebase) {
      try {
        const docRef = doc(firebaseDb, "settings", userId);
        await setDoc(docRef, { ...settings, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (e) {
        console.warn("Firestore saveSettings error:", e);
      }
    }
  },

  // ==========================================
  // 6. NOTES (Continuous Sync)
  // ==========================================
  getNotes: async (userId: string): Promise<any[]> => {
    if (isLiveFirebase) {
      try {
        const q = query(collection(firebaseDb, "notes"), where("userId", "==", userId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (e) {
        console.warn("Firestore getNotes failed:", e);
      }
    }
    const db = getMockDB();
    return db.notes[userId] || [];
  },

  saveNote: async (userId: string, note: any): Promise<void> => {
    const db = getMockDB();
    if (!db.notes) db.notes = {};
    if (!db.notes[userId]) db.notes[userId] = [];
    const index = db.notes[userId].findIndex((n: any) => n.id === note.id);
    if (index >= 0) {
      db.notes[userId][index] = note;
    } else {
      db.notes[userId].push(note);
    }
    saveMockDB(db);

    if (isLiveFirebase) {
      try {
        const docRef = doc(firebaseDb, "notes", note.id);
        await setDoc(docRef, { ...note, userId, updatedAt: new Date().toISOString() });
      } catch (e) {
        console.warn("Firestore saveNote error:", e);
      }
    }
  },

  deleteNote: async (userId: string, noteId: string): Promise<void> => {
    const db = getMockDB();
    if (db.notes?.[userId]) {
      db.notes[userId] = db.notes[userId].filter((n: any) => n.id !== noteId);
      saveMockDB(db);
    }

    if (isLiveFirebase) {
      try {
        await deleteDoc(doc(firebaseDb, "notes", noteId));
      } catch (e) {
        console.warn("Firestore deleteNote error:", e);
      }
    }
  },

  subscribeNotes: (userId: string, onUpdate: (notes: any[]) => void): (() => void) => {
    if (isLiveFirebase) {
      try {
        const q = query(collection(firebaseDb, "notes"), where("userId", "==", userId));
        return onSnapshot(q, (snapshot) => {
          const notes = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          if (notes.length > 0) {
            onUpdate(notes);
          }
        });
      } catch (e) {
        console.warn("Firestore subscribeNotes failed:", e);
      }
    }
    return () => {};
  },

  // ==========================================
  // 7. LIVE ASSET & MARKET DATA (Continuous Persistence)
  // ==========================================
  saveMarketAssets: async (assets: Asset[]): Promise<void> => {
    if (!assets || assets.length === 0) return;

    // 1. Keep local cache up to date
    const db = getMockDB();
    db.marketAssets = assets;
    saveMockDB(db);

    // 2. Persist live asset snapshot to Firebase Firestore
    if (isLiveFirebase) {
      try {
        const docRef = doc(firebaseDb, "market_data", "latest_snapshot");
        await setDoc(docRef, {
          assets,
          count: assets.length,
          lastSync: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        // Silently catch background market persistence warnings
      }
    }
  },

  getMarketAssets: async (): Promise<Asset[] | null> => {
    if (isLiveFirebase) {
      try {
        const docRef = doc(firebaseDb, "market_data", "latest_snapshot");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().assets) {
          return docSnap.data().assets as Asset[];
        }
      } catch (e) {
        // Fallback
      }
    }
    const db = getMockDB();
    return db.marketAssets && db.marketAssets.length > 0 ? db.marketAssets : null;
  },

  subscribeMarketAssets: (onUpdate: (assets: Asset[]) => void): (() => void) => {
    if (isLiveFirebase) {
      try {
        const docRef = doc(firebaseDb, "market_data", "latest_snapshot");
        return onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists() && docSnap.data().assets) {
            onUpdate(docSnap.data().assets);
          }
        });
      } catch (e) {
        console.warn("Firestore subscribeMarketAssets error:", e);
      }
    }
    return () => {};
  }
};
