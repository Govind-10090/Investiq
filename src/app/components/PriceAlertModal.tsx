import { useState, useEffect } from "react";
import { Bell } from "lucide-react";

interface PriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  assetType: string;
  initialPrice: number;
  currencySymbol?: string;
  onCreateAlert: (symbol: string, assetType: string, condition: "above" | "below", value: number) => void;
}

export function PriceAlertModal({
  isOpen,
  onClose,
  symbol,
  assetType,
  initialPrice,
  currencySymbol = "₹",
  onCreateAlert
}: PriceAlertModalProps) {
  const [condition, setCondition] = useState<"above" | "below">("above");
  const [targetValue, setTargetValue] = useState<number>(initialPrice);

  // Sync state if modal reopens for a different asset
  useEffect(() => {
    if (isOpen) {
      setTargetValue(initialPrice);
    }
  }, [isOpen, initialPrice, symbol]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateAlert(symbol, assetType, condition, targetValue);
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-card border border-border/40 rounded-xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-md text-foreground font-medium flex items-center gap-2">
            <Bell className="size-4 text-emerald-500" />
            Create Alert for {symbol}
          </h3>
          <button 
            type="button"
            onClick={onClose} 
            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Alert Condition</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as "above" | "below")}
              className="w-full bg-[#16161e] border border-border/40 rounded px-2.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="above">Price Crosses Above</option>
              <option value="below">Price Drops Below</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Target Price ({currencySymbol})</label>
            <input
              type="number"
              step="0.0001"
              required
              value={targetValue}
              onChange={(e) => setTargetValue(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#16161e] border border-border/40 rounded px-2.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-[#16161e] hover:bg-[#20202b] text-xs text-white rounded font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-xs text-white rounded font-medium cursor-pointer"
            >
              Set Alert
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
