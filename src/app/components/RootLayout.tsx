import { useState, useEffect } from "react";
import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { AIAssistant } from "./AIAssistant";
import { BrainCircuit } from "lucide-react";
import { useMarketStore, useThemeStore } from "../../store";

export function RootLayout() {
  const [isAiOpen, setIsAiOpen] = useState(false);
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
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden relative">
        <Header onToggleAI={() => setIsAiOpen(!isAiOpen)} />
        <main className="flex-1 overflow-y-auto bg-background/50 p-6">
          <Outlet />
        </main>

        {/* Floating Summon Button for AI Assistant */}
        {!isAiOpen && (
          <button
            onClick={() => setIsAiOpen(true)}
            className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-2xl transition-all hover:scale-105 cursor-pointer z-40 border border-emerald-400/25"
            title="Open AI Co-pilot"
          >
            <BrainCircuit className="size-6 animate-pulse" />
          </button>
        )}

        {/* AI Assistant Drawer */}
        <AIAssistant isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
      </div>
    </div>
  );
}
export default RootLayout;

