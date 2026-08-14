import { create } from "zustand";
import { authService } from "../firebase/config";
import { AppUser } from "../types";
import { usePortfolioStore } from "./usePortfolioStore";

export const getCachedUser = (): AppUser | null => {
  try {
    const stored = localStorage.getItem("investiq_cached_user") || localStorage.getItem("investiq_mock_current_user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const setCachedUser = (user: AppUser | null) => {
  try {
    if (user) {
      localStorage.setItem("investiq_cached_user", JSON.stringify(user));
      localStorage.setItem("investiq_mock_current_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("investiq_cached_user");
      localStorage.removeItem("investiq_mock_current_user");
    }
  } catch {}
};

export interface AuthState {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
  login: (e: string, p: string) => Promise<void>;
  register: (e: string, p: string, name: string) => Promise<void>;
  googleLogin: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (e: string) => Promise<void>;
  initAuth: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const initialUser = getCachedUser();

  return {
    user: initialUser,
    loading: false,
    error: null,

    login: async (email, password) => {
      set({ error: null });
      try {
        const user = await authService.login(email, password);
        setCachedUser(user);
        set({ user, loading: false });
        if (user?.uid) {
          usePortfolioStore.getState().fetchHoldings(user.uid);
        }
      } catch (e: any) {
        set({ error: e.message || "Login failed", loading: false });
        throw e;
      }
    },

    register: async (email, password, displayName) => {
      set({ error: null });
      try {
        const user = await authService.register(email, password, displayName);
        setCachedUser(user);
        set({ user, loading: false });
        if (user?.uid) {
          usePortfolioStore.getState().fetchHoldings(user.uid);
        }
      } catch (e: any) {
        set({ error: e.message || "Registration failed", loading: false });
        throw e;
      }
    },

    googleLogin: async () => {
      set({ error: null });
      try {
        const user = await authService.googleLogin();
        setCachedUser(user);
        set({ user, loading: false });
        if (user?.uid) {
          usePortfolioStore.getState().fetchHoldings(user.uid);
        }
      } catch (e: any) {
        set({ error: e.message || "Google Sign-in failed", loading: false });
        throw e;
      }
    },

    logout: async () => {
      setCachedUser(null);
      await authService.logout();
      set({ user: null, loading: false });
      usePortfolioStore.setState({ holdings: [], transactions: [] });
    },

    resetPassword: async (email) => {
      set({ error: null });
      try {
        await authService.resetPassword(email);
      } catch (e: any) {
        set({ error: e.message || "Reset failed" });
        throw e;
      }
    },

    initAuth: () => {
      return authService.onAuthStateChanged((user) => {
        setCachedUser(user);
        set({ user, loading: false });
        if (user?.uid) {
          usePortfolioStore.getState().fetchHoldings(user.uid);
        }
      });
    }
  };
});
