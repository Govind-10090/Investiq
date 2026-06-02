import { TrendingUp, Clock } from "lucide-react";
import { Link } from "react-router";
import { useState, useEffect } from "react";
import { getFinancialNews, NewsArticle } from "../../api/clients";

export function NewsPreview() {
  const [news, setNews] = useState<NewsArticle[]>([]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const data = await getFinancialNews("general");
        setNews(data.slice(0, 4));
      } catch (e) {}
    };
    fetchNews();
  }, []);

  return (
    <div className="bg-[#0f0f14] border border-border/40 rounded-xl p-6 flex flex-col justify-between h-[410px]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg text-white font-medium">Market News</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Latest updates</p>
        </div>
        <Link to="/news" className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold">
          View All
        </Link>
      </div>

      <div className="space-y-3.5 flex-1 overflow-y-auto pr-1">
        {news.length > 0 ? (
          news.map((item, index) => {
            const isHigh = item.impactScore >= 7;
            const isMed = item.impactScore >= 5 && item.impactScore < 7;
            
            return (
              <div
                key={index}
                className="pb-3 border-b border-border/30 last:border-0 last:pb-0 hover:opacity-85 transition-opacity"
              >
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                  <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wide ${
                    isHigh ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                    isMed ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" :
                    "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  }`}>
                    {item.sentiment} Sentiment
                  </span>
                  
                  <span className="text-[9px] text-muted-foreground font-semibold">
                    Score: {item.impactScore}/10
                  </span>
                </div>
                
                <p className="text-xs text-white font-medium leading-snug line-clamp-2 mb-1.5">
                  <a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a>
                </p>
                
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-semibold">
                  <Clock className="size-3" />
                  <span>{new Date(item.publishedAt).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                  <span>•</span>
                  <span>{item.source}</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-xs text-muted-foreground py-16 animate-pulse">
            Retrieving financial updates...
          </div>
        )}
      </div>
    </div>
  );
}
export default NewsPreview;
