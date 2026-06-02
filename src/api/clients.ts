// API Clients and Simulators
import { Asset, AISignal } from "../types";

const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const COINGECKO_KEY = import.meta.env.VITE_COINGECKO_API_KEY;
const EXCHANGE_RATE_KEY = import.meta.env.VITE_EXCHANGE_RATE_API_KEY;
const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY;
const GROWW_KEY = import.meta.env.VITE_GROWW_API_KEY;

// Check if keys are active
export const hasOpenAIKey = !!(OPENAI_KEY && OPENAI_KEY !== "YOUR_OPENAI_API_KEY");
export const hasCoinGeckoKey = !!(COINGECKO_KEY && COINGECKO_KEY !== "YOUR_COINGECKO_API_KEY");
export const hasExchangeRateKey = !!(EXCHANGE_RATE_KEY && EXCHANGE_RATE_KEY !== "YOUR_EXCHANGE_RATE_API_KEY");
export const hasNewsApiKey = !!(NEWS_API_KEY && NEWS_API_KEY !== "YOUR_NEWS_API_KEY");
export const hasGrowwKey = !!(GROWW_KEY && GROWW_KEY.trim() !== "" && !GROWW_KEY.includes("YOUR_GROWW_API_KEY"));

// ----------------------------------------------------
// 1. Yahoo Finance (NSE/BSE & Indices) Client / Simulator
// ----------------------------------------------------
export const getStockData = async (): Promise<Asset[]> => {
  const defaultStocks: Asset[] = [
    { symbol: "RELIANCE", name: "Reliance Industries", type: "stock", price: 2456.75, change: 1.01, volume: "2.4M", marketCap: "16.6L Cr", sector: "Energy" },
    { symbol: "TCS", name: "Tata Consultancy Services", type: "stock", price: 3542.30, change: 0.54, volume: "1.2M", marketCap: "13.2L Cr", sector: "Technology" },
    { symbol: "INFY", name: "Infosys Ltd", type: "stock", price: 1456.85, change: 2.26, volume: "1.8M", marketCap: "6.2L Cr", sector: "Technology" },
    { symbol: "HDFCBANK", name: "HDFC Bank Ltd", type: "stock", price: 1685.40, change: -0.74, volume: "3.5M", marketCap: "9.8L Cr", sector: "Financial Services" },
    { symbol: "ICICIBANK", name: "ICICI Bank Ltd", type: "stock", price: 942.60, change: -0.57, volume: "4.1M", marketCap: "6.6L Cr", sector: "Financial Services" },
    { symbol: "SBIN", name: "State Bank of India", type: "stock", price: 598.45, change: -1.24, volume: "6.2M", marketCap: "5.3L Cr", sector: "Financial Services" },
    { symbol: "BHARTIARTL", name: "Bharti Airtel Ltd", type: "stock", price: 1350.20, change: 0.85, volume: "1.9M", marketCap: "8.1L Cr", sector: "Telecommunication" },
    { symbol: "ITC", name: "ITC Ltd", type: "stock", price: 430.50, change: -0.15, volume: "4.8M", marketCap: "5.4L Cr", sector: "Consumer Goods" },
    { symbol: "HINDUNILVR", name: "Hindustan Unilever Ltd", type: "stock", price: 2350.60, change: -0.92, volume: "1.1M", marketCap: "5.5L Cr", sector: "Consumer Goods" },
    { symbol: "LT", name: "Larsen & Toubro Ltd", type: "stock", price: 3450.40, change: 1.15, volume: "1.4M", marketCap: "4.8L Cr", sector: "Construction" },
    { symbol: "TATASTEEL", name: "Tata Steel Ltd", type: "stock", price: 165.20, change: 2.45, volume: "8.5M", marketCap: "2.1L Cr", sector: "Metals" },
    { symbol: "MARUTI", name: "Maruti Suzuki India Ltd", type: "stock", price: 12450.80, change: 0.35, volume: "0.3M", marketCap: "3.9L Cr", sector: "Automotive" },
    { symbol: "TATAMOTORS", name: "Tata Motors Ltd", type: "stock", price: 950.40, change: 1.82, volume: "3.1M", marketCap: "3.2L Cr", sector: "Automotive" },
    { symbol: "WIPRO", name: "Wipro Ltd", type: "stock", price: 460.70, change: -0.45, volume: "2.2M", marketCap: "2.4L Cr", sector: "Technology" },
    { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank Ltd", type: "stock", price: 1720.50, change: -0.85, volume: "1.6M", marketCap: "3.4L Cr", sector: "Financial Services" },
    { symbol: "AXISBANK", name: "Axis Bank Ltd", type: "stock", price: 1050.40, change: 0.12, volume: "2.9M", marketCap: "3.2L Cr", sector: "Financial Services" },
    { symbol: "ASIANPAINT", name: "Asian Paints Ltd", type: "stock", price: 2850.60, change: -1.05, volume: "0.8M", marketCap: "2.7L Cr", sector: "Consumer Goods" },
    { symbol: "BAJFINANCE", name: "Bajaj Finance Ltd", type: "stock", price: 6850.20, change: 0.95, volume: "0.9M", marketCap: "4.2L Cr", sector: "Financial Services" },
    { symbol: "SUNPHARMA", name: "Sun Pharmaceutical Industries Ltd", type: "stock", price: 1540.30, change: 1.25, volume: "1.2M", marketCap: "3.7L Cr", sector: "Healthcare" },
    { symbol: "ADANIENT", name: "Adani Enterprises Ltd", type: "stock", price: 3120.40, change: -2.15, volume: "2.5M", marketCap: "3.5L Cr", sector: "Conglomerate" },
    { symbol: "HCLTECH", name: "HCL Technologies Ltd", type: "stock", price: 1320.50, change: 0.65, volume: "1.5M", marketCap: "3.6L Cr", sector: "Technology" },
    { symbol: "NIFTY_50", name: "NIFTY 50", type: "stock", price: 22450.30, change: 0.65, volume: "N/A", marketCap: "N/A", sector: "Index" },
    { symbol: "SENSEX", name: "SENSEX", type: "stock", price: 73850.50, change: 0.58, volume: "N/A", marketCap: "N/A", sector: "Index" },
    { symbol: "BANK_NIFTY", name: "BANK NIFTY", type: "stock", price: 47850.80, change: -0.15, volume: "N/A", marketCap: "N/A", sector: "Index" }
  ];

  if (hasGrowwKey) {
    try {
      const cacheKey = "investiq_stocks_cache";
      const cacheTimeKey = "investiq_stocks_cache_time";
      const cacheApiKey = "investiq_stocks_cache_api_key";
      const cacheDuration = 30 * 60 * 1000; // 30 minutes cache

      const cachedData = localStorage.getItem(cacheKey);
      const cachedTime = localStorage.getItem(cacheTimeKey);
      const cachedApiKey = localStorage.getItem(cacheApiKey);

      const isCacheValid = 
        cachedData && 
        cachedTime && 
        cachedApiKey === GROWW_KEY &&
        Date.now() - parseInt(cachedTime) < cacheDuration;

      if (isCacheValid) {
        try {
          return JSON.parse(cachedData!);
        } catch (e) {
          // Fall back to fetching if parsing failed
        }
      }

      // Query Groww API via our dev server proxy
      const querySymbols = [
        { orig: "RELIANCE", groww: "RELIANCE" },
        { orig: "TCS", groww: "TCS" },
        { orig: "INFY", groww: "INFY" },
        { orig: "NIFTY_50", groww: "NIFTY" }
      ];

      const fetchPromises = querySymbols.map(async (item) => {
        try {
          const res = await fetch(`/api-groww/v1/live-data/quote?exchange=NSE&segment=CASH&trading_symbol=${item.groww}`, {
            headers: {
              "Authorization": `Bearer ${GROWW_KEY}`,
              "X-API-VERSION": "1.0",
              "Accept": "application/json"
            }
          });
          const data = await res.json();
          if (data) {
            const price = parseFloat(data.ltp || data.price || data.lastPrice || data.close || 0);
            const change = parseFloat(data.dayChangePerc || data.dayChangePercent || data.changePercent || data.change || 0);
            if (price > 0) {
              return { orig: item.orig, price, change };
            }
          }
        } catch (e) {
          console.warn(`Groww API fetch error for ${item.groww}:`, e);
        }
        return null;
      });

      const results = await Promise.all(fetchPromises);
      const resultsMap = new Map<string, { price: number; change: number }>();
      results.forEach(res => {
        if (res) resultsMap.set(res.orig, res);
      });

      const niftyUpdate = resultsMap.get("NIFTY_50");
      const marketShiftPct = niftyUpdate ? niftyUpdate.change : 0.65;

      const updatedStocks = defaultStocks.map(stock => {
        const live = resultsMap.get(stock.symbol);
        if (live) {
          return {
            ...stock,
            price: live.price,
            change: live.change
          };
        }
        
        // Adjust other stocks based on market shift
        if (stock.symbol !== "NIFTY_50" && stock.symbol !== "SENSEX" && stock.symbol !== "BANK_NIFTY") {
          const adjustedPrice = stock.price * (1 + (marketShiftPct - stock.change) / 100);
          return {
            ...stock,
            price: Number(adjustedPrice.toFixed(2)),
            change: Number(marketShiftPct.toFixed(2))
          };
        } else if (stock.symbol === "SENSEX") {
          const adjustedPrice = stock.price * (1 + (marketShiftPct - stock.change) / 100);
          return {
            ...stock,
            price: Number(adjustedPrice.toFixed(2)),
            change: Number(marketShiftPct.toFixed(2))
          };
        } else if (stock.symbol === "BANK_NIFTY") {
          const bankShift = marketShiftPct * 1.1;
          const adjustedPrice = stock.price * (1 + (bankShift - stock.change) / 100);
          return {
            ...stock,
            price: Number(adjustedPrice.toFixed(2)),
            change: Number(bankShift.toFixed(2))
          };
        }

        return stock;
      });

      localStorage.setItem(cacheKey, JSON.stringify(updatedStocks));
      localStorage.setItem(cacheTimeKey, Date.now().toString());
      localStorage.setItem(cacheApiKey, GROWW_KEY || "");
      return updatedStocks;

    } catch (e) {
      console.warn("Groww API query failed. Falling back to simulated stocks.", e);
      return defaultStocks;
    }
  }

  return defaultStocks;
};

export const getMutualFundsData = async (): Promise<Asset[]> => {
  return [
    { symbol: "AXIS_BLUE", name: "Axis Bluechip Fund", type: "mutual_fund", price: 52.3, change: 0.12, volume: "N/A", marketCap: "45,234 Cr", sector: "Large Cap" },
    { symbol: "SBI_SMALL", name: "SBI Small Cap Fund", type: "mutual_fund", price: 96.8, change: 0.45, volume: "N/A", marketCap: "28,456 Cr", sector: "Small Cap" },
    { symbol: "ICICI_TECH", name: "ICICI Prudential Technology Fund", type: "mutual_fund", price: 145.6, change: -0.22, volume: "N/A", marketCap: "15,678 Cr", sector: "Sectoral" },
    { symbol: "HDFC_MID", name: "HDFC Mid-Cap Opportunities Fund", type: "mutual_fund", price: 178.4, change: 0.08, volume: "N/A", marketCap: "32,890 Cr", sector: "Mid Cap" },
    { symbol: "MIRAE_LARGE", name: "Mirae Asset Large Cap Fund", type: "mutual_fund", price: 85.2, change: 0.15, volume: "N/A", marketCap: "38,567 Cr", sector: "Large Cap" },
    { symbol: "PP_FLEXI", name: "Parag Parikh Flexi Cap Fund", type: "mutual_fund", price: 65.8, change: 0.31, volume: "N/A", marketCap: "52,123 Cr", sector: "Flexi Cap" },
    { symbol: "KOTAK_EMERG", name: "Kotak Emerging Equity Fund", type: "mutual_fund", price: 72.3, change: -0.05, volume: "N/A", marketCap: "18,234 Cr", sector: "Mid Cap" },
    { symbol: "SBI_HYBRID", name: "SBI Equity Hybrid Fund", type: "mutual_fund", price: 198.5, change: 0.02, volume: "N/A", marketCap: "42,567 Cr", sector: "Hybrid" }
  ];
};

export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const getAssetHistory = (symbol: string, days: number | string = 30): Candle[] => {
  const data: Candle[] = [];
  let currentPrice = 100;
  
  if (symbol.includes("BTC")) currentPrice = 64000;
  else if (symbol.includes("ETH")) currentPrice = 3400;
  else if (symbol.includes("SOL")) currentPrice = 145;
  else if (symbol.includes("RELIANCE")) currentPrice = 2450;
  else if (symbol.includes("TCS")) currentPrice = 3540;
  else if (symbol.includes("HDFCBANK")) currentPrice = 1680;
  else if (symbol.includes("INFY")) currentPrice = 1450;
  else if (symbol.includes("ICICIBANK")) currentPrice = 940;
  else if (symbol.includes("SBIN")) currentPrice = 600;
  else if (symbol.includes("USD/INR")) currentPrice = 83.2;
  else if (symbol.includes("EUR/INR")) currentPrice = 90.5;
  else if (symbol.includes("GBP/INR")) currentPrice = 105.3;
  else if (symbol.includes("JPY/INR")) currentPrice = 0.55;
  else if (symbol.includes("NIFTY")) currentPrice = 22400;
  else if (symbol.includes("SENSEX")) currentPrice = 73800;
  else if (symbol.includes("AXIS_BLUE")) currentPrice = 52.3;
  else if (symbol.includes("SBI_SMALL")) currentPrice = 96.8;
  else if (symbol.includes("ICICI_TECH")) currentPrice = 145.6;
  else if (symbol.includes("HDFC_MID")) currentPrice = 178.4;
  else if (symbol.includes("MIRAE_LARGE")) currentPrice = 85.2;
  else if (symbol.includes("PP_FLEXI")) currentPrice = 65.8;
  else if (symbol.includes("KOTAK_EMERG")) currentPrice = 72.3;
  else if (symbol.includes("SBI_HYBRID")) currentPrice = 198.5;

  const now = new Date();
  
  if (days === "1D") {
    // Intraday: 5-minute candles representing a typical trading day
    const marketStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 15, 0);
    const numCandles = 76;
    for (let i = 0; i < numCandles; i++) {
      const d = new Date(marketStart.getTime() + i * 5 * 60 * 1000);
      const timeSec = Math.floor(d.getTime() / 1000);
      
      const vol = symbol.includes("BTC") || symbol.includes("SOL") ? 0.01 : 0.003;
      const change = (Math.random() - 0.495) * currentPrice * vol;
      const open = currentPrice;
      const close = currentPrice + change;
      const high = Math.max(open, close) + Math.random() * (currentPrice * vol * 0.4);
      const low = Math.min(open, close) - Math.random() * (currentPrice * vol * 0.4);
      const volume = Math.floor(Math.random() * 50000) + 5000;

      data.push({
        time: timeSec as any,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume
      });
      currentPrice = close;
    }
    return data;
  }

  let daysNum = 30;
  if (typeof days === "number") {
    daysNum = days;
  } else {
    if (days === "1W") daysNum = 7;
    else if (days === "1M") daysNum = 30;
    else if (days === "3M") daysNum = 90;
    else if (days === "6M") daysNum = 180;
    else if (days === "1Y") daysNum = 365;
    else if (days === "5Y") daysNum = 1825;
    else if (days === "MAX") daysNum = 3000;
  }

  for (let i = daysNum; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split("T")[0];
    
    // Simulate daily return
    const vol = symbol.includes("BTC") || symbol.includes("SOL") ? 0.04 : 0.015;
    const change = (Math.random() - 0.49) * currentPrice * vol;
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + Math.random() * (currentPrice * vol * 0.5);
    const low = Math.min(open, close) - Math.random() * (currentPrice * vol * 0.5);
    const volume = Math.floor(Math.random() * 1000000) + 100000;

    data.push({
      time: dateStr,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume
    });
    
    currentPrice = close;
  }
  return data;
};

// ----------------------------------------------------
// 2. CoinGecko Client
// ----------------------------------------------------
export const getCryptoPrices = async (): Promise<Asset[]> => {
  const defaultCrypto: Asset[] = [
    { symbol: "BTC", name: "Bitcoin", type: "crypto", price: 67450.00, change: 2.45, volume: "$32.4B", marketCap: "$1.3T" },
    { symbol: "ETH", name: "Ethereum", type: "crypto", price: 3510.50, change: 1.82, volume: "$18.1B", marketCap: "$420B" },
    { symbol: "SOL", name: "Solana", type: "crypto", price: 165.20, change: 5.64, volume: "$3.8B", marketCap: "$75B" },
    { symbol: "XRP", name: "Ripple", type: "crypto", price: 0.52, change: -1.05, volume: "$850M", marketCap: "$28B" },
    { symbol: "DOGE", name: "Dogecoin", type: "crypto", price: 0.14, change: -3.20, volume: "$1.2B", marketCap: "$20B" },
    { symbol: "BNB", name: "Binance Coin", type: "crypto", price: 585.60, change: 0.45, volume: "$1.6B", marketCap: "$86B" }
  ];

  if (hasCoinGeckoKey) {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,ripple,dogecoin,binancecoin&vs_currencies=usd&include_24hr_change=true&x_cg_demo_api_key=${COINGECKO_KEY}`
      );
      const data = await response.json();
      const mappings: Record<string, { index: number; name: string; symbol: string }> = {
        bitcoin: { index: 0, name: "Bitcoin", symbol: "BTC" },
        ethereum: { index: 1, name: "Ethereum", symbol: "ETH" },
        solana: { index: 2, name: "Solana", symbol: "SOL" },
        ripple: { index: 3, name: "Ripple", symbol: "XRP" },
        dogecoin: { index: 4, name: "Dogecoin", symbol: "DOGE" },
        binancecoin: { index: 5, name: "Binance Coin", symbol: "BNB" },
      };

      const updated = [...defaultCrypto];
      Object.keys(data).forEach(id => {
        const item = mappings[id];
        if (item) {
          updated[item.index] = {
            ...updated[item.index],
            price: data[id].usd,
            change: data[id].usd_24h_change || updated[item.index].change
          };
        }
      });
      return updated;
    } catch (e) {
      console.warn("CoinGecko API error, returning default data:", e);
      return defaultCrypto;
    }
  }

  return defaultCrypto;
};

// ----------------------------------------------------
// 3. ExchangeRate API Client
// ----------------------------------------------------
export const getForexPrices = async (): Promise<Asset[]> => {
  const defaultForex: Asset[] = [
    { symbol: "USD/INR", name: "US Dollar / Indian Rupee", type: "forex", price: 83.42, change: 0.05, volume: "N/A" },
    { symbol: "EUR/INR", name: "Euro / Indian Rupee", type: "forex", price: 90.25, change: -0.12, volume: "N/A" },
    { symbol: "GBP/INR", name: "Pound Sterling / Indian Rupee", type: "forex", price: 106.12, change: 0.18, volume: "N/A" },
    { symbol: "JPY/INR", name: "Japanese Yen / Indian Rupee", type: "forex", price: 0.53, change: -0.45, volume: "N/A" }
  ];

  if (hasExchangeRateKey) {
    try {
      const response = await fetch(`https://v6.exchangerate-api.com/v6/${EXCHANGE_RATE_KEY}/latest/INR`);
      const data = await response.json();
      if (data && data.conversion_rates) {
        const rates = data.conversion_rates;
        const usdRate = rates.USD ? 1 / rates.USD : 83.42;
        const eurRate = rates.EUR ? 1 / rates.EUR : 90.25;
        const gbpRate = rates.GBP ? 1 / rates.GBP : 106.12;
        const jpyRate = rates.JPY ? 1 / rates.JPY : 0.53;

        return [
          { ...defaultForex[0], price: Number(usdRate.toFixed(4)) },
          { ...defaultForex[1], price: Number(eurRate.toFixed(4)) },
          { ...defaultForex[2], price: Number(gbpRate.toFixed(4)) },
          { ...defaultForex[3], price: Number(jpyRate.toFixed(4)) }
        ];
      }
    } catch (e) {
      console.warn("ExchangeRate API error:", e);
    }
  }

  return defaultForex;
};

// ----------------------------------------------------
// 4. NewsAPI Client
// ----------------------------------------------------
export interface NewsArticle {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  description: string;
  sentiment: "Positive" | "Negative" | "Neutral";
  impactScore: number; // 0 to 10
}

const mockNews: NewsArticle[] = [
  {
    title: "RBI Keeps Repo Rate Unchanged at 6.5%, Focuses on Inflation Target",
    source: "Economic Times",
    url: "#",
    publishedAt: new Date().toISOString(),
    description: "The Reserve Bank of India Monetary Policy Committee has voted to keep the policy repo rate unchanged at 6.5% for the eighth consecutive time.",
    sentiment: "Positive",
    impactScore: 7
  },
  {
    title: "Reliance Industries to Expand Green Energy Projects with ₹50,000 Cr Investment",
    source: "Business Standard",
    url: "#",
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    description: "Reliance Industries announced plans to deploy significant capital in solar and hydrogen infrastructure over the next two fiscal years.",
    sentiment: "Positive",
    impactScore: 8
  },
  {
    title: "Bitcoin Crosses $67,000 Mark as Spot ETF Inflows Surpass Expectations",
    source: "CoinDesk",
    url: "#",
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
    description: "Cryptocurrency markets surged as institutional demand for Spot Bitcoin ETFs continues to accelerate globally.",
    sentiment: "Positive",
    impactScore: 8
  },
  {
    title: "TCS Reports Subdued Q1 Net Profit growth, Cites Slowdown in Tech Spending",
    source: "LiveMint",
    url: "#",
    publishedAt: new Date(Date.now() - 14400000).toISOString(),
    description: "India's largest IT exporter reported margin pressure as corporate clients defer discretionery digital transformation projects.",
    sentiment: "Negative",
    impactScore: 6
  },
  {
    title: "Rupee Hits Record Low Against US Dollar as FII Outflows Intensify",
    source: "Financial Express",
    url: "#",
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
    description: "The Indian Rupee weakened beyond 83.50 per USD as foreign institutional investors pulled funds from domestic equities.",
    sentiment: "Negative",
    impactScore: 5
  },
  {
    title: "SEBI Proposes Tighter Rules for Derivatives Trading to Curb Retail Speculation",
    source: "Moneycontrol",
    url: "#",
    publishedAt: new Date(Date.now() - 100000000).toISOString(),
    description: "The market regulator is considering higher lot sizes and margins for Futures & Options contracts to shield retail accounts from losses.",
    sentiment: "Neutral",
    impactScore: 6
  }
];

export const getFinancialNews = async (category: string = "general"): Promise<NewsArticle[]> => {
  if (hasNewsApiKey) {
    try {
      const q = category === "crypto" ? "bitcoin OR cryptocurrency" : "nifty OR sensex OR india stock";
      const response = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${NEWS_API_KEY}`);
      const data = await response.json();
      if (data && data.articles) {
        return data.articles.map((art: any) => {
          const sentVal = Math.random();
          const sentiment = sentVal > 0.6 ? "Positive" : sentVal > 0.3 ? "Neutral" : "Negative";
          return {
            title: art.title,
            source: art.source?.name || "News",
            url: art.url,
            publishedAt: art.publishedAt,
            description: art.description || "",
            sentiment,
            impactScore: Math.floor(Math.random() * 5) + 5
          };
        });
      }
    } catch (e) {
      console.warn("NewsAPI error, returning simulated news:", e);
    }
  }

  return mockNews.filter(n => {
    if (category === "crypto") return n.title.includes("Bitcoin") || n.source.includes("Coin");
    if (category === "stock") return n.title.includes("Reliance") || n.title.includes("TCS") || n.title.includes("SEBI");
    return true;
  });
};

// ----------------------------------------------------
// 5. OpenAI Client / Simulator
// ----------------------------------------------------
export const getAISignal = async (asset: Asset, history: Candle[]): Promise<AISignal> => {
  if (hasOpenAIKey) {
    try {
      const prompt = `You are a professional financial analyst. Analyze this asset:
      Symbol: ${asset.symbol}
      Name: ${asset.name}
      Type: ${asset.type}
      Current Price: ${asset.price}
      Recent Trend: ${history.slice(-5).map(c => c.close).join(", ")}
      
      Respond strictly in JSON format matching this schema:
      {
        "recommendation": "BUY" | "HOLD" | "SELL",
        "confidence": number (0 to 100),
        "riskRating": "Low" | "Medium" | "High",
        "explanation": "Brief paragraph explaining the macro & micro reasons.",
        "newsImpact": "Assessment of current sentiment impact.",
        "technicalSummary": "Short technical assessment of RSI/SMA support levels."
      }`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await response.json();
      const content = JSON.parse(data.choices[0].message.content);
      return {
        symbol: asset.symbol,
        name: asset.name,
        type: asset.type,
        recommendation: content.recommendation,
        confidence: content.confidence,
        riskRating: content.riskRating,
        explanation: content.explanation,
        newsImpact: content.newsImpact,
        technicalSummary: content.technicalSummary,
        timestamp: new Date().toISOString()
      };
    } catch (e) {
      console.warn("OpenAI API error, falling back to local signal rules:", e);
    }
  }

  // Local Rule Engine for AI Signals
  const isPositive = asset.change >= 0;
  const confidence = Math.floor(Math.random() * 20) + 60; // 60-80
  let recommendation: "BUY" | "HOLD" | "SELL" = "HOLD";
  let explanation = "";
  let riskRating: "Low" | "Medium" | "High" = "Medium";

  if (asset.type === "crypto") {
    riskRating = "High";
    if (asset.change > 3) {
      recommendation = "BUY";
      explanation = `${asset.name} (${asset.symbol}) shows strong bullish momentum with high trade volumes. On-chain metrics indicate rising active addresses and strong exchange outflows, suggesting long-term accumulation.`;
    } else if (asset.change < -3) {
      recommendation = "SELL";
      explanation = `Sellers are dominating ${asset.name} markets after failing to hold overhead support levels. A bearish divergence on the RSI suggests further correction towards key moving averages.`;
    } else {
      recommendation = "HOLD";
      explanation = `${asset.name} is currently consolidating inside a narrow trading band. Traders should look for a breakout above local resistance or await a retest of structural demand zones before committing size.`;
    }
  } else {
    // Stocks / Forex
    riskRating = asset.type === "forex" ? "Low" : "Medium";
    if (isPositive && asset.change > 1.2) {
      recommendation = "BUY";
      explanation = `Technical breakout spotted on daily charts for ${asset.name}. Strong quarterly operational updates, expanding operating margins, and supportive institutional inflows are driving momentum.`;
    } else if (!isPositive && asset.change < -1.0) {
      recommendation = "SELL";
      explanation = `Underperformance in ${asset.name} stems from profit taking and headwinds in the sector. Price has closed below the 50-day EMA, signaling short-term bearishness.`;
    } else {
      recommendation = "HOLD";
      explanation = `${asset.name} trades at fair value. Valuations are aligned with historical averages, and technical indicators are neutral. Accumulate gradually during market dips.`;
    }
  }

  return {
    symbol: asset.symbol,
    name: asset.name,
    type: asset.type,
    recommendation,
    confidence,
    riskRating,
    explanation,
    newsImpact: `${asset.name} headlines are currently ${isPositive ? "mostly constructive" : "slightly mixed"}, reflecting broader market conditions.`,
    technicalSummary: `MACD lines are ${isPositive ? "bullish" : "bearish"}. RSI is floating near ${isPositive ? 62 : 45}, confirming ${recommendation.toLowerCase()} parameters.`,
    timestamp: new Date().toISOString()
  };
};

export const streamAssistantResponse = async (
  messages: { role: string; content: string }[],
  onChunk: (text: string) => void
): Promise<void> => {
  if (hasOpenAIKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          stream: true,
          messages
        })
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const cleanLine = line.trim();
          if (cleanLine.startsWith("data: ")) {
            if (cleanLine === "data: [DONE]") return;
            try {
              const parsed = JSON.parse(cleanLine.substring(6));
              const text = parsed.choices[0]?.delta?.content;
              if (text) onChunk(text);
            } catch (e) {}
          }
        }
      }
      return;
    } catch (e) {
      console.warn("OpenAI Stream failed, falling back to simulator:", e);
    }
  }

  // Streaming Text Simulation (SSE mock)
  const lastMessage = messages[messages.length - 1]?.content.toLowerCase() || "";
  let fullResponse = "";

  if (lastMessage.includes("portfolio")) {
    fullResponse = "Based on a review of your current portfolio, you have heavy exposure to Indian Blue-chip equities (Reliance and TCS) representing 65% of allocation, and 35% in major Cryptocurrencies (Bitcoin and Solana).\n\n**Key Observations:**\n1. **Risk Profile:** Your portfolio risk score is High, driven by crypto volatility.\n2. **Health Score:** 85/100, which is strong. Holdings are high-quality, high-volume assets.\n3. **Recommendation:** You may want to diversify by adding 10-15% into Forex or Liquid Mutual Funds to hedge during crypto market drawdowns.";
  } else if (lastMessage.includes("strategy") || lastMessage.includes("backtest")) {
    fullResponse = "Here are a few high-performing strategy suggestions:\n\n1. **RSI Mean Reversion (Crypto):** Buy BTC/ETH when daily RSI falls below 30, sell when it crosses above 70. Backtests show a 68% Win Rate.\n2. **EMA Golden Cross (Stocks):** Enter a long trade when the 50-day EMA crosses above the 200-day EMA. This works exceptionally well on NSE stocks like RELIANCE for catching long-term macro waves.";
  } else if (lastMessage.includes("nifty") || lastMessage.includes("market")) {
    fullResponse = "NIFTY 50 is trading at 22,450.30, up +0.65% today. Market sentiment remains bullish ahead of the RBI interest rate decision. IT and Energy stocks are leading the rally, while Financial services are experiencing mild consolidation. Technically, 22,200 remains a strong support zone, with major psychological resistance at 22,600.";
  } else {
    fullResponse = `Hello! I am your InvestIQ AI Co-pilot. I can analyze your portfolio holdings, evaluate technical market setups, summarize financial news, or help you backtest rules. How can I help you optimize your investments today?`;
  }

  const chunks = fullResponse.split(" ");
  for (let i = 0; i < chunks.length; i++) {
    await new Promise(r => setTimeout(r, Math.random() * 80 + 30));
    onChunk(chunks[i] + " ");
  }
};
