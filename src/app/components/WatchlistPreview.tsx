import { ArrowUpRight, ArrowDownRight, Star } from "lucide-react";
import { Link } from "react-router";
import { useWatchlistStore, useMarketStore, useAuthStore } from "../../store";
import { useEffect } from "react";

export function WatchlistPreview() {
  const { user } = useAuthStore();
  const { watchlists, fetchWatchlists } = useWatchlistStore();
  const { assets } = useMarketStore();

  useEffect(() => {
    if (user?.uid) {
      fetchWatchlists(user.uid);
    }
  }, [user?.uid, fetchWatchlists]);

  // Find active or pinned watchlist
  const activeList = watchlists.find(w => w.isPinned) || watchlists[0];

  const watchlistAssets = activeList
    ? activeList.assets.slice(0, 5).map(symbol => {
        const live = assets.find(a => a.symbol === symbol);
        return live || {
          symbol,
          name: symbol,
          price: 0,
          change: 0,
          type: "stock"
        };
      })
    : [];

  return (
    <div className="bg-[#0f0f14] border border-border/40 rounded-xl p-6 flex flex-col justify-between h-[410px]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg text-white font-medium">Watchlist Preview</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {activeList ? `Tracking: ${activeList.name}` : "Your tracked symbols"}
          </p>
        </div>
        <Link
          to="/watchlist"
          className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
        >
          View All
        </Link>
      </div>

      <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
        {watchlistAssets.length > 0 ? (
          watchlistAssets.map((stock) => {
            const isPos = stock.change >= 0;
            const displayPrice = stock.type === "forex" ? `₹${stock.price}` : `₹${stock.price.toLocaleString()}`;
            return (
              <div
                key={stock.symbol}
                className="flex items-center justify-between p-2.5 bg-[#1a1a20]/40 border border-border/40 rounded-lg hover:border-emerald-500/10 transition-colors"
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <Star className="size-3.5 text-yellow-500 fill-yellow-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white tracking-wider uppercase">{stock.symbol}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{stock.name}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-white">{displayPrice}</p>
                  <div className="flex items-center justify-end gap-0.5 mt-0.5">
                    {isPos ? (
                      <ArrowUpRight className="size-3 text-emerald-400" />
                    ) : (
                      <ArrowDownRight className="size-3 text-red-400" />
                    )}
                    <span className={`text-[10px] font-semibold ${isPos ? "text-emerald-400" : "text-red-400"}`}>
                      {isPos ? "+" : ""}{stock.change.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-xs text-muted-foreground py-16">
            No assets tracked yet. Add assets to watchlist page.
          </div>
        )}
      </div>
    </div>
  );
}
export default WatchlistPreview;
