import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { usePortfolioStore, useMarketStore } from "../../store";

// Base performance coefficients to generate realistic returns curves
const relativeCoefficients = [
  0.72, 0.75, 0.74, 0.81, 0.84, 0.82, 0.89, 0.91, 0.88, 0.93, 0.95, 1.00
];

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function PortfolioChart() {
  const { holdings } = usePortfolioStore();
  const { assets } = useMarketStore();

  // Compute actual portfolio value
  const totalValue = holdings.reduce((sum, h) => {
    const liveAsset = assets.find(a => a.symbol === h.symbol);
    const currentPrice = liveAsset ? liveAsset.price : h.currentPrice;
    return sum + (h.shares * currentPrice);
  }, 0);

  // Fallback to demo portfolio value of ₹24,56,890 if portfolio is empty
  const activeValue = totalValue > 0 ? totalValue : 2456890;

  const data = months.map((month, index) => {
    const value = Math.round(activeValue * relativeCoefficients[index]);
    return { month, value };
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="month"
          stroke="#71717a"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#71717a"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#16161e",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "8px",
            color: "#fff",
          }}
          formatter={(value: number) => [`₹${value.toLocaleString()}`, "Valuation"]}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#10b981"
          strokeWidth={2}
          fill="url(#colorValue)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
export default PortfolioChart;
