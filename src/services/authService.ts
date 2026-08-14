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

import { emailService } from "./emailService";

export function formatAuthError(err: any): string {
  const code = err?.code || "";
  const msg = err?.message || "";

  if (code === "auth/email-already-in-use" || msg.includes("email-already-in-use")) {
    return "This email is already registered. Please click 'Sign In' instead.";
  }
  if (code === "auth/weak-password" || msg.includes("weak-password")) {
    return "Password must be at least 6 characters long.";
  }
  if (code === "auth/invalid-email" || msg.includes("invalid-email")) {
    return "Please enter a valid email address.";
  }
  if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential" || msg.includes("invalid-credential")) {
    return "Invalid email or password. If you are new, please select 'Register'.";
  }
  if (code === "auth/too-many-requests" || msg.includes("too-many-requests")) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  if (code === "auth/network-request-failed" || msg.includes("network-request-failed")) {
    return "Network connection issue. Please check your internet connection.";
  }
  return msg || "Authentication failed. Please check your details.";
}

export const authService = {
  login: async (email: string, password: string): Promise<AppUser> => {
    const cleanEmail = email.trim().toLowerCase();
    if (isLiveFirebase) {
      try {
        const res = await signInWithEmailAndPassword(firebaseAuth, cleanEmail, password);
        return {
          uid: res.user.uid,
          email: res.user.email || cleanEmail,
          displayName: res.user.displayName || "Investor"
        };
      } catch (err: any) {
        throw new Error(formatAuthError(err));
      }
    } else {
      await new Promise(r => setTimeout(r, 400));
      const users = getMockUsers();
      let user = users[cleanEmail];
      if (!user) {
        // Create user on first login in sandbox for seamless demo
        user = { email: cleanEmail, password, displayName: "Retail Investor" };
        users[cleanEmail] = user;
        saveMockUsers(users);
      } else if (user.password && user.password !== password) {
        throw new Error("Invalid password. Please try again.");
      }
      const appUser: AppUser = { uid: cleanEmail, email: cleanEmail, displayName: user.displayName || "Retail Investor" };
      saveMockCurrentUser(appUser);
      return appUser;
    }
  },

  register: async (email: string, password: string, displayName: string): Promise<AppUser> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = displayName.trim() || "Investor";

    let appUser: AppUser;
    if (isLiveFirebase) {
      try {
        const res = await createUserWithEmailAndPassword(firebaseAuth, cleanEmail, password);
        try {
          await updateProfile(res.user, { displayName: cleanName });
        } catch (_) {}
        appUser = {
          uid: res.user.uid,
          email: res.user.email || cleanEmail,
          displayName: cleanName
        };
      } catch (err: any) {
        throw new Error(formatAuthError(err));
      }
    } else {
      await new Promise(r => setTimeout(r, 400));
      const users = getMockUsers();
      if (users[cleanEmail]) {
        throw new Error("This email is already registered. Please click 'Sign In' instead.");
      }
      users[cleanEmail] = { email: cleanEmail, password, displayName: cleanName };
      saveMockUsers(users);
      appUser = { uid: cleanEmail, email: cleanEmail, displayName: cleanName };
      saveMockCurrentUser(appUser);
    }

    // Trigger welcome email in background (non-blocking)
    try {
      emailService.sendWelcomeEmail(cleanEmail, cleanName).catch(() => {});
    } catch (_) {}

    return appUser;
  },

  googleLogin: async (): Promise<AppUser> => {
    if (isLiveFirebase) {
      try {
        const provider = new GoogleAuthProvider();
        const res = await signInWithPopup(firebaseAuth, provider);
        return {
          uid: res.user.uid,
          email: res.user.email || "google.investor@investiq.com",
          displayName: res.user.displayName || "Google Investor",
          photoURL: res.user.photoURL || undefined
        };
      } catch (err: any) {
        throw new Error(formatAuthError(err));
      }
    } else {
      await new Promise(r => setTimeout(r, 400));
      const appUser: AppUser = { uid: "google-investor", email: "google.investor@gmail.com", displayName: "Google Investor" };
      saveMockCurrentUser(appUser);
      return appUser;
    }
  },

  logout: async (): Promise<void> => {
    if (isLiveFirebase) {
      try {
        await signOut(firebaseAuth);
      } catch (_) {}
    }
    removeMockCurrentUser();
  },

  resetPassword: async (email: string): Promise<void> => {
    const cleanEmail = email.trim().toLowerCase();
    if (isLiveFirebase) {
      try {
        await sendPasswordResetEmail(firebaseAuth, cleanEmail);
      } catch (err: any) {
        throw new Error(formatAuthError(err));
      }
    } else {
      await new Promise(r => setTimeout(r, 400));
      const users = getMockUsers();
      if (!users[cleanEmail]) {
        throw new Error("No account found with this email.");
      }
    }
  },

  onAuthStateChanged: (callback: (user: AppUser | null) => void) => {
    if (isLiveFirebase) {
      return fbOnAuthStateChanged(firebaseAuth, (user: FirebaseUser | null) => {
        if (user) {
          callback({
            uid: user.uid,
            email: user.email || "",
            displayName: user.displayName || "Retail Investor"
          });
        } else {
          callback(null);
        }
      });
    } else {
      const stored = getMockCurrentUser();
      callback(stored || null);
      return () => {};
    }
  }
};
