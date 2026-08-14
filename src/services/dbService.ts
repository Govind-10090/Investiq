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
  getWatchlists: async (userId: string, userEmail?: string): Promise<Watchlist[]> => {
    const db = getMockDB();
    const cleanId = (userId || "").trim().toLowerCase();
    const cleanEmail = (userEmail || "").trim().toLowerCase();

    let local: Watchlist[] = [];
    if (cleanId && db.watchlists[cleanId] && db.watchlists[cleanId].length > 0) {
      local = db.watchlists[cleanId];
    } else if (cleanEmail && db.watchlists[cleanEmail] && db.watchlists[cleanEmail].length > 0) {
      local = db.watchlists[cleanEmail];
    }

    if (isLiveFirebase) {
      const keysToSearch = Array.from(new Set([cleanId, cleanEmail, userId, userEmail].filter(Boolean) as string[]));
      for (const k of keysToSearch) {
        try {
          const subSnap = await getDocs(collection(firebaseDb, "users", k, "watchlists"));
          if (!subSnap.empty) {
            const remote = subSnap.docs.map(d => ({ id: d.id, ...d.data() } as Watchlist));
            keysToSearch.forEach(id => { db.watchlists[id] = remote; });
            saveMockDB(db);
            return remote;
          }

          const q = query(collection(firebaseDb, "watchlists"), where("userId", "==", k));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const remote = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Watchlist));
            keysToSearch.forEach(id => { db.watchlists[id] = remote; });
            saveMockDB(db);
            return remote;
          }
        } catch (e) {
          console.warn("Firestore getWatchlists query fallback:", e);
        }
      }
    }
    return local;
  },

  saveWatchlist: async (userId: string, watchlist: any, userEmail?: string): Promise<void> => {
    const db = getMockDB();
    const cleanId = (userId || "").trim().toLowerCase();
    const cleanEmail = (userEmail || "").trim().toLowerCase();
    const ids = Array.from(new Set([cleanId, cleanEmail, userId, userEmail].filter(Boolean) as string[]));

    ids.forEach(id => {
      if (!db.watchlists[id]) db.watchlists[id] = [];
      const index = db.watchlists[id].findIndex(w => w.id === watchlist.id);
      if (index >= 0) {
        db.watchlists[id][index] = watchlist;
      } else {
        db.watchlists[id].push(watchlist);
      }
    });
    saveMockDB(db);

    if (isLiveFirebase && userId) {
      try {
        const payload = { ...watchlist, userId: cleanId || userId, userEmail: cleanEmail || userEmail, updatedAt: new Date().toISOString() };
        await setDoc(doc(firebaseDb, "users", userId, "watchlists", watchlist.id), payload);
        await setDoc(doc(firebaseDb, "watchlists", watchlist.id), payload);
        if (cleanEmail && cleanEmail !== userId) {
          await setDoc(doc(firebaseDb, "users", cleanEmail, "watchlists", watchlist.id), payload);
        }
      } catch (e) {
        console.warn("Firestore saveWatchlist error:", e);
      }
    }
  },

  deleteWatchlist: async (userId: string, watchlistId: string, userEmail?: string): Promise<void> => {
    const db = getMockDB();
    const cleanId = (userId || "").trim().toLowerCase();
    const cleanEmail = (userEmail || "").trim().toLowerCase();
    const ids = Array.from(new Set([cleanId, cleanEmail, userId, userEmail].filter(Boolean) as string[]));

    ids.forEach(id => {
      if (db.watchlists[id]) {
        db.watchlists[id] = db.watchlists[id].filter(w => w.id !== watchlistId);
      }
    });
    saveMockDB(db);

    if (isLiveFirebase && userId) {
      try {
        await deleteDoc(doc(firebaseDb, "users", userId, "watchlists", watchlistId));
        await deleteDoc(doc(firebaseDb, "watchlists", watchlistId));
        if (cleanEmail && cleanEmail !== userId) {
          await deleteDoc(doc(firebaseDb, "users", cleanEmail, "watchlists", watchlistId));
        }
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
  // 2. HOLDINGS / PORTFOLIOS (Continuous Sync with User UID & Email)
  // ==========================================
  getHoldings: async (userId: string, userEmail?: string): Promise<PortfolioHolding[]> => {
    const db = getMockDB();
    const cleanId = (userId || "").trim().toLowerCase();
    const cleanEmail = (userEmail || "").trim().toLowerCase();

    // 1. Check local DB cache across all keys
    let local: PortfolioHolding[] = [];
    if (cleanId && db.holdings[cleanId] && db.holdings[cleanId].length > 0) {
      local = db.holdings[cleanId];
    } else if (cleanEmail && db.holdings[cleanEmail] && db.holdings[cleanEmail].length > 0) {
      local = db.holdings[cleanEmail];
    } else if (userId && db.holdings[userId] && db.holdings[userId].length > 0) {
      local = db.holdings[userId];
    } else if (userEmail && db.holdings[userEmail] && db.holdings[userEmail].length > 0) {
      local = db.holdings[userEmail];
    }

    // 2. Query Firestore if live
    if (isLiveFirebase) {
      const keysToSearch = Array.from(new Set([cleanId, cleanEmail, userId, userEmail].filter(Boolean) as string[]));
      for (const k of keysToSearch) {
        try {
          // A. User subcollection
          const subSnap = await getDocs(collection(firebaseDb, "users", k, "holdings"));
          if (!subSnap.empty) {
            const remote = subSnap.docs.map(d => ({ id: d.id, ...d.data() } as PortfolioHolding));
            keysToSearch.forEach(id => { db.holdings[id] = remote; });
            saveMockDB(db);
            return remote;
          }

          // B. Root collection where userId == k
          const q = query(collection(firebaseDb, "holdings"), where("userId", "==", k));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const remote = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PortfolioHolding));
            keysToSearch.forEach(id => { db.holdings[id] = remote; });
            saveMockDB(db);
            return remote;
          }
        } catch (e) {
          console.warn("Firestore getHoldings query fallback:", e);
        }
      }
    }
    return local;
  },

  saveHolding: async (userId: string, holding: PortfolioHolding, userEmail?: string): Promise<void> => {
    const db = getMockDB();
    const cleanId = (userId || "").trim().toLowerCase();
    const cleanEmail = (userEmail || "").trim().toLowerCase();
    const ids = Array.from(new Set([cleanId, cleanEmail, userId, userEmail].filter(Boolean) as string[]));

    // 1. Keep local cache updated instantly for all identifiers (UID and Email)
    ids.forEach(id => {
      if (!db.holdings[id]) db.holdings[id] = [];
      const index = db.holdings[id].findIndex(h => h.id === holding.id || h.symbol === holding.symbol);
      if (index >= 0) {
        db.holdings[id][index] = holding;
      } else {
        db.holdings[id].push(holding);
      }
    });
    saveMockDB(db);

    // 2. Persist to Firestore under user subcollection and root collection
    if (isLiveFirebase && userId) {
      try {
        const payload = { ...holding, userId: cleanId || userId, userEmail: cleanEmail || userEmail, updatedAt: new Date().toISOString() };
        await setDoc(doc(firebaseDb, "users", userId, "holdings", holding.id), payload);
        await setDoc(doc(firebaseDb, "holdings", holding.id), payload);
        if (cleanEmail && cleanEmail !== userId) {
          await setDoc(doc(firebaseDb, "users", cleanEmail, "holdings", holding.id), payload);
        }
      } catch (e) {
        console.warn("Firestore saveHolding error:", e);
      }
    }
  },

  deleteHolding: async (userId: string, holdingId: string, userEmail?: string): Promise<void> => {
    const db = getMockDB();
    const cleanId = (userId || "").trim().toLowerCase();
    const cleanEmail = (userEmail || "").trim().toLowerCase();
    const ids = Array.from(new Set([cleanId, cleanEmail, userId, userEmail].filter(Boolean) as string[]));

    ids.forEach(id => {
      if (db.holdings[id]) {
        db.holdings[id] = db.holdings[id].filter(h => h.id !== holdingId);
      }
    });
    saveMockDB(db);

    if (isLiveFirebase && userId) {
      try {
        await deleteDoc(doc(firebaseDb, "users", userId, "holdings", holdingId));
        await deleteDoc(doc(firebaseDb, "holdings", holdingId));
        if (cleanEmail && cleanEmail !== userId) {
          await deleteDoc(doc(firebaseDb, "users", cleanEmail, "holdings", holdingId));
        }
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
  // 3. TRANSACTIONS LOG (Continuous Sync with User UID & Email)
  // ==========================================
  getTransactions: async (userId: string, userEmail?: string): Promise<Transaction[]> => {
    const db = getMockDB();
    const cleanId = (userId || "").trim().toLowerCase();
    const cleanEmail = (userEmail || "").trim().toLowerCase();

    let local: Transaction[] = [];
    if (cleanId && db.transactions[cleanId] && db.transactions[cleanId].length > 0) {
      local = db.transactions[cleanId];
    } else if (cleanEmail && db.transactions[cleanEmail] && db.transactions[cleanEmail].length > 0) {
      local = db.transactions[cleanEmail];
    } else if (userId && db.transactions[userId] && db.transactions[userId].length > 0) {
      local = db.transactions[userId];
    } else if (userEmail && db.transactions[userEmail] && db.transactions[userEmail].length > 0) {
      local = db.transactions[userEmail];
    }

    if (isLiveFirebase) {
      const keysToSearch = Array.from(new Set([cleanId, cleanEmail, userId, userEmail].filter(Boolean) as string[]));
      for (const k of keysToSearch) {
        try {
          const subSnap = await getDocs(collection(firebaseDb, "users", k, "transactions"));
          if (!subSnap.empty) {
            const remote = subSnap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
            keysToSearch.forEach(id => { db.transactions[id] = remote; });
            saveMockDB(db);
            return remote;
          }

          const q = query(collection(firebaseDb, "transactions"), where("userId", "==", k));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const remote = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
            keysToSearch.forEach(id => { db.transactions[id] = remote; });
            saveMockDB(db);
            return remote;
          }
        } catch (e) {
          console.warn("Firestore getTransactions fallback:", e);
        }
      }
    }
    return local;
  },

  saveTransaction: async (userId: string, transaction: Transaction, userEmail?: string): Promise<void> => {
    const db = getMockDB();
    const cleanId = (userId || "").trim().toLowerCase();
    const cleanEmail = (userEmail || "").trim().toLowerCase();
    const ids = Array.from(new Set([cleanId, cleanEmail, userId, userEmail].filter(Boolean) as string[]));

    ids.forEach(id => {
      if (!db.transactions[id]) db.transactions[id] = [];
      db.transactions[id].unshift(transaction);
    });
    saveMockDB(db);

    if (isLiveFirebase && userId) {
      try {
        const payload = { ...transaction, userId: cleanId || userId, userEmail: cleanEmail || userEmail, recordedAt: new Date().toISOString() };
        await setDoc(doc(firebaseDb, "users", userId, "transactions", transaction.id), payload);
        await setDoc(doc(firebaseDb, "transactions", transaction.id), payload);
        if (cleanEmail && cleanEmail !== userId) {
          await setDoc(doc(firebaseDb, "users", cleanEmail, "transactions", transaction.id), payload);
        }
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
  getAlerts: async (userId: string, userEmail?: string): Promise<PriceAlert[]> => {
    const db = getMockDB();
    const cleanId = (userId || "").trim().toLowerCase();
    const cleanEmail = (userEmail || "").trim().toLowerCase();

    let local: PriceAlert[] = [];
    if (cleanId && db.alerts[cleanId] && db.alerts[cleanId].length > 0) {
      local = db.alerts[cleanId];
    } else if (cleanEmail && db.alerts[cleanEmail] && db.alerts[cleanEmail].length > 0) {
      local = db.alerts[cleanEmail];
    }

    if (isLiveFirebase) {
      const keysToSearch = Array.from(new Set([cleanId, cleanEmail, userId, userEmail].filter(Boolean) as string[]));
      for (const k of keysToSearch) {
        try {
          const subSnap = await getDocs(collection(firebaseDb, "users", k, "alerts"));
          if (!subSnap.empty) {
            const remote = subSnap.docs.map(d => ({ id: d.id, ...d.data() } as PriceAlert));
            keysToSearch.forEach(id => { db.alerts[id] = remote; });
            saveMockDB(db);
            return remote;
          }
          const q = query(collection(firebaseDb, "alerts"), where("userId", "==", k));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const remote = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PriceAlert));
            keysToSearch.forEach(id => { db.alerts[id] = remote; });
            saveMockDB(db);
            return remote;
          }
        } catch (e) {
          console.warn("Firestore getAlerts fallback:", e);
        }
      }
    }
    return local;
  },

  saveAlert: async (userId: string, alert: any, userEmail?: string): Promise<void> => {
    const db = getMockDB();
    const cleanId = (userId || "").trim().toLowerCase();
    const cleanEmail = (userEmail || "").trim().toLowerCase();
    const ids = Array.from(new Set([cleanId, cleanEmail, userId, userEmail].filter(Boolean) as string[]));

    ids.forEach(id => {
      if (!db.alerts[id]) db.alerts[id] = [];
      const index = db.alerts[id].findIndex(a => a.id === alert.id);
      if (index >= 0) {
        db.alerts[id][index] = alert;
      } else {
        db.alerts[id].push(alert);
      }
    });
    saveMockDB(db);

    if (isLiveFirebase && userId) {
      try {
        const payload = { ...alert, userId: cleanId || userId, userEmail: cleanEmail || userEmail, updatedAt: new Date().toISOString() };
        await setDoc(doc(firebaseDb, "users", userId, "alerts", alert.id), payload);
        await setDoc(doc(firebaseDb, "alerts", alert.id), payload);
        if (cleanEmail && cleanEmail !== userId) {
          await setDoc(doc(firebaseDb, "users", cleanEmail, "alerts", alert.id), payload);
        }
      } catch (e) {
        console.warn("Firestore saveAlert error:", e);
      }
    }
  },

  deleteAlert: async (userId: string, alertId: string, userEmail?: string): Promise<void> => {
    const db = getMockDB();
    const cleanId = (userId || "").trim().toLowerCase();
    const cleanEmail = (userEmail || "").trim().toLowerCase();
    const ids = Array.from(new Set([cleanId, cleanEmail, userId, userEmail].filter(Boolean) as string[]));

    ids.forEach(id => {
      if (db.alerts[id]) {
        db.alerts[id] = db.alerts[id].filter(a => a.id !== alertId);
      }
    });
    saveMockDB(db);

    if (isLiveFirebase && userId) {
      try {
        await deleteDoc(doc(firebaseDb, "users", userId, "alerts", alertId));
        await deleteDoc(doc(firebaseDb, "alerts", alertId));
        if (cleanEmail && cleanEmail !== userId) {
          await deleteDoc(doc(firebaseDb, "users", cleanEmail, "alerts", alertId));
        }
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
    const cleanId = (userId || "").trim().toLowerCase();
    const local = db.settings[cleanId] || db.settings[userId] || null;

    if (isLiveFirebase && userId) {
      try {
        const docRef = doc(firebaseDb, "settings", userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const remote = docSnap.data();
          db.settings[userId] = remote;
          if (cleanId) db.settings[cleanId] = remote;
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
    const cleanId = (userId || "").trim().toLowerCase();
    db.settings[userId] = { ...db.settings[userId], ...settings };
    if (cleanId) db.settings[cleanId] = { ...db.settings[cleanId], ...settings };
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
  getNotes: async (userId: string, userEmail?: string): Promise<any[]> => {
    const db = getMockDB();
    const cleanId = (userId || "").trim().toLowerCase();
    const cleanEmail = (userEmail || "").trim().toLowerCase();

    let local: any[] = [];
    if (cleanId && db.notes[cleanId] && db.notes[cleanId].length > 0) {
      local = db.notes[cleanId];
    } else if (cleanEmail && db.notes[cleanEmail] && db.notes[cleanEmail].length > 0) {
      local = db.notes[cleanEmail];
    }

    if (isLiveFirebase) {
      const keysToSearch = Array.from(new Set([cleanId, cleanEmail, userId, userEmail].filter(Boolean) as string[]));
      for (const k of keysToSearch) {
        try {
          const subSnap = await getDocs(collection(firebaseDb, "users", k, "notes"));
          if (!subSnap.empty) {
            const remote = subSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            keysToSearch.forEach(id => { db.notes[id] = remote; });
            saveMockDB(db);
            return remote;
          }
        } catch (e) {
          console.warn("Firestore getNotes failed:", e);
        }
      }
    }
    return local;
  },

  saveNote: async (userId: string, note: any, userEmail?: string): Promise<void> => {
    const db = getMockDB();
    if (!db.notes) db.notes = {};
    const cleanId = (userId || "").trim().toLowerCase();
    const cleanEmail = (userEmail || "").trim().toLowerCase();
    const ids = Array.from(new Set([cleanId, cleanEmail, userId, userEmail].filter(Boolean) as string[]));

    ids.forEach(id => {
      if (!db.notes[id]) db.notes[id] = [];
      const index = db.notes[id].findIndex((n: any) => n.id === note.id);
      if (index >= 0) {
        db.notes[id][index] = note;
      } else {
        db.notes[id].push(note);
      }
    });
    saveMockDB(db);

    if (isLiveFirebase && userId) {
      try {
        const payload = { ...note, userId: cleanId || userId, userEmail: cleanEmail || userEmail, updatedAt: new Date().toISOString() };
        await setDoc(doc(firebaseDb, "users", userId, "notes", note.id), payload);
        await setDoc(doc(firebaseDb, "notes", note.id), payload);
        if (cleanEmail && cleanEmail !== userId) {
          await setDoc(doc(firebaseDb, "users", cleanEmail, "notes", note.id), payload);
        }
      } catch (e) {
        console.warn("Firestore saveNote error:", e);
      }
    }
  },

  deleteNote: async (userId: string, noteId: string, userEmail?: string): Promise<void> => {
    const db = getMockDB();
    const cleanId = (userId || "").trim().toLowerCase();
    const cleanEmail = (userEmail || "").trim().toLowerCase();
    const ids = Array.from(new Set([cleanId, cleanEmail, userId, userEmail].filter(Boolean) as string[]));

    ids.forEach(id => {
      if (db.notes?.[id]) {
        db.notes[id] = db.notes[id].filter((n: any) => n.id !== noteId);
      }
    });
    saveMockDB(db);

    if (isLiveFirebase && userId) {
      try {
        await deleteDoc(doc(firebaseDb, "users", userId, "notes", noteId));
        await deleteDoc(doc(firebaseDb, "notes", noteId));
        if (cleanEmail && cleanEmail !== userId) {
          await deleteDoc(doc(firebaseDb, "users", cleanEmail, "notes", noteId));
        }
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

    const db = getMockDB();
    db.marketAssets = assets;
    saveMockDB(db);

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
