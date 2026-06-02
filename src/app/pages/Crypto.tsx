import { useState, useEffect, useRef } from "react";
import { TrendingUp, TrendingDown, Star, Bell, ExternalLink, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useMarketStore, useWatchlistStore, useAlertStore, useAuthStore } from "../../store";
import { getAssetHistory, Candle } from "../../api/clients";
import { useNavigate } from "react-router";
import { LivePrice } from "../components/LivePrice";
import { PriceAlertModal } from "../components/PriceAlertModal";

export function Crypto() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { assets } = useMarketStore();
  const { watchlists, addAsset } = useWatchlistStore();
  const { createAlert } = useAlertStore();

  const [activeSymbol, setActiveSymbol] = useState("BTC");
  const [history, setHistory] = useState<Candle[]>([]);
  const cryptoSymbolRef = useRef<string>("");
  const [selectedWatchlist, setSelectedWatchlist] = useState("");
  const [alertForm, setAlertForm] = useState<{ symbol: string; initialPrice: number } | null>(null);

  // Filter crypto from assets
  const cryptos = assets.filter((a) => a.type === "crypto");
  const activeCrypto = cryptos.find(c => c.symbol === activeSymbol) || cryptos[0] || {
    symbol: "BTC",
    name: "Bitcoin",
    price: 67450,
    change: 2.45,
    volume: "$32.4B",
    marketCap: "$1.3T"
  };

  useEffect(() => {
    const hist = getAssetHistory(activeSymbol, 14); // 14-day history
    setHistory(hist);
    cryptoSymbolRef.current = activeSymbol;
  }, [activeSymbol]);

  // Sync sparkline last point with live crypto price tick
  useEffect(() => {
    if (cryptoSymbolRef.current !== activeSymbol) return;
    const currentPrice = activeCrypto.price;
    setHistory(prev => {
      if (prev.length === 0) return prev;
      const lastIndex = prev.length - 1;
      if (prev[lastIndex].close === currentPrice) return prev;
      
      const copy = [...prev];
      const lastCandle = { ...copy[lastIndex] };
      lastCandle.close = currentPrice;
      lastCandle.high = Math.max(lastCandle.high, currentPrice);
      lastCandle.low = Math.min(lastCandle.low, currentPrice);
      copy[lastIndex] = lastCandle;
      return copy;
    });
  }, [activeCrypto.price, activeSymbol]);

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
      createAlert(user.uid, symbol, "crypto", condition, value);
    }
  };

  const chartData = history.map(h => ({
    name: new Date(h.time).toLocaleDateString([], { month: "short", day: "numeric" }),
    Price: h.close
  }));

  const activePos = activeCrypto.change >= 0;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-foreground font-medium">Cryptocurrency</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and trade digital assets (Web3 & DeFi tokens) in real time
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

      {/* Market Indices / Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border/40 rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase font-semibold">Total Crypto Market Cap</p>
          <p className="text-2xl text-foreground font-semibold mt-1.5">$2.48T</p>
          <div className="flex items-center gap-1 text-xs text-emerald-400 mt-1">
            <TrendingUp className="size-3" />
            <span>+3.12% 24h Change</span>
          </div>
        </div>
        <div className="bg-card border border-border/40 rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase font-semibold">24h Trade Volume</p>
          <p className="text-2xl text-foreground font-semibold mt-1.5">$84.5B</p>
          <div className="flex items-center gap-1 text-xs text-emerald-400 mt-1">
            <TrendingUp className="size-3" />
            <span>+12.4% Volume Spike</span>
          </div>
        </div>
        <div className="bg-card border border-border/40 rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase font-semibold">Bitcoin Dominance</p>
          <p className="text-2xl text-foreground font-semibold mt-1.5">54.6%</p>
          <div className="flex items-center gap-1 text-xs text-red-400 mt-1">
            <TrendingDown className="size-3" />
            <span>-0.45% Dominance drop</span>
          </div>
        </div>
      </div>

      {/* Dynamic Sparkline Detail Chart */}
      <div className="bg-card border border-border/40 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg text-foreground font-semibold">{activeCrypto.name} ({activeCrypto.symbol})</h2>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 font-medium">Sparkline</span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">14-day historical price movement</p>
          </div>
          <div className="text-right">
            <p className="text-2xl text-foreground font-bold">
              <LivePrice value={activeCrypto.price} type="currency" currencySymbol="$" />
            </p>
            <span className={`text-xs font-semibold ${activePos ? "text-emerald-400" : "text-red-400"}`}>
              {activePos ? "+" : ""}{activeCrypto.change.toFixed(2)}%
            </span>
          </div>
        </div>

        {chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis 
                stroke="var(--muted-foreground)" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                domain={["dataMin - 100", "dataMax + 100"]}
                tickFormatter={(val) => `$${val.toLocaleString()}`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px" }}
                labelStyle={{ color: "var(--muted-foreground)", fontSize: 10 }}
                itemStyle={{ color: "var(--foreground)", fontSize: 12 }}
              />
              <Area type="monotone" dataKey="Price" stroke="#f59e0b" strokeWidth={2} fill="url(#colorPrice)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Crypto Assets List Table */}
      <div className="bg-card border border-border/40 rounded-xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-border/40 bg-muted flex items-center justify-between">
          <h2 className="text-md text-foreground font-medium">Top Digital Assets</h2>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Activity className="size-3.5" /> High volatility assets
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="border-b border-border/40">
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-14">Watch</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Asset</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Price (USD)</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">24h Change</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Market Cap</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">24h Volume</th>
                <th className="text-center p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {cryptos.map((crypto) => {
                const active = crypto.symbol === activeSymbol;
                const pos = crypto.change >= 0;
                return (
                  <tr
                    key={crypto.symbol}
                    onClick={() => setActiveSymbol(crypto.symbol)}
                    className={`hover:bg-muted/40 transition-colors cursor-pointer ${
                      active ? "bg-orange-500/5" : ""
                    }`}
                  >
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => handleAddWatchlist(crypto.symbol)}
                        className="hover:text-yellow-500 text-muted-foreground transition-colors"
                      >
                        <Star className="size-4 hover:fill-yellow-500" />
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                          {crypto.symbol[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground tracking-wider">{crypto.symbol}</p>
                          <p className="text-xs text-muted-foreground">{crypto.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right text-sm text-foreground font-medium">
                      <LivePrice value={crypto.price} type="currency" currencySymbol="$" />
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {pos ? (
                          <TrendingUp className="size-3 text-emerald-400" />
                        ) : (
                          <TrendingDown className="size-3 text-red-400" />
                        )}
                        <span
                          className={`text-sm font-medium ${
                            pos ? "text-emerald-400" : "text-red-400"
                          }`}
                        >
                          {pos ? "+" : ""}
                          {crypto.change.toFixed(2)}%
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right text-sm text-muted-foreground font-medium">{crypto.marketCap}</td>
                    <td className="p-4 text-right text-sm text-muted-foreground font-medium">{crypto.volume}</td>
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setAlertForm({ symbol: crypto.symbol, initialPrice: crypto.price })}
                          className="p-1.5 hover:bg-muted/30 text-muted-foreground hover:text-foreground rounded transition-colors"
                        >
                          <Bell className="size-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSymbolInMarkets(crypto.symbol); // we can trigger this or route
                            navigate("/markets");
                          }}
                          className="p-1.5 hover:bg-muted/30 text-muted-foreground hover:text-foreground rounded transition-colors"
                        >
                          <ExternalLink className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert Creator Modal */}
      <PriceAlertModal
        isOpen={!!alertForm}
        onClose={() => setAlertForm(null)}
        symbol={alertForm?.symbol || ""}
        assetType="crypto"
        initialPrice={alertForm?.initialPrice || 0}
        currencySymbol="$"
        onCreateAlert={handleCreateAlert}
      />
    </div>
  );
}

// Private helper to bridge selection to Markets
function setSelectedSymbolInMarkets(symbol: string) {
  try {
    // Write selection state locally, Markets page can check it
    localStorage.setItem("investiq_selected_symbol", symbol);
  } catch (e) {}
}

