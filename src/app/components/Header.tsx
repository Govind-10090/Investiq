import { useState, useEffect, useRef } from "react";
import { Search, Bell, Settings as SettingsIcon, BrainCircuit } from "lucide-react";
import { useAlertStore, useMarketStore } from "../../store";
import { useNavigate } from "react-router";

interface HeaderProps {
  onToggleAI: () => void;
}

export function Header({ onToggleAI }: HeaderProps) {
  const navigate = useNavigate();
  const { triggeredAlerts, clearTriggered } = useAlertStore();
  const { assets } = useMarketStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredAssets = searchQuery.trim()
    ? assets.filter(
        (asset) =>
          asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          asset.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Group filtered results by asset type
  const groupedAssets = filteredAssets.reduce((acc, asset) => {
    if (!acc[asset.type]) {
      acc[asset.type] = [];
    }
    acc[asset.type].push(asset);
    return acc;
  }, {} as Record<string, typeof assets>);

  const handleSelectAsset = (symbol: string) => {
    localStorage.setItem("investiq_selected_symbol", symbol);
    window.dispatchEvent(new Event("investiq_select_symbol"));
    navigate("/markets");
    setSearchQuery("");
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && filteredAssets.length > 0) {
      handleSelectAsset(filteredAssets[0].symbol);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleNotificationClick = () => {
    clearTriggered();
    navigate("/alerts");
  };

  return (
    <header className="h-16 border-b border-border/40 bg-card flex items-center justify-between px-6 shrink-0 z-20">
      {/* Search Field */}
      <div className="flex-1 max-w-xl relative" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search stocks, funds, crypto, forex..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            className="w-full h-9 pl-9 pr-4 bg-background border border-border/40 rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Search Results Dropdown */}
        {isOpen && searchQuery.trim() && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur-md border border-border/50 rounded-xl shadow-2xl max-h-[360px] overflow-y-auto z-50 divide-y divide-border/20 py-2">
            {filteredAssets.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                No assets found matching "{searchQuery}"
              </div>
            ) : (
              Object.entries(groupedAssets).map(([type, list]) => (
                <div key={type} className="p-2">
                  <div className="px-2.5 py-1 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                    {type === "stock" ? "Indian Stocks" :
                     type === "crypto" ? "Cryptocurrencies" :
                     type === "forex" ? "Forex Rates" : "Mutual Funds"}
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {list.map((asset) => {
                      const isPositive = asset.change >= 0;
                      return (
                        <div
                          key={asset.symbol}
                          onClick={() => handleSelectAsset(asset.symbol)}
                          className="flex items-center justify-between px-2.5 py-1.5 hover:bg-emerald-500/10 rounded-lg cursor-pointer transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`size-7 rounded-lg flex items-center justify-center font-bold text-[9px] border border-border/40 ${
                              type === "stock" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                              type === "crypto" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                              type === "forex" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                              "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            }`}>
                              {asset.symbol.slice(0, 3)}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-foreground group-hover:text-emerald-400 transition-colors">
                                {asset.symbol}
                              </div>
                              <div className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                                {asset.name}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                             <div className="text-xs font-bold text-foreground">
                              {type === "forex" ? `₹${asset.price}` : `₹${asset.price.toLocaleString()}`}
                            </div>
                            <div className={`text-[10px] font-medium ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                              {isPositive ? "+" : ""}{asset.change.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      
      {/* Action Toolbar */}
      <div className="flex items-center gap-3">
        {/* Summon AI co-pilot */}
        <button
          onClick={onToggleAI}
          className="p-2 hover:bg-emerald-500/10 hover:text-emerald-400 rounded-lg text-muted-foreground transition-all flex items-center gap-1.5 cursor-pointer text-xs font-semibold"
          title="Open AI Co-pilot"
        >
          <BrainCircuit className="size-4.5" />
          <span className="hidden sm:inline">AI Co-pilot</span>
        </button>

        {/* Notifications Bell */}
        <button 
          onClick={handleNotificationClick}
          className="relative p-2 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer"
          title="Alerts Center"
        >
          <Bell className="size-4.5 text-muted-foreground hover:text-foreground" />
          {triggeredAlerts.length > 0 && (
            <span className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full animate-ping" />
          )}
        </button>

        <button 
          onClick={() => navigate("/settings")}
          className="p-2 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer"
          title="Settings"
        >
          <SettingsIcon className="size-4.5 text-muted-foreground hover:text-foreground" />
        </button>
      </div>
    </header>
  );
}

export default Header;
