import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  deleteDoc 
} from "firebase/firestore";
import { firebaseDb, isLiveFirebase } from "../firebase/config";
import { getMockDB, saveMockDB } from "./mockDb";

export const dbService = {
  // --- Watchlists ---
  getWatchlists: async (userId: string): Promise<any[]> => {
    if (isLiveFirebase) {
      const q = query(collection(firebaseDb, "watchlists"), where("userId", "==", userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      const db = getMockDB();
      return db.watchlists[userId] || [];
    }
  },

  saveWatchlist: async (userId: string, watchlist: any): Promise<void> => {
    if (isLiveFirebase) {
      const docRef = doc(firebaseDb, "watchlists", watchlist.id);
      await setDoc(docRef, { ...watchlist, userId });
    } else {
      const db = getMockDB();
      if (!db.watchlists[userId]) db.watchlists[userId] = [];
      const index = db.watchlists[userId].findIndex(w => w.id === watchlist.id);
      if (index >= 0) {
        db.watchlists[userId][index] = watchlist;
      } else {
        db.watchlists[userId].push(watchlist);
      }
      saveMockDB(db);
    }
  },

  deleteWatchlist: async (userId: string, watchlistId: string): Promise<void> => {
    if (isLiveFirebase) {
      await deleteDoc(doc(firebaseDb, "watchlists", watchlistId));
    } else {
      const db = getMockDB();
      if (db.watchlists[userId]) {
        db.watchlists[userId] = db.watchlists[userId].filter(w => w.id !== watchlistId);
        saveMockDB(db);
      }
    }
  },

  // --- Holdings / Portfolios ---
  getHoldings: async (userId: string): Promise<any[]> => {
    if (isLiveFirebase) {
      const q = query(collection(firebaseDb, "holdings"), where("userId", "==", userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      const db = getMockDB();
      return db.holdings[userId] || [];
    }
  },

  saveHolding: async (userId: string, holding: any): Promise<void> => {
    if (isLiveFirebase) {
      const docRef = doc(firebaseDb, "holdings", holding.id);
      await setDoc(docRef, { ...holding, userId });
    } else {
      const db = getMockDB();
      if (!db.holdings[userId]) db.holdings[userId] = [];
      const index = db.holdings[userId].findIndex(h => h.id === holding.id);
      if (index >= 0) {
        db.holdings[userId][index] = holding;
      } else {
        db.holdings[userId].push(holding);
      }
      saveMockDB(db);
    }
  },

  deleteHolding: async (userId: string, holdingId: string): Promise<void> => {
    if (isLiveFirebase) {
      await deleteDoc(doc(firebaseDb, "holdings", holdingId));
    } else {
      const db = getMockDB();
      if (db.holdings[userId]) {
        db.holdings[userId] = db.holdings[userId].filter(h => h.id !== holdingId);
        saveMockDB(db);
      }
    }
  },

  // --- Alerts ---
  getAlerts: async (userId: string): Promise<any[]> => {
    if (isLiveFirebase) {
      const q = query(collection(firebaseDb, "alerts"), where("userId", "==", userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      const db = getMockDB();
      return db.alerts[userId] || [];
    }
  },

  saveAlert: async (userId: string, alert: any): Promise<void> => {
    if (isLiveFirebase) {
      const docRef = doc(firebaseDb, "alerts", alert.id);
      await setDoc(docRef, { ...alert, userId });
    } else {
      const db = getMockDB();
      if (!db.alerts[userId]) db.alerts[userId] = [];
      const index = db.alerts[userId].findIndex(a => a.id === alert.id);
      if (index >= 0) {
        db.alerts[userId][index] = alert;
      } else {
        db.alerts[userId].push(alert);
      }
      saveMockDB(db);
    }
  },

  deleteAlert: async (userId: string, alertId: string): Promise<void> => {
    if (isLiveFirebase) {
      await deleteDoc(doc(firebaseDb, "alerts", alertId));
    } else {
      const db = getMockDB();
      if (db.alerts[userId]) {
        db.alerts[userId] = db.alerts[userId].filter(a => a.id !== alertId);
        saveMockDB(db);
      }
    }
  },

  // --- User Settings / Preferences ---
  getSettings: async (userId: string): Promise<any> => {
    if (isLiveFirebase) {
      const docRef = doc(firebaseDb, "settings", userId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    } else {
      const db = getMockDB();
      return db.settings[userId] || null;
    }
  },

  saveSettings: async (userId: string, settings: any): Promise<void> => {
    if (isLiveFirebase) {
      const docRef = doc(firebaseDb, "settings", userId);
      await setDoc(docRef, settings, { merge: true });
    } else {
      const db = getMockDB();
      db.settings[userId] = { ...db.settings[userId], ...settings };
      saveMockDB(db);
    }
  }
};
