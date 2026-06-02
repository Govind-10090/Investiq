import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { AppUser } from "../types";

// Read Environment Variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if credentials are valid (i.e. not empty and not placeholder strings)
const hasFirebaseEnv = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== "YOUR_API_KEY"
);

export let firebaseApp: any = null;
export let firebaseAuth: any = null;
export let firebaseDb: any = null;

if (hasFirebaseEnv) {
  try {
    firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    firebaseAuth = getAuth(firebaseApp);
    firebaseDb = getFirestore(firebaseApp);
    console.log("InvestIQ: Firebase initialized successfully in live mode.");
  } catch (error) {
    console.error("InvestIQ: Failed to initialize live Firebase. Falling back to sandbox.", error);
  }
}

export const isLiveFirebase = !!(firebaseAuth && firebaseDb);

// Re-export AppUser type for backward-compatibility
export type { AppUser };
export { authService } from "../services/authService";
export { dbService } from "../services/dbService";
