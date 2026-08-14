import { useEffect, useState } from "react";
import { Bell, X, TrendingUp, TrendingDown, CheckCircle, Info } from "lucide-react";
import { useToastStore } from "../../store";

function ToastItem({ id, title, message, type, symbol }: {
  id: string;
  title: string;
  message: string;
  type: "success" | "error" | "alert" | "info";
  symbol?: string;
}) {
  const { removeToast } = useToastStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => removeToast(id), 300);
  };

  const icons = {
    alert: <Bell className="size-4 text-amber-400" />,
    success: <CheckCircle className="size-4 text-emerald-400" />,
    error: <TrendingDown className="size-4 text-red-400" />,
    info: <Info className="size-4 text-blue-400" />,
  };

  const borders = {
    alert: "border-amber-500/30 bg-amber-500/5",
    success: "border-emerald-500/30 bg-emerald-500/5",
    error: "border-red-500/30 bg-red-500/5",
    info: "border-blue-500/30 bg-blue-500/5",
  };

  const titleColors = {
    alert: "text-amber-400",
    success: "text-emerald-400",
    error: "text-red-400",
    info: "text-blue-400",
  };

  return (
    <div
      className={`
        w-80 max-w-[calc(100vw-2rem)] bg-card border rounded-xl p-4 shadow-2xl
        flex items-start gap-3 transition-all duration-300
        ${borders[type]}
        ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}
      `}
    >
      {/* Icon */}
      <div className="mt-0.5 shrink-0">{icons[type]}</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className={`text-xs font-bold uppercase tracking-wider ${titleColors[type]}`}>
            {title}
          </p>
          {symbol && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium uppercase border border-border/30">
              {symbol}
            </span>
          )}
        </div>
        <p className="text-xs text-foreground/80 leading-relaxed">{message}</p>
      </div>

      {/* Close */}
      <button
        onClick={handleClose}
        className="shrink-0 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem {...toast} />
        </div>
      ))}
    </div>
  );
}
