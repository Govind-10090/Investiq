import { useState, useEffect } from "react";
import { Lightbulb, TrendingUp, AlertTriangle, Target, Shield, Zap, Percent, Activity, Play, BrainCircuit, RefreshCw, BarChart2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useMarketStore, useBacktestStore } from "../../store";
import { SSEStreamer } from "../../sse/streamer";
import { getAISignal, getAssetHistory } from "../../api/clients";

const staticInsights = [
  {
    icon: TrendingUp,
    title: "Portfolio Diversification Opportunity",
    description: "Your portfolio has high concentration in IT sector (45%). Consider adding exposure to FMCG and Pharma sectors for better risk management and stability during market volatility.",
    category: "Opportunity",
    priority: "High",
    action: "View Recommendations",
    color: "emerald"
  },
  {
    icon: Target,
    title: "Goal Achievement Alert",
    description: "You're on track to achieve your retirement goal by 2045. Current returns of 24.8% exceed your target of 18% by 6.8%. Consider rebalancing to lock in gains and reduce risk exposure.",
    category: "Achievement",
    priority: "Medium",
    action: "Review Goals",
    color: "blue"
  },
  {
    icon: AlertTriangle,
    title: "Market Volatility Warning",
    description: "Banking sector showing increased volatility (Beta: 1.42). Review your HDFC Bank and ICICI Bank holdings which represent 28% of your portfolio. Stop-loss recommended at 5% below current levels.",
    category: "Risk Alert",
    priority: "High",
    action: "Set Stop Loss",
    color: "yellow"
  }
];

export function Insights() {
  const { assets, fetchPrices } = useMarketStore();
  const { runBacktest, progress, statusText, isRunning, result, clearResult } = useBacktestStore();

  const [activeTab, setActiveTab] = useState<"signals" | "backtest" | "insights">("signals");
  const [selectedAsset, setSelectedAsset] = useState("RELIANCE");

  // AI Signal Engine states
  const [signalProgress, setSignalProgress] = useState(0);
  const [signalStatusText, setSignalStatusText] = useState("");
  const [isSignalRunning, setIsSignalRunning] = useState(false);
  const [signalResult, setSignalResult] = useState<any | null>(null);

  // Strategy Builder form
  const [strategyName, setStrategyName] = useState("RSI Mean Reversion");
  const [entryIndicator, setEntryIndicator] = useState<"RSI" | "SMA" | "EMA">("RSI");
  const [entryCondition, setEntryCondition] = useState<"less_than" | "greater_than">("less_than");
  const [entryVal, setEntryVal] = useState(30);

  const [exitIndicator, setExitIndicator] = useState<"RSI" | "SMA" | "EMA">("RSI");
  const [exitCondition, setExitCondition] = useState<"less_than" | "greater_than">("greater_than");
  const [exitVal, setExitVal] = useState(70);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  const handleGenerateSignal = () => {
    setIsSignalRunning(true);
    setSignalProgress(0);
    setSignalStatusText("Retrieving current price action tickers...");
    setSignalResult(null);

    const asset = assets.find(a => a.symbol === selectedAsset);
    if (!asset) {
      setIsSignalRunning(false);
      return;
    }
    const history = getAssetHistory(selectedAsset, 30);

    // Fetch actual signal in parallel to allow SSE steps to animate smoothly
    const signalPromise = getAISignal(asset, history);

    SSEStreamer.streamAISignals(selectedAsset, async (event) => {
      if (event.type === "progress") {
        setSignalProgress(event.progress || 0);
        setSignalStatusText(event.data.message);
      } else if (event.type === "complete") {
        try {
          setSignalStatusText("Compiling recommendations...");
          const actualSignal = await signalPromise;
          setSignalProgress(100);
          setIsSignalRunning(false);
          setSignalResult(actualSignal);
        } catch (e) {
          setSignalProgress(100);
          setIsSignalRunning(false);
          setSignalResult(event.data.signal);
        }
      }
    });
  };

  const handleRunBacktest = () => {
    runBacktest({
      name: strategyName,
      assetSymbol: selectedAsset,
      entryRules: { indicator: entryIndicator, condition: entryCondition as any, value: entryVal },
      exitRules: { indicator: exitIndicator, condition: exitCondition as any, value: exitVal },
      startDate: "2025-01-01",
      endDate: "2026-06-01"
    });
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl text-foreground font-medium flex items-center gap-2">
          <BrainCircuit className="size-6 text-emerald-400" />
          InvestIQ Research Lab
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Access automated AI signals and build/backtest algorithmic strategies.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border/20 pb-1.5 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("signals")}
          className={`px-4 py-2 rounded-lg whitespace-nowrap text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "signals"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          AI Signal Engine
        </button>
        <button
          onClick={() => setActiveTab("backtest")}
          className={`px-4 py-2 rounded-lg whitespace-nowrap text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "backtest"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Backtesting Laboratory
        </button>
        <button
          onClick={() => setActiveTab("insights")}
          className={`px-4 py-2 rounded-lg whitespace-nowrap text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "insights"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          AI Advisory Advisor
        </button>
      </div>

      {/* ---------------------------------------------------- */}
      {/* Tab 1: AI Signal Engine */}
      {/* ---------------------------------------------------- */}
      {activeTab === "signals" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Signal Control Panel */}
          <div className="lg:col-span-1 bg-card border border-border/40 rounded-xl p-5 space-y-4">
            <h2 className="text-md text-foreground font-medium">Configure Signal Engine</h2>
            
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground block">Select Asset target</label>
              <select
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
                className="w-full bg-background border border-border/40 rounded-lg text-xs px-2.5 py-2 text-foreground focus:outline-none"
              >
                {assets.map(a => (
                  <option key={a.symbol} value={a.symbol}>{a.symbol} - {a.name} ({a.type})</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGenerateSignal}
              disabled={isSignalRunning}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`size-3.5 ${isSignalRunning ? "animate-spin" : ""}`} />
              Generate BUY/HOLD/SELL
            </button>

            {/* Signal Stream Loader */}
            {isSignalRunning && (
              <div className="space-y-2 border-t border-border/20 pt-4">
                <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                  <span>{signalStatusText}</span>
                  <span>{signalProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${signalProgress}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Signal Result Outputs */}
          <div className="lg:col-span-2 space-y-4">
            {signalResult ? (
              <div className="bg-card border border-border/45 rounded-xl p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-border/20 pb-4 flex-wrap gap-4">
                  <div>
                    <h3 className="text-lg text-foreground font-bold tracking-tight">AI recommendation for {selectedAsset}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Compiled just now via OpenAI Engine</p>
                  </div>

                  {/* Signal Badge */}
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-[10px] text-muted-foreground block text-right font-medium uppercase">Confidence</span>
                      <strong className="text-foreground text-md font-bold">{signalResult.confidence}%</strong>
                    </div>
                    <div className={`px-4 py-2 rounded-lg font-bold text-center text-sm shadow-md ${
                      signalResult.recommendation === "BUY" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" :
                      signalResult.recommendation === "SELL" ? "bg-red-500/10 text-red-400 border border-red-500/30" :
                      "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                    }`}>
                      {signalResult.recommendation}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-background/40 p-4 border border-border/30 rounded-lg">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">AI Analysis Description</span>
                    <p className="text-xs text-foreground leading-relaxed mt-2">{signalResult.explanation}</p>
                  </div>
                  <div className="bg-background/40 p-4 border border-border/30 rounded-lg">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Technical Overview</span>
                    <p className="text-xs text-foreground leading-relaxed mt-2">{signalResult.technicalSummary}</p>
                  </div>
                </div>

                <div className="bg-background/40 p-4 border border-border/30 rounded-lg flex items-center justify-between flex-wrap gap-4">
                  <div className="max-w-md">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">News Sentiment Impact</span>
                    <p className="text-xs text-foreground leading-relaxed mt-1">{signalResult.newsImpact}</p>
                  </div>
                  <div className="bg-muted border border-border/40 p-3 rounded-lg text-center">
                    <span className="text-[9px] text-muted-foreground block font-bold">RISK RATING</span>
                    <strong className={`text-xs uppercase font-bold block mt-1 ${
                      signalResult.riskRating === "High" ? "text-red-400" :
                      signalResult.riskRating === "Medium" ? "text-amber-400" : "text-emerald-400"
                    }`}>
                      {signalResult.riskRating}
                    </strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border/40 rounded-xl p-12 text-center text-muted-foreground text-sm font-medium flex flex-col items-center justify-center h-full min-h-[300px]">
                <Activity className="size-8 text-muted-foreground/30 animate-pulse mb-3" />
                Select an asset and click "Generate" to retrieve real-time technical & fundamental AI signals.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* Tab 2: Backtesting Laboratory */}
      {/* ---------------------------------------------------- */}
      {activeTab === "backtest" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Backtest Strategy Controls */}
          <div className="lg:col-span-1 bg-card border border-border/40 rounded-xl p-5 space-y-4">
            <h2 className="text-md text-foreground font-medium flex items-center gap-2">
              <Zap className="size-4 text-emerald-400" /> Algorithmic Rules Builder
            </h2>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Select Backtest Asset</label>
              <select
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
                className="w-full bg-background border border-border/40 rounded-lg text-xs px-2.5 py-2 text-foreground focus:outline-none"
              >
                {assets.map(a => (
                  <option key={a.symbol} value={a.symbol}>{a.symbol} - {a.name}</option>
                ))}
              </select>
            </div>

            {/* Entry Condition */}
            <div className="space-y-2 border-t border-border/20 pt-4">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Buy Entry Conditions</span>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={entryIndicator}
                  onChange={(e) => setEntryIndicator(e.target.value as any)}
                  className="bg-background border border-border/40 rounded text-[11px] px-2 py-1.5 text-foreground focus:outline-none"
                >
                  <option value="RSI">RSI (14)</option>
                  <option value="SMA">SMA (14)</option>
                  <option value="EMA">EMA (20)</option>
                </select>
                <select
                  value={entryCondition}
                  onChange={(e) => setEntryCondition(e.target.value as any)}
                  className="bg-background border border-border/40 rounded text-[11px] px-2 py-1.5 text-foreground focus:outline-none"
                >
                  <option value="less_than">Falls Below</option>
                  <option value="greater_than">Crosses Above</option>
                </select>
              </div>
              <input
                type="number"
                value={entryVal}
                onChange={(e) => setEntryVal(parseInt(e.target.value) || 0)}
                className="w-full bg-background border border-border/40 rounded text-[11px] px-2.5 py-1.5 text-foreground focus:outline-none"
              />
            </div>

            {/* Exit Condition */}
            <div className="space-y-2 border-t border-border/20 pt-4">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Sell Exit Conditions</span>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={exitIndicator}
                  onChange={(e) => setExitIndicator(e.target.value as any)}
                  className="bg-background border border-border/40 rounded text-[11px] px-2 py-1.5 text-foreground focus:outline-none"
                >
                  <option value="RSI">RSI (14)</option>
                  <option value="SMA">SMA (14)</option>
                  <option value="EMA">EMA (20)</option>
                </select>
                <select
                  value={exitCondition}
                  onChange={(e) => setExitCondition(e.target.value as any)}
                  className="bg-background border border-border/40 rounded text-[11px] px-2 py-1.5 text-foreground focus:outline-none"
                >
                  <option value="less_than">Falls Below</option>
                  <option value="greater_than">Crosses Above</option>
                </select>
              </div>
              <input
                type="number"
                value={exitVal}
                onChange={(e) => setExitVal(parseInt(e.target.value) || 0)}
                className="w-full bg-background border border-border/40 rounded text-[11px] px-2.5 py-1.5 text-foreground focus:outline-none"
              />
            </div>

            <button
              onClick={handleRunBacktest}
              disabled={isRunning}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Play className="size-3.5 fill-current text-white" />
              Launch Backtest Strategy
            </button>

            {/* Simulation Loading */}
            {isRunning && (
              <div className="space-y-2 border-t border-border/20 pt-4">
                <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                  <span>{statusText}</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Backtest Simulation Results */}
          <div className="lg:col-span-2 space-y-4">
            {result ? (
              <div className="bg-card border border-border/40 rounded-xl p-5 space-y-6">
                
                {/* Metrics Grid */}
                <div>
                  <h3 className="text-md text-foreground font-medium mb-3">Simulation Performance Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard title="CAGR" value={`${result.cagr}%`} />
                    <MetricCard title="Sharpe Ratio" value={result.sharpeRatio.toString()} />
                    <MetricCard title="Max Drawdown" value={`-${result.maxDrawdown}%`} className="text-red-400" />
                    <MetricCard title="Win Rate" value={`${result.winRate}%`} />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    <MetricCard title="Profit Factor" value={result.profitFactor.toString()} />
                    <MetricCard title="Trades Executed" value={result.trades.toString()} />
                    <MetricCard title="Total Cumulative Return" value={`${result.cumulativeReturn}%`} />
                  </div>
                </div>

                {/* Equity Curve Line Chart */}
                <div>
                  <h3 className="text-md text-foreground font-medium mb-4 flex items-center gap-1.5">
                    <BarChart2 className="size-4 text-emerald-400" /> Cumulative Returns Curve
                  </h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={result.equityCurve}>
                      <defs>
                        <linearGradient id="colorPort" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorBench" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--muted-foreground)" fontSize={9} tickLine={false} axisLine={false} />
                      <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, "Valuation"]} />
                      <Legend />
                      <Area type="monotone" name="Strategy Return" dataKey="portfolioValue" stroke="#10b981" strokeWidth={2} fill="url(#colorPort)" />
                      <Area type="monotone" name="Benchmark Index" dataKey="benchmarkValue" stroke="#3b82f6" strokeWidth={1.5} fill="url(#colorBench)" strokeDasharray="3 3" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
                <div className="bg-card border border-border/40 rounded-xl p-12 text-center text-muted-foreground text-sm font-medium flex flex-col items-center justify-center h-full min-h-[300px]">
                <Play className="size-8 text-muted-foreground/30 animate-pulse mb-3" />
                Select indicator rules on the left panel and click "Launch" to run historical strategy backtests.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* Tab 3: Advisory Insights */}
      {/* ---------------------------------------------------- */}
      {activeTab === "insights" && (
        <div className="grid grid-cols-1 gap-4">
          {staticInsights.map((insight, index) => {
            const Icon = insight.icon;
            return (
              <div
                key={index}
                className="bg-card border border-border/30 rounded-xl p-5 hover:border-border/60 transition-all flex items-start gap-4"
              >
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                  <Icon className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 justify-between mb-2">
                    <h3 className="text-sm font-semibold text-foreground truncate">{insight.title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      insight.priority === "High" ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400"
                    }`}>
                      {insight.priority}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">{insight.description}</p>
                  <button className="text-xs font-semibold text-emerald-400 hover:text-emerald-500 flex items-center gap-1 cursor-pointer">
                    {insight.action}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Internal helpers

interface MetricCardProps {
  title: string;
  value: string;
  className?: string;
}

function MetricCard({ title, value, className = "text-foreground" }: MetricCardProps) {
  return (
    <div className="bg-background/40 border border-border/30 p-3.5 rounded-lg">
      <span className="text-[10px] text-muted-foreground uppercase font-bold block">{title}</span>
      <strong className={`text-md font-bold block mt-1.5 ${className}`}>{value}</strong>
    </div>
  );
}
