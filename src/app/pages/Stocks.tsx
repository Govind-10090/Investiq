import { useState } from "react";
import { Search, TrendingUp, TrendingDown, Star, Bell, Plus, ExternalLink } from "lucide-react";
import { useMarketStore, useWatchlistStore, useAlertStore, useAuthStore } from "../../store";
import { useNavigate } from "react-router";
import { LivePrice } from "../components/LivePrice";
import { PriceAlertModal } from "../components/PriceAlertModal";

export function Stocks() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { assets } = useMarketStore();
  const { watchlists, addAsset } = useWatchlistStore();
  const { createAlert } = useAlertStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWatchlist, setSelectedWatchlist] = useState("");
  const [alertForm, setAlertForm] = useState<{ symbol: string; initialPrice: number } | null>(null);

  // Filter stocks from market assets
  const stocks = assets.filter((a) => a.type === "stock" && a.symbol !== "NIFTY_50" && a.symbol !== "SENSEX" && a.symbol !== "BANK_NIFTY");

  const filteredStocks = stocks.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Set default watchlist on load
  if (!selectedWatchlist && watchlists.length > 0) {
    setSelectedWatchlist(watchlists[0].id);
  }

  const handleAddWatchlist = (symbol: string) => {
    if (user?.uid && selectedWatchlist) {
      addAsset(user.uid, selectedWatchlist, symbol);
    }
  };

  const handleCreateAlert = (symbol: string, assetType: string, condition: "above" | "below", value: number) => {
    if (user?.uid) {
      createAlert(user.uid, symbol, "stock", condition, value);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-foreground font-medium">Indian Stocks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and trade leading Indian equities (NSE & BSE) in real time
          </p>
        </div>
        
        {/* Watchlist Quick Selector */}
        {watchlists.length > 0 && (
          <div className="flex items-center gap-2 bg-card border border-border/40 p-2 rounded-lg">
            <span className="text-xs text-muted-foreground font-medium">Select Watchlist:</span>
            <select
              value={selectedWatchlist}
              onChange={(e) => setSelectedWatchlist(e.target.value)}
              className="bg-muted text-xs text-foreground border border-border/30 rounded px-2 py-1 focus:outline-none"
            >
              {watchlists.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Search Input */}
      <div className="bg-card border border-border/40 rounded-xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search stocks by name or symbol (e.g. Reliance, TCS)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-background border border-border/40 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Stocks Table */}
      <div className="bg-card border border-border/40 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr className="border-b border-border/40">
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-14">Watch</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Symbol</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Company</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Price</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Change %</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Volume</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sector</th>
                <th className="text-center p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {filteredStocks.map((stock) => {
                const isPositive = stock.change >= 0;
                return (
                  <tr
                    key={stock.symbol}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    <td className="p-4">
                      <button 
                        onClick={() => handleAddWatchlist(stock.symbol)}
                        title="Add to Watchlist"
                        className="hover:text-yellow-500 text-muted-foreground transition-colors"
                      >
                        <Star className="size-4 hover:fill-yellow-500" />
                      </button>
                    </td>
                    <td className="p-4 text-sm font-semibold text-foreground tracking-wider">{stock.symbol}</td>
                    <td className="p-4 text-sm text-muted-foreground">{stock.name}</td>
                    <td className="p-4 text-right text-sm text-foreground font-medium">
                      <LivePrice value={stock.price} type="currency" currencySymbol="₹" />
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isPositive ? (
                          <TrendingUp className="size-3 text-emerald-400" />
                        ) : (
                          <TrendingDown className="size-3 text-red-400" />
                        )}
                        <span
                          className={`text-sm font-medium ${
                            isPositive ? "text-emerald-400" : "text-red-400"
                          }`}
                        >
                          {isPositive ? "+" : ""}
                          {stock.change.toFixed(2)}%
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right text-sm text-muted-foreground">{stock.volume}</td>
                    <td className="p-4 text-right text-sm text-muted-foreground">
                      <span className="px-2.5 py-0.5 rounded-full bg-muted/30 border border-border/30 text-[10px]">
                        {stock.sector}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setAlertForm({ symbol: stock.symbol, initialPrice: stock.price })}
                          title="Set Price Alert"
                          className="p-1.5 hover:bg-muted/30 text-muted-foreground hover:text-foreground rounded transition-colors"
                        >
                          <Bell className="size-4" />
                        </button>
                        <button
                          onClick={() => {
                            localStorage.setItem("investiq_selected_symbol", stock.symbol);
                            navigate("/markets");
                          }}
                          title="Open in Workspace"
                          className="p-1.5 hover:bg-muted/30 text-muted-foreground hover:text-foreground rounded transition-colors"
                        >
                          <ExternalLink className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredStocks.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-muted-foreground">
                    <Search className="size-8 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm font-medium text-foreground mb-1">No stocks match your search</p>
                    <p className="text-xs text-muted-foreground">
                      Try searching for other major companies like <strong className="text-emerald-400">Tata Motors</strong>, <strong className="text-emerald-400">Wipro</strong>, or <strong className="text-emerald-400">Reliance</strong>.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert Creator Modal */}
      <PriceAlertModal
        isOpen={!!alertForm}
        onClose={() => setAlertForm(null)}
        symbol={alertForm?.symbol || ""}
        assetType="stock"
        initialPrice={alertForm?.initialPrice || 0}
        currencySymbol="₹"
        onCreateAlert={handleCreateAlert}
      />
    </div>
  );
}

