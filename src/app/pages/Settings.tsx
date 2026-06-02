import { useState, useEffect } from "react";
import { User, Bell, Shield, Palette, Globe, Check } from "lucide-react";
import { useAuthStore, useThemeStore } from "../../store";
import { dbService } from "../../firebase/config";

export function Settings() {
  const { user, resetPassword } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const [displayName, setDisplayName] = useState(user?.displayName || "Retail Investor");
  const [email, setEmail] = useState(user?.email || "investor@example.com");
  const [phone, setPhone] = useState("+91 98765 43210");
  
  // Preferences
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [portfolioUpdates, setPortfolioUpdates] = useState(true);
  const [marketNews, setMarketNews] = useState(false);
  const [dailySummary, setDailySummary] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const loadSettings = async () => {
      if (user?.uid) {
        try {
          const settings = await dbService.getSettings(user.uid);
          if (settings) {
            if (settings.phone) setPhone(settings.phone);
            if (settings.priceAlerts !== undefined) setPriceAlerts(settings.priceAlerts);
            if (settings.portfolioUpdates !== undefined) setPortfolioUpdates(settings.portfolioUpdates);
            if (settings.marketNews !== undefined) setMarketNews(settings.marketNews);
            if (settings.dailySummary !== undefined) setDailySummary(settings.dailySummary);
            if (settings.language) setSelectedLanguage(settings.language);
          }
        } catch (e) {}
      }
    };
    loadSettings();
  }, [user?.uid]);

  const handleSaveSettings = async () => {
    setSavedSuccess(false);
    setErrorMsg("");
    if (user?.uid) {
      try {
        await dbService.saveSettings(user.uid, {
          phone,
          priceAlerts,
          portfolioUpdates,
          marketNews,
          dailySummary,
          language: selectedLanguage
        });
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } catch (e) {
        setErrorMsg("Failed to update preferences.");
      }
    }
  };

  const handleTriggerPasswordReset = async () => {
    if (user?.email) {
      try {
        await resetPassword(user.email);
        alert("A password reset email has been dispatched!");
      } catch (e) {
        alert("Password reset request failed.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-foreground font-medium">Settings Console</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure system configurations, notification channels, and appearance themes
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/20">
            <Check className="size-3.5" /> Preferences saved!
          </div>
        )}
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Profile Details */}
        <div className="bg-card border border-border/40 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-border/20 pb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <User className="size-5" />
            </div>
            <div>
              <h2 className="text-md text-foreground font-medium">Profile Settings</h2>
              <p className="text-xs text-muted-foreground">Modify profile identities</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Full Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full h-10 px-4 bg-background border border-border/40 rounded-lg text-xs text-foreground focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Email Address</label>
              <input
                type="email"
                readOnly
                value={email}
                className="w-full h-10 px-4 bg-background/50 border border-border/20 rounded-lg text-xs text-muted-foreground cursor-not-allowed"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-10 px-4 bg-background border border-border/40 rounded-lg text-xs text-foreground focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Channels */}
        <div className="bg-card border border-border/40 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-border/20 pb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <Bell className="size-5" />
            </div>
            <div>
              <h2 className="text-md text-foreground font-medium">Notification Toggles</h2>
              <p className="text-xs text-muted-foreground">Manage active notification streams</p>
            </div>
          </div>

          <div className="space-y-3">
            <PreferenceToggle label="Price Threshold Alerts" active={priceAlerts} onToggle={() => setPriceAlerts(!priceAlerts)} />
            <PreferenceToggle label="Weekly Portfolio Reports" active={portfolioUpdates} onToggle={() => setPortfolioUpdates(!portfolioUpdates)} />
            <PreferenceToggle label="Live Market News Tickers" active={marketNews} onToggle={() => setMarketNews(!marketNews)} />
            <PreferenceToggle label="End-of-day XIRR Performance Summary" active={dailySummary} onToggle={() => setDailySummary(!dailySummary)} />
          </div>
        </div>

        {/* Security */}
        <div className="bg-card border border-border/40 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-border/20 pb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
              <Shield className="size-5" />
            </div>
            <div>
              <h2 className="text-md text-foreground font-medium">Security & Keys</h2>
              <p className="text-xs text-muted-foreground">Protect access credentials</p>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleTriggerPasswordReset}
              className="w-full p-3 bg-muted border border-border/30 hover:bg-accent rounded-lg text-xs font-semibold text-foreground transition-all text-left cursor-pointer"
            >
              Trigger Recovery Reset Email
            </button>
            <button className="w-full p-3 bg-background/40 border border-border/20 rounded-lg text-xs font-semibold text-muted-foreground text-left cursor-not-allowed">
              Configure WebAuthn/FIDO Keys (Enterprise)
            </button>
          </div>
        </div>

        {/* Interface Customization */}
        <div className="bg-card border border-border/40 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-border/20 pb-4">
            <div className="p-2 bg-pink-500/10 rounded-lg text-pink-400">
              <Palette className="size-5" />
            </div>
            <div>
              <h2 className="text-md text-foreground font-medium">Appearance & Lang</h2>
              <p className="text-xs text-muted-foreground">Tailor UI aesthetics</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground block">Workspace Layout Theme</label>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`py-2 border rounded text-xs transition-all cursor-pointer ${
                    theme === "light" 
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 font-semibold" 
                      : "bg-muted border-border/30 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Light
                </button>
                <button 
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`py-2 border rounded text-xs transition-all cursor-pointer ${
                    theme === "dark" 
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 font-semibold" 
                      : "bg-muted border-border/30 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Dark
                </button>
                <button 
                  type="button"
                  onClick={() => setTheme("system")}
                  className={`py-2 border rounded text-xs transition-all cursor-pointer ${
                    theme === "system" 
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 font-semibold" 
                      : "bg-muted border-border/30 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sync OS
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground block">System Localized Language</label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full bg-background border border-border/40 rounded px-2 py-2 text-xs text-foreground focus:outline-none"
              >
                <option>English</option>
                <option>Hindi</option>
                <option>Tamil</option>
                <option>Japanese</option>
              </select>
            </div>
          </div>
        </div>

      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSaveSettings}
          className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-lg"
        >
          Save Preference Changes
        </button>
      </div>
    </div>
  );
}

interface PreferenceToggleProps {
  label: string;
  active: boolean;
  onToggle: () => void;
}

function PreferenceToggle({ label, active, onToggle }: PreferenceToggleProps) {
  return (
    <div className="flex items-center justify-between p-3.5 bg-muted/40 border border-border/25 rounded-lg">
      <span className="text-xs text-foreground font-medium">{label}</span>
      <button
        onClick={onToggle}
        className={`w-10 h-5.5 rounded-full transition-colors relative flex items-center px-0.5 cursor-pointer ${
          active ? "bg-emerald-500" : "bg-border"
        }`}
      >
        <div
          className={`size-4.5 bg-white rounded-full transition-transform shadow ${
            active ? "translate-x-4.5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
