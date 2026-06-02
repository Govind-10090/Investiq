import { useState } from "react";
import { useAuthStore } from "../../store";
import { TrendingUp, Mail, Lock, User, KeyRound, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router";

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { login, register, googleLogin, resetPassword, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setToastMessage(null);
    try {
      if (isForgotPassword) {
        await resetPassword(email);
        setToastMessage({ type: "success", text: "Password reset link sent to your email!" });
        setIsForgotPassword(false);
      } else if (isLogin) {
        await login(email, password);
        navigate("/");
      } else {
        await register(email, password, displayName);
        navigate("/");
      }
    } catch (err: any) {
      setToastMessage({ type: "error", text: err.message || "Authentication failed" });
    }
  };

  const handleGoogleSignIn = async () => {
    setToastMessage(null);
    try {
      await googleLogin();
      navigate("/");
    } catch (err: any) {
      setToastMessage({ type: "error", text: err.message || "Google Sign-in failed" });
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden p-4">
      {/* Background Gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-card/80 border border-border/40 backdrop-blur-md rounded-2xl p-8 shadow-2xl relative z-10">
        
        {/* Branding Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="size-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-3">
            <TrendingUp className="size-7 text-emerald-400 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">InvestIQ</h1>
          <p className="text-sm text-muted-foreground mt-1">Enterprise Investment Intelligence</p>
        </div>

        {/* Alerts / Error Toasts */}
        {toastMessage && (
          <div
            className={`flex items-start gap-3 p-3 rounded-lg text-xs mb-6 border ${
              toastMessage.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}
          >
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <p>{toastMessage.text}</p>
          </div>
        )}

        {isForgotPassword ? (
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">Reset Password</h2>
            <p className="text-xs text-muted-foreground">
              Enter your email address and we'll send you a recovery link.
            </p>
            
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 bg-background border border-border/30 rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? "Sending link..." : "Send Reset Email"}
            </button>

            <button
              type="button"
              onClick={() => setIsForgotPassword(false)}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors pt-2"
            >
              Back to Login
            </button>
          </form>
        ) : (
          <form onSubmit={handleAuthSubmit} className="space-y-5">
            {/* Tabs */}
            <div className="grid grid-cols-2 p-1 bg-muted border border-border/30 rounded-lg">
              <button
                type="button"
                onClick={() => { setIsLogin(true); setToastMessage(null); }}
                className={`py-1.5 text-xs font-medium rounded-md transition-all ${
                  isLogin ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsLogin(false); setToastMessage(null); }}
                className={`py-1.5 text-xs font-medium rounded-md transition-all ${
                  !isLogin ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Register
              </button>
            </div>

            {/* Form Fields */}
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 bg-background border border-border/30 rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 bg-background border border-border/30 rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">Password</label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => { setIsForgotPassword(true); setToastMessage(null); }}
                    className="text-xs text-emerald-400 hover:text-emerald-500"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 bg-background border border-border/30 rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? "Authenticating..." : isLogin ? "Sign In" : "Create Account"}
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/20"></div>
              </div>
              <span className="relative px-3 bg-card text-xs text-muted-foreground">OR</span>
            </div>

            {/* Google Authentication */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full h-10 bg-card hover:bg-muted text-foreground border border-border/30 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              <svg className="size-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
