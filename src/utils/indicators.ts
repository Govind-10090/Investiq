// Technical Indicators Calculations Utility

export function calculateSMA(prices: number[], period: number): number[] {
  const sma: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      sma.push(prices[i]); // Keep base price for padding
      continue;
    }
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += prices[i - j];
    }
    sma.push(Number((sum / period).toFixed(2)));
  }
  return sma;
}

export function calculateEMA(prices: number[], period: number): number[] {
  const ema: number[] = [];
  if (prices.length === 0) return [];
  
  const k = 2 / (period + 1);
  let prevEma = prices[0];
  ema.push(prevEma);

  for (let i = 1; i < prices.length; i++) {
    const curEma = prices[i] * k + prevEma * (1 - k);
    ema.push(Number(curEma.toFixed(2)));
    prevEma = curEma;
  }
  return ema;
}

export function calculateRSI(prices: number[], period: number = 14): number[] {
  const rsi: number[] = [];
  if (prices.length < period) return prices.map(() => 50);

  let gains = 0;
  let losses = 0;

  // First period change averages
  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  // Pad the first items
  for (let i = 0; i < period; i++) {
    rsi.push(50);
  }
  rsi.push(avgLoss === 0 ? 100 : Number((100 - 100 / (1 + avgGain / avgLoss)).toFixed(2)));

  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi.push(avgLoss === 0 ? 100 : Number((100 - 100 / (1 + rs)).toFixed(2)));
  }

  return rsi;
}

export interface MACDResult {
  macdLine: number[];
  signalLine: number[];
  histogram: number[];
}

export function calculateMACD(
  prices: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult {
  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);
  
  const macdLine: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    macdLine.push(Number((fastEMA[i] - slowEMA[i]).toFixed(2)));
  }

  const signalLine = calculateEMA(macdLine, signalPeriod);
  const histogram: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    histogram.push(Number((macdLine[i] - signalLine[i]).toFixed(2)));
  }

  return { macdLine, signalLine, histogram };
}

export interface BollingerBandsResult {
  upper: number[];
  middle: number[];
  lower: number[];
}

export function calculateBollingerBands(
  prices: number[],
  period: number = 20,
  multiplier: number = 2
): BollingerBandsResult {
  const middle = calculateSMA(prices, period);
  const upper: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      upper.push(prices[i]);
      lower.push(prices[i]);
      continue;
    }

    let varianceSum = 0;
    const mean = middle[i];
    for (let j = 0; j < period; j++) {
      varianceSum += Math.pow(prices[i - j] - mean, 2);
    }
    const stdDev = Math.sqrt(varianceSum / period);
    
    upper.push(Number((mean + multiplier * stdDev).toFixed(2)));
    lower.push(Number((mean - multiplier * stdDev).toFixed(2)));
  }

  return { upper, middle, lower };
}

export interface BacktestRule {
  indicator: "RSI" | "SMA" | "EMA";
  condition: "less_than" | "greater_than";
  value: number;
}

export interface BacktestStrategy {
  name: string;
  assetSymbol: string;
  entryRules: BacktestRule;
  exitRules: BacktestRule;
  startDate: string;
  endDate: string;
}

interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function runActualBacktest(candles: Candle[], strategy: BacktestStrategy) {
  const closes = candles.map(c => c.close);
  const rsi14 = calculateRSI(closes, 14);
  const sma14 = calculateSMA(closes, 14);
  const ema20 = calculateEMA(closes, 20);

  let cash = 100000;
  let shares = 0;
  let tradesCount = 0;
  let wins = 0;
  let totalProfits = 0;
  let totalLosses = 0;
  
  const tradesList: any[] = [];
  const equityCurve: { date: string; portfolioValue: number; benchmarkValue: number }[] = [];
  
  const initialClose = closes[0] || 1;
  const initialCash = cash;
  
  let peak = initialCash;
  let maxDd = 0;

  // We start at index 20 to allow indicators to stabilize
  const startIndex = Math.min(20, candles.length - 1);
  
  // Fill initial padding days in equity curve
  for (let i = 0; i < startIndex; i++) {
    equityCurve.push({
      date: candles[i].time,
      portfolioValue: initialCash,
      benchmarkValue: initialCash
    });
  }

  for (let i = startIndex; i < candles.length; i++) {
    const candle = candles[i];
    const price = candle.close;
    
    // Calculate current indicator values for entry/exit checks
    const getVal = (rule: BacktestRule) => {
      if (rule.indicator === "RSI") return rsi14[i];
      if (rule.indicator === "SMA") return sma14[i];
      return ema20[i]; // EMA
    };

    const checkCondition = (rule: BacktestRule) => {
      const val = getVal(rule);
      if (rule.condition === "less_than") return val < rule.value;
      return val > rule.value;
    };

    // Check entry (buy) if we don't own shares
    if (shares === 0) {
      if (checkCondition(strategy.entryRules)) {
        shares = cash / price;
        cash = 0;
        tradesList.push({
          type: "buy",
          price,
          date: candle.time
        });
      }
    } 
    // Check exit (sell) if we do own shares
    else {
      if (checkCondition(strategy.exitRules)) {
        const proceeds = shares * price;
        const buyTrade = tradesList[tradesList.length - 1];
        const gain = proceeds - (buyTrade.price * shares);
        const gainPct = (price / buyTrade.price - 1) * 100;
        
        cash = proceeds;
        shares = 0;
        tradesCount++;
        
        if (gain > 0) {
          wins++;
          totalProfits += gain;
        } else {
          totalLosses += Math.abs(gain);
        }

        tradesList.push({
          type: "sell",
          price,
          date: candle.time,
          profitPercent: Number(gainPct.toFixed(2))
        });
      }
    }

    const currentPortfolioValue = shares > 0 ? shares * price : cash;
    const currentBenchmarkValue = (price / initialClose) * initialCash;
    
    equityCurve.push({
      date: candle.time,
      portfolioValue: Math.round(currentPortfolioValue),
      benchmarkValue: Math.round(currentBenchmarkValue)
    });

    // Peak & Drawdown calculations
    if (currentPortfolioValue > peak) {
      peak = currentPortfolioValue;
    }
    const dd = ((peak - currentPortfolioValue) / peak) * 100;
    if (dd > maxDd) {
      maxDd = dd;
    }
  }

  // Force close position at the end of backtest if still open
  if (shares > 0) {
    const finalCandle = candles[candles.length - 1];
    const price = finalCandle.close;
    const proceeds = shares * price;
    const buyTrade = tradesList[tradesList.length - 1];
    const gain = proceeds - (buyTrade.price * shares);
    const gainPct = (price / buyTrade.price - 1) * 100;
    
    cash = proceeds;
    shares = 0;
    tradesCount++;
    
    if (gain > 0) {
      wins++;
      totalProfits += gain;
    } else {
      totalLosses += Math.abs(gain);
    }

    tradesList.push({
      type: "sell",
      price,
      date: finalCandle.time,
      profitPercent: Number(gainPct.toFixed(2))
    });

    // Update last element of equity curve
    if (equityCurve.length > 0) {
      equityCurve[equityCurve.length - 1].portfolioValue = Math.round(cash);
    }
  }

  const finalValue = cash;
  const cumulativeReturn = ((finalValue / initialCash) - 1) * 100;
  const benchmarkReturn = ((closes[closes.length - 1] / initialClose) - 1) * 100;
  
  // CAGR Calculation
  const tradingDaysPerYear = 252;
  const years = candles.length / tradingDaysPerYear;
  const cagr = years > 0 ? (Math.pow(finalValue / initialCash, 1 / years) - 1) * 100 : cumulativeReturn;

  // Win Rate
  const winRate = tradesCount > 0 ? (wins / tradesCount) * 100 : 0;

  // Profit Factor
  const profitFactor = totalLosses > 0 ? totalProfits / totalLosses : totalProfits > 0 ? 9.99 : 1.0;

  // Sharpe Ratio
  const dailyReturns: number[] = [];
  for (let i = 1; i < equityCurve.length; i++) {
    const prev = equityCurve[i - 1].portfolioValue;
    const cur = equityCurve[i].portfolioValue;
    const r = prev > 0 ? (cur - prev) / prev : 0;
    dailyReturns.push(r);
  }
  const avgDailyReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / (dailyReturns.length || 1);
  const dailyRf = 0.05 / 252;
  const excessReturns = dailyReturns.map(r => r - dailyRf);
  const meanExcess = excessReturns.reduce((sum, r) => sum + r, 0) / (excessReturns.length || 1);
  const variance = excessReturns.reduce((sum, r) => sum + Math.pow(r - meanExcess, 2), 0) / (excessReturns.length || 1);
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? (meanExcess / stdDev) * Math.sqrt(252) : 0;

  return {
    cagr: Number(cagr.toFixed(2)),
    sharpeRatio: Number(Math.max(-3, Math.min(5, sharpeRatio)).toFixed(2)),
    maxDrawdown: Number(maxDd.toFixed(2)),
    winRate: Number(winRate.toFixed(2)),
    profitFactor: Number(Math.min(9.99, profitFactor).toFixed(2)),
    cumulativeReturn: Number(cumulativeReturn.toFixed(2)),
    benchmarkReturn: Number(benchmarkReturn.toFixed(2)),
    trades: tradesCount,
    equityCurve
  };
}

export function calculateVWAP(candles: Candle[]): number[] {
  const vwap: number[] = [];
  let cumulativeTypicalPriceVolume = 0;
  let cumulativeVolume = 0;

  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    const typicalPrice = (candle.high + candle.low + candle.close) / 3;
    cumulativeTypicalPriceVolume += typicalPrice * (candle.volume || 1);
    cumulativeVolume += (candle.volume || 1);

    if (cumulativeVolume === 0) {
      vwap.push(candle.close);
    } else {
      vwap.push(Number((cumulativeTypicalPriceVolume / cumulativeVolume).toFixed(2)));
    }
  }
  return vwap;
}
