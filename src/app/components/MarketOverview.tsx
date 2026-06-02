import { TrendingUp, TrendingDown } from "lucide-react";
import { useMarketStore } from "../../store";

export function MarketOverview() {
  const { assets } = useMarketStore();

  // Find index/forex items from live assets
  const targetKeys = ["NIFTY_50", "SENSEX", "BANK_NIFTY", "BTC", "ETH", "USD/INR"];
  const resolvedIndices = targetKeys.map(key => {
    const asset = assets.find(a => a.symbol === key);
    return asset || {
      symbol: key,
      name: key.replace("_", " "),
      price: 0,
      change: 0,
      type: "stock"
    };
  });

  return (
    <div className="bg-[#0f0f14] border border-border/40 rounded-xl p-6">
      <div className="mb-6">
        <h2 className="text-lg text-white font-medium">Market Overview</h2>
        <p className="text-sm text-muted-foreground mt-1">Live market indexes and benchmark rates</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resolvedIndices.map((market) => {
          const isPos = market.change >= 0;
          const displayPrice = market.type === "forex" ? `₹${market.price}` : `₹${market.price.toLocaleString()}`;
          return (
            <div
              key={market.symbol}
              className="bg-[#1a1a20]/40 border border-border/40 rounded-lg p-4 hover:border-emerald-500/10 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                  {market.symbol === "NIFTY_50" ? "NIFTY 50" : market.symbol === "BANK_NIFTY" ? "BANK NIFTY" : market.symbol}
                </p>
                {isPos ? (
                  <TrendingUp className="size-4 text-emerald-400" />
                ) : (
                  <TrendingDown className="size-4 text-red-400" />
                )}
              </div>
              <p className="text-xl text-white font-semibold tracking-tight mb-1">{displayPrice}</p>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    isPos
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}
                >
                  {isPos ? "+" : ""}{market.change.toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
export default MarketOverview;
