import { create } from "zustand";

export type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  initTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: (localStorage.getItem("investiq_theme") as Theme) || "dark",
  setTheme: (theme) => {
    localStorage.setItem("investiq_theme", theme);
    set({ theme });
    get().initTheme();
  },
  initTheme: () => {
    const theme = get().theme;
    const root = window.document.documentElement;
    
    // Remove both light/dark classes first
    root.classList.remove("light", "dark");
    
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }
}));
