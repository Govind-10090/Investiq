import { Lightbulb, TrendingUp, AlertTriangle, Target } from "lucide-react";
import { Link } from "react-router";

const insights = [
  {
    icon: TrendingUp,
    title: "Portfolio Diversification Opportunity",
    description:
      "Your portfolio has high concentration in IT sector (45%). Consider adding exposure to FMCG and Pharma sectors for better risk management.",
    type: "opportunity",
    color: "emerald",
  },
  {
    icon: Target,
    title: "Goal Achievement Alert",
    description:
      "You're on track to achieve your retirement goal. Current returns exceed target by 3.2%. Consider rebalancing to lock in gains.",
    type: "achievement",
    color: "blue",
  },
  {
    icon: AlertTriangle,
    title: "Market Volatility Warning",
    description:
      "Banking sector showing increased volatility. Review your HDFC Bank and ICICI Bank holdings. Stop-loss recommended at 5% below current levels.",
    type: "warning",
    color: "yellow",
  },
  {
    icon: Lightbulb,
    title: "Tax Saving Opportunity",
    description:
      "₹45,000 remaining in ELSS limit for this financial year. Invest before March 31st to maximize tax benefits under Section 80C.",
    type: "insight",
    color: "purple",
  },
];

export function InsightsPreview() {
  return (
    <div className="bg-[#0f0f14] border border-border/40 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg text-white">AI Insights & Recommendations</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Personalized investment intelligence
          </p>
        </div>
        <Link
          to="/insights"
          className="text-sm text-emerald-500 hover:text-emerald-400"
        >
          View All
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          const colorClasses = {
            emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
            blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
            yellow: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
            purple: "bg-purple-500/10 text-purple-500 border-purple-500/20",
          }[insight.color];

          return (
            <div
              key={index}
              className={`p-4 bg-[#1a1a20] border rounded-lg ${colorClasses}`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${colorClasses}`}>
                  <Icon className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm text-white mb-2">{insight.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
