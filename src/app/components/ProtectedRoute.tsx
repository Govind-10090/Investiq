import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";
import { useAuthStore } from "../../store";
import { TrendingUp } from "lucide-react";

export function ProtectedRoute() {
  const { user, loading, initAuth } = useAuthStore();
  const [authChecked, setAuthChecked] = useState(!loading);

  useEffect(() => {
    const unsubscribe = initAuth();
    
    // Safety guard: max 500ms for auth check so app NEVER gets stuck on loading screen
    const timer = setTimeout(() => {
      setAuthChecked(true);
      useAuthStore.setState({ loading: false });
    }, 500);

    return () => {
      clearTimeout(timer);
      if (unsubscribe) unsubscribe();
    };
  }, [initAuth]);

  useEffect(() => {
    if (!loading) {
      setAuthChecked(true);
    }
  }, [loading]);

  if (!authChecked && loading) {
    return (
      <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center gap-4">
        <div className="size-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 animate-pulse">
          <TrendingUp className="size-7 text-emerald-400" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-foreground text-sm font-semibold tracking-wide">InvestIQ</h2>
          <p className="text-xs text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
}
