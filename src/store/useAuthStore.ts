import { create } from "zustand";
import { authService } from "../firebase/config";
import { AppUser } from "../types";

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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const user = await authService.login(email, password);
      set({ user, loading: false });
    } catch (e: any) {
      set({ error: e.message || "Login failed", loading: false });
      throw e;
    }
  },
  register: async (email, password, displayName) => {
    set({ loading: true, error: null });
    try {
      const user = await authService.register(email, password, displayName);
      set({ user, loading: false });
    } catch (e: any) {
      set({ error: e.message || "Registration failed", loading: false });
      throw e;
    }
  },
  googleLogin: async () => {
    set({ loading: true, error: null });
    try {
      const user = await authService.googleLogin();
      set({ user, loading: false });
    } catch (e: any) {
      set({ error: e.message || "Google Sign-in failed", loading: false });
      throw e;
    }
  },
  logout: async () => {
    set({ loading: true });
    await authService.logout();
    set({ user: null, loading: false });
  },
  resetPassword: async (email) => {
    set({ loading: true, error: null });
    try {
      await authService.resetPassword(email);
      set({ loading: false });
    } catch (e: any) {
      set({ error: e.message || "Reset failed", loading: false });
      throw e;
    }
  },
  initAuth: () => {
    return authService.onAuthStateChanged((user) => {
      set({ user, loading: false });
    });
  }
}));
