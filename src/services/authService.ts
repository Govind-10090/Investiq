import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  signInWithPopup, 
  GoogleAuthProvider,
  onAuthStateChanged as fbOnAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from "firebase/auth";
import { firebaseAuth, isLiveFirebase } from "../firebase/config";
import { AppUser } from "../types";
import { 
  getMockUsers, 
  saveMockUsers, 
  getMockCurrentUser, 
  saveMockCurrentUser, 
  removeMockCurrentUser 
} from "./mockDb";

export const authService = {
  login: async (email: string, password: string): Promise<AppUser> => {
    if (isLiveFirebase) {
      const res = await signInWithEmailAndPassword(firebaseAuth, email, password);
      return {
        uid: res.user.uid,
        email: res.user.email,
        displayName: res.user.displayName || "User"
      };
    } else {
      // Simulate network delays
      await new Promise(r => setTimeout(r, 600));
      const users = getMockUsers();
      const user = users[email];
      if (!user || user.password !== password) {
        throw new Error("Invalid credentials");
      }
      const appUser = { uid: email, email, displayName: user.displayName };
      saveMockCurrentUser(appUser);
      return appUser;
    }
  },

  register: async (email: string, password: string, displayName: string): Promise<AppUser> => {
    if (isLiveFirebase) {
      const res = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      await updateProfile(res.user, { displayName });
      return {
        uid: res.user.uid,
        email: res.user.email,
        displayName: displayName
      };
    } else {
      await new Promise(r => setTimeout(r, 600));
      const users = getMockUsers();
      if (users[email]) {
        throw new Error("User already exists");
      }
      users[email] = { email, password, displayName };
      saveMockUsers(users);
      const appUser = { uid: email, email, displayName };
      saveMockCurrentUser(appUser);
      return appUser;
    }
  },

  googleLogin: async (): Promise<AppUser> => {
    if (isLiveFirebase) {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(firebaseAuth, provider);
      return {
        uid: res.user.uid,
        email: res.user.email,
        displayName: res.user.displayName,
        photoURL: res.user.photoURL
      };
    } else {
      await new Promise(r => setTimeout(r, 600));
      const appUser = { uid: "google-investor", email: "google.investor@gmail.com", displayName: "Google Investor" };
      saveMockCurrentUser(appUser);
      return appUser;
    }
  },

  logout: async (): Promise<void> => {
    if (isLiveFirebase) {
      await signOut(firebaseAuth);
    } else {
      removeMockCurrentUser();
    }
  },

  resetPassword: async (email: string): Promise<void> => {
    if (isLiveFirebase) {
      await sendPasswordResetEmail(firebaseAuth, email);
    } else {
      await new Promise(r => setTimeout(r, 400));
      const users = getMockUsers();
      if (!users[email]) {
        throw new Error("User not found");
      }
    }
  },

  onAuthStateChanged: (callback: (user: AppUser | null) => void) => {
    if (isLiveFirebase) {
      return fbOnAuthStateChanged(firebaseAuth, (user: FirebaseUser | null) => {
        if (user) {
          callback({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || "Retail Investor"
          });
        } else {
          callback(null);
        }
      });
    } else {
      const stored = getMockCurrentUser();
      if (stored) {
        callback(stored);
      } else {
        // Log in default user for instant access in Sandbox
        const defaultUser = { uid: "investor@example.com", email: "investor@example.com", displayName: "Retail Investor" };
        saveMockCurrentUser(defaultUser);
        callback(defaultUser);
      }
      // Return dummy unsubscribe function
      return () => {};
    }
  }
};
