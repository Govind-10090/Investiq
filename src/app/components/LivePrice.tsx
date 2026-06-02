import { useEffect, useRef, useState } from "react";

interface LivePriceProps {
  value: number;
  type?: "currency" | "number";
  currencySymbol?: string;
  className?: string;
}

export function LivePrice({ value, type = "number", currencySymbol = "₹", className = "" }: LivePriceProps) {
  const prevValueRef = useRef<number>(value);
  const [flashClass, setFlashClass] = useState<string>("");

  useEffect(() => {
    if (value > prevValueRef.current) {
      setFlashClass("text-emerald-400 bg-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.3)] font-semibold");
      const timer = setTimeout(() => {
        setFlashClass("");
      }, 800);
      prevValueRef.current = value;
      return () => clearTimeout(timer);
    } else if (value < prevValueRef.current) {
      setFlashClass("text-red-400 bg-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.3)] font-semibold");
      const timer = setTimeout(() => {
        setFlashClass("");
      }, 800);
      prevValueRef.current = value;
      return () => clearTimeout(timer);
    }
  }, [value]);

  const formatted = type === "currency" 
    ? `${currencySymbol}${value.toLocaleString(currencySymbol === "₹" ? "en-IN" : "en-US", { 
        minimumFractionDigits: value < 1 ? 4 : 2, 
        maximumFractionDigits: value < 1 ? 4 : 2 
      })}`
    : value.toLocaleString();

  return (
    <span className={`px-2 py-0.5 rounded transition-all duration-300 ${flashClass} ${className}`}>
      {formatted}
    </span>
  );
}
export default LivePrice;
