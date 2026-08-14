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
    const db = getMockDB();
    const local = db.watchlists[userId] || [];

    if (isLiveFirebase && userId) {
      try {
        const subSnap = await getDocs(collection(firebaseDb, "users", userId, "watchlists"));
        if (!subSnap.empty) {
          const remote = subSnap.docs.map(d => ({ id: d.id, ...d.data() } as Watchlist));
          db.watchlists[userId] = remote;
          saveMockDB(db);
          return remote;
        }

        const q = query(collection(firebaseDb, "watchlists"), where("userId", "==", userId));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const remote = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Watchlist));
          db.watchlists[userId] = remote;
          saveMockDB(db);
          return remote;
        }
      } catch (e) {
        console.warn("Firestore getWatchlists query, using local cache:", e);
      }
    }
    return local;
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

    // 2. Persist to Firebase Firestore under user subcollection and root collection
    if (isLiveFirebase && userId) {
      try {
        const payload = { ...watchlist, userId, updatedAt: new Date().toISOString() };
        await setDoc(doc(firebaseDb, "users", userId, "watchlists", watchlist.id), payload);
        await setDoc(doc(firebaseDb, "watchlists", watchlist.id), payload);
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

    if (isLiveFirebase && userId) {
      try {
        await deleteDoc(doc(firebaseDb, "users", userId, "watchlists", watchlistId));
        await deleteDoc(doc(firebaseDb, "watchlists", watchlistId));
      } catch (e) {
        console.warn("Firestore deleteWatchlist error:", e);
      }
    }
  },

  subscribeWatchlists: (userId: string, onUpdate: (watchlists: Watchlist[]) => void): (() => void) => {
    if (isLiveFirebase && userId) {
      try {
        const unsub = onSnapshot(collection(firebaseDb, "users", userId, "watchlists"), (snapshot) => {
          if (!snapshot.empty) {
            const lists = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Watchlist));
            onUpdate(lists);
            const db = getMockDB();
            db.watchlists[userId] = lists;
            saveMockDB(db);
          }
        }, () => {});
        return unsub;
      } catch (e) {
        console.warn("Firestore subscribeWatchlists failed:", e);
      }
    }
    return () => {};
  },

  // ==========================================
  // 2. HOLDINGS / PORTFOLIOS (Continuous Sync with User UID)
  // ==========================================
  getHoldings: async (userId: string): Promise<PortfolioHolding[]> => {
    // 1. Instant return from local DB cache for 0ms initial load
    const db = getMockDB();
    const local = db.holdings[userId] || [];

    if (isLiveFirebase && userId) {
      try {
        // A. Check user subcollection users/{userId}/holdings
        const subSnap = await getDocs(collection(firebaseDb, "users", userId, "holdings"));
        if (!subSnap.empty) {
          const remote = subSnap.docs.map(d => ({ id: d.id, ...d.data() } as PortfolioHolding));
          db.holdings[userId] = remote;
          saveMockDB(db);
          return remote;
        }

        // B. Check root collection holdings where userId == userId
        const q = query(collection(firebaseDb, "holdings"), where("userId", "==", userId));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const remote = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PortfolioHolding));
          db.holdings[userId] = remote;
          saveMockDB(db);
          return remote;
        }
      } catch (e) {
        console.warn("Firestore getHoldings query, using local cache:", e);
      }
    }
    return local;
  },

  saveHolding: async (userId: string, holding: PortfolioHolding): Promise<void> => {
    // 1. Keep local cache updated instantly
    const db = getMockDB();
    if (!db.holdings[userId]) db.holdings[userId] = [];
    const index = db.holdings[userId].findIndex(h => h.id === holding.id || h.symbol === holding.symbol);
    if (index >= 0) {
      db.holdings[userId][index] = holding;
    } else {
      db.holdings[userId].push(holding);
    }
    saveMockDB(db);

    // 2. Persist to Firestore under user subcollection and root collection
    if (isLiveFirebase && userId) {
      try {
        const payload = { ...holding, userId, updatedAt: new Date().toISOString() };
        await setDoc(doc(firebaseDb, "users", userId, "holdings", holding.id), payload);
        await setDoc(doc(firebaseDb, "holdings", holding.id), payload);
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

    if (isLiveFirebase && userId) {
      try {
        await deleteDoc(doc(firebaseDb, "users", userId, "holdings", holdingId));
        await deleteDoc(doc(firebaseDb, "holdings", holdingId));
      } catch (e) {
        console.warn("Firestore deleteHolding error:", e);
      }
    }
  },

  subscribeHoldings: (userId: string, onUpdate: (holdings: PortfolioHolding[]) => void): (() => void) => {
    if (isLiveFirebase && userId) {
      try {
        const unsub = onSnapshot(collection(firebaseDb, "users", userId, "holdings"), (snapshot) => {
          if (!snapshot.empty) {
            const holdings = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PortfolioHolding));
            onUpdate(holdings);
            const db = getMockDB();
            db.holdings[userId] = holdings;
            saveMockDB(db);
          }
        }, () => {});
        return unsub;
      } catch (e) {
        console.warn("Firestore subscribeHoldings failed:", e);
      }
    }
    return () => {};
  },

  // ==========================================
  // 3. TRANSACTIONS LOG (Continuous Sync with User UID)
  // ==========================================
  getTransactions: async (userId: string): Promise<Transaction[]> => {
    const db = getMockDB();
    const local = db.transactions[userId] || [];

    if (isLiveFirebase && userId) {
      try {
        const subSnap = await getDocs(collection(firebaseDb, "users", userId, "transactions"));
        if (!subSnap.empty) {
          const remote = subSnap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
          db.transactions[userId] = remote;
          saveMockDB(db);
          return remote;
        }

        const q = query(collection(firebaseDb, "transactions"), where("userId", "==", userId));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const remote = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
          db.transactions[userId] = remote;
          saveMockDB(db);
          return remote;
        }
      } catch (e) {
        console.warn("Firestore getTransactions fallback:", e);
      }
    }
    return local;
  },

  saveTransaction: async (userId: string, transaction: Transaction): Promise<void> => {
    const db = getMockDB();
    if (!db.transactions[userId]) db.transactions[userId] = [];
    db.transactions[userId].unshift(transaction);
    saveMockDB(db);

    if (isLiveFirebase && userId) {
      try {
        const payload = { ...transaction, userId, recordedAt: new Date().toISOString() };
        await setDoc(doc(firebaseDb, "users", userId, "transactions", transaction.id), payload);
        await setDoc(doc(firebaseDb, "transactions", transaction.id), payload);
      } catch (e) {
        console.warn("Firestore saveTransaction error:", e);
      }
    }
  },

  subscribeTransactions: (userId: string, onUpdate: (txs: Transaction[]) => void): (() => void) => {
    if (isLiveFirebase && userId) {
      try {
        const unsub = onSnapshot(collection(firebaseDb, "users", userId, "transactions"), (snapshot) => {
          if (!snapshot.empty) {
            const txs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
            onUpdate(txs);
            const db = getMockDB();
            db.transactions[userId] = txs;
            saveMockDB(db);
          }
        }, () => {});
        return unsub;
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
    const db = getMockDB();
    const local = db.alerts[userId] || [];

    if (isLiveFirebase && userId) {
      try {
        const subSnap = await getDocs(collection(firebaseDb, "users", userId, "alerts"));
        if (!subSnap.empty) {
          const remote = subSnap.docs.map(d => ({ id: d.id, ...d.data() } as PriceAlert));
          db.alerts[userId] = remote;
          saveMockDB(db);
          return remote;
        }
        const q = query(collection(firebaseDb, "alerts"), where("userId", "==", userId));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const remote = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PriceAlert));
          db.alerts[userId] = remote;
          saveMockDB(db);
          return remote;
        }
      } catch (e) {
        console.warn("Firestore getAlerts fallback:", e);
      }
    }
    return local;
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

    if (isLiveFirebase && userId) {
      try {
        const payload = { ...alert, userId, updatedAt: new Date().toISOString() };
        await setDoc(doc(firebaseDb, "users", userId, "alerts", alert.id), payload);
        await setDoc(doc(firebaseDb, "alerts", alert.id), payload);
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

    if (isLiveFirebase && userId) {
      try {
        await deleteDoc(doc(firebaseDb, "users", userId, "alerts", alertId));
        await deleteDoc(doc(firebaseDb, "alerts", alertId));
      } catch (e) {
        console.warn("Firestore deleteAlert error:", e);
      }
    }
  },

  subscribeAlerts: (userId: string, onUpdate: (alerts: PriceAlert[]) => void): (() => void) => {
    if (isLiveFirebase && userId) {
      try {
        const unsub = onSnapshot(collection(firebaseDb, "users", userId, "alerts"), (snapshot) => {
          if (!snapshot.empty) {
            const alerts = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PriceAlert));
            onUpdate(alerts);
            const db = getMockDB();
            db.alerts[userId] = alerts;
            saveMockDB(db);
          }
        }, () => {});
        return unsub;
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
    const db = getMockDB();
    const local = db.settings[userId] || null;

    if (isLiveFirebase && userId) {
      try {
        const docRef = doc(firebaseDb, "settings", userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const remote = docSnap.data();
          db.settings[userId] = remote;
          saveMockDB(db);
          return remote;
        }
      } catch (e) {
        console.warn("Firestore getSettings failed:", e);
      }
    }
    return local;
  },

  saveSettings: async (userId: string, settings: any): Promise<void> => {
    const db = getMockDB();
    db.settings[userId] = { ...db.settings[userId], ...settings };
    saveMockDB(db);

    if (isLiveFirebase && userId) {
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
    const db = getMockDB();
    const local = db.notes[userId] || [];

    if (isLiveFirebase && userId) {
      try {
        const subSnap = await getDocs(collection(firebaseDb, "users", userId, "notes"));
        if (!subSnap.empty) {
          const remote = subSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          db.notes[userId] = remote;
          saveMockDB(db);
          return remote;
        }
      } catch (e) {
        console.warn("Firestore getNotes failed:", e);
      }
    }
    return local;
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

    if (isLiveFirebase && userId) {
      try {
        await setDoc(doc(firebaseDb, "users", userId, "notes", note.id), { ...note, userId, updatedAt: new Date().toISOString() });
        await setDoc(doc(firebaseDb, "notes", note.id), { ...note, userId, updatedAt: new Date().toISOString() });
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

    if (isLiveFirebase && userId) {
      try {
        await deleteDoc(doc(firebaseDb, "users", userId, "notes", noteId));
        await deleteDoc(doc(firebaseDb, "notes", noteId));
      } catch (e) {
        console.warn("Firestore deleteNote error:", e);
      }
    }
  },

  subscribeNotes: (userId: string, onUpdate: (notes: any[]) => void): (() => void) => {
    if (isLiveFirebase && userId) {
      try {
        const unsub = onSnapshot(collection(firebaseDb, "users", userId, "notes"), (snapshot) => {
          if (!snapshot.empty) {
            const notes = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            onUpdate(notes);
            const db = getMockDB();
            db.notes[userId] = notes;
            saveMockDB(db);
          }
        }, () => {});
        return unsub;
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
