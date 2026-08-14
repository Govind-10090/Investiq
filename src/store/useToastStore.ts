import { create } from "zustand";

export interface Toast {
  id: string;
  title: string;
  message: string;
  type: "success" | "error" | "alert" | "info";
  symbol?: string;
}

export interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    set({ toasts: [...get().toasts, { ...toast, id }] });
    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      get().removeToast(id);
    }, 6000);
  },
  removeToast: (id) =>
    set({ toasts: get().toasts.filter((t) => t.id !== id) }),
  clearAll: () => set({ toasts: [] }),
}));
