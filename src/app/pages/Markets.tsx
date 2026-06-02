import { useState, useEffect, useRef } from "react";
import { useMarketStore } from "../../store";
import { LightweightChart } from "../../charts/LightweightChart";
import { getAssetHistory, Candle } from "../../api/clients";
import { Star, BarChart3, LineChart, TrendingUp, TrendingDown, Eye, Plus } from "lucide-react";

export function Markets() {
  const { assets, fetchPrices, updatePricesFromWS } = useMarketStore();
  
  // States for selected assets, type, indicators, comparison
  const [selectedSymbol, setSelectedSymbol] = useState("RELIANCE");
  const [chartType, setChartType] = useState<"candlestick" | "line" | "area">("candlestick");
  
  const [showSMA, setShowSMA] = useState(false);
  const [showEMA, setShowEMA] = useState(false);
  const [showBB, setShowBB] = useState(false);
  const [showVWAP, setShowVWAP] = useState(false);
  const [showRSI, setShowRSI] = useState(false);
  const [showMACD, setShowMACD] = useState(false);

  const [compareSymbol, setCompareSymbol] = useState<string>("");
  const [timeframe, setTimeframe] = useState<string>("1M"); // "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "5Y" | "MAX"
  
  const [mainHistory, setMainHistory] = useState<Candle[]>([]);
  const [compareHistory, setCompareHistory] = useState<Candle[]>([]);

  // Refs to verify which symbols are currently loaded in the chart state
  const mainHistorySymbolRef = useRef<string>("");
  const compareHistorySymbolRef = useRef<string>("");
  
  // Load selected symbol from other market pages if navigated
  useEffect(() => {
    const loadSymbol = () => {
      const symbol = localStorage.getItem("investiq_selected_symbol");
      if (symbol) {
        setSelectedSymbol(symbol);
        localStorage.removeItem("investiq_selected_symbol");
      }
    };
    loadSymbol();

    window.addEventListener("investiq_select_symbol", loadSymbol);
    return () => {
      window.removeEventListener("investiq_select_symbol", loadSymbol);
    };
  }, []);

  // Load candle history on symbol or timeframe shift
  useEffect(() => {
    const mainData = getAssetHistory(selectedSymbol, timeframe);
    setMainHistory(mainData);
    mainHistorySymbolRef.current = selectedSymbol;
  }, [selectedSymbol, timeframe]);

  // Load candle history for comparison asset
  useEffect(() => {
    if (compareSymbol) {
      const compData = getAssetHistory(compareSymbol, timeframe);
      setCompareHistory(compData);
      compareHistorySymbolRef.current = compareSymbol;
    } else {
      setCompareHistory([]);
      compareHistorySymbolRef.current = "";
    }
  }, [compareSymbol, timeframe]);

  const activeAsset = assets.find((a) => a.symbol === selectedSymbol) || assets[0] || {
    symbol: "RELIANCE",
    name: "Reliance Industries",
    price: 2456.75,
    change: 1.01,
    volume: "2.4M",
    type: "stock",
    sector: "Energy"
  };

  // Sync main chart last candle with live price tick
  useEffect(() => {
    if (mainHistorySymbolRef.current !== selectedSymbol) return;
    const currentPrice = activeAsset.price;
    setMainHistory(prev => {
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
  }, [activeAsset.price, selectedSymbol]);

  // Sync compare chart last candle with live comparison price tick
  const compareAsset = assets.find((a) => a.symbol === compareSymbol);
  useEffect(() => {
    if (!compareAsset || compareHistorySymbolRef.current !== compareSymbol) return;
    const currentPrice = compareAsset.price;
    setCompareHistory(prev => {
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
  }, [compareAsset?.price, compareSymbol]);

  const handleAssetSelect = (symbol: string) => {
    setSelectedSymbol(symbol);
    // Don't compare same asset
    if (compareSymbol === symbol) {
      setCompareSymbol("");
    }
  };

  const isPositive = activeAsset.change >= 0;

  // --- Performance returns and metrics calculations ---
  const calculateReturns = () => {
    if (mainHistory.length === 0) return { d: 0, w: 0, m: 0, y: 0, y5: 0, cagr: 0, vol: 0 };
    
    const lastItem = mainHistory[mainHistory.length - 1];
    const closes = mainHistory.map(h => h.close);
    const firstClose = closes[0];
    const lastClose = closes[closes.length - 1];
    
    // Day Change
    const d = activeAsset.change;
    
    // 1W Change
    const wIndex = Math.max(0, mainHistory.length - 7);
    const w = ((lastClose - closes[wIndex]) / (closes[wIndex] || 1)) * 100;
    
    // 1M Change
    const mIndex = Math.max(0, mainHistory.length - 30);
    const m = ((lastClose - closes[mIndex]) / (closes[mIndex] || 1)) * 100;
    
    // 1Y Change
    const yIndex = Math.max(0, mainHistory.length - 252); // Approx trading days
    const y = ((lastClose - closes[yIndex]) / (closes[yIndex] || 1)) * 100;
    
    // 5Y Change
    const y5Index = Math.max(0, mainHistory.length - 1260); // Approx trading days
    const y5 = ((lastClose - closes[y5Index]) / (closes[y5Index] || 1)) * 100;
    
    // CAGR
    const years = mainHistory.length / 252;
    const cagr = years > 0 ? (Math.pow(lastClose / firstClose, 1 / years) - 1) * 100 : ((lastClose - firstClose) / firstClose) * 100;

    // Daily Returns and Standard Deviation (Volatility)
    const dailyReturns: number[] = [];
    for (let i = 1; i < closes.length; i++) {
      const prev = closes[i - 1];
      const cur = closes[i];
      dailyReturns.push(prev > 0 ? (cur - prev) / prev : 0);
    }
    const avgReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / (dailyReturns.length || 1);
    const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (dailyReturns.length || 1);
    const vol = Math.sqrt(variance) * Math.sqrt(252) * 100;

    return {
      d,
      w: Number(w.toFixed(2)),
      m: Number(m.toFixed(2)),
      y: Number(y.toFixed(2)),
      y5: Number(y5.toFixed(2)),
      cagr: Number(cagr.toFixed(2)),
      vol: Number(vol.toFixed(2))
    };
  };

  const performance = calculateReturns();

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-foreground font-medium flex items-center gap-2">
            <BarChart3 className="size-6 text-emerald-400" />
            Trading Workspace
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Interactive analytical charts with indicator overlays & index comparisons.
          </p>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Column - Assets Selector List */}
        <div className="xl:col-span-1 bg-card border border-border/40 rounded-xl overflow-hidden flex flex-col h-[740px]">
          <div className="p-4 border-b border-border/40 bg-muted">
            <h2 className="text-sm text-foreground font-medium">Select Ticker Asset</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Real-time quotes feed</p>
          </div>
          
          <div className="flex-1 overflow-y-auto divide-y divide-border/20">
            {assets.map((asset) => {
              const active = asset.symbol === selectedSymbol;
              const pos = asset.change >= 0;
              return (
                <div
                  key={asset.symbol}
                  onClick={() => handleAssetSelect(asset.symbol)}
                  className={`p-3.5 flex items-center justify-between cursor-pointer transition-all ${
                    active ? "bg-emerald-500/5 border-l-2 border-emerald-500" : "hover:bg-muted/40"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-foreground tracking-wider uppercase">
                        {asset.symbol}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground capitalize">
                        {asset.type}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{asset.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-foreground">
                      {asset.type === "forex" ? `₹${asset.price}` : `₹${asset.price.toLocaleString()}`}
                    </p>
                    <div className="flex items-center gap-0.5 justify-end mt-0.5 text-[10px]">
                      {pos ? <TrendingUp className="size-3 text-emerald-400" /> : <TrendingDown className="size-3 text-red-400" />}
                      <span className={pos ? "text-emerald-400" : "text-red-400"}>
                        {pos ? "+" : ""}{asset.change.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Columns - Trading Chart & Workspace Controllers */}
        <div className="xl:col-span-3 space-y-4">
          
          {/* Controllers Card */}
          <div className="bg-card border border-border/40 rounded-xl p-4 flex flex-wrap gap-4 items-center justify-between">
            {/* Chart Style Toggle */}
            <div className="flex items-center gap-1 bg-muted border border-border/40 p-1 rounded-lg">
              <button
                onClick={() => setChartType("candlestick")}
                className={`px-3 py-1.5 text-xs rounded font-medium transition-all ${
                  chartType === "candlestick" ? "bg-emerald-500/10 text-emerald-400" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Candles
              </button>
              <button
                onClick={() => setChartType("area")}
                className={`px-3 py-1.5 text-xs rounded font-medium transition-all ${
                  chartType === "area" ? "bg-emerald-500/10 text-emerald-400" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Area
              </button>
              <button
                onClick={() => setChartType("line")}
                className={`px-3 py-1.5 text-xs rounded font-medium transition-all ${
                  chartType === "line" ? "bg-emerald-500/10 text-emerald-400" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Line
              </button>
            </div>

            {/* Technical Overlay Toggles */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mr-1">Overlays:</span>
              <button
                onClick={() => setShowSMA(!showSMA)}
                className={`px-2.5 py-1 text-xs rounded border transition-all ${
                  showSMA 
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30" 
                    : "border-border/30 text-muted-foreground hover:text-foreground"
                }`}
              >
                SMA (14)
              </button>
              <button
                onClick={() => setShowEMA(!showEMA)}
                className={`px-2.5 py-1 text-xs rounded border transition-all ${
                  showEMA 
                    ? "bg-purple-500/10 text-purple-400 border-purple-500/30" 
                    : "border-border/30 text-muted-foreground hover:text-foreground"
                }`}
              >
                EMA (20)
              </button>
              <button
                onClick={() => setShowBB(!showBB)}
                className={`px-2.5 py-1 text-xs rounded border transition-all ${
                  showBB 
                    ? "bg-green-500/10 text-green-400 border-green-500/30" 
                    : "border-border/30 text-muted-foreground hover:text-foreground"
                }`}
              >
                Bands (20,2)
              </button>
              <button
                onClick={() => setShowVWAP(!showVWAP)}
                className={`px-2.5 py-1 text-xs rounded border transition-all ${
                  showVWAP 
                    ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" 
                    : "border-border/30 text-muted-foreground hover:text-foreground"
                }`}
              >
                VWAP
              </button>
              <button
                onClick={() => setShowRSI(!showRSI)}
                className={`px-2.5 py-1 text-xs rounded border transition-all ${
                  showRSI 
                    ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" 
                    : "border-border/30 text-muted-foreground hover:text-foreground"
                }`}
              >
                RSI
              </button>
              <button
                onClick={() => setShowMACD(!showMACD)}
                className={`px-2.5 py-1 text-xs rounded border transition-all ${
                  showMACD 
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/30" 
                    : "border-border/30 text-muted-foreground hover:text-foreground"
                }`}
              >
                MACD
              </button>
            </div>

            {/* Timeframes */}
            <div className="flex items-center gap-1.5 bg-muted border border-border/40 p-1 rounded-lg">
              {[
                { label: "1D", val: "1D" },
                { label: "1W", val: "1W" },
                { label: "1M", val: "1M" },
                { label: "3M", val: "3M" },
                { label: "6M", val: "6M" },
                { label: "1Y", val: "1Y" },
                { label: "5Y", val: "5Y" },
                { label: "MAX", val: "MAX" }
              ].map((tf) => (
                <button
                  key={tf.label}
                  onClick={() => setTimeframe(tf.val)}
                  className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
                    timeframe === tf.val ? "bg-accent text-accent-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Asset Info Card */}
          <div className="bg-card border border-border/40 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                <LineChart className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-md text-foreground font-medium uppercase">{activeAsset.symbol}</h3>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase px-1.5 py-0.5 bg-muted/20 border border-border/40 rounded">
                    {activeAsset.type}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{activeAsset.name}</p>
              </div>
            </div>

            {/* Price Quote Panel */}
            <div className="flex items-center gap-6">
              <div>
                <p className="text-2xl text-foreground font-semibold tracking-tight">
                  {activeAsset.type === "forex" ? `₹${activeAsset.price}` : `₹${activeAsset.price.toLocaleString()}`}
                </p>
                <div className="flex items-center gap-1 justify-end text-xs mt-0.5">
                  {isPositive ? <TrendingUp className="size-3 text-emerald-400" /> : <TrendingDown className="size-3 text-red-400" />}
                  <span className={isPositive ? "text-emerald-400" : "text-red-400"}>
                    {isPositive ? "+" : ""}{activeAsset.change.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Compare Asset Field */}
              <div className="border-l border-border/30 pl-6 space-y-1.5">
                <label className="text-[10px] text-muted-foreground uppercase font-semibold block">Compare Asset:</label>
                <select
                  value={compareSymbol}
                  onChange={(e) => setCompareSymbol(e.target.value)}
                  className="bg-background border border-border/40 rounded-lg text-xs px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">-- Overlay Asset --</option>
                  {assets
                    .filter(a => a.symbol !== selectedSymbol)
                    .map(a => (
                      <option key={a.symbol} value={a.symbol}>{a.symbol} - {a.name}</option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Lightweight Chart Render Box */}
          <div className="bg-card border border-border/40 rounded-xl p-5">
            <LightweightChart
              data={mainHistory}
              type={chartType}
              showSMA={showSMA}
              showEMA={showEMA}
              showBB={showBB}
              showVWAP={showVWAP}
              showRSI={showRSI}
              showMACD={showMACD}
              compareSymbol={compareSymbol}
              compareData={compareHistory}
            />
          </div>

          {/* Market Session & Performance Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Market Session Information */}
            <div className="bg-card border border-border/40 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border/20 pb-3">
                <h3 className="text-sm font-semibold text-foreground">Market Session Info</h3>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Market Open
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-muted-foreground">Current Price</span>
                  <div className="text-foreground font-bold text-sm">
                    ₹{activeAsset.price.toLocaleString()}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Day Change</span>
                  <div className={`font-bold text-sm ${activeAsset.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {activeAsset.change >= 0 ? "+" : ""}{activeAsset.change.toFixed(2)}%
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Day High</span>
                  <div className="text-foreground font-bold text-sm">
                    ₹{(activeAsset.high || Math.max(activeAsset.price, activeAsset.open || activeAsset.price) * 1.002).toLocaleString(undefined, {maximumFractionDigits: 2})}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Day Low</span>
                  <div className="text-foreground font-bold text-sm">
                    ₹{(activeAsset.low || Math.min(activeAsset.price, activeAsset.open || activeAsset.price) * 0.998).toLocaleString(undefined, {maximumFractionDigits: 2})}
                  </div>
                </div>
                <div className="space-y-1 pt-2 border-t border-border/10">
                  <span className="text-muted-foreground">Open Price</span>
                  <div className="text-foreground font-semibold">
                    ₹{(activeAsset.open || activeAsset.price / (1 + activeAsset.change/100)).toLocaleString(undefined, {maximumFractionDigits: 2})}
                  </div>
                </div>
                <div className="space-y-1 pt-2 border-t border-border/10">
                  <span className="text-muted-foreground">Prev Close</span>
                  <div className="text-foreground font-semibold">
                    ₹{(activeAsset.price / (1 + activeAsset.change/100)).toLocaleString(undefined, {maximumFractionDigits: 2})}
                  </div>
                </div>
                <div className="space-y-1 pt-2 border-t border-border/10">
                  <span className="text-muted-foreground">Volume</span>
                  <div className="text-foreground font-semibold">
                    {activeAsset.volume || "1.2M"}
                  </div>
                </div>
                <div className="space-y-1 pt-2 border-t border-border/10">
                  <span className="text-muted-foreground">Sector</span>
                  <div className="text-foreground font-semibold capitalize">
                    {activeAsset.sector || "General"}
                  </div>
                </div>
              </div>
            </div>

            {/* Performance & Quantitative Analytics */}
            <div className="bg-card border border-border/40 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border/20 pb-3">
                <h3 className="text-sm font-semibold text-foreground">Performance Analytics</h3>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Metrics</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                {/* Returns Table */}
                <div className="space-y-2 border-r border-border/10 pr-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">1D Return:</span>
                    <span className={`font-semibold ${performance.d >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {performance.d >= 0 ? "+" : ""}{performance.d.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">1W Return:</span>
                    <span className={`font-semibold ${performance.w >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {performance.w >= 0 ? "+" : ""}{performance.w.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">1M Return:</span>
                    <span className={`font-semibold ${performance.m >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {performance.m >= 0 ? "+" : ""}{performance.m.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">1Y Return:</span>
                    <span className={`font-semibold ${performance.y >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {performance.y >= 0 ? "+" : ""}{performance.y.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">5Y Return:</span>
                    <span className={`font-semibold ${performance.y5 >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {performance.y5 >= 0 ? "+" : ""}{performance.y5.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Advanced Quantitative Metrics */}
                <div className="space-y-3 pl-2 flex flex-col justify-center">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Annual Volatility:</span>
                    <span className="text-foreground font-bold">{performance.vol}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">CAGR:</span>
                    <span className={`font-bold ${performance.cagr >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {performance.cagr >= 0 ? "+" : ""}{performance.cagr}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Sharpe Ratio:</span>
                    <span className="text-foreground font-bold">
                      {Number((performance.cagr / (performance.vol || 1)).toFixed(2))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
