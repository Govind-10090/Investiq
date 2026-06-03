import { useState, useEffect } from "react";
import { Outlet, NavLink } from "react-router";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { AIAssistant } from "./AIAssistant";
import { BrainCircuit, LayoutDashboard, TrendingUp, Briefcase, Star, Lightbulb } from "lucide-react";
import { useMarketStore, useThemeStore } from "../../store";
import { cn } from "../utils/cn";

const bottomNavItems = [
  { to: "/", icon: LayoutDashboard, label: "Home" },
  { to: "/markets", icon: TrendingUp, label: "Markets" },
  { to: "/portfolio", icon: Briefcase, label: "Portfolio" },
  { to: "/watchlist", icon: Star, label: "Watchlist" },
  { to: "/insights", icon: Lightbulb, label: "Insights" },
];

export function RootLayout() {
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const fetchPrices = useMarketStore((state) => state.fetchPrices);
  const updatePricesFromWS = useMarketStore((state) => state.updatePricesFromWS);
  const { initTheme } = useThemeStore();

  useEffect(() => {
    // Initialize user theme selection
    initTheme();
    // Initial load of stock, crypto, and forex rates
    fetchPrices();
    // Subscribe to live WebSocket ticking updates
    const unsub = updatePricesFromWS();
    return () => unsub();
  }, [fetchPrices, updatePricesFromWS, initTheme]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden relative">
        <Header
          onToggleAI={() => setIsAiOpen(!isAiOpen)}
          onToggleSidebar={() => setIsMobileSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto bg-background/50 p-4 sm:p-6 pb-20 lg:pb-6">
          <Outlet />
        </main>

        {/* Floating Summon Button for AI Assistant */}
        {!isAiOpen && (
          <button
            onClick={() => setIsAiOpen(true)}
            className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 h-12 w-12 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-2xl transition-all hover:scale-105 cursor-pointer z-40 border border-emerald-400/25"
            title="Open AI Co-pilot"
          >
            <BrainCircuit className="size-6 animate-pulse" />
          </button>
        )}

        {/* AI Assistant Drawer */}
        <AIAssistant isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
      </div>

      {/* Mobile Bottom Navigation Bar — hidden on lg+ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border/40 flex items-center justify-around px-2 h-16 safe-area-inset-bottom">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all text-center",
                isActive
                  ? "text-emerald-500"
                  : "text-muted-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("size-5", isActive && "text-emerald-500")} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
export default RootLayout;
