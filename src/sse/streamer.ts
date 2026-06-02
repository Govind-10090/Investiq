// Server-Sent Events (SSE) Streamer Client

export interface SSEEvent<T = any> {
  type: string;
  progress?: number;
  data: T;
  timestamp: string;
}

export class SSEStreamer {
  private static activeStreams: Map<string, { cancel: () => void }> = new Map();

  /**
   * Start a streaming simulation for Backtesting Strategy runs
   */
  public static streamBacktest(
    strategyId: string,
    onEvent: (event: SSEEvent<{ message: string; results?: any }>) => void
  ): { cancel: () => void } {
    const streamKey = `backtest-${strategyId}`;
    this.cancelStream(streamKey);

    let progress = 0;
    let timer: any = null;

    const cancel = () => {
      if (timer) clearInterval(timer);
      this.activeStreams.delete(streamKey);
    };

    const steps = [
      "Loading historical candlestick datasets...",
      "Parsing entry conditions and indicator triggers...",
      "Executing backtest strategy transactions...",
      "Generating strategy trade log details...",
      "Compiling CAGR, Sharpe Ratio, and Drawdowns...",
      "Finalizing cumulative equity curves..."
    ];

    timer = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(timer);
        
        // Final Results Event
        onEvent({
          type: "complete",
          progress: 100,
          data: {
            message: "Backtest strategy ran successfully.",
            results: {
              cagr: Number((Math.random() * 12 + 10).toFixed(2)), // 10% - 22%
              sharpeRatio: Number((Math.random() * 1.2 + 0.8).toFixed(2)), // 0.8 - 2.0
              sortinoRatio: Number((Math.random() * 1.5 + 1.0).toFixed(2)), // 1.0 - 2.5
              maxDrawdown: Number((Math.random() * 15 + 5).toFixed(2)), // 5% - 20%
              winRate: Number((Math.random() * 25 + 50).toFixed(2)), // 50% - 75%
              profitFactor: Number((Math.random() * 0.8 + 1.2).toFixed(2)), // 1.2 - 2.0
              cumulativeReturn: Number((Math.random() * 150 + 50).toFixed(2)), // 50% - 200%
              benchmarkReturn: Number((Math.random() * 80 + 30).toFixed(2)),
              trades: Math.floor(Math.random() * 120) + 30
            }
          },
          timestamp: new Date().toISOString()
        });
        this.activeStreams.delete(streamKey);
      } else {
        const stepIndex = Math.min(Math.floor((progress / 100) * steps.length), steps.length - 1);
        onEvent({
          type: "progress",
          progress,
          data: { message: steps[stepIndex] },
          timestamp: new Date().toISOString()
        });
      }
    }, 800); // Send updates every 800ms

    const handle = { cancel };
    this.activeStreams.set(streamKey, handle);
    return handle;
  }

  /**
   * Start a streaming simulation for AI Signal Generation
   */
  public static streamAISignals(
    assetSymbol: string,
    onEvent: (event: SSEEvent<{ message: string; signal?: any }>) => void
  ): { cancel: () => void } {
    const streamKey = `ai-signal-${assetSymbol}`;
    this.cancelStream(streamKey);

    let progress = 0;
    let timer: any = null;

    const cancel = () => {
      if (timer) clearInterval(timer);
      this.activeStreams.delete(streamKey);
    };

    const steps = [
      "Retrieving current price action tickers...",
      "Analyzing technical support and resistance zones...",
      "Aggregating latest sentiment on Yahoo Finance & CoinGecko...",
      "Consulting OpenAI financial evaluation models...",
      "Assembling confidence matrix weights..."
    ];

    timer = setInterval(() => {
      progress += 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(timer);
        
        onEvent({
          type: "complete",
          progress: 100,
          data: {
            message: "AI recommendation compiled.",
            signal: {
              recommendation: Math.random() > 0.55 ? "BUY" : Math.random() > 0.4 ? "HOLD" : "SELL",
              confidence: Math.floor(Math.random() * 25) + 65,
              riskRating: Math.random() > 0.6 ? "High" : Math.random() > 0.3 ? "Medium" : "Low",
              explanation: `The model identifies a breakout pattern in ${assetSymbol}. Institutional accumulation is confirmed alongside strong buying pressure above local key averages.`,
              newsImpact: "News sentiment is positive; market headlines focus on sector expansion.",
              technicalSummary: "RSI is bullish at 58. MACD shows golden cross in 4-hour timeline."
            }
          },
          timestamp: new Date().toISOString()
        });
        this.activeStreams.delete(streamKey);
      } else {
        const stepIndex = Math.floor(progress / 20) - 1;
        onEvent({
          type: "progress",
          progress,
          data: { message: steps[stepIndex] || "Processing..." },
          timestamp: new Date().toISOString()
        });
      }
    }, 600);

    const handle = { cancel };
    this.activeStreams.set(streamKey, handle);
    return handle;
  }

  /**
   * Cancel an active stream
   */
  public static cancelStream(key: string) {
    const active = this.activeStreams.get(key);
    if (active) {
      active.cancel();
      this.activeStreams.delete(key);
    }
  }

  /**
   * Cancel all running streams
   */
  public static cancelAll() {
    this.activeStreams.forEach(stream => stream.cancel());
    this.activeStreams.clear();
  }
}
