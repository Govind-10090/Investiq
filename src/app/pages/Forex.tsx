import { useState, useEffect, useRef } from "react";
import { TrendingUp, TrendingDown, Star, Bell, ArrowRightLeft, ExternalLink } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useMarketStore, useWatchlistStore, useAlertStore, useAuthStore } from "../../store";
import { getAssetHistory, Candle } from "../../api/clients";
import { useNavigate } from "react-router";
import { LivePrice } from "../components/LivePrice";
import { PriceAlertModal } from "../components/PriceAlertModal";

export function Forex() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { assets } = useMarketStore();
  const { watchlists, addAsset } = useWatchlistStore();
  const { createAlert } = useAlertStore();

  const [activePair, setActivePair] = useState("USD/INR");
  const [history, setHistory] = useState<Candle[]>([]);
  const forexSymbolRef = useRef<string>("");
  const [selectedWatchlist, setSelectedWatchlist] = useState("");
  const [alertForm, setAlertForm] = useState<{ symbol: string; initialPrice: number } | null>(null);

  // Conversion calculator states
  const [convertAmount, setConvertAmount] = useState<number>(1000);
  const [convertFrom, setConvertFrom] = useState<string>("USD");

  // Filter forex from assets
  const forexes = assets.filter((a) => a.type === "forex");
  const activeForex = forexes.find(f => f.symbol === activePair) || forexes[0] || {
    symbol: "USD/INR",
    name: "US Dollar / Indian Rupee",
    price: 83.42,
    change: 0.05
  };

  useEffect(() => {
    const hist = getAssetHistory(activePair, 15);
    setHistory(hist);
    forexSymbolRef.current = activePair;
  }, [activePair]);

  // Sync rate chart last point with live forex price tick
  useEffect(() => {
    if (forexSymbolRef.current !== activePair) return;
    const currentPrice = activeForex.price;
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
  }, [activeForex.price, activePair]);

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
      createAlert(user.uid, symbol, "forex", condition, value);
    }
  };

  // Convert calculation
  const getConvertResult = () => {
    const targetAsset = forexes.find(f => f.symbol.startsWith(convertFrom));
    const rate = targetAsset ? targetAsset.price : 83.42;
    return (convertAmount * rate).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  };

  const chartData = history.map(h => ({
    time: new Date(h.time).toLocaleDateString([], { month: "short", day: "numeric" }),
    Rate: h.close
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-foreground font-medium">Forex Markets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor real-time foreign currency exchanges and global cross rates
          </p>
        </div>

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

      {/* Forex Grid cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {forexes.map((forex) => {
          const isPositive = forex.change >= 0;
          const active = forex.symbol === activePair;
          return (
            <div
              key={forex.symbol}
              onClick={() => setActivePair(forex.symbol)}
              className={`bg-card border border-border/40 rounded-xl p-5 cursor-pointer transition-all hover:bg-muted ${
                active ? "ring-1 ring-emerald-500 bg-emerald-500/5" : ""
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">{forex.symbol}</p>
                  <div className="text-xl text-foreground font-bold mt-1.5">
                    <LivePrice value={forex.price} type="currency" currencySymbol="₹" />
                  </div>
                </div>
                {isPositive ? (
                  <TrendingUp className="size-4 text-emerald-400" />
                ) : (
                  <TrendingDown className="size-4 text-red-400" />
                )}
              </div>
              <div className="flex items-center justify-between text-[11px] mt-2">
                <span className={isPositive ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>
                  {isPositive ? "+" : ""}{forex.change.toFixed(2)}%
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddWatchlist(forex.symbol);
                  }}
                  className="text-muted-foreground hover:text-yellow-500 transition-colors"
                >
                  <Star className="size-3.5 hover:fill-yellow-500" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Graph */}
      <div className="bg-card border border-border/40 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-lg text-foreground font-medium">{activeForex.symbol} Exchange Rate Graph</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Historical price trend parameters</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAlertForm({ symbol: activeForex.symbol, initialPrice: activeForex.price })}
              className="px-3.5 py-1.5 bg-muted hover:bg-accent text-xs text-foreground rounded-lg border border-border/40 flex items-center gap-1.5"
            >
              <Bell className="size-3.5" /> Alert
            </button>
            <button
              onClick={() => {
                localStorage.setItem("investiq_selected_symbol", activeForex.symbol);
                navigate("/markets");
              }}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-xs text-white rounded-lg flex items-center gap-1.5 font-medium"
            >
              <ExternalLink className="size-3.5" /> Workspace
            </button>
          </div>
        </div>

        {chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData}>
              <XAxis dataKey="time" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis 
                stroke="var(--muted-foreground)" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                domain={["dataMin - 0.05", "dataMax + 0.05"]} 
              />
              <Tooltip 
                contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px" }}
                labelStyle={{ color: "var(--muted-foreground)", fontSize: 10 }}
                itemStyle={{ color: "var(--foreground)", fontSize: 12 }}
              />
              <Line type="monotone" dataKey="Rate" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Currency Converter */}
      <div className="bg-card border border-border/40 rounded-xl p-6">
        <h2 className="text-md text-foreground font-medium mb-6 flex items-center gap-2">
          <ArrowRightLeft className="size-5 text-emerald-400" />
          Live Currency Converter
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs text-muted-foreground uppercase font-semibold mb-2">Convert From</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={convertAmount}
                onChange={(e) => setConvertAmount(parseFloat(e.target.value) || 0)}
                className="flex-1 h-10 px-4 bg-background border border-border/40 rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <select
                value={convertFrom}
                onChange={(e) => setConvertFrom(e.target.value)}
                className="h-10 px-4 bg-background border border-border/40 rounded-lg text-sm text-foreground focus:outline-none"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground uppercase font-semibold mb-2">Estimated Value (INR)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={`₹ ${getConvertResult()}`}
                readOnly
                className="flex-1 h-10 px-4 bg-background/50 border border-border/20 rounded-lg text-sm text-emerald-400 font-semibold"
              />
              <div className="h-10 px-6 bg-background/50 border border-border/20 rounded-lg text-sm text-muted-foreground flex items-center">
                INR
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Creator Modal */}
      <PriceAlertModal
        isOpen={!!alertForm}
        onClose={() => setAlertForm(null)}
        symbol={alertForm?.symbol || ""}
        assetType="forex"
        initialPrice={alertForm?.initialPrice || 0}
        currencySymbol="₹"
        onCreateAlert={handleCreateAlert}
      />
    </div>
  );
}

