export type AssetType = "stock" | "crypto" | "forex" | "mutual_fund";

export interface Asset {
  symbol: string;
  name: string;
  type: AssetType;
  price: number;
  change: number;
  volume: string | number;
  marketCap?: string;
  sector?: string;
  high?: number;
  low?: number;
  open?: number;
}

export interface PortfolioHolding {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
  sector?: string;
  dateAdded: string;
}

export interface Transaction {
  id: string;
  type: "buy" | "sell";
  symbol: string;
  name: string;
  assetType: AssetType;
  shares: number;
  price: number;
  date: string;
}

export interface PriceAlert {
  id: string;
  symbol: string;
  assetType: AssetType;
  condition: "above" | "below";
  targetPrice: number;
  isActive: boolean;
  isTriggered: boolean;
  createdAt: string;
  triggeredAt?: string;
}

export interface Watchlist {
  id: string;
  name: string;
  assets: string[]; // List of symbols
  isPinned: boolean;
}

export interface BacktestStrategy {
  id?: string;
  name: string;
  assetSymbol: string;
  entryRules: {
    indicator: "RSI" | "SMA" | "EMA" | "Bollinger";
    condition: "less_than" | "greater_than" | "cross_above" | "cross_below";
    value: number;
  };
  exitRules: {
    indicator: "RSI" | "SMA" | "EMA" | "Bollinger";
    condition: "less_than" | "greater_than" | "cross_above" | "cross_below";
    value: number;
  };
  startDate: string;
  endDate: string;
}

export interface BacktestResult {
  cagr: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  cumulativeReturn: number;
  benchmarkReturn: number;
  trades: number;
  equityCurve: { date: string; portfolioValue: number; benchmarkValue: number }[];
}

export interface AISignal {
  symbol: string;
  name: string;
  type: AssetType;
  recommendation: "BUY" | "HOLD" | "SELL";
  confidence: number; // 0-100
  riskRating: "Low" | "Medium" | "High";
  explanation: string;
  newsImpact: string;
  technicalSummary: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}
