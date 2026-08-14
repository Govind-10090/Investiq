import { useEffect, useState } from "react";
import { ArrowUpRight, ArrowDownRight, TrendingUp, ShieldCheck, AlertCircle, RefreshCw, PartyPopper, X, Mail } from "lucide-react";
import { PortfolioChart } from "../components/PortfolioChart";
import { MarketOverview } from "../components/MarketOverview";
import { WatchlistPreview } from "../components/WatchlistPreview";
import { NewsPreview } from "../components/NewsPreview";
import { InsightsPreview } from "../components/InsightsPreview";
import { useMarketStore, usePortfolioStore, useAuthStore } from "../../store";
import { generateWelcomeEmailHTML } from "../../services/emailService";

export function Dashboard() {
  const { user } = useAuthStore();
  const { assets, fetchPrices, updatePricesFromWS, connectionStatus, lastUpdated } = useMarketStore();
  const { holdings, fetchHoldings } = usePortfolioStore();
  const [welcomeName, setWelcomeName] = useState<string | null>(null);
  const [showWelcomeEmailModal, setShowWelcomeEmailModal] = useState(false);

  // Check for first-time registration welcome flag
  useEffect(() => {
    const name = sessionStorage.getItem("investiq_just_registered");
    if (name) {
      setWelcomeName(name);
      sessionStorage.removeItem("investiq_just_registered");
    }
  }, []);

  // Load and start WS updates
  useEffect(() => {
    fetchPrices();
    const unsub = updatePricesFromWS();
    return () => unsub();
  }, [fetchPrices, updatePricesFromWS]);

  // Load holdings for the user
  useEffect(() => {
    const uid = user?.uid || "guest";
    fetchHoldings(uid);
  }, [user?.uid, fetchHoldings]);

  // --- Calculate Live Metrics ---
  const holdingsWithLivePrice = holdings.map(h => {
    const liveAsset = assets.find(a => a.symbol === h.symbol);
    const currentPrice = liveAsset ? liveAsset.price : h.currentPrice;
    const value = Number((h.shares * currentPrice).toFixed(2));
    const cost = Number((h.shares * h.avgPrice).toFixed(2));
    const gain = Number((value - cost).toFixed(2));
    const gainPercent = cost > 0 ? Number(((gain / cost) * 100).toFixed(2)) : 0;
    
    return {
      ...h,
      currentPrice,
      value,
      cost,
      gain,
      gainPercent,
      liveAsset
    };
  });

  const totalValue = holdingsWithLivePrice.reduce((sum, h) => sum + h.value, 0);
  const totalCost = holdingsWithLivePrice.reduce((sum, h) => sum + h.cost, 0);
  const totalGains = totalValue - totalCost;
  const totalGainsPercent = totalCost > 0 ? (totalGains / totalCost) * 100 : 0;

  // Day P&L Calculation: sum of (holding.shares * liveAssetPrice * liveAssetChangePct / 100)
  const todayChange = holdingsWithLivePrice.reduce((sum, h) => {
    if (h.liveAsset) {
      const priceDelta = h.liveAsset.price * (h.liveAsset.change / 100);
      return sum + (h.shares * priceDelta);
    }
    return sum;
  }, 0);

  const todayChangePercent = totalValue > 0 ? (todayChange / totalValue) * 100 : 0;

  // Portfolio Health Score & Risk Calculation
  // Risk index: Crypto = 90, Stock = 50, Mutual Fund = 30, Forex = 15
  let weightedRisk = 0;
  let maxWeight = 0;
  
  if (holdingsWithLivePrice.length > 0) {
    let riskSum = 0;
    holdingsWithLivePrice.forEach(h => {
      const weight = h.value / totalValue;
      maxWeight = Math.max(maxWeight, weight);

      let assetRisk = 50; // default stock
      if (h.type === "crypto") assetRisk = 90;
      else if (h.type === "forex") assetRisk = 15;
      else if (h.type === "mutual_fund") assetRisk = 30;

      riskSum += assetRisk * weight;
    });
    weightedRisk = Math.round(riskSum);
  } else {
    weightedRisk = 0; // Neutral/No holdings
  }

  // Health Score: penalize high concentration (> 40% in one asset) and high risk (> 70)
  let healthScore = 100;
  if (holdingsWithLivePrice.length > 0) {
    if (maxWeight > 0.40) {
      healthScore -= Math.round((maxWeight - 0.40) * 100);
    }
    if (weightedRisk > 70) {
      healthScore -= Math.round((weightedRisk - 70) * 0.5);
    }
  } else {
    healthScore = 100;
  }
  healthScore = Math.max(10, Math.min(100, healthScore));

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(val);
  };

  return (
    <div className="space-y-6">

      {/* ✅ Welcome Registration Banner */}
      {welcomeName && (
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/60 via-emerald-900/30 to-emerald-950/60 p-6 shadow-2xl">
          {/* Animated glow blobs */}
          <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div className="size-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <PartyPopper className="size-7 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Welcome to InvestIQ
                  </span>
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  Hey {welcomeName}, great to have you! 🎉
                </h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-lg">
                  Your account has been created. A welcome letter has been dispatched to{" "}
                  <span className="text-emerald-400 font-semibold">{user?.email || "your email"}</span>.
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => setShowWelcomeEmailModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs font-semibold text-emerald-300 transition-colors"
                  >
                    <Mail className="size-3.5" />
                    Preview Welcome Email
                  </button>
                  <span className="text-xs text-muted-foreground">
                    Sent & synced with Firebase.
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setWelcomeName(null)}
              className="shrink-0 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* Welcome Email Inspection Modal */}
      {showWelcomeEmailModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
          <div className="w-full max-w-2xl bg-card border border-border/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-4 border-b border-border/30 bg-muted/60">
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-emerald-400" />
                <span className="text-sm font-semibold text-foreground">
                  Dispatched Welcome Email — {user?.email || "New Member"}
                </span>
              </div>
              <button
                onClick={() => setShowWelcomeEmailModal(false)}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 bg-background/50">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-1 text-xs">
                <p className="text-muted-foreground"><strong>To:</strong> {user?.email || "User"}</p>
                <p className="text-muted-foreground"><strong>Subject:</strong> Welcome to InvestIQ — Your Investment Analytics Platform 🎉</p>
                <p className="text-muted-foreground"><strong>Status:</strong> Queued & Dispatched via Firebase Mail Trigger</p>
              </div>

              <div className="rounded-xl border border-border/30 overflow-hidden shadow-inner">
                <iframe
                  srcDoc={generateWelcomeEmailHTML(user?.displayName || "Investor", user?.email || "investor@example.com")}
                  title="Welcome Email Preview"
                  className="w-full h-[400px] border-0 rounded-xl"
                />
              </div>
            </div>
            <div className="p-4 border-t border-border/30 bg-muted/40 flex justify-end">
              <button
                onClick={() => setShowWelcomeEmailModal(false)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header and Live Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-foreground font-medium">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, {user?.displayName || "Investor"}! Here's your real-time snapshot.
          </p>
        </div>

        {/* Real-time Ticker Connection Indicator */}
        <div className="flex items-center gap-3 bg-card border border-border/40 px-3.5 py-1.5 rounded-lg">
          <div className="flex items-center gap-1.5">
            <span className={`size-2 rounded-full ${
              connectionStatus === "connected" ? "bg-emerald-500 animate-pulse" :
              connectionStatus === "connecting" || connectionStatus === "reconnecting" ? "bg-amber-500" : "bg-red-500"
            }`} />
            <span className="text-xs text-foreground capitalize font-medium">{connectionStatus}</span>
          </div>
          <div className="h-3 w-px bg-border/40" />
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <RefreshCw className="size-3" />
            Last: {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Portfolio Value"
          value={formatCurrency(totalValue)}
          change={`${totalGainsPercent >= 0 ? "+" : ""}${totalGainsPercent.toFixed(2)}%`}
          isPositive={totalGainsPercent >= 0}
          subtitle={`Cost Basis: ${formatCurrency(totalCost)}`}
        />
        <KPICard
          title="Total P&L"
          value={`${totalGains >= 0 ? "+" : ""}${formatCurrency(totalGains)}`}
          change={`${totalGainsPercent >= 0 ? "+" : ""}${totalGainsPercent.toFixed(2)}%`}
          isPositive={totalGains >= 0}
          subtitle="All-time return"
        />
        <KPICard
          title="Today's P&L"
          value={`${todayChange >= 0 ? "+" : ""}${formatCurrency(todayChange)}`}
          change={`${todayChangePercent >= 0 ? "+" : ""}${todayChangePercent.toFixed(2)}%`}
          isPositive={todayChange >= 0}
          subtitle="Day Change"
        />
        
        {/* Risk & Health Metrics Card */}
        <div className="bg-card border border-border/40 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Portfolio Health</p>
            <div className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="size-3" />
              Score
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <p className="text-2xl text-foreground font-medium">{healthScore}/100</p>
            <span className="text-xs text-muted-foreground">Risk: {weightedRisk}</span>
          </div>
          <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mt-2">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                healthScore > 80 ? "bg-emerald-500" : healthScore > 50 ? "bg-amber-500" : "bg-red-500"
              }`} 
              style={{ width: `${healthScore}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Portfolio Chart Section */}
      <div className="bg-card border border-border/40 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg text-foreground font-medium">Portfolio Performance</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Your portfolio vs NIFTY 50 benchmark — select a range below
            </p>
          </div>
        </div>
        <PortfolioChart />
      </div>

      {/* Market Overview */}
      <MarketOverview />

      {/* Two Column Layout for Watchlists and News */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WatchlistPreview />
        <NewsPreview />
      </div>

      {/* Insights */}
      <InsightsPreview />
    </div>
  );
}

interface KPICardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  subtitle: string;
}

function KPICard({ title, value, change, isPositive, subtitle }: KPICardProps) {
  return (
    <div className="bg-card border border-border/40 rounded-xl p-5 flex flex-col justify-between">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div
          className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium ${
            isPositive
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {isPositive ? (
            <ArrowUpRight className="size-3" />
          ) : (
            <ArrowDownRight className="size-3" />
          )}
          {change}
        </div>
      </div>
      <div>
        <p className="text-2xl text-foreground font-semibold tracking-tight mb-1">{value}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}
