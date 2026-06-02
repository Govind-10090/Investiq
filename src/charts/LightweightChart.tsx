import { useEffect, useRef, useState } from "react";
import { 
  createChart, 
  ColorType, 
  LineStyle,
  ISeriesApi,
  CandlestickSeries,
  AreaSeries,
  LineSeries,
  HistogramSeries
} from "lightweight-charts";
import { Candle } from "../api/clients";
import { useThemeStore } from "../store";

import { 
  calculateSMA, 
  calculateEMA, 
  calculateRSI, 
  calculateMACD, 
  calculateBollingerBands,
  calculateVWAP
} from "../utils/indicators";

interface ChartProps {
  data: Candle[];
  type: "candlestick" | "line" | "area";
  showSMA?: boolean;
  showEMA?: boolean;
  showBB?: boolean;
  showRSI?: boolean;
  showMACD?: boolean;
  showVWAP?: boolean;
  compareData?: Candle[];
  compareSymbol?: string;
}

export function LightweightChart({
  data,
  type,
  showSMA = false,
  showEMA = false,
  showBB = false,
  showRSI = false,
  showMACD = false,
  showVWAP = false,
  compareData,
  compareSymbol
}: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);
  
  // Refs to retain chart & series instances for incremental updates
  const chartRef = useRef<any>(null);
  const mainSeriesRef = useRef<any>(null);
  const smaSeriesRef = useRef<any>(null);
  const emaSeriesRef = useRef<any>(null);
  const bbUpperRef = useRef<any>(null);
  const bbMiddleRef = useRef<any>(null);
  const bbLowerRef = useRef<any>(null);
  const vwapSeriesRef = useRef<any>(null);
  const compareSeriesRef = useRef<any>(null);
  const rsiChartRef = useRef<any>(null);
  const rsiSeriesRef = useRef<any>(null);
  const macdChartRef = useRef<any>(null);
  const macdLineSeriesRef = useRef<any>(null);
  const macdSignalLineSeriesRef = useRef<any>(null);
  const macdHistSeriesRef = useRef<any>(null);

  const prevDataRef = useRef<Candle[]>([]);
  const prevConfigRef = useRef<string>("");
  const dataMapRef = useRef<Map<string, Candle>>(new Map());

  const [crosshairPrice, setCrosshairPrice] = useState<number | null>(null);
  const [crosshairDate, setCrosshairDate] = useState<string | null>(null);

  const { theme } = useThemeStore();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const checkDark = () => {
      if (theme === "system") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches;
      }
      return theme === "dark";
    };
    setIsDark(checkDark());
    
    if (theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = () => setIsDark(media.matches);
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }
  }, [theme]);

  // Hover/Tooltip state
  const [hoverData, setHoverData] = useState<{
    x: number;
    y: number;
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    changePct: number;
  } | null>(null);

  // Maintain quick O(1) lookups for candle details (like volume) on cursor hover
  useEffect(() => {
    dataMapRef.current.clear();
    data.forEach((item) => {
      dataMapRef.current.set(item.time.toString(), item);
    });
  }, [data]);

  // Handle cleanup on unmount
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      if (rsiChartRef.current) {
        rsiChartRef.current.remove();
        rsiChartRef.current = null;
      }
      if (macdChartRef.current) {
        macdChartRef.current.remove();
        macdChartRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    const currentConfigKey = `${type}-${showSMA}-${showEMA}-${showBB}-${showVWAP}-${showRSI}-${showMACD}-${compareSymbol}`;
    const prevData = prevDataRef.current;
    const isConfigSame = prevConfigRef.current === currentConfigKey;
    const isIncremental = 
      isConfigSame &&
      prevData.length > 0 && 
      data.length === prevData.length && 
      data[0].time === prevData[0].time &&
      chartRef.current !== null;

    const closes = data.map(d => d.close);
    const lastIndex = data.length - 1;
    const lastItem = data[lastIndex];

    if (isIncremental) {
      // --- Incremental Tick Updates (Groww Architecture) ---
      if (mainSeriesRef.current) {
        if (type === "candlestick") {
          mainSeriesRef.current.update({
            time: lastItem.time,
            open: lastItem.open,
            high: lastItem.high,
            low: lastItem.low,
            close: lastItem.close,
          });
        } else {
          mainSeriesRef.current.update({
            time: lastItem.time,
            value: lastItem.close,
          });
        }
      }

      if (showSMA && smaSeriesRef.current) {
        const smaData = calculateSMA(closes, 14);
        smaSeriesRef.current.update({ time: lastItem.time, value: smaData[lastIndex] });
      }

      if (showEMA && emaSeriesRef.current) {
        const emaData = calculateEMA(closes, 20);
        emaSeriesRef.current.update({ time: lastItem.time, value: emaData[lastIndex] });
      }

      if (showBB && bbUpperRef.current && bbMiddleRef.current && bbLowerRef.current) {
        const bb = calculateBollingerBands(closes, 20, 2);
        bbUpperRef.current.update({ time: lastItem.time, value: bb.upper[lastIndex] });
        bbMiddleRef.current.update({ time: lastItem.time, value: bb.middle[lastIndex] });
        bbLowerRef.current.update({ time: lastItem.time, value: bb.lower[lastIndex] });
      }

      if (showVWAP && vwapSeriesRef.current) {
        const vwapData = calculateVWAP(data);
        vwapSeriesRef.current.update({ time: lastItem.time, value: vwapData[lastIndex] });
      }

      if (compareSeriesRef.current && compareData && compareData.length > 0) {
        const lastComp = compareData[compareData.length - 1];
        compareSeriesRef.current.update({ time: lastComp.time, value: lastComp.close });
      }

      if (showRSI && rsiSeriesRef.current) {
        const rsiData = calculateRSI(closes, 14);
        rsiSeriesRef.current.update({ time: lastItem.time, value: rsiData[lastIndex] });
      }

      if (showMACD && macdLineSeriesRef.current && macdSignalLineSeriesRef.current && macdHistSeriesRef.current) {
        const macd = calculateMACD(closes);
        macdLineSeriesRef.current.update({ time: lastItem.time, value: macd.macdLine[lastIndex] });
        macdSignalLineSeriesRef.current.update({ time: lastItem.time, value: macd.signalLine[lastIndex] });
        macdHistSeriesRef.current.update({
          time: lastItem.time,
          value: macd.histogram[lastIndex],
          color: macd.histogram[lastIndex] >= 0 ? "rgba(16, 185, 129, 0.5)" : "rgba(239, 68, 68, 0.5)"
        });
      }
    } else {
      // --- Full Rebuild (For Asset, Timeframe, or Config Overlay Changes) ---
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      if (rsiChartRef.current) {
        rsiChartRef.current.remove();
        rsiChartRef.current = null;
      }
      if (macdChartRef.current) {
        macdChartRef.current.remove();
        macdChartRef.current = null;
      }
      mainSeriesRef.current = null;
      smaSeriesRef.current = null;
      emaSeriesRef.current = null;
      bbUpperRef.current = null;
      bbMiddleRef.current = null;
      bbLowerRef.current = null;
      vwapSeriesRef.current = null;
      compareSeriesRef.current = null;
      rsiSeriesRef.current = null;
      macdLineSeriesRef.current = null;
      macdSignalLineSeriesRef.current = null;
      macdHistSeriesRef.current = null;

      const chartBg = isDark ? "#0f0f14" : "#ffffff";
      const chartText = isDark ? "#a1a1aa" : "#717182";
      const chartGrid = isDark ? "rgba(63, 63, 70, 0.15)" : "rgba(0, 0, 0, 0.06)";
      const chartBorder = isDark ? "rgba(63, 63, 70, 0.3)" : "rgba(0, 0, 0, 0.1)";

      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: chartBg },
          textColor: chartText,
        },
        grid: {
          vertLines: { color: chartGrid },
          horzLines: { color: chartGrid },
        },
        width: chartContainerRef.current.clientWidth || 600,
        height: chartContainerRef.current.clientHeight || 420,
        timeScale: {
          borderColor: chartBorder,
          timeVisible: true,
        },
        rightPriceScale: {
          borderColor: chartBorder,
        }
      });
      chartRef.current = chart;

      let mainSeries: ISeriesApi<any>;
      if (type === "candlestick") {
        mainSeries = chart.addSeries(CandlestickSeries, {
          upColor: "#10b981",
          downColor: "#ef4444",
          borderVisible: false,
          wickUpColor: "#10b981",
          wickDownColor: "#ef4444",
        });
      } else if (type === "area") {
        mainSeries = chart.addSeries(AreaSeries, {
          lineColor: "#10b981",
          topColor: "rgba(16, 185, 129, 0.2)",
          bottomColor: "rgba(16, 185, 129, 0.0)",
          lineWidth: 2,
        });
      } else {
        mainSeries = chart.addSeries(LineSeries, {
          color: "#3b82f6",
          lineWidth: 2,
        });
      }
      mainSeriesRef.current = mainSeries;

      if (type === "candlestick") {
        mainSeries.setData(data.map((d) => ({
          time: d.time,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        })));
      } else {
        mainSeries.setData(data.map((d) => ({
          time: d.time,
          value: d.close,
        })));
      }

      chart.timeScale().fitContent();

      if (showSMA) {
        const smaData = calculateSMA(closes, 14);
        const smaSeries = chart.addSeries(LineSeries, {
          color: "#f59e0b",
          lineWidth: 1.5,
          title: "SMA (14)",
        });
        smaSeries.setData(data.map((d, i) => ({ time: d.time, value: smaData[i] })));
        smaSeriesRef.current = smaSeries;
      }

      if (showEMA) {
        const emaData = calculateEMA(closes, 20);
        const emaSeries = chart.addSeries(LineSeries, {
          color: "#a855f7",
          lineWidth: 1.5,
          title: "EMA (20)",
        });
        emaSeries.setData(data.map((d, i) => ({ time: d.time, value: emaData[i] })));
        emaSeriesRef.current = emaSeries;
      }

      if (showBB) {
        const bb = calculateBollingerBands(closes, 20, 2);
        const bbUpper = chart.addSeries(LineSeries, { color: "#22c55e", lineWidth: 1, lineStyle: LineStyle.Dashed });
        const bbMiddle = chart.addSeries(LineSeries, { color: "#22c55e", lineWidth: 1 });
        const bbLower = chart.addSeries(LineSeries, { color: "#22c55e", lineWidth: 1, lineStyle: LineStyle.Dashed });
        
        bbUpper.setData(data.map((d, i) => ({ time: d.time, value: bb.upper[i] })));
        bbMiddle.setData(data.map((d, i) => ({ time: d.time, value: bb.middle[i] })));
        bbLower.setData(data.map((d, i) => ({ time: d.time, value: bb.lower[i] })));

        bbUpperRef.current = bbUpper;
        bbMiddleRef.current = bbMiddle;
        bbLowerRef.current = bbLower;
      }

      if (showVWAP) {
        const vwapData = calculateVWAP(data);
        const vwapSeries = chart.addSeries(LineSeries, {
          color: "#06b6d4",
          lineWidth: 1.5,
          title: "VWAP",
        });
        vwapSeries.setData(data.map((d, i) => ({ time: d.time, value: vwapData[i] })));
        vwapSeriesRef.current = vwapSeries;
      }

      if (compareData && compareData.length > 0 && compareSymbol) {
        const compareSeries = chart.addSeries(LineSeries, {
          color: "#ec4899",
          lineWidth: 1.5,
          title: compareSymbol,
        });
        compareSeries.setData(
          compareData.map((d) => ({ time: d.time, value: d.close }))
        );
        compareSeriesRef.current = compareSeries;
      }

      // Interactive hover tooltip logic
      chart.subscribeCrosshairMove((param) => {
        if (
          param.point === undefined ||
          !param.time ||
          param.point.x < 0 ||
          param.point.y < 0
        ) {
          setHoverData(null);
          setCrosshairPrice(null);
          setCrosshairDate(null);
        } else {
          const seriesData = param.seriesData.get(mainSeries) as any;
          if (seriesData) {
            let dateStr = "";
            if (typeof param.time === "number") {
              const date = new Date(param.time * 1000);
              dateStr = date.toLocaleString([], {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              });
            } else if (typeof param.time === "string") {
              dateStr = new Date(param.time).toLocaleDateString([], {
                year: "numeric",
                month: "short",
                day: "numeric"
              });
            } else {
              const t = param.time as any;
              dateStr = `${t.year}-${String(t.month).padStart(2, "0")}-${String(t.day).padStart(2, "0")}`;
            }

            const open = seriesData.open ?? seriesData.value ?? 0;
            const close = seriesData.close ?? seriesData.value ?? 0;
            const high = seriesData.high ?? seriesData.value ?? 0;
            const low = seriesData.low ?? seriesData.value ?? 0;
            
            const originalCandle = dataMapRef.current.get(param.time.toString());
            const volume = originalCandle ? originalCandle.volume : 0;
            const changePct = open > 0 ? ((close - open) / open) * 100 : 0;

            const containerWidth = chartContainerRef.current?.clientWidth || 0;
            const tooltipWidth = 150;
            const xPos = param.point.x + tooltipWidth + 30 > containerWidth 
              ? param.point.x - tooltipWidth - 15 
              : param.point.x + 15;
            
            const yPos = param.point.y + 15;

            setHoverData({
              x: xPos,
              y: yPos,
              date: dateStr,
              open,
              high,
              low,
              close,
              volume,
              changePct
            });

            setCrosshairPrice(close);
            setCrosshairDate(dateStr);
          } else {
            setHoverData(null);
            setCrosshairPrice(null);
            setCrosshairDate(null);
          }
        }
      });

      chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (range) {
          if (rsiChartRef.current) {
            rsiChartRef.current.timeScale().setVisibleLogicalRange(range);
          }
          if (macdChartRef.current) {
            macdChartRef.current.timeScale().setVisibleLogicalRange(range);
          }
        }
      });

      if (showRSI && rsiContainerRef.current) {
        const rsiChart = createChart(rsiContainerRef.current, {
          layout: {
            background: { type: ColorType.Solid, color: chartBg },
            textColor: chartText,
          },
          grid: {
            vertLines: { visible: false },
            horzLines: { color: chartGrid },
          },
          width: rsiContainerRef.current.clientWidth || 600,
          height: rsiContainerRef.current.clientHeight || 120,
          timeScale: { visible: false }
        });
        rsiChartRef.current = rsiChart;

        const rsiSeries = rsiChart.addSeries(LineSeries, {
          color: "#eab308",
          lineWidth: 1.5,
          title: "RSI (14)"
        });
        rsiSeriesRef.current = rsiSeries;
        
        const rsiData = calculateRSI(closes, 14);
        rsiSeries.setData(data.map((d, i) => ({ time: d.time, value: rsiData[i] })));

        const limitUpper = rsiChart.addSeries(LineSeries, { color: "rgba(239, 68, 68, 0.3)", lineWidth: 1, lineStyle: LineStyle.Dashed });
        const limitLower = rsiChart.addSeries(LineSeries, { color: "rgba(16, 185, 129, 0.3)", lineWidth: 1, lineStyle: LineStyle.Dashed });
        limitUpper.setData(data.map((d) => ({ time: d.time, value: 70 })));
        limitLower.setData(data.map((d) => ({ time: d.time, value: 30 })));
        rsiChart.timeScale().fitContent();
      }

      if (showMACD && macdContainerRef.current) {
        const macdChart = createChart(macdContainerRef.current, {
          layout: {
            background: { type: ColorType.Solid, color: chartBg },
            textColor: chartText,
          },
          grid: {
            vertLines: { visible: false },
            horzLines: { color: chartGrid },
          },
          width: macdContainerRef.current.clientWidth || 600,
          height: macdContainerRef.current.clientHeight || 120,
          timeScale: { visible: false }
        });
        macdChartRef.current = macdChart;

        const macdLineSeries = macdChart.addSeries(LineSeries, { color: "#2563eb", lineWidth: 1.5 });
        const signalLineSeries = macdChart.addSeries(LineSeries, { color: "#ea580c", lineWidth: 1.5 });
        const histogramSeries = macdChart.addSeries(HistogramSeries, {
          color: "#10b981",
          base: 0
        });

        macdLineSeriesRef.current = macdLineSeries;
        macdSignalLineSeriesRef.current = signalLineSeries;
        macdHistSeriesRef.current = histogramSeries;

        const macd = calculateMACD(closes);
        macdLineSeries.setData(data.map((d, i) => ({ time: d.time, value: macd.macdLine[i] })));
        signalLineSeries.setData(data.map((d, i) => ({ time: d.time, value: macd.signalLine[i] })));
        histogramSeries.setData(
          data.map((d, i) => ({
            time: d.time,
            value: macd.histogram[i],
            color: macd.histogram[i] >= 0 ? "rgba(16, 185, 129, 0.5)" : "rgba(239, 68, 68, 0.5)"
          }))
        );
        macdChart.timeScale().fitContent();
      }
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0) {
          if (entry.target === chartContainerRef.current && chartRef.current) {
            chartRef.current.resize(width, height || 420);
          } else if (entry.target === rsiContainerRef.current && rsiChartRef.current) {
            rsiChartRef.current.resize(width, height || 120);
          } else if (entry.target === macdContainerRef.current && macdChartRef.current) {
            macdChartRef.current.resize(width, height || 120);
          }
        }
      }
    });

    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }
    if (showRSI && rsiContainerRef.current) {
      resizeObserver.observe(rsiContainerRef.current);
    }
    if (showMACD && macdContainerRef.current) {
      resizeObserver.observe(macdContainerRef.current);
    }

    prevDataRef.current = data;
    prevConfigRef.current = currentConfigKey;

    return () => {
      resizeObserver.disconnect();
    };
  }, [data, type, showSMA, showEMA, showBB, showVWAP, showRSI, showMACD, compareData, compareSymbol, isDark]);

  return (
    <div className="space-y-4">
      {/* Live Track Coordinates Header */}
      {crosshairPrice !== null && (
        <div className="flex gap-4 text-xs bg-card px-4 py-2 border border-border/40 rounded-lg text-muted-foreground">
          <span>Date/Time: <strong className="text-foreground">{crosshairDate}</strong></span>
          <span>Price: <strong className="text-emerald-400">₹{crosshairPrice.toLocaleString()}</strong></span>
        </div>
      )}

      {/* Main Chart Canvas & Floating Tooltip */}
      <div className="relative">
        <div ref={chartContainerRef} className="w-full h-[420px] border border-border/20 rounded-xl overflow-hidden shadow-2xl bg-card" />
        
        {/* TradingView-grade hover tooltip */}
        {hoverData && (
          <div 
            className="absolute bg-card/95 backdrop-blur-md border border-border/70 rounded-lg p-3 text-[10px] text-muted-foreground shadow-2xl z-40 pointer-events-none space-y-1 min-w-[150px]"
            style={{ 
              left: `${hoverData.x}px`, 
              top: `${hoverData.y}px`,
              transition: "left 0.03s linear, top 0.03s linear"
            }}
          >
            <div className="text-foreground font-bold border-b border-border/30 pb-1 mb-1">
              {hoverData.date}
            </div>
            <div className="space-y-0.5">
              <div className="flex justify-between gap-4"><span>Open:</span><span className="text-foreground font-medium">₹{hoverData.open.toLocaleString()}</span></div>
              <div className="flex justify-between gap-4"><span>High:</span><span className="text-foreground font-medium">₹{hoverData.high.toLocaleString()}</span></div>
              <div className="flex justify-between gap-4"><span>Low:</span><span className="text-foreground font-medium">₹{hoverData.low.toLocaleString()}</span></div>
              <div className="flex justify-between gap-4"><span>Close:</span><span className="text-foreground font-medium">₹{hoverData.close.toLocaleString()}</span></div>
              <div className="flex justify-between gap-4"><span>Volume:</span><span className="text-foreground font-medium">{hoverData.volume.toLocaleString()}</span></div>
              <div className="flex justify-between gap-4 border-t border-border/20 pt-0.5 mt-0.5">
                <span>Change:</span>
                <span className={`font-semibold ${hoverData.changePct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {hoverData.changePct >= 0 ? "+" : ""}{hoverData.changePct.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RSI Sub-pane */}
      {showRSI && (
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground pl-2 font-medium">Relative Strength Index (RSI)</div>
          <div ref={rsiContainerRef} className="w-full h-[120px] border border-border/20 rounded-xl overflow-hidden bg-card" />
        </div>
      )}

      {/* MACD Sub-pane */}
      {showMACD && (
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground pl-2 font-medium">MACD (12, 26, 9)</div>
          <div ref={macdContainerRef} className="w-full h-[120px] border border-border/20 rounded-xl overflow-hidden bg-card" />
        </div>
      )}
    </div>
  );
}
