import { useEffect } from "react";
import { Navigate, Outlet } from "react-router";
import { useAuthStore } from "../../store";
import { TrendingUp } from "lucide-react";

export function ProtectedRoute() {
  const { user, loading, initAuth } = useAuthStore();

  useEffect(() => {
    const unsubscribe = initAuth();
    return () => unsubscribe();
  }, [initAuth]);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center gap-4">
        <div className="size-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 animate-bounce">
          <TrendingUp className="size-8 text-emerald-400" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-foreground text-md font-medium tracking-wide">InvestIQ</h2>
          <p className="text-xs text-muted-foreground animate-pulse">Loading secure investment workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
}
