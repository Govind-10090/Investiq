import { useState, useEffect } from "react";
import { Star, TrendingUp, TrendingDown, Plus, Trash2, Pin, Search, PlusCircle } from "lucide-react";
import { useWatchlistStore, useMarketStore, useAuthStore } from "../../store";
import { LivePrice } from "../components/LivePrice";

export function Watchlist() {
  const { user } = useAuthStore();
  const { assets, fetchPrices } = useMarketStore();
  const { 
    watchlists, 
    fetchWatchlists, 
    createWatchlist, 
    addAsset, 
    removeAsset, 
    deleteWatchlist,
    pinWatchlist 
  } = useWatchlistStore();

  const [activeListId, setActiveListId] = useState("");
  const [newListName, setNewListName] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [assetSearchQuery, setAssetSearchQuery] = useState("");

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  useEffect(() => {
    if (user?.uid) {
      fetchWatchlists(user.uid);
    }
  }, [user?.uid, fetchWatchlists]);

  // Handle active watchlist pointer
  useEffect(() => {
    if (watchlists.length > 0 && !activeListId) {
      const pinned = watchlists.find(w => w.isPinned);
      setActiveListId(pinned ? pinned.id : watchlists[0].id);
    }
  }, [watchlists, activeListId]);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.uid && newListName.trim()) {
      await createWatchlist(user.uid, newListName.trim());
      setNewListName("");
      setIsCreateOpen(false);
    }
  };

  const handleRemoveAsset = async (symbol: string) => {
    if (user?.uid && activeListId) {
      await removeAsset(user.uid, activeListId, symbol);
    }
  };

  const handleDeleteList = async () => {
    if (user?.uid && activeListId) {
      if (confirm("Are you sure you want to delete this watchlist?")) {
        const nextActive = watchlists.find(w => w.id !== activeListId);
        await deleteWatchlist(user.uid, activeListId);
        setActiveListId(nextActive ? nextActive.id : "");
      }
    }
  };

  const handlePinList = async () => {
    if (user?.uid && activeListId) {
      await pinWatchlist(user.uid, activeListId);
    }
  };

  const handleAddAsset = async (symbol: string) => {
    if (user?.uid && activeListId) {
      await addAsset(user.uid, activeListId, symbol);
      setIsAddAssetOpen(false);
      setAssetSearchQuery("");
    }
  };

  // Find active watchlist
  const activeList = watchlists.find(w => w.id === activeListId) || watchlists[0];

  // Resolve assets with live quotes
  const resolvedListAssets = activeList
    ? activeList.assets.map(symbol => {
        const live = assets.find(a => a.symbol === symbol);
        return live || {
          symbol,
          name: symbol,
          price: 0,
          change: 0,
          type: "stock" as any
        };
      })
    : [];

  const gainersCount = resolvedListAssets.filter(a => a.change > 0).length;
  const losersCount = resolvedListAssets.filter(a => a.change < 0).length;

  // Filter lists for add assets search
  const filteredSearchAssets = assets.filter(
    (a) =>
      (a.symbol.toLowerCase().includes(assetSearchQuery.toLowerCase()) ||
      a.name.toLowerCase().includes(assetSearchQuery.toLowerCase())) &&
      activeList && !activeList.assets.includes(a.symbol)
  );

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-foreground font-medium">Watchlist Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Build custom watchlists to track targeted assets and indices
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-3.5 py-2 bg-card border border-border/40 hover:bg-muted text-foreground rounded-lg text-xs font-semibold flex items-center gap-1.5"
          >
            <Plus className="size-4" /> Create List
          </button>
          
          {activeList && (
            <button
              onClick={() => setIsAddAssetOpen(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <PlusCircle className="size-4" /> Add Asset
            </button>
          )}
        </div>
      </div>

      {/* Watchlist Tabs & Pinned controls */}
      {watchlists.length > 0 && (
        <div className="flex items-center justify-between border-b border-border/20 pb-1 flex-wrap gap-4">
          <div className="flex gap-2 overflow-x-auto">
            {watchlists.map(w => (
              <button
                key={w.id}
                onClick={() => setActiveListId(w.id)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  w.id === activeListId
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    : "bg-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {w.name}
                {w.isPinned && <Pin className="size-3 fill-emerald-400 text-emerald-400" />}
              </button>
            ))}
          </div>

          {activeList && (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePinList}
                title={activeList.isPinned ? "Unpin Watchlist" : "Pin Watchlist"}
                className={`p-1.5 rounded border border-border/30 transition-all ${
                  activeList.isPinned 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Pin className="size-4" />
              </button>
              <button
                onClick={handleDeleteList}
                className="p-1.5 hover:bg-red-500/10 text-muted-foreground hover:text-red-400 rounded border border-border/30 transition-colors"
                title="Delete watchlist"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Statistics Cards */}
      {activeList && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border/40 rounded-xl p-5">
            <p className="text-xs text-muted-foreground uppercase font-semibold">Total Assets Tracked</p>
            <p className="text-2xl text-foreground font-bold mt-1">{resolvedListAssets.length}</p>
          </div>
          <div className="bg-card border border-border/40 rounded-xl p-5">
            <p className="text-xs text-muted-foreground uppercase font-semibold">24h Gainers</p>
            <p className="text-2xl text-emerald-400 font-bold mt-1">{gainersCount}</p>
          </div>
          <div className="bg-card border border-border/40 rounded-xl p-5">
            <p className="text-xs text-muted-foreground uppercase font-semibold">24h Losers</p>
            <p className="text-2xl text-red-400 font-bold mt-1">{losersCount}</p>
          </div>
        </div>
      )}

      {/* Watchlist Assets Table */}
      {activeList ? (
        <div className="bg-card border border-border/40 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr className="border-b border-border/40">
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Asset</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                  <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Price (₹)</th>
                  <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">24h Change %</th>
                  <th className="text-center p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-20">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {resolvedListAssets.length > 0 ? (
                  resolvedListAssets.map((item) => {
                    const pos = item.change >= 0;
                    return (
                      <tr key={item.symbol} className="hover:bg-muted/40 transition-colors">
                        <td className="p-4">
                          <div>
                            <p className="text-sm font-semibold text-foreground tracking-wider">{item.symbol}</p>
                            <p className="text-xs text-muted-foreground">{item.name}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/25 text-blue-400 font-medium capitalize">
                            {item.type}
                          </span>
                        </td>
                        <td className="p-4 text-right text-sm text-foreground font-medium">
                          <LivePrice 
                            value={item.price} 
                            type="currency" 
                            currencySymbol={item.type === "crypto" ? "$" : "₹"} 
                          />
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {pos ? (
                              <TrendingUp className="size-3.5 text-emerald-400" />
                            ) : (
                              <TrendingDown className="size-3.5 text-red-400" />
                            )}
                            <span className={`text-sm font-medium ${pos ? "text-emerald-400" : "text-red-400"}`}>
                              {pos ? "+" : ""}{item.change.toFixed(2)}%
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleRemoveAsset(item.symbol)}
                            className="p-1.5 hover:bg-red-500/10 text-muted-foreground hover:text-red-400 rounded transition-colors"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-sm text-muted-foreground font-medium">
                      No assets inside this watchlist. Click "Add Asset" to include tracking markers.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border/40 rounded-xl p-12 text-center text-muted-foreground text-sm font-medium">
          Create or choose a watchlist from above to populate tracking grids.
        </div>
      )}

      {/* Watchlist Creator Dialog */}
      {isCreateOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
          <div className="w-full max-w-sm bg-card border border-border/40 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-md text-foreground font-medium">Create New Watchlist</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
            </div>
            
            <form onSubmit={handleCreateList} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Watchlist Name</label>
                <input
                  type="text"
                  required
                  placeholder="Tech Stocks, Defi Crypto, etc."
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="w-full bg-background border border-border/40 rounded px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3.5 py-1.5 bg-muted hover:bg-accent text-xs text-foreground rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-xs text-white rounded font-medium"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Asset Search Overlay */}
      {isAddAssetOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
          <div className="w-full max-w-md bg-card border border-border/40 rounded-xl p-6 shadow-2xl space-y-4 h-[420px] flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-md text-foreground font-medium">Add Asset to {activeList?.name}</h3>
              <button onClick={() => setIsAddAssetOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
            </div>

            {/* Live Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search symbol or name..."
                value={assetSearchQuery}
                onChange={(e) => setAssetSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-4 bg-background border border-border/40 rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-border/20 border border-border/30 rounded-lg bg-background/30">
              {filteredSearchAssets.length > 0 ? (
                filteredSearchAssets.map((asset) => (
                  <div
                    key={asset.symbol}
                    onClick={() => handleAddAsset(asset.symbol)}
                    className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="text-xs font-semibold text-foreground tracking-wider uppercase">{asset.symbol}</p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{asset.name}</p>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground uppercase">
                      {asset.type}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No matching assets available.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
