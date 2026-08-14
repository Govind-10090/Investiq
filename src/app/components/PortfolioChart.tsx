import { useMemo, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { usePortfolioStore, useMarketStore } from "../../store";
import { getAssetHistory } from "../../api/clients";
import { TrendingUp } from "lucide-react";

type Range = "1W" | "1M" | "3M" | "6M" | "1Y";

const RANGES: { label: string; value: Range; days: number }[] = [
  { label: "1W", value: "1W", days: 7 },
  { label: "1M", value: "1M", days: 30 },
  { label: "3M", value: "3M", days: 90 },
  { label: "6M", value: "6M", days: 180 },
  { label: "1Y", value: "1Y", days: 365 },
];

function formatYAxis(value: number): string {
  if (value >= 10_000_000) return `₹${(value / 10_000_000).toFixed(1)}Cr`;
  if (value >= 100_000) return `₹${(value / 100_000).toFixed(1)}L`;
  if (value >= 1_000) return `₹${(value / 1_000).toFixed(1)}K`;
  return `₹${value.toFixed(0)}`;
}

function formatTooltipValue(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string | number, days: number): string {
  const d = typeof dateStr === "number" ? new Date(dateStr * 1000) : new Date(dateStr);
  if (days <= 7) return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
  if (days <= 30) return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

export function PortfolioChart() {
  const { holdings } = usePortfolioStore();
  const { assets } = useMarketStore();
  const [range, setRange] = useState<Range>("1M");

  const selectedRange = RANGES.find((r) => r.value === range)!;
  const days = selectedRange.days;

  const { data, totalReturn, totalReturnPct, isEmpty } = useMemo(() => {
    if (holdings.length === 0) {
      return { data: [], totalReturn: 0, totalReturnPct: 0, isEmpty: true };
    }

    // Get simulated daily price history for each holding
    const holdingHistories = holdings.map((h) => ({
      holding: h,
      history: getAssetHistory(h.symbol, days),
    }));

    const minLen = Math.min(...holdingHistories.map((hh) => hh.history.length));
    if (minLen === 0) return { data: [], totalReturn: 0, totalReturnPct: 0, isEmpty: true };

    // NIFTY benchmark
    const niftyHistory = getAssetHistory("NIFTY_50", days);
    const niftyStartPrice = niftyHistory.length > 0 ? niftyHistory[0].close : 22450;

    // Initial portfolio value (day 0) for benchmark normalization
    const initialPortfolioValue = holdingHistories.reduce((sum, hh) => {
      const firstClose = hh.history[0]?.close ?? hh.holding.avgPrice;
      return sum + hh.holding.shares * firstClose;
    }, 0);

    const chartData = Array.from({ length: minLen }, (_, i) => {
      // Sum portfolio value at index i
      const portfolioValue = holdingHistories.reduce((sum, hh) => {
        const candle = hh.history[i];
        return candle ? sum + hh.holding.shares * candle.close : sum;
      }, 0);

      // Normalize NIFTY to same starting value as portfolio
      const niftyCandle = niftyHistory[i];
      const niftyValue = niftyCandle && niftyStartPrice > 0
        ? (niftyCandle.close / niftyStartPrice) * initialPortfolioValue
        : initialPortfolioValue;

      const rawTime = holdingHistories[0].history[i]?.time;

      return {
        label: formatDate(rawTime as any, days),
        portfolio: Math.round(portfolioValue),
        benchmark: Math.round(niftyValue),
      };
    });

    const first = chartData[0]?.portfolio ?? 0;
    const last = chartData[chartData.length - 1]?.portfolio ?? 0;
    const ret = last - first;
    const retPct = first > 0 ? (ret / first) * 100 : 0;

    return { data: chartData, totalReturn: ret, totalReturnPct: retPct, isEmpty: false };
  }, [holdings, assets, days]);

  const tickInterval = days <= 7 ? 0 : days <= 30 ? 4 : days <= 90 ? 9 : days <= 180 ? 19 : 29;
  const isPositive = totalReturn >= 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] gap-3 text-center">
        <div className="size-14 rounded-2xl bg-muted/30 border border-border/30 flex items-center justify-center">
          <TrendingUp className="size-7 text-muted-foreground/40" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground font-medium">No portfolio data yet</p>
          <p className="text-xs text-muted-foreground/50 mt-1">
            Add holdings in the Portfolio page to see your performance curve.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Period return summary + range selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-baseline gap-2">
          <span className={`text-xl font-bold ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
            {isPositive ? "+" : ""}{formatTooltipValue(totalReturn)}
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
            isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
          }`}>
            {isPositive ? "+" : ""}{totalReturnPct.toFixed(2)}%
          </span>
          <span className="text-xs text-muted-foreground">this period</span>
        </div>

        <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                range === r.value
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="gradPortfolio" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.25} />
              <stop offset="95%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradBenchmark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="label"
            stroke="#52525b"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            interval={tickInterval}
          />
          <YAxis
            stroke="#52525b"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatYAxis}
            width={68}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#16161e",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "10px",
              fontSize: "11px",
              color: "#fff",
              padding: "10px 14px",
            }}
            formatter={(value: number, name: string) => [
              formatTooltipValue(value),
              name === "portfolio" ? "Your Portfolio" : "NIFTY 50 (indexed)",
            ]}
            labelStyle={{ color: "#71717a", marginBottom: 4 }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
            formatter={(value) =>
              value === "portfolio" ? "Your Portfolio" : "NIFTY 50 (benchmark)"
            }
          />

          {/* Benchmark (behind) */}
          <Area
            type="monotone"
            dataKey="benchmark"
            stroke="#6366f1"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            fill="url(#gradBenchmark)"
            dot={false}
            activeDot={{ r: 3 }}
          />

          {/* Portfolio (front) */}
          <Area
            type="monotone"
            dataKey="portfolio"
            stroke={isPositive ? "#10b981" : "#ef4444"}
            strokeWidth={2.5}
            fill="url(#gradPortfolio)"
            dot={false}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default PortfolioChart;


