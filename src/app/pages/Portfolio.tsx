import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { TrendingUp, TrendingDown, Plus, Minus, Briefcase, PlusCircle, Trash } from "lucide-react";
import { usePortfolioStore, useMarketStore, useAuthStore } from "../../store";
import { LivePrice } from "../components/LivePrice";

export function Portfolio() {
  const { user } = useAuthStore();
  const { assets, fetchPrices } = useMarketStore();
  const { holdings, fetchHoldings, addHolding, sellHolding, deleteHolding } = usePortfolioStore();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedAssetSymbol, setSelectedAssetSymbol] = useState("RELIANCE");
  const [sharesInput, setSharesInput] = useState<number>(10);
  const [priceInput, setPriceInput] = useState<number>(2456.75);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  useEffect(() => {
    if (user?.uid) {
      fetchHoldings(user.uid);
    }
  }, [user?.uid, fetchHoldings]);

  // Adjust price input when selected symbol changes
  const handleAssetSelect = (symbol: string) => {
    setSelectedAssetSymbol(symbol);
    const asset = assets.find(a => a.symbol === symbol);
    if (asset) {
      setPriceInput(asset.price);
    }
  };

  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const asset = assets.find(a => a.symbol === selectedAssetSymbol);
    if (user?.uid && asset && sharesInput > 0 && priceInput > 0) {
      await addHolding(user.uid, asset, sharesInput, priceInput);
      setIsAddOpen(false);
    }
  };

  const handleSellAsset = async (symbol: string, currentShares: number) => {
    const sharesToSell = prompt(`You own ${currentShares} shares. How many would you like to sell?`);
    if (!sharesToSell) return;
    const qty = parseFloat(sharesToSell);
    
    if (isNaN(qty) || qty <= 0 || qty > currentShares) {
      alert("Invalid quantity entered.");
      return;
    }

    const asset = assets.find(a => a.symbol === symbol);
    const sellPrice = asset ? asset.price : 100;
    if (user?.uid) {
      try {
        await sellHolding(user.uid, symbol, qty, sellPrice);
      } catch (e: any) {
        alert(e.message || "Failed to sell holding.");
      }
    }
  };

  const handleDeleteHolding = async (id: string) => {
    if (user?.uid && confirm("Are you sure you want to delete this position entirely?")) {
      await deleteHolding(user.uid, id);
    }
  };

  // --- Calculations ---
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
      gainPercent
    };
  });

  const totalValue = holdingsWithLivePrice.reduce((sum, h) => sum + h.value, 0);
  const totalCost = holdingsWithLivePrice.reduce((sum, h) => sum + h.cost, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  // --- Chart Allocations ---
  const typeMap: Record<string, number> = {};
  const sectorMap: Record<string, number> = {};

  holdingsWithLivePrice.forEach(h => {
    // Type allocation
    const typeLabel = h.type === "stock" ? "Stocks" : h.type === "crypto" ? "Cryptocurrency" : h.type === "mutual_fund" ? "Mutual Funds" : "Forex";
    typeMap[typeLabel] = (typeMap[typeLabel] || 0) + h.value;
    
    // Sector allocation
    const sectorLabel = h.sector || "Other";
    sectorMap[sectorLabel] = (sectorMap[sectorLabel] || 0) + h.value;
  });

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#a855f7", "#ec4899", "#ef4444"];

  const allocationData = Object.keys(typeMap).map((name, i) => ({
    name,
    value: Number(typeMap[name].toFixed(2)),
    color: COLORS[i % COLORS.length]
  }));

  const sectorData = Object.keys(sectorMap).map((name, i) => ({
    name,
    value: Number(sectorMap[name].toFixed(2)),
    color: COLORS[(i + 2) % COLORS.length]
  }));

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-foreground font-medium flex items-center gap-2">
            <Briefcase className="size-6 text-emerald-400" />
            My Portfolio Holdings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track asset allocations, sector weights, and individual transactional P&L gains.
          </p>
        </div>
        
        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <PlusCircle className="size-4" /> Add Asset Transaction
        </button>
      </div>

      {/* Summary KPI Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border/40 rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase font-semibold">Total Portfolio Value</p>
          <p className="text-2xl text-foreground font-bold tracking-tight mt-1.5">{formatCurrency(totalValue)}</p>
        </div>
        <div className="bg-card border border-border/40 rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase font-semibold">Total Invested Cost</p>
          <p className="text-2xl text-foreground font-bold tracking-tight mt-1.5">{formatCurrency(totalCost)}</p>
        </div>
        <div className="bg-card border border-border/40 rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase font-semibold">Total Capital Gains</p>
          <p className={`text-2xl font-bold tracking-tight mt-1.5 ${totalGain >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {totalGain >= 0 ? "+" : ""}{formatCurrency(totalGain)}
          </p>
        </div>
        <div className="bg-card border border-border/40 rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase font-semibold">Absolute Returns</p>
          <p className={`text-2xl font-bold tracking-tight mt-1.5 ${totalGain >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {totalGain >= 0 ? "+" : ""}{totalGainPercent.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Allocation Charts Section */}
      {holdingsWithLivePrice.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border/40 rounded-xl p-6 flex flex-col justify-between">
            <h2 className="text-sm text-foreground font-semibold uppercase tracking-wider mb-6">Asset Allocation</h2>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {allocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [formatCurrency(value), "Allocation"]} />
                <Legend formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-border/40 rounded-xl p-6 flex flex-col justify-between">
            <h2 className="text-sm text-foreground font-semibold uppercase tracking-wider mb-6">Sector Allocation</h2>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={sectorData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {sectorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [formatCurrency(value), "Allocation"]} />
                <Legend formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border/40 rounded-xl p-12 text-center text-muted-foreground text-sm font-medium">
          No active positions. Add transaction details above to render allocation charts.
        </div>
      )}

      {/* Holdings List Table */}
      <div className="bg-card border border-border/40 rounded-xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-border/40 bg-muted">
          <h2 className="text-md text-foreground font-medium">Active Asset Holdings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="border-b border-border/40">
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Asset</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Shares/Units</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Price</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Price</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Invested Value</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Value</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">P&L</th>
                <th className="text-center p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {holdingsWithLivePrice.length > 0 ? (
                holdingsWithLivePrice.map((holding) => {
                  const pos = holding.gain >= 0;
                  return (
                    <tr key={holding.id} className="hover:bg-muted/40 transition-colors">
                      <td className="p-4">
                        <div>
                          <p className="text-sm font-semibold text-foreground tracking-wider">{holding.symbol}</p>
                          <p className="text-xs text-muted-foreground max-w-[180px] truncate">{holding.name}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/25 text-blue-400 font-medium capitalize">
                          {holding.type === "mutual_fund" ? "Mutual Fund" : holding.type}
                        </span>
                      </td>
                      <td className="p-4 text-right text-sm text-foreground font-medium">{holding.shares.toLocaleString()}</td>
                      <td className="p-4 text-right text-sm text-foreground font-medium">{formatCurrency(holding.avgPrice)}</td>
                      <td className="p-4 text-right text-sm text-foreground font-medium">
                        <LivePrice 
                          value={holding.currentPrice} 
                          type="currency" 
                          currencySymbol={holding.type === "crypto" ? "$" : "₹"} 
                        />
                      </td>
                      <td className="p-4 text-right text-sm text-muted-foreground font-semibold">{formatCurrency(holding.cost)}</td>
                      <td className="p-4 text-right text-sm text-foreground font-semibold">{formatCurrency(holding.value)}</td>
                      <td className={`p-4 text-right text-sm font-bold ${pos ? "text-emerald-400" : "text-red-400"}`}>
                        {pos ? "+" : ""}{formatCurrency(holding.gain)}
                        <span className="block text-[10px] font-semibold mt-0.5">
                          {pos ? "+" : ""}{holding.gainPercent.toFixed(2)}%
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleSellAsset(holding.symbol, holding.shares)}
                            className="p-1.5 bg-card border border-border/40 hover:bg-muted text-xs text-foreground rounded transition-colors cursor-pointer"
                            title="Sell shares"
                          >
                            Sell
                          </button>
                          <button
                            onClick={() => handleDeleteHolding(holding.id)}
                            className="p-1.5 hover:bg-red-500/10 hover:text-red-400 text-muted-foreground rounded transition-colors cursor-pointer"
                            title="Delete transaction record"
                          >
                            <Trash className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-sm text-muted-foreground font-medium">
                    Your portfolio is currently empty. Click "Add Asset Transaction" to initialize positions.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Modal Panel */}
      {isAddOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
          <div className="w-full max-w-sm bg-card border border-border/40 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-md text-foreground font-medium flex items-center gap-2">
                <Plus className="size-4" /> Add Asset Buy Position
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
            </div>
            
            <form onSubmit={handleSubmitTransaction} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Select Asset</label>
                <select
                  value={selectedAssetSymbol}
                  onChange={(e) => handleAssetSelect(e.target.value)}
                  className="w-full bg-background border border-border/40 rounded px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {assets.map(a => (
                    <option key={a.symbol} value={a.symbol}>{a.symbol} - {a.name} ({a.type})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Quantity Purchased (Shares / Units)</label>
                <input
                  type="number"
                  step="0.001"
                  required
                  value={sharesInput}
                  onChange={(e) => setSharesInput(parseFloat(e.target.value) || 0)}
                  className="w-full bg-background border border-border/40 rounded px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Purchase Price per Share (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={priceInput}
                  onChange={(e) => setPriceInput(parseFloat(e.target.value) || 0)}
                  className="w-full bg-background border border-border/40 rounded px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3.5 py-1.5 bg-muted hover:bg-accent text-xs text-foreground rounded font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-xs text-white rounded font-medium cursor-pointer"
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
