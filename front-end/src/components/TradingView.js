import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  createChart,
  ColorType,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  HistogramSeries,
  CrosshairMode,
  LineStyle,
} from 'lightweight-charts';
import Navbar from './Navbar';

// Expanded mock data with volume and indicator data
const mockData = {
  AAPL: Array.from({ length: 100 }, (_, i) => {
    const date = new Date('2025-08-27');
    date.setDate(date.getDate() + i);
    const basePrice = 150 + i * 0.5;
    const close = basePrice + (Math.random() - 0.5) * 3;
    return {
      time: Math.floor(date.getTime() / 1000),
      open: basePrice,
      high: basePrice + Math.random() * 5,
      low: basePrice - Math.random() * 5,
      close,
      value: close,
      volume: Math.floor(Math.random() * 1000000),
    };
  }),
  GOOGL: Array.from({ length: 100 }, (_, i) => {
    const date = new Date('2025-08-27');
    date.setDate(date.getDate() + i);
    const basePrice = 120 + i * 0.4;
    const close = basePrice + (Math.random() - 0.5) * 2;
    return {
      time: Math.floor(date.getTime() / 1000),
      open: basePrice,
      high: basePrice + Math.random() * 4,
      low: basePrice - Math.random() * 4,
      close,
      value: close,
      volume: Math.floor(Math.random() * 800000),
    };
  }),
  TSLA: Array.from({ length: 100 }, (_, i) => {
    const date = new Date('2025-08-27');
    date.setDate(date.getDate() + i);
    const basePrice = 300 + i * 1;
    const close = basePrice + (Math.random() - 0.5) * 5;
    return {
      time: Math.floor(date.getTime() / 1000),
      open: basePrice,
      high: basePrice + Math.random() * 10,
      low: basePrice - Math.random() * 10,
      close,
      value: close,
      volume: Math.floor(Math.random() * 2000000),
    };
  }),
  BTCUSD: Array.from({ length: 100 }, (_, i) => {
    const date = new Date('2025-08-27');
    date.setDate(date.getDate() + i);
    const basePrice = 50000 + i * 100;
    const close = basePrice + (Math.random() - 0.5) * 500;
    return {
      time: Math.floor(date.getTime() / 1000),
      open: basePrice,
      high: basePrice + Math.random() * 1000,
      low: basePrice - Math.random() * 1000,
      close,
      value: close,
      volume: Math.floor(Math.random() * 50000),
    };
  }),
  yieldCurve: [
    { time: 1, value: 5.378 },
    { time: 2, value: 5.372 },
    { time: 3, value: 5.271 },
    { time: 6, value: 5.094 },
    { time: 12, value: 4.739 },
    { time: 24, value: 4.237 },
    { time: 36, value: 4.036 },
    { time: 60, value: 3.887 },
    { time: 84, value: 3.921 },
    { time: 120, value: 4.007 },
    { time: 240, value: 4.366 },
    { time: 360, value: 4.290 },
  ],
  options: Array.from({ length: 100 }, (_, i) => ({
    time: i * 0.25,
    value: Math.sin(i / 100) + i / 500,
  })),
};

const calculateSMA = (data, options = { length: 20, source: 'close' }) => {
  return data.map((d, i) => {
    if (i < options.length - 1) return { time: d.time, value: NaN };
    const slice = data.slice(i - options.length + 1, i + 1);
    const value = slice.reduce((sum, bar) => sum + getSourceValue(bar, options.source), 0) / options.length;
    return { time: d.time, value };
  }).filter(d => !isNaN(d.value));
};

const calculateEMA = (data, period = 20) => {
  if (data.length === 0) return [];
  
  const multiplier = 2 / (period + 1);
  const emaData = [];

  // Start with SMA for the first value
  let ema = data.slice(0, period).reduce((sum, bar) => sum + (bar.close || bar.value || 0), 0) / period;
  emaData.push({ time: data[period - 1].time, value: ema });

  for (let i = period; i < data.length; i++) {
    ema = ((data[i].close || data[i].value || 0) - ema) * multiplier + ema;
    emaData.push({ time: data[i].time, value: ema });
  }

  return emaData;
};

// Helper to get source value from bar
const getSourceValue = (bar, source) => {
  switch (source) {
    case 'open': return bar.open || 0;
    case 'high': return bar.high || 0;
    case 'low': return bar.low || 0;
    case 'close': return bar.close || 0;
    case 'hl2': return ((bar.high || 0) + (bar.low || 0)) / 2;
    case 'hlc3': return ((bar.high || 0) + (bar.low || 0) + (bar.close || bar.value || 0)) / 3;
    case 'ohlc4': return ((bar.open || 0) + (bar.high || 0) + (bar.low || 0) + (bar.close || bar.value || 0)) / 4;
    default: return bar.close || bar.value || 0;
  }
};

// Average Price
const calculateAveragePriceValues = (data, options = { source1: 'close', source2: 'open' }) => {
  return data.map(bar => ({
    time: bar.time,
    value: (getSourceValue(bar, options.source1) + getSourceValue(bar, options.source2)) / 2,
  }));
};

// Correlation
const calculateCorrelationValues = (data, options = { length: 20, source: 'close' }) => {
  const sourceValues = data.map(bar => getSourceValue(bar, options.source));
  return data.map((bar, i) => {
    if (i < options.length - 1) return { time: bar.time, value: NaN };
    const slice1 = sourceValues.slice(i - options.length + 1, i + 1);
    const slice2 = sourceValues.slice(i - options.length, i);
    const mean1 = slice1.reduce((a, b) => a + b, 0) / options.length;
    const mean2 = slice2.reduce((a, b) => a + b, 0) / options.length;
    const num = slice1.reduce((sum, v, j) => sum + (v - mean1) * (slice2[j] - mean2), 0);
    const den1 = Math.sqrt(slice1.reduce((sum, v) => sum + Math.pow(v - mean1, 2), 0));
    const den2 = Math.sqrt(slice2.reduce((sum, v) => sum + Math.pow(v - mean2, 2), 0));
    return { time: bar.time, value: den1 * den2 ? num / (den1 * den2) : 0 };
  }).filter(d => !isNaN(d.value));
};

// Median Price
const calculateMedianPriceValues = (data) => {
  return data.map(bar => ({
    time: bar.time,
    value: ((bar.high || 0) + (bar.low || 0) + (bar.close || bar.value || 0)) / 3,
  }));
};

// Momentum
const calculateMomentumValues = (data, options = { length: 10, source: 'close' }) => {
  return data.map((bar, i) => {
    if (i < options.length - 1) return { time: bar.time, value: NaN };
    const prev = getSourceValue(data[i - options.length + 1], options.source);
    const curr = getSourceValue(bar, options.source);
    return { time: bar.time, value: curr - prev };
  }).filter(d => !isNaN(d.value));
};

// Percent Change
const calculatePercentChangeValues = (data, options = { length: 1, source: 'close' }) => {
  return data.map((bar, i) => {
    if (i < options.length) return { time: bar.time, value: NaN };
    const prev = getSourceValue(data[i - options.length], options.source);
    const curr = getSourceValue(bar, options.source);
    return { time: bar.time, value: prev ? ((curr - prev) / prev) * 100 : 0 };
  }).filter(d => !isNaN(d.value));
};

// Product
const calculateProductValues = (data, options = { length: 20, source: 'close' }) => {
  return data.map((bar, i) => {
    if (i < options.length - 1) return { time: bar.time, value: NaN };
    const slice = data.slice(i - options.length + 1, i + 1);
    const value = slice.reduce((prod, b) => prod * (getSourceValue(b, options.source) || 1), 1);
    return { time: bar.time, value };
  }).filter(d => !isNaN(d.value));
};

// Ratio
const calculateRatioValues = (data, options = { source1: 'close', source2: 'open' }) => {
  return data.map(bar => ({
    time: bar.time,
    value: (getSourceValue(bar, options.source2) || 0) ? getSourceValue(bar, options.source1) / getSourceValue(bar, options.source2) : 0,
  })).filter(d => isFinite(d.value));
};

// Spread
const calculateSpreadValues = (data, options = { source1: 'high', source2: 'low' }) => {
  return data.map(bar => ({
    time: bar.time,
    value: getSourceValue(bar, options.source1) - getSourceValue(bar, options.source2),
  }));
};

// Sum
const calculateSumValues = (data, options = { length: 20, source: 'close' }) => {
  return data.map((d, i) => {
    if (i < options.length - 1) return { time: d.time, value: NaN };
    const slice = data.slice(i - options.length + 1, i + 1);
    const value = slice.reduce((sum, bar) => sum + getSourceValue(bar, options.source), 0);
    return { time: d.time, value };
  }).filter(d => !isNaN(d.value));
};

// Weighted Close
const calculateWeightedCloseValues = (data) => {
  return data.map(bar => ({
    time: bar.time,
    value: ((bar.high || 0) + (bar.low || 0) + 2 * (bar.close || bar.value || 0)) / 4,
  }));
};

const TradingView = () => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const smaSeriesRef = useRef(null);
  const emaSeriesRef = useRef(null);
  const histogramSeriesRef = useRef(null);
  const indicatorsRefs = useRef({});

  const [symbol, setSymbol] = useState('AAPL');
  const [interval, setInterval] = useState('1D');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [legendValue, setLegendValue] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [maPeriod, setMAPeriod] = useState(20);
  const [showVolume, setShowVolume] = useState(true);
  const [showSMA, setShowSMA] = useState(true);
  const [showEMA, setShowEMA] = useState(false);
  const [chartType, setChartType] = useState('candlestick');
  const [currentPrice, setCurrentPrice] = useState(null);
  const [priceChange, setPriceChange] = useState(null);
  const [priceChangePercent, setPriceChangePercent] = useState(null);
  const priceLineRefs = useRef([]);
  const [showPriceLines, setShowPriceLines] = useState(false);
  const [indicators, setIndicators] = useState({});
  const liveIntervalRef = useRef(null);

  // Cleanup function
  const cleanupChart = useCallback(() => {
    if (liveIntervalRef.current) {
      clearInterval(liveIntervalRef.current);
      liveIntervalRef.current = null;
    }

    // Clean up indicator series
    Object.values(indicatorsRefs.current).forEach(series => {
      if (series && chartRef.current) {
        try {
          chartRef.current.removeSeries(series);
        } catch (err) {
          console.warn('Error removing series:', err);
        }
      }
    });
    indicatorsRefs.current = {};

    // Clean up main series
    if (smaSeriesRef.current && chartRef.current) {
      try {
        chartRef.current.removeSeries(smaSeriesRef.current);
      } catch (err) {
        console.warn('Error removing SMA series:', err);
      }
      smaSeriesRef.current = null;
    }

    if (emaSeriesRef.current && chartRef.current) {
      try {
        chartRef.current.removeSeries(emaSeriesRef.current);
      } catch (err) {
        console.warn('Error removing EMA series:', err);
      }
      emaSeriesRef.current = null;
    }

    if (histogramSeriesRef.current && chartRef.current) {
      try {
        chartRef.current.removeSeries(histogramSeriesRef.current);
      } catch (err) {
        console.warn('Error removing histogram series:', err);
      }
      histogramSeriesRef.current = null;
    }

    if (candlestickSeriesRef.current && chartRef.current) {
      try {
        chartRef.current.removeSeries(candlestickSeriesRef.current);
      } catch (err) {
        console.warn('Error removing main series:', err);
      }
      candlestickSeriesRef.current = null;
    }

    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch (err) {
        console.warn('Error removing chart:', err);
      }
      chartRef.current = null;
    }
  }, []);

  // Indicator helpers
  const applyIndicator = (
    sourceSeries, 
    options, 
    calculateFunc, 
    seriesOptions = {}
  ) => {
    if (!chartRef.current) return null;

    const indicatorSeries = chartRef.current.addSeries(LineSeries, {
      ...seriesOptions,
      priceScaleId: 'right',
      lastValueVisible: false,
      priceLineVisible: false,
    });

    const updateIndicator = () => {
      const data = sourceSeries.data();
      const indData = calculateFunc(data, options);
      indicatorSeries.setData(indData);
    };

    updateIndicator();
    
    return indicatorSeries;
  };

  const applyAveragePriceIndicator = (sourceSeries, options = { source1: 'close', source2: 'open' }) =>
    applyIndicator(sourceSeries, options, calculateAveragePriceValues, { color: '#ff9800', title: 'Avg Price' });

  const applyCorrelationIndicator = (sourceSeries, options = { length: 20, source: 'close' }) =>
    applyIndicator(sourceSeries, options, calculateCorrelationValues, { color: '#9c27b0', title: 'Correlation' });

  const applyMedianPriceIndicator = (sourceSeries) =>
    applyIndicator(sourceSeries, {}, calculateMedianPriceValues, { color: '#4caf50', title: 'Median Price' });

  const applyMomentumIndicator = (sourceSeries, options = { length: 10, source: 'close' }) =>
    applyIndicator(sourceSeries, options, calculateMomentumValues, { color: '#f44336', title: 'Momentum' });

  const applySMAMovingAverageIndicator = (sourceSeries, options = { length: 20, source: 'close' }) =>
    applyIndicator(sourceSeries, options, calculateSMA, { color: '#f48fb1', title: `SMA ${options.length}` });

  const applyPercentChangeIndicator = (sourceSeries, options = { length: 1, source: 'close' }) =>
    applyIndicator(sourceSeries, options, calculatePercentChangeValues, { color: '#ffeb3b', title: 'Percent Change' });

  const applyProductIndicator = (sourceSeries, options = { length: 20, source: 'close' }) =>
    applyIndicator(sourceSeries, options, calculateProductValues, { color: '#607d8b', title: 'Product' });

  const applyRatioIndicator = (sourceSeries, options = { source1: 'close', source2: 'open' }) =>
    applyIndicator(sourceSeries, options, calculateRatioValues, { color: '#00bcd4', title: 'Ratio' });

  const applySpreadIndicator = (sourceSeries, options = { source1: 'high', source2: 'low' }) =>
    applyIndicator(sourceSeries, options, calculateSpreadValues, { color: '#795548', title: 'Spread' });

  const applySumIndicator = (sourceSeries, options = { length: 20, source: 'close' }) =>
    applyIndicator(sourceSeries, options, calculateSumValues, { color: '#3f51b5', title: 'Sum' });

  const applyWeightedCloseIndicator = (sourceSeries) =>
    applyIndicator(sourceSeries, {}, calculateWeightedCloseValues, { color: '#e91e63', title: 'Weighted Close' });

  const fetchChartData = async () => {
    try {
      setLoading(true);
      setError(null);
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      let data = [];
      if (symbol === 'yieldCurve') {
        data = mockData.yieldCurve;
      } else if (symbol === 'options') {
        data = mockData.options;
      } else {
        data = mockData[symbol] || [];
      }
      
      if (data.length === 0) throw new Error(`No data available for ${symbol}`);

      if (data.length > 1) {
        const lastPrice = data[data.length - 1].close || data[data.length - 1].value || 0;
        const previousPrice = data[data.length - 2].close || data[data.length - 2].value || 0;
        const change = lastPrice - previousPrice;
        const changePercent = previousPrice ? (change / previousPrice) * 100 : 0;

        setCurrentPrice(lastPrice);
        setPriceChange(change);
        setPriceChangePercent(changePercent);
      }

      return data;
    } catch (err) {
      setError(err.message || 'Failed to load chart data');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const initializeChart = useCallback(async () => {
    if (!chartContainerRef.current) {
      setError('Chart container not found');
      return;
    }

    try {
      // Clean up existing chart
      cleanupChart();

      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 500,
        layout: {
          background: { type: ColorType.Solid, color: theme === 'light' ? '#ffffff' : '#0f1419' },
          textColor: theme === 'light' ? '#333333' : '#d1d4dc',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        },
        grid: {
          vertLines: {
            color: theme === 'light' ? '#e1e4ea' : '#1e222d',
            style: LineStyle.Solid,
          },
          horzLines: {
            color: theme === 'light' ? '#e1e4ea' : '#1e222d',
            style: LineStyle.Solid,
          },
        },
        rightPriceScale: {
          borderColor: theme === 'light' ? '#e1e4ea' : '#1e222d',
          scaleMargins: {
            top: 0.1,
            bottom: showVolume && chartType !== 'yieldCurve' && chartType !== 'options' ? 0.25 : 0.1,
          },
          autoScale: true,
        },
        timeScale: {
          rightOffset: 5,
          barSpacing: 12,
          borderColor: theme === 'light' ? '#e1e4ea' : '#1e222d',
          timeVisible: chartType === 'candlestick' || chartType === 'line' || chartType === 'area' || chartType === 'custom',
          secondsVisible: false,
          tickMarkFormatter: (time) => {
            if (chartType === 'yieldCurve') return `${time}M`;
            const date = new Date(time * 1000);
            return date.toLocaleDateString();
          },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: {
            labelVisible: true,
            style: LineStyle.Dashed,
            width: 1,
            color: theme === 'light' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)',
          },
          horzLine: {
            labelVisible: true,
            style: LineStyle.Dashed,
            width: 1,
            color: theme === 'light' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)',
          },
        },
        handleScale: {
          axisPressedMouseMove: {
            time: true,
            price: true,
          },
          mouseWheel: true,
          pinch: true,
        },
        handleScroll: {
          mouseMove: true,
          pressedMouseMove: true,
          horzTouchDrag: true,
          vertTouchDrag: true,
          mouseWheel: true,
          pressedMouseWheel: true,
        },
      });

      chartRef.current = chart;

      // Create main series based on chart type
      if (chartType === 'candlestick') {
        const candlestickSeries = chart.addSeries(CandlestickSeries, {
          upColor: '#26a69a',
          downColor: '#ef5350',
          borderUpColor: '#26a69a',
          borderDownColor: '#ef5350',
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350',
          lastValueVisible: false,
          priceLineVisible: false,
        });
        candlestickSeriesRef.current = candlestickSeries;
      } else if (chartType === 'area') {
        const areaSeries = chart.addSeries(AreaSeries, {
          lineColor: '#2962ff',
          topColor: 'rgba(41, 98, 255, 0.3)',
          bottomColor: 'rgba(41, 98, 255, 0.0)',
          lineWidth: 2,
          lastValueVisible: false,
          priceLineVisible: false,
        });
        candlestickSeriesRef.current = areaSeries;
      } else {
        const lineSeries = chart.addSeries(LineSeries, {
          color: '#2962ff',
          lineWidth: 2,
          lastValueVisible: false,
          priceLineVisible: false,
        });
        candlestickSeriesRef.current = lineSeries;
      }

      // Create volume histogram if needed
      if (showVolume && chartType !== 'yieldCurve' && chartType !== 'options') {
        const histogramSeries = chart.addSeries(HistogramSeries, {
          priceFormat: { type: 'volume' },
          priceScaleId: 'volume',
        });
        chart.priceScale('volume').applyOptions({
          scaleMargins: { top: 0.85, bottom: 0 },
        });
        histogramSeriesRef.current = histogramSeries;
      }

      // Load and set data
      const data = await fetchChartData();
      if (data.length > 0 && candlestickSeriesRef.current) {
        const mainData = chartType === 'candlestick' ? data : data.map(d => ({ time: d.time, value: d.close || d.value || 0 }));
        candlestickSeriesRef.current.setData(mainData);

        // Apply SMA if enabled
        if (showSMA && ['candlestick', 'line', 'area', 'custom'].includes(chartType)) {
          const smaData = calculateSMA(data, { length: maPeriod, source: 'close' });
          smaSeriesRef.current = chart.addSeries(LineSeries, {
            color: '#f48fb1',
            lineWidth: 2,
            title: `SMA ${maPeriod}`,
            priceScaleId: 'right',
            lastValueVisible: false,
            priceLineVisible: false,
          });
          smaSeriesRef.current.setData(smaData);
        }

        // Apply EMA if enabled
        if (showEMA && ['candlestick', 'line', 'area', 'custom'].includes(chartType)) {
          const emaData = calculateEMA(data, maPeriod);
          emaSeriesRef.current = chart.addSeries(LineSeries, {
            color: '#81c784',
            lineWidth: 2,
            title: `EMA ${maPeriod}`,
            priceScaleId: 'right',
            lastValueVisible: false,
            priceLineVisible: false,
          });
          emaSeriesRef.current.setData(emaData);
        }

        // Apply custom indicators
        Object.entries(indicators).forEach(([key, { enabled, opts }]) => {
          if (enabled && ['candlestick', 'line', 'area', 'custom'].includes(chartType) && candlestickSeriesRef.current) {
            const applyFunc = {
              averagePrice: applyAveragePriceIndicator,
              correlation: applyCorrelationIndicator,
              medianPrice: applyMedianPriceIndicator,
              momentum: applyMomentumIndicator,
              percentChange: applyPercentChangeIndicator,
              product: applyProductIndicator,
              ratio: applyRatioIndicator,
              spread: applySpreadIndicator,
              sum: applySumIndicator,
              weightedClose: applyWeightedCloseIndicator,
            }[key];
            if (applyFunc) {
              const indSeries = applyFunc(candlestickSeriesRef.current, opts);
              if (indSeries) {
                indicatorsRefs.current[key] = indSeries;
              }
            }
          }
        });

        // Set volume data
        if (showVolume && histogramSeriesRef.current && chartType !== 'yieldCurve' && chartType !== 'options') {
          histogramSeriesRef.current.setData(data.map(d => ({
            time: d.time,
            value: d.volume || 0,
            color: (d.close || 0) > (d.open || 0) ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
          })));
        }

        // Fit content after all data is set
        chart.timeScale().fitContent();
      }

      // Subscribe to crosshair movements
      chart.subscribeCrosshairMove((param) => {
        if (param && param.seriesPrices && candlestickSeriesRef.current) {
          const seriesData = param.seriesPrices.get(candlestickSeriesRef.current);
          if (seriesData) {
            if (chartType === 'candlestick') {
              const candleData = seriesData;
              setLegendValue({
                open: candleData.open,
                high: candleData.high,
                low: candleData.low,
                close: candleData.close,
              });
            } else {
              setLegendValue({ value: seriesData });
            }
          } else {
            setLegendValue(null);
          }
        }
      });

      // Handle resize
      const handleResize = () => {
        if (chart && chartContainerRef.current) {
          chart.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
        }
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        cleanupChart();
      };

    } catch (err) {
      setError('Failed to initialize chart: ' + err.message);
      setLoading(false);
    }
  }, [symbol, interval, maPeriod, theme, showVolume, showSMA, showEMA, chartType, indicators, cleanupChart]);

  useEffect(() => {
    initializeChart();
  }, [initializeChart]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupChart();
    };
  }, [cleanupChart]);

  // Handle live updates
  useEffect(() => {
    if (!isLive) {
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current);
        liveIntervalRef.current = null;
      }
      return;
    }

    if (!candlestickSeriesRef.current) return;

    const symbolData = symbol === 'yieldCurve' ? mockData.yieldCurve : 
                      symbol === 'options' ? mockData.options : 
                      mockData[symbol];
    
    if (!symbolData || symbolData.length === 0) return;

    let lastData = symbolData[symbolData.length - 1];
    
    liveIntervalRef.current = setInterval(() => {
      if (!candlestickSeriesRef.current) return;

      let newBar;
      if (chartType === 'yieldCurve') {
        const newTime = lastData.time + 1;
        const variance = Math.random() - 0.5;
        newBar = {
          time: newTime,
          value: (lastData.value || 0) + variance * 0.1,
        };
        candlestickSeriesRef.current.update(newBar);
      } else if (chartType === 'options') {
        const newTime = lastData.time + 0.25;
        const variance = Math.random() - 0.5;
        newBar = {
          time: newTime,
          value: (lastData.value || 0) + variance * 0.01,
        };
        candlestickSeriesRef.current.update(newBar);
      } else if (chartType === 'candlestick') {
        const newTime = Math.floor(Date.now() / 1000);
        const variance = Math.random() - 0.5;
        newBar = {
          time: newTime,
          open: lastData.close || 0,
          high: (lastData.close || 0) + Math.abs(variance) * 5,
          low: (lastData.close || 0) - Math.abs(variance) * 5,
          close: (lastData.close || 0) + variance * 3,
          volume: Math.floor(Math.random() * 1000000),
          value: (lastData.close || 0) + variance * 3,
        };
        candlestickSeriesRef.current.update(newBar);
      } else {
        const newTime = Math.floor(Date.now() / 1000);
        const variance = Math.random() - 0.5;
        newBar = {
          time: newTime,
          value: (lastData.close || lastData.value || 0) + variance * 3,
        };
        candlestickSeriesRef.current.update(newBar);
      }

      // Update volume if shown
      if (showVolume && histogramSeriesRef.current && chartType !== 'yieldCurve' && chartType !== 'options') {
        histogramSeriesRef.current.update({
          time: newBar.time,
          value: newBar.volume || Math.floor(Math.random() * 1000000),
          color: (newBar.close || 0) > (newBar.open || 0) ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
        });
      }

      // Update price info
      const newPrice = newBar.close || newBar.value || 0;
      setCurrentPrice(newPrice);
      const change = newPrice - (lastData.close || lastData.value || 0);
      setPriceChange(change);
      setPriceChangePercent(((lastData.close || lastData.value || 0) ? (change / (lastData.close || lastData.value || 0)) * 100 : 0));

      lastData = newBar;
    }, 1000);

    return () => {
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current);
        liveIntervalRef.current = null;
      }
    };
  }, [isLive, symbol, showVolume, chartType]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      switch (e.key) {
        case ' ':
          e.preventDefault();
          resetView();
          break;
        case '+':
        case '=':
          e.preventDefault();
          zoomIn();
          break;
        case '-':
        case '_':
          e.preventDefault();
          zoomOut();
          break;
        case 'Escape':
          e.preventDefault();
          resetView();
          break;
        case 'l':
        case 'L':
          e.preventDefault();
          setIsLive(!isLive);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isLive]);

  const handleSymbolChange = (e) => {
    setSymbol(e.target.value);
    if (e.target.value !== 'yieldCurve' && e.target.value !== 'options') {
      setChartType('candlestick');
    }
  };

  const handleIntervalChange = (e) => setInterval(e.target.value);

  const refreshChart = async () => {
    await initializeChart();
  };

  const exportChart = () => {
    if (chartRef.current) {
      chartRef.current.takeScreenshot().then((canvas) => {
        const link = document.createElement('a');
        link.download = `${symbol}_chart_${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL();
        link.click();
      });
    }
  };

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');
  const zoomIn = () => chartRef.current?.timeScale().zoomIn();
  const zoomOut = () => chartRef.current?.timeScale().zoomOut();
  const resetView = () => chartRef.current?.timeScale().fitContent();

  if (error) {
    return (
      <>
        <Navbar theme={theme} toggleTheme={toggleTheme} />
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-950' : 'bg-gray-50'} flex items-center justify-center p-4`}>
          <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} p-8 rounded-2xl shadow-2xl max-w-md w-full border`}>
            <div className="text-center">
              <div className="mx-auto w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
                Unable to Load Chart
              </h3>
              <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-6`}>{error}</p>
              <button
                onClick={refreshChart}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-950' : 'bg-gray-50'} transition-all duration-300`}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border mb-6 overflow-hidden transition-all duration-300`}>
            <div className={`${theme === 'dark' ? 'bg-gradient-to-r from-gray-900 to-gray-800' : 'bg-gradient-to-r from-gray-50 to-white'} px-6 py-4 border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {symbol}
                      </h1>
                      {isLive && (
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/20 text-green-500 text-sm font-medium rounded-full animate-pulse">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          LIVE
                        </span>
                      )}
                    </div>
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm mt-1`}>
                      {symbol === 'BTCUSD' ? 'Bitcoin / USD' :
                        symbol === 'AAPL' ? 'Apple Inc.' :
                        symbol === 'GOOGL' ? 'Alphabet Inc.' :
                        symbol === 'TSLA' ? 'Tesla Inc.' :
                        symbol === 'yieldCurve' ? 'Yield Curve' :
                        'Options Chain'}
                    </p>
                  </div>
                  {currentPrice && (
                    <div className="flex items-baseline gap-4">
                      <span className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {chartType === 'yieldCurve' ? `${currentPrice.toFixed(3)}%` : `$${currentPrice.toFixed(2)}`}
                      </span>
                      <div className="flex flex-col items-end">
                        <span className={`text-lg font-medium ${priceChange && priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {priceChange && priceChange >= 0 ? '+' : ''}{priceChange?.toFixed(2)}
                        </span>
                        <span className={`text-sm ${priceChange && priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          ({priceChange && priceChange >= 0 ? '+' : ''}{priceChangePercent?.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {['candlestick', 'area', 'line', 'yieldCurve', 'options', 'custom'].map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setChartType(type);
                        if (type === 'yieldCurve') setSymbol('yieldCurve');
                        else if (type === 'options') setSymbol('options');
                        else if (['candlestick', 'area', 'line', 'custom'].includes(type) && ['yieldCurve', 'options'].includes(symbol)) {
                          setSymbol('AAPL');
                        }
                      }}
                      className={`px-4 py-2 rounded-lg font-medium capitalize transition-all duration-200 ${chartType === type
                          ? theme === 'dark'
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-500 text-white'
                          : theme === 'dark'
                            ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                      {type === 'candlestick' ? 'Candles' :
                        type === 'yieldCurve' ? 'Yield Curve' :
                        type === 'options' ? 'Options' :
                        type === 'custom' ? 'Custom' :
                        type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className={`px-6 py-4 ${theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-50/50'}`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <select
                    value={symbol}
                    onChange={handleSymbolChange}
                    className={`px-4 py-2.5 rounded-xl border ${theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                      } focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-200`}
                  >
                    <option value="AAPL">AAPL - Apple Inc.</option>
                    <option value="GOOGL">GOOGL - Alphabet Inc.</option>
                    <option value="TSLA">TSLA - Tesla Inc.</option>
                    <option value="BTCUSD">BTC/USD - Bitcoin</option>
                    <option value="yieldCurve">Yield Curve</option>
                    <option value="options">Options Chain</option>
                  </select>
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800">
                    {['1m', '5m', '15m', '1H', '1D'].map((int) => (
                      <button
                        key={int}
                        onClick={() => setInterval(int)}
                        disabled={chartType === 'yieldCurve' || chartType === 'options'}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${interval === int
                            ? theme === 'dark'
                              ? 'bg-gray-700 text-white'
                              : 'bg-white text-gray-900 shadow-sm'
                            : theme === 'dark'
                              ? 'text-gray-400 hover:text-white'
                              : 'text-gray-600 hover:text-gray-900'
                          } ${chartType === 'yieldCurve' || chartType === 'options' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {int}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showVolume}
                        onChange={(e) => setShowVolume(e.target.checked)}
                        disabled={chartType === 'yieldCurve' || chartType === 'options'}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                      />
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} ${chartType === 'yieldCurve' || chartType === 'options' ? 'opacity-50' : ''}`}>
                        Volume
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showSMA}
                        onChange={(e) => setShowSMA(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        SMA
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showEMA}
                        onChange={(e) => setShowEMA(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        EMA
                      </span>
                    </label>
                    {[
                      { key: 'averagePrice', label: 'Avg Price', opts: { source1: 'close', source2: 'open' } },
                      { key: 'correlation', label: 'Correlation', opts: { length: 20, source: 'close' } },
                      { key: 'medianPrice', label: 'Median', opts: {} },
                      { key: 'momentum', label: 'Momentum', opts: { length: 10, source: 'close' } },
                      { key: 'percentChange', label: '% Change', opts: { length: 1, source: 'close' } },
                      { key: 'product', label: 'Product', opts: { length: 20, source: 'close' } },
                      { key: 'ratio', label: 'Ratio', opts: { source1: 'close', source2: 'open' } },
                      { key: 'spread', label: 'Spread', opts: { source1: 'high', source2: 'low' } },
                      { key: 'sum', label: 'Sum', opts: { length: 20, source: 'close' } },
                      { key: 'weightedClose', label: 'W. Close', opts: {} },
                    ].map(({ key, label, opts }) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={indicators[key]?.enabled || false}
                          onChange={(e) => setIndicators(prev => ({ ...prev, [key]: { enabled: e.target.checked, opts } }))}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          {label}
                        </span>
                      </label>
                    ))}
                    {(showSMA || showEMA) && (
                      <select
                        value={maPeriod}
                        onChange={(e) => setMAPeriod(parseInt(e.target.value))}
                        className={`ml-2 px-3 py-1.5 rounded-lg border text-sm ${theme === 'dark'
                            ? 'bg-gray-800 border-gray-700 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                          } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                      >
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                        <option value="200">200</option>
                      </select>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={refreshChart}
                    className={`p-2.5 rounded-xl ${theme === 'dark'
                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                      } transition-all duration-200`}
                    title="Refresh Chart"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setIsLive(!isLive)}
                    className={`px-4 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${isLive
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : theme === 'dark'
                          ? 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                      }`}
                    title={isLive ? 'Stop Live Feed' : 'Start Live Feed'}
                  >
                    {isLive ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                        </svg>
                        Stop
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Live
                      </>
                    )}
                  </button>
                  <button
                    onClick={exportChart}
                    className={`p-2.5 rounded-xl ${theme === 'dark'
                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                      } transition-all duration-200`}
                    title="Export Chart"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border relative overflow-hidden transition-all duration-300`}>
            <div className={`px-6 py-4 border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'} flex items-center justify-between`}>
              {legendValue && (
                <div className="flex items-center gap-6">
                  {chartType === 'candlestick' ? (
                    <>
                      <div>
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>Open</span>
                        <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {legendValue.open?.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>High</span>
                        <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {legendValue.high?.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>Low</span>
                        <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {legendValue.low?.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>Close</span>
                        <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {legendValue.close?.toFixed(2)}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div>
                      <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                        {chartType === 'yieldCurve' ? 'Yield' : chartType === 'options' ? 'Price' : 'Value'}
                      </span>
                      <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {chartType === 'yieldCurve' ? `${legendValue.value?.toFixed(3)}%` : legendValue.value?.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={zoomIn}
                  className={`p-2 rounded-lg ${theme === 'dark'
                      ? 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                    } transition-all duration-200`}
                  title="Zoom In"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
                <button
                  onClick={zoomOut}
                  className={`p-2 rounded-lg ${theme === 'dark'
                      ? 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                    } transition-all duration-200`}
                  title="Zoom Out"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                  </svg>
                </button>
                <button
                  onClick={resetView}
                  className={`p-2 rounded-lg ${theme === 'dark'
                      ? 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                    } transition-all duration-200`}
                  title="Reset View"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                  <p className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Loading chart data...
                  </p>
                </div>
              </div>
            )}
            <div ref={chartContainerRef} className="w-full h-[500px] relative" />
          </div>
          <div className={`mt-6 p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border`}>
            <h3 className={`text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Keyboard Shortcuts
            </h3>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <kbd className={`px-2 py-1 rounded text-xs font-mono ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>Space</kbd>
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Reset View</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className={`px-2 py-1 rounded text-xs font-mono ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>+</kbd>
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Zoom In</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className={`px-2 py-1 rounded text-xs font-mono ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>-</kbd>
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Zoom Out</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className={`px-2 py-1 rounded text-xs font-mono ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>L</kbd>
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Toggle Live</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className={`px-2 py-1 rounded text-xs font-mono ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>Esc</kbd>
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Reset View</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TradingView;