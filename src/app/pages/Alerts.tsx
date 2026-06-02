import { useState, useEffect } from "react";
import { Bell, Plus, Trash2, Check, X, AlertCircle } from "lucide-react";
import { useAlertStore, useMarketStore, useAuthStore } from "../../store";

export function Alerts() {
  const { user } = useAuthStore();
  const { assets } = useMarketStore();
  const { alerts, fetchAlerts, createAlert, deleteAlert, toggleAlert } = useAlertStore();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState("RELIANCE");
  const [condition, setCondition] = useState<"above" | "below">("above");
  const [targetValue, setTargetValue] = useState<number>(2500);

  useEffect(() => {
    if (user?.uid) {
      fetchAlerts(user.uid);
    }
  }, [user?.uid, fetchAlerts]);

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    const asset = assets.find(a => a.symbol === selectedAsset);
    if (user?.uid && asset) {
      await createAlert(user.uid, selectedAsset, asset.type, condition, targetValue);
      setIsCreateOpen(false);
    }
  };

  const handleToggleAlert = async (id: string) => {
    if (user?.uid) {
      await toggleAlert(user.uid, id);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    if (user?.uid) {
      await deleteAlert(user.uid, id);
    }
  };

  // Adjust default target value when asset changes
  const handleAssetChange = (symbol: string) => {
    setSelectedAsset(symbol);
    const asset = assets.find(a => a.symbol === symbol);
    if (asset) {
      setTargetValue(asset.price);
    }
  };

  // Split alerts
  const activeAlertsList = alerts.filter(a => !a.isTriggered);
  const triggeredAlertsList = alerts.filter(a => a.isTriggered);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-foreground font-medium flex items-center gap-2">
            <Bell className="size-6 text-emerald-400" />
            Alerts Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Build and monitor real-time price alerts for index rates, stocks, and crypto
          </p>
        </div>
        
        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Plus className="size-4" /> Create Alert
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border/40 rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase font-semibold">Active Monitors</p>
          <p className="text-2xl text-foreground font-bold mt-1">{activeAlertsList.length}</p>
        </div>
        <div className="bg-card border border-border/40 rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase font-semibold">Triggered Today</p>
          <p className="text-2xl text-emerald-400 font-bold mt-1">
            {triggeredAlertsList.filter(a => {
              if (!a.triggeredAt) return false;
              const date = new Date(a.triggeredAt);
              return date.toDateString() === new Date().toDateString();
            }).length}
          </p>
        </div>
        <div className="bg-card border border-border/40 rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase font-semibold">All-time triggers</p>
          <p className="text-2xl text-blue-400 font-bold mt-1">{triggeredAlertsList.length}</p>
        </div>
        <div className="bg-card border border-border/40 rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase font-semibold">Subscription limits</p>
          <p className="text-2xl text-foreground font-bold mt-1">{activeAlertsList.length}/50</p>
        </div>
      </div>

      {/* Active Alerts */}
      <div className="bg-card border border-border/40 rounded-xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-border/40 bg-muted">
          <h2 className="text-md text-foreground font-medium">Active Monitoring Filters</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Currently monitoring price thresholds</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="border-b border-border/40">
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Asset</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Condition</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Target Value</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Price</th>
                <th className="text-center p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Monitor Toggle</th>
                <th className="text-center p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {activeAlertsList.length > 0 ? (
                activeAlertsList.map((alert) => {
                  const asset = assets.find(a => a.symbol === alert.symbol);
                  const currentPrice = asset ? asset.price : 0;
                  return (
                    <tr key={alert.id} className="hover:bg-muted/40 transition-colors">
                       <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Bell className="size-4 text-emerald-400" />
                          <span className="text-sm font-semibold text-foreground tracking-wider">{alert.symbol}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-[9px] px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/25 text-blue-400 font-medium uppercase">
                          {alert.assetType}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-muted-foreground font-medium">
                        Price goes <strong className="text-foreground">{alert.condition}</strong> target
                      </td>
                      <td className="p-4 text-right text-sm text-foreground font-medium">
                        {alert.assetType === "forex" ? `₹${alert.targetPrice}` : `₹${alert.targetPrice.toLocaleString()}`}
                      </td>
                      <td className="p-4 text-right text-sm text-emerald-400 font-semibold">
                        {alert.assetType === "forex" ? `₹${currentPrice}` : `₹${currentPrice.toLocaleString()}`}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleAlert(alert.id)}
                          className={`text-xs px-2.5 py-1 rounded font-semibold border transition-all cursor-pointer ${
                            alert.isActive 
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                              : "bg-[#16161e] border-border/30 text-muted-foreground"
                          }`}
                        >
                          {alert.isActive ? "Monitoring" : "Paused"}
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDeleteAlert(alert.id)}
                          className="p-1.5 hover:bg-red-500/10 text-muted-foreground hover:text-red-400 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-sm text-muted-foreground font-medium">
                    No active monitors. Click "Create Alert" to set rules.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Triggered Alerts History */}
      <div className="bg-card border border-border/40 rounded-xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-border/40 bg-muted">
          <h2 className="text-md text-foreground font-medium">Triggered Alert History</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Logs of alerts that met conditions</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="border-b border-border/40">
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Asset</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Condition</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trigger Value</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trigger Time</th>
                <th className="text-center p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16">Clear</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {triggeredAlertsList.length > 0 ? (
                triggeredAlertsList.map((alert) => (
                  <tr key={alert.id} className="hover:bg-muted/40 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Check className="size-4 text-emerald-400" />
                        <span className="text-sm font-semibold text-foreground tracking-wider">{alert.symbol}</span>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      Went {alert.condition} {alert.targetPrice}
                    </td>
                    <td className="p-4 text-right text-sm text-emerald-400 font-bold">
                      {alert.assetType === "forex" ? `₹${alert.targetPrice}` : `₹${alert.targetPrice.toLocaleString()}`}
                    </td>
                    <td className="p-4 text-right text-xs text-muted-foreground">
                      {alert.triggeredAt ? new Date(alert.triggeredAt).toLocaleString() : "Recently"}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="p-1.5 hover:bg-red-500/10 text-muted-foreground hover:text-red-400 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-sm text-muted-foreground font-medium">
                    No trigger histories logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Alert Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
          <div className="w-full max-w-sm bg-card border border-border/40 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-md text-foreground font-medium flex items-center gap-2">
                <Bell className="size-5 text-emerald-400" /> Create Price Alert Filter
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">✕</button>
            </div>
            
            <form onSubmit={handleCreateAlert} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Select Asset</label>
                <select
                  value={selectedAsset}
                  onChange={(e) => handleAssetChange(e.target.value)}
                  className="w-full bg-background border border-border/40 rounded px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {assets.map(a => (
                    <option key={a.symbol} value={a.symbol}>{a.symbol} - {a.name} ({a.type})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Trigger Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as any)}
                  className="w-full bg-background border border-border/40 rounded px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="above">Price Crosses Above</option>
                  <option value="below">Price Drops Below</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Target Trigger Price (₹)</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={targetValue}
                  onChange={(e) => setTargetValue(parseFloat(e.target.value) || 0)}
                  className="w-full bg-background border border-border/40 rounded px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3.5 py-1.5 bg-[#16161e] hover:bg-[#20202b] text-xs text-foreground rounded font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded font-medium cursor-pointer"
                >
                  Confirm Monitor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
