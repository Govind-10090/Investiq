import { NavLink } from "react-router";
import { 
  LayoutDashboard, 
  TrendingUp, 
  Building2, 
  PiggyBank, 
  DollarSign, 
  Bitcoin, 
  Briefcase, 
  Star, 
  Lightbulb, 
  Newspaper, 
  Bell, 
  Settings,
  X
} from "lucide-react";
import { cn } from "../utils/cn";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/markets", icon: TrendingUp, label: "Markets" },
  { to: "/stocks", icon: Building2, label: "Stocks" },
  { to: "/mutual-funds", icon: PiggyBank, label: "Mutual Funds" },
  { to: "/forex", icon: DollarSign, label: "Forex" },
  { to: "/crypto", icon: Bitcoin, label: "Crypto" },
  { to: "/portfolio", icon: Briefcase, label: "Portfolio" },
  { to: "/watchlist", icon: Star, label: "Watchlist" },
  { to: "/insights", icon: Lightbulb, label: "Insights" },
  { to: "/news", icon: Newspaper, label: "News" },
  { to: "/alerts", icon: Bell, label: "Alerts" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

import { useAuthStore } from "../../store";

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ isMobileOpen = false, onMobileClose }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const handleLogout = () => {
    logout();
  };

  const sidebarContent = (
    <>
      <div className="p-6 border-b border-sidebar-border/40 flex items-center justify-between">
        <div>
          <h1 className="text-xl tracking-tight text-sidebar-foreground flex items-center gap-2">
            <TrendingUp className="size-6 text-emerald-500" />
            InvestIQ
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Investment Analytics</p>
        </div>
        {/* Close button visible only on mobile */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1.5 hover:bg-muted/50 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        )}
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            onClick={onMobileClose}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm",
                isActive
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("size-5", isActive && "text-emerald-500")} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-border/40 space-y-3">
        <div className="flex items-center gap-3 px-3 py-1">
          <div className="size-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold">
            {user?.displayName ? user.displayName.substring(0, 2).toUpperCase() : "RI"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate text-foreground font-medium">{user?.displayName || "Retail Investor"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || "investor@example.com"}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all flex items-center gap-2"
        >
          <span>Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar — always visible on lg+ */}
      <aside className="hidden lg:flex w-64 border-r border-sidebar-border/40 bg-sidebar flex-col shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile drawer overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          {/* Drawer panel */}
          <aside className="relative w-72 max-w-[85vw] bg-sidebar flex flex-col border-r border-sidebar-border/40 shadow-2xl animate-in slide-in-from-left duration-250">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}


