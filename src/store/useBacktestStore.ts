import { create } from "zustand";
import { BacktestStrategy, BacktestResult } from "../types";
import { SSEStreamer } from "../sse/streamer";
import { runActualBacktest } from "../utils/indicators";
import { getAssetHistory } from "../api/clients";

export interface BacktestState {
  progress: number;
  statusText: string;
  isRunning: boolean;
  result: BacktestResult | null;
  runBacktest: (strategy: BacktestStrategy) => Promise<void>;
  clearResult: () => void;
}

export const useBacktestStore = create<BacktestState>((set) => ({
  progress: 0,
  statusText: "",
  isRunning: false,
  result: null,
  runBacktest: async (strategy) => {
    set({ isRunning: true, progress: 0, statusText: "Initializing Simulation...", result: null });
    
    SSEStreamer.streamBacktest(strategy.name, (event) => {
      if (event.type === "progress") {
        set({ 
          progress: event.progress || 0,
          statusText: event.data.message 
        });
      } else if (event.type === "complete") {
        const candles = getAssetHistory(strategy.assetSymbol, 180);
        const backtestResult = runActualBacktest(candles, strategy);

        set({
          progress: 100,
          isRunning: false,
          statusText: "Analysis Complete!",
          result: backtestResult
        });
      }
    });
  },
  clearResult: () => set({ result: null, progress: 0, statusText: "", isRunning: false })
}));
