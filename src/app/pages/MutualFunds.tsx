import { useState } from "react";
import { Search, Star, PiggyBank, Plus, TrendingUp } from "lucide-react";
import { usePortfolioStore, useWatchlistStore, useAuthStore, useMarketStore } from "../../store";

const FUND_METADATA: Record<string, { returns1Y: number; returns3Y: number; rating: number }> = {
  AXIS_BLUE: { returns1Y: 18.5, returns3Y: 24.2, rating: 5 },
  SBI_SMALL: { returns1Y: 32.4, returns3Y: 38.6, rating: 4 },
  ICICI_TECH: { returns1Y: 28.7, returns3Y: 35.4, rating: 5 },
  HDFC_MID: { returns1Y: 22.8, returns3Y: 28.5, rating: 4 },
  MIRAE_LARGE: { returns1Y: 17.9, returns3Y: 23.1, rating: 5 },
  PP_FLEXI: { returns1Y: 24.5, returns3Y: 30.2, rating: 5 },
  KOTAK_EMERG: { returns1Y: 21.4, returns3Y: 27.8, rating: 4 },
  SBI_HYBRID: { returns1Y: 15.6, returns3Y: 19.4, rating: 4 }
};

export function MutualFunds() {
  const { user } = useAuthStore();
  const { addHolding } = usePortfolioStore();
  const { watchlists, addAsset } = useWatchlistStore();
  const { assets } = useMarketStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedWatchlist, setSelectedWatchlist] = useState("");
  const [sipForm, setSipForm] = useState<{ symbol: string; name: string; nav: number; amount: number; date: number } | null>(null);

  const mutualFunds = assets.filter(a => a.type === "mutual_fund");

  const mutualFundsWithLivePrices = mutualFunds.map(fund => {
    const meta = FUND_METADATA[fund.symbol] || { returns1Y: 15.0, returns3Y: 20.0, rating: 4 };
    return {
      symbol: fund.symbol,
      name: fund.name,
      category: fund.sector || "General",
      nav: fund.price,
      returns1Y: meta.returns1Y,
      returns3Y: meta.returns3Y,
      aum: fund.marketCap || "N/A",
      rating: meta.rating
    };
  });

  // Set default watchlist
  if (!selectedWatchlist && watchlists.length > 0) {
    setSelectedWatchlist(watchlists[0].id);
  }

  const handleAddWatchlist = (symbol: string) => {
    if (user?.uid && selectedWatchlist) {
      addAsset(user.uid, selectedWatchlist, symbol);
    }
  };

  const handleSipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.uid && sipForm) {
      // Calculate starting units purchased: amount / NAV
      const units = Number((sipForm.amount / sipForm.nav).toFixed(4));
      addHolding(user.uid, {
        symbol: sipForm.symbol,
        name: sipForm.name,
        price: sipForm.nav,
        change: 0,
        volume: "N/A",
        type: "mutual_fund",
        sector: "Mutual Fund"
      }, units, sipForm.nav);
      setSipForm(null);
    }
  };

  const filteredFunds = mutualFundsWithLivePrices.filter((fund) => {
    const matchesSearch = fund.name.toLowerCase().includes(searchQuery.toLowerCase()) || fund.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === "All" || fund.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-foreground font-medium">Mutual Funds</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Grow your wealth systematically with high-performing mutual funds
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

      {/* Category Slider Tags */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {["All", "Large Cap", "Mid Cap", "Small Cap", "Flexi Cap", "Hybrid", "Sectoral"].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap text-xs font-semibold border transition-all ${
              cat === selectedCategory
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-card border-border/30 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search Field */}
      <div className="bg-card border border-border/40 rounded-xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search mutual funds by name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-background border border-border/40 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Funds Table */}
      <div className="bg-card border border-border/40 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr className="border-b border-border/40">
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-14">Watch</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fund Name</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">NAV (₹)</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">1Y Returns</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">3Y Returns</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">AUM</th>
                <th className="text-center p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rating</th>
                <th className="text-center p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">SIP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {filteredFunds.map((fund, index) => (
                <tr
                  key={index}
                  className="hover:bg-muted/40 transition-colors"
                >
                  <td className="p-4">
                    <button 
                      onClick={() => handleAddWatchlist(fund.symbol)}
                      className="hover:text-yellow-500 text-muted-foreground transition-colors"
                    >
                      <Star className="size-4 hover:fill-yellow-500" />
                    </button>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-semibold text-foreground">{fund.name}</p>
                  </td>
                  <td className="p-4">
                    <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full font-medium">
                      {fund.category}
                    </span>
                  </td>
                  <td className="p-4 text-right text-sm text-foreground font-medium">
                    ₹{fund.nav.toFixed(2)}
                  </td>
                  <td className="p-4 text-right text-sm text-emerald-400 font-semibold">
                    +{fund.returns1Y}%
                  </td>
                  <td className="p-4 text-right text-sm text-emerald-400 font-semibold">
                    +{fund.returns3Y}%
                  </td>
                  <td className="p-4 text-right text-sm text-muted-foreground font-medium">
                    ₹{fund.aum}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`size-3 ${
                            i < fund.rating
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => setSipForm({ symbol: fund.symbol, name: fund.name, nav: fund.nav, amount: 5000, date: 5 })}
                      className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-xs font-semibold flex items-center gap-1 mx-auto"
                    >
                      <Plus className="size-3" /> Start SIP
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Start SIP Dialog */}
      {sipForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
          <div className="w-full max-w-sm bg-card border border-border/40 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-md text-foreground font-medium flex items-center gap-2">
                <PiggyBank className="size-5 text-emerald-400" /> Start Systematic Investment Plan
              </h3>
              <button onClick={() => setSipForm(null)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              Investing in <strong className="text-foreground">{sipForm.name}</strong> (NAV: ₹{sipForm.nav})
            </p>
            
            <form onSubmit={handleSipSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Monthly Installment Amount (₹)</label>
                <input
                  type="number"
                  step="500"
                  min="500"
                  required
                  value={sipForm.amount}
                  onChange={(e) => setSipForm({ ...sipForm, amount: parseInt(e.target.value) || 0 })}
                  className="w-full bg-background border border-border/40 rounded px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">SIP Date (Day of Month)</label>
                <input
                  type="number"
                  min="1"
                  max="28"
                  required
                  value={sipForm.date}
                  onChange={(e) => setSipForm({ ...sipForm, date: parseInt(e.target.value) || 1 })}
                  className="w-full bg-background border border-border/40 rounded px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSipForm(null)}
                  className="px-3.5 py-1.5 bg-muted hover:bg-accent text-xs text-foreground rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-xs text-white rounded font-medium"
                >
                  Confirm SIP Setup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
