import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronUp, ChevronDown, Search, Filter, Info, Grid, List, Calendar,
  X, Target, PieChart, Star, Sun, Moon, TrendingUp, TrendingDown,
  Activity, Eye, Zap, Bell, GitCompareArrows, TestTube, ChevronsRight,
  Mic, Download, BarChart2, Globe, Award, Shield, Clock, Layers,
  Bookmark, AlertTriangle, ArrowRight, Plus, Minus, Volume2
} from 'lucide-react';
import Navbar from '../components/Navbar';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:4000';

// --- MOCK DATA & HELPERS ---
const mockEvents = {
  'RELIANCE': { date: '2025-08-15', event: 'Quarterly Earnings' },
  'TCS': { date: '2025-08-22', event: 'AGM' },
  'HDFCBANK': { date: '2025-09-01', event: 'Dividend' }
};
// New color palette
const colors = {
  primary: '#4F46E5',       // Indigo
  secondary: '#10B981',     // Emerald
  accent: '#F59E0B',        // Amber
  dark: '#1E293B',          // Dark slate
  light: '#F8FAFC',         // Lightest slate
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6'
};
const mockSentiments = ['Bullish', 'Neutral', 'Bearish'];
const getMockData = (symbol) => ({
  event: mockEvents[symbol] || {
    date: `2025-09-${Math.floor(Math.random() * 28) + 1}`,
    event: ['Analyst Call', 'Product Launch', 'Conference'][Math.floor(Math.random() * 3)]
  },
  sentiment: mockSentiments[Math.floor(Math.random() * 3)],
  fiiFlow: Math.random() * 10 - 5,
  news: [
    { title: `${symbol} announces new expansion plans`, source: 'Economic Times', sentiment: 'positive' },
    { title: `Analysts raise target price for ${symbol}`, source: 'Moneycontrol', sentiment: 'positive' }
  ].slice(0, Math.floor(Math.random() * 2) + 1)
});

// --- REUSABLE COMPONENTS ---
const StockRowSkeleton = () => (
  <tr className="border-b border-gray-100/60 dark:border-gray-800/60">
    {[...Array(8)].map((_, i) => (
      <td key={i} className="px-6 py-4">
        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full animate-pulse"></div>
      </td>
    ))}
  </tr>
);

const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
    primary: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400',
    success: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400',
    warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400',
    danger: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

const SortableHeader = ({ children, name, sortConfig, onSort, tooltip }) => {
  const isSorted = sortConfig.key === name;
  const direction = isSorted ? sortConfig.direction : 'desc';

  return (
    <th
      className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide cursor-pointer select-none group"
      onClick={() => onSort(name, direction === 'asc' ? 'desc' : 'asc')}
    >
      <div className="flex items-center justify-end space-x-2">
        {tooltip ? (
          <div className="relative flex items-center group/tooltip">
            <span className="mr-1">{children}</span>
            <Info size={12} className="text-gray-400 group-hover/tooltip:text-blue-500" />
            <div className="absolute bottom-full mb-2 right-0 w-48 bg-gray-900/95 backdrop-blur-sm text-white text-xs rounded-xl py-2 px-3 opacity-0 group-hover/tooltip:opacity-100 transform translate-y-1 group-hover/tooltip:translate-y-0 z-50 shadow-2xl border-gray-700/50">
              {tooltip}
            </div>
          </div>
        ) : <span>{children}</span>}
        <motion.div animate={{ rotate: isSorted && direction === 'asc' ? 180 : 0 }} className="w-4 h-4 flex items-center justify-center">
          {isSorted ? <ChevronDown size={14} className="text-blue-500" /> : <ChevronDown size={14} className="text-gray-300 group-hover:text-gray-400" />}
        </motion.div>
      </div>
    </th>
  );
};

const Card = ({ children, className = '', ...props }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-white dark:bg-gray-850 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm ${className}`}
    {...props}
  >
    {children}
  </motion.div>
);

// --- FEATURE COMPONENTS ---
const SmartWatchlist = ({ stocks, title, onPin, onAddToCompare, icon: Icon }) => {
  if (!stocks || stocks.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
      <div className="flex items-center space-x-3 mb-4">
        {Icon && <Icon size={20} className="text-blue-500" />}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">{title}</h3>
      </div>
      <div className="flex overflow-x-auto space-x-4 pb-4 -mx-6 px-6 scrollbar-hide">
        {stocks.map((stock, i) => (
          <motion.div
            key={stock.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex-shrink-0 w-64 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl p-5 group hover:scale-[1.02]"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{stock.symbol}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">{stock.name}</p>
              </div>
              <div className="flex flex-col space-y-2">
                <motion.button
                  onClick={() => onPin(stock)}
                  className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                >
                  <Star size={14} className="text-gray-400 group-hover:text-blue-500" />
                </motion.button>
                <motion.button
                  onClick={() => onAddToCompare(stock)}
                  className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                >
                  <GitCompareArrows size={14} className="text-gray-400 group-hover:text-blue-500" />
                </motion.button>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-gray-900 dark:text-white">₹{stock.price?.toFixed(2) ?? 'N/A'}</p>
              <div className="flex items-center justify-end space-x-1 mt-1">
                {stock.change > 0 ? <TrendingUp size={14} className="text-emerald-500" /> : <TrendingDown size={14} className="text-red-500" />}
                <p className={`text-sm font-medium ${stock.change > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {stock.change?.toFixed(2)} ({stock.change && stock.price ? (stock.change / (stock.price - stock.change) * 100).toFixed(2) : '0.00'}%)
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

const PortfolioSimulator = ({ portfolio, setPortfolio }) => {
  const [investment, setInvestment] = useState(10000);
  const [years, setYears] = useState(1);
  const [simulation, setSimulation] = useState(null);
  const [riskProfile, setRiskProfile] = useState('moderate');

  const handleDrop = (e) => {
    e.preventDefault();
    const stockData = JSON.parse(e.dataTransfer.getData("stock"));
    if (!portfolio.find(s => s.id === stockData.id)) {
      setPortfolio(prev => [...prev, { ...stockData, allocation: 1 }]);
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  const runSimulation = () => {
    // Enhanced simulation with risk profile consideration
    let growthRate;
    switch (riskProfile) {
      case 'conservative':
        growthRate = Math.random() * 0.1 + 0.03; // 3-13%
        break;
      case 'moderate':
        growthRate = Math.random() * 0.15 + 0.05; // 5-20%
        break;
      case 'aggressive':
        growthRate = Math.random() * 0.25 + 0.08; // 8-33%
        break;
      default:
        growthRate = Math.random() * 0.15 + 0.05;
    }

    const finalValue = investment * Math.pow(1 + growthRate, years);
    const cagr = (Math.pow(finalValue / investment, 1 / years) - 1) * 100;
    setSimulation({
      initial: investment,
      final: finalValue,
      cagr: cagr.toFixed(2),
      bestStock: portfolio[Math.floor(Math.random() * portfolio.length)]?.symbol || 'N/A',
      worstStock: portfolio[Math.floor(Math.random() * portfolio.length)]?.symbol || 'N/A'
    });
  };

  const totalAllocation = portfolio.reduce((sum, s) => sum + s.allocation, 0) || 1;

  return (
    <Card className="p-6 mb-8">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
        <PieChart size={20} className="text-blue-500" />
        <span>Portfolio Simulator</span>
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-6 text-center min-h-[150px]"
          >
            <p className="text-gray-500 dark:text-gray-400">Drag stocks here to build your portfolio</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {portfolio.map(s => (
                <div key={s.id} className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-sm font-medium px-3 py-1 rounded-full flex items-center">
                  {s.symbol}
                  <button
                    onClick={() => setPortfolio(p => p.filter(i => i.id !== s.id))}
                    className="ml-2 text-blue-500 hover:text-blue-700"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-100 dark:bg-gray-800/50 p-4 rounded-2xl">
            <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">"What If?" Scenario</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Investment (₹)</label>
                  <input
                    type="number"
                    value={investment}
                    onChange={e => setInvestment(Number(e.target.value))}
                    className="w-full p-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Time (Years)</label>
                  <input
                    type="number"
                    value={years}
                    onChange={e => setYears(Number(e.target.value))}
                    className="w-full p-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Risk Profile</label>
                  <select
                    value={riskProfile}
                    onChange={e => setRiskProfile(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-lg"
                  >
                    <option value="conservative">Conservative</option>
                    <option value="moderate">Moderate</option>
                    <option value="aggressive">Aggressive</option>
                  </select>
                </div>
              </div>

              <motion.button
                onClick={runSimulation}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center space-x-2 w-full"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <TestTube size={16} />
                <span>Run Simulation</span>
              </motion.button>

              {simulation && (
                <div className="mt-4 p-4 bg-white dark:bg-gray-700 rounded-xl">
                  <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-300">₹{simulation.initial.toLocaleString()} would become</p>
                    <p className="text-2xl font-bold text-emerald-500 my-2">₹{simulation.final.toLocaleString()}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">A CAGR of {simulation.cagr}%</p>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg">
                      <p className="text-emerald-600 dark:text-emerald-400">Best Performer</p>
                      <p className="font-medium">{simulation.bestStock}</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                      <p className="text-red-600 dark:text-red-400">Worst Performer</p>
                      <p className="font-medium">{simulation.worstStock}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Portfolio Allocation</h4>
          <div className="relative w-full aspect-square max-w-xs mx-auto">
            {portfolio.map((stock, i) => {
              const angleStart = portfolio.slice(0, i).reduce((sum, s) => sum + (s.allocation / totalAllocation) * 360, 0);
              const angleEnd = angleStart + (stock.allocation / totalAllocation) * 360;
              const midAngle = (angleStart + angleEnd) / 2;
              const labelX = 50 + Math.cos((midAngle - 90) * Math.PI / 180) * 35;
              const labelY = 50 + Math.sin((midAngle - 90) * Math.PI / 180) * 35;

              return (
                <React.Fragment key={i}>
                  <div
                    className="absolute w-full h-full"
                    style={{
                      clipPath: `polygon(50% 50%, ${50 + Math.cos((angleStart - 90) * Math.PI / 180) * 50}% ${50 + Math.sin((angleStart - 90) * Math.PI / 180) * 50}%, ${50 + Math.cos((angleEnd - 90) * Math.PI / 180) * 50}% ${50 + Math.sin((angleEnd - 90) * Math.PI / 180) * 50}%)`,
                      backgroundColor: `hsl(${i * 60}, 70%, 50%)`
                    }}
                  />
                  <div
                    className="absolute text-xs font-medium pointer-events-none"
                    style={{
                      left: `${labelX}%`,
                      top: `${labelY}%`,
                      transform: 'translate(-50%, -50%)',
                      color: `hsl(${i * 60}, 70%, 30%)`
                    }}
                  >
                    {stock.symbol}
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          <div className="mt-4 space-y-2">
            {portfolio.map((stock, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: `hsl(${i * 60}, 70%, 50%)` }}
                  />
                  <span className="text-sm">{stock.symbol}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPortfolio(p => p.map(s => s.id === stock.id ? { ...s, allocation: Math.max(1, s.allocation - 1) } : s))}
                    className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="text-sm font-medium w-6 text-center">{stock.allocation}</span>
                  <button
                    onClick={() => setPortfolio(p => p.map(s => s.id === stock.id ? { ...s, allocation: s.allocation + 1 } : s))}
                    className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

const CompetitorComparison = ({ stocks, onClose }) => {
  if (stocks.length === 0) return null;

  const metrics = [
    { key: 'price', label: 'Price (₹)', format: (v) => v?.toFixed(2) || 'N/A', better: 'higher' },
    { key: 'marketCap', label: 'Market Cap (Cr)', format: (v) => v?.toLocaleString('en-IN') || 'N/A', better: 'higher' },
    { key: 'peRatio', label: 'P/E Ratio', format: (v) => v?.toFixed(1) || 'N/A', better: 'lower' },
    { key: 'eagleViewScore', label: 'Eagle Score', format: (v) => v?.toFixed(0) || 'N/A', better: 'higher' },
    { key: 'dividendYield', label: 'Div Yield (%)', format: (v) => v?.toFixed(2) || 'N/A', better: 'higher' },
    { key: 'beta', label: 'Beta', format: (v) => v?.toFixed(2) || 'N/A', better: 'lower' },
    { key: 'fiiFlow', label: 'FII Flow', format: (v) => v?.toFixed(2) || 'N/A', better: 'higher' }
  ];

  const bestValues = metrics.reduce((acc, metric) => {
    const values = stocks.map(s => s[metric.key]).filter(v => typeof v === 'number');
    if (values.length > 0) {
      acc[metric.key] = metric.better === 'higher' ? Math.max(...values) : Math.min(...values);
    }
    return acc;
  }, {});

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50"
      >
        <Card className="m-4 p-0">
          <div className="p-4 flex justify-between items-center border-b border-gray-200/50 dark:border-gray-700/50">
            <h3 className="font-semibold flex items-center space-x-2">
              <GitCompareArrows size={18} />
              <span>Competitor Comparison</span>
            </h3>
            <button onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50">
                  <th className="p-3 text-left font-semibold">Metric</th>
                  {stocks.map(s => (
                    <th key={s.id} className="p-3 font-semibold text-center">
                      <div className="flex flex-col items-center">
                        <span>{s.symbol}</span>
                        <span className="text-xs text-gray-500">{s.price?.toFixed(2) || 'N/A'}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                {metrics.map(metric => (
                  <tr key={metric.key}>
                    <td className="p-3 font-medium text-gray-600 dark:text-gray-400">{metric.label}</td>
                    {stocks.map(s => {
                      const isBest = s[metric.key] === bestValues[metric.key];
                      return (
                        <td
                          key={s.id}
                          className={`p-3 text-center font-semibold ${isBest ? 'text-emerald-500' : 'text-gray-800 dark:text-gray-200'}`}
                        >
                          {metric.format(s[metric.key])}
                          {isBest && <span className="ml-1">★</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Comparing {stocks.length} stocks
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium"
            >
              Done
            </button>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

const CustomAlerts = ({ alerts, setAlerts, stock, onClose }) => {
  const [priceTarget, setPriceTarget] = useState('');
  const [condition, setCondition] = useState('above');
  const [alertType, setAlertType] = useState('price');
  const [expiry, setExpiry] = useState('7');

  const addAlert = () => {
    if (!priceTarget) return;
    const newAlert = {
      id: Date.now(),
      stockSymbol: stock.symbol,
      condition: `Price ${condition} ₹${priceTarget}`,
      type: alertType,
      expiry: new Date(Date.now() + parseInt(expiry) * 24 * 60 * 60 * 1000),
      active: true
    };
    setAlerts(prev => [...prev, newAlert]);
    setPriceTarget('');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-semibold">Set Alert for {stock.symbol}</h4>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X size={20} />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Alert Type</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setAlertType('price')}
              className={`p-2 rounded-lg border ${alertType === 'price' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'}`}
            >
              Price
            </button>
            <button
              onClick={() => setAlertType('volume')}
              className={`p-2 rounded-lg border ${alertType === 'volume' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'}`}
            >
              Volume
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Condition</label>
          <div className="flex gap-2">
            <select
              value={condition}
              onChange={e => setCondition(e.target.value)}
              className="flex-1 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
            >
              <option value="above">Above</option>
              <option value="below">Below</option>
              <option value="crosses">Crosses</option>
            </select>
            <input
              type="number"
              placeholder={alertType === 'price' ? "Price Target" : "Volume Target"}
              value={priceTarget}
              onChange={e => setPriceTarget(e.target.value)}
              className="flex-1 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Expires In</label>
          <select
            value={expiry}
            onChange={e => setExpiry(e.target.value)}
            className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
          >
            <option value="1">1 Day</option>
            <option value="7">7 Days</option>
            <option value="30">30 Days</option>
            <option value="0">Never</option>
          </select>
        </div>

        <button
          onClick={addAlert}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2"
        >
          <Bell size={16} />
          <span>Create Alert</span>
        </button>

        {alerts.filter(a => a.stockSymbol === stock.symbol).length > 0 && (
          <div className="mt-4 border-t pt-4">
            <h5 className="font-medium mb-2">Active Alerts</h5>
            <div className="space-y-2">
              {alerts
                .filter(a => a.stockSymbol === stock.symbol)
                .map(alert => (
                  <div key={alert.id} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium">{alert.condition}</p>
                      <p className="text-xs text-gray-500">
                        {alert.expiry && alert.expiry !== 'Never' ? `Expires: ${new Date(alert.expiry).toLocaleDateString()}` : 'No expiry'}
                      </p>
                    </div>
                    <button
                      onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const HeatmapView = ({ stocks }) => {
  const [sectorFilter, setSectorFilter] = useState('all');
  const [heatmapType, setHeatmapType] = useState('priceChange');

  // Group stocks by sector for filtering
  const sectors = useMemo(() => {
    const uniqueSectors = [...new Set(stocks.map(s => s.sector))];
    return ['all', ...uniqueSectors].filter(Boolean);
  }, [stocks]);

  // Filter stocks based on selected sector
  const filteredStocks = useMemo(() => {
    if (sectorFilter === 'all') return stocks;
    return stocks.filter(s => s.sector === sectorFilter);
  }, [stocks, sectorFilter]);

  // Calculate heatmap values based on type
  const getHeatmapValue = (stock) => {
    switch (heatmapType) {
      case 'priceChange':
        return stock.price && stock.change ? (stock.change / (stock.price - stock.change)) * 100 : 0;
      case 'volume':
        return stock.volume ? Math.log10(stock.volume) * 10 : 0;
      case 'fiiFlow':
        return stock.mock?.fiiFlow || 0;
      default:
        return 0;
    }
  };

  // Get color for heatmap cell
  const getHeatmapColor = (value) => {
    if (heatmapType === 'fiiFlow') {
      // For FII flow: red to green (-5 to +5)
      const intensity = Math.min(Math.abs(value) / 5, 1);
      const opacity = 0.7 + intensity * 0.3;
      return value > 0
        ? `rgba(16, 185, 129, ${opacity})`
        : `rgba(239, 68, 68, ${opacity})`;
    } else {
      // For price change and volume: red to green
      const normalizedValue = Math.min(Math.abs(value) / 10, 1);
      const opacity = 0.7 + normalizedValue * 0.3;
      return value > 0
        ? `rgba(16, 185, 129, ${opacity})`
        : `rgba(239, 68, 68, ${opacity})`;
    }
  };

  // Get tooltip content
  const getTooltipContent = (stock, value) => {
    switch (heatmapType) {
      case 'priceChange':
        return `${stock.symbol}: ${value.toFixed(2)}%`;
      case 'volume':
        return `${stock.symbol}: ${stock.volume?.toLocaleString() || 'N/A'} volume`;
      case 'fiiFlow':
        return `${stock.symbol}: FII flow ${value.toFixed(2)}%`;
      default:
        return stock.symbol;
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
          <Grid size={20} className="text-blue-500" />
          <span>Market Heatmap</span>
        </h3>

        <div className="flex flex-wrap gap-4 mt-4 md:mt-0">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Sector:</label>
            <select
              value={sectorFilter}
              onChange={e => setSectorFilter(e.target.value)}
              className="bg-white/80 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 text-sm"
            >
              {sectors.map(sector => (
                <option key={sector} value={sector}>
                  {sector === 'all' ? 'All Sectors' : sector}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">View:</label>
            <select
              value={heatmapType}
              onChange={e => setHeatmapType(e.target.value)}
              className="bg-white/80 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 text-sm"
            >
              <option value="priceChange">Price Change</option>
              <option value="volume">Volume</option>
              <option value="fiiFlow">FII Flow</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
        {filteredStocks.map((stock, index) => {
          const value = getHeatmapValue(stock);
          const color = getHeatmapColor(value);
          const tooltipContent = getTooltipContent(stock, value);

          return (
            <motion.div
              key={stock.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02 }}
              whileHover={{ scale: 1.05, zIndex: 10 }}
              className="relative rounded-xl flex flex-col items-center justify-center p-2 h-20 cursor-pointer hover:shadow-lg transition-all duration-300"
              style={{ backgroundColor: color }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center">
                <span className="text-xs font-semibold text-white">{stock.symbol}</span>
                <span className="text-xs text-white opacity-90">
                  {heatmapType === 'priceChange' ? `${value.toFixed(1)}%` : ''}
                </span>
              </div>

              <div className="absolute bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none z-20">
                {tooltipContent}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-0 border-t-4 border-gray-900 border-l-transparent border-r-transparent"></div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-sm bg-red-500/70 mr-1"></div>
            <span className="text-xs">
              {heatmapType === 'fiiFlow' ? 'Selling' : 'Decreasing'}
            </span>
          </div>
          <div className="w-24 h-2 rounded-full bg-gradient-to-r from-red-500 via-gray-300 to-emerald-500"></div>
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-sm bg-emerald-500/70 mr-1"></div>
            <span className="text-xs">
              {heatmapType === 'fiiFlow' ? 'Buying' : 'Increasing'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const TimelineView = ({ stocksWithData }) => {
  const [timelineType, setTimelineType] = useState('all');

  // Filter events based on type
  const filteredEvents = useMemo(() => {
    const events = stocksWithData
      .filter(stock => stock.mock && stock.mock.event)
      .map(stock => ({
        ...stock,
        event: stock.mock.event,
        sentiment: stock.mock.sentiment,
        news: stock.mock.news || []
      }));

    if (timelineType === 'all') return events;
    return events.filter(e =>
      (timelineType === 'earnings' && e.event.event.toLowerCase().includes('earnings')) ||
      (timelineType === 'dividends' && e.event.event.toLowerCase().includes('dividend')) ||
      (timelineType === 'news' && e.news.length > 0)
    );
  }, [stocksWithData, timelineType]);

  // Group events by date
  const groupedEvents = useMemo(() => {
    return filteredEvents.reduce((groups, event) => {
      const date = event.event.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(event);
      return groups;
    }, {});
  }, [filteredEvents]);

  // Sort dates chronologically
  const sortedDates = useMemo(() => {
    return Object.keys(groupedEvents).sort((a, b) => new Date(a) - new Date(b));
  }, [groupedEvents]);

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
          <Calendar size={20} className="text-blue-500" />
          <span>Upcoming Events</span>
        </h3>

        <div className="flex space-x-2 mt-4 md:mt-0">
          <button
            onClick={() => setTimelineType('all')}
            className={`px-3 py-1 rounded-full text-sm ${timelineType === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}
          >
            All
          </button>
          <button
            onClick={() => setTimelineType('earnings')}
            className={`px-3 py-1 rounded-full text-sm ${timelineType === 'earnings' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}
          >
            Earnings
          </button>
          <button
            onClick={() => setTimelineType('dividends')}
            className={`px-3 py-1 rounded-full text-sm ${timelineType === 'dividends' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}
          >
            Dividends
          </button>
          <button
            onClick={() => setTimelineType('news')}
            className={`px-3 py-1 rounded-full text-sm ${timelineType === 'news' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}
          >
            News
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {sortedDates.length > 0 ? (
          sortedDates.map(date => (
            <div key={date} className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 ml-6"></div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h4>
              </div>

              <div className="space-y-4 ml-10">
                {groupedEvents[date].map((event, index) => (
                  <motion.div
                    key={`${event.id}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-4 p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-300"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                      {event.symbol.substring(0, 2)}
                    </div>

                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{event.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{event.symbol}</p>
                        </div>

                        <div className="flex items-center space-x-2">
                          {event.sentiment === 'Bullish' ? (
                            <TrendingUp size={16} className="text-emerald-500" />
                          ) : event.sentiment === 'Bearish' ? (
                            <TrendingDown size={16} className="text-red-500" />
                          ) : (
                            <Activity size={16} className="text-gray-500" />
                          )}
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700">
                            {event.event.event}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {event.event.event === 'Quarterly Earnings'
                            ? `Expected EPS: ₹${(Math.random() * 20 + 5).toFixed(2)}`
                            : event.event.event === 'Dividend'
                              ? `Expected Dividend: ₹${(Math.random() * 10 + 2).toFixed(2)} per share`
                              : event.event.event}
                        </p>
                      </div>

                      {event.news.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {event.news.map((newsItem, newsIndex) => (
                            <div key={newsIndex} className="text-sm p-2 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                              <p className="font-medium">{newsItem.title}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {newsItem.source} • {newsItem.sentiment === 'positive' ? 'Positive' : 'Neutral'}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No upcoming events match your filters
          </div>
        )}
      </div>
    </div>
  );
};

const InstitutionalActivity = ({ stocks }) => {
  // Filter stocks with significant institutional activity
  const activeStocks = useMemo(() => {
    return stocks
      .filter(stock => Math.abs(stock.mock?.fiiFlow || 0) > 2)
      .sort((a, b) => Math.abs(b.mock?.fiiFlow || 0) - Math.abs(a.mock?.fiiFlow || 0))
      .slice(0, 8);
  }, [stocks]);

  if (activeStocks.length === 0) return null;

  return (
    <Card className="p-6 mb-8">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
        <Globe size={20} className="text-blue-500" />
        <span>Institutional Activity</span>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {activeStocks.map((stock, index) => {
          const fiiFlow = stock.mock?.fiiFlow || 0;
          const isBuying = fiiFlow > 0;

          return (
            <motion.div
              key={stock.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{stock.symbol}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{stock.name}</p>
                </div>
                <div className={`text-xs font-medium px-2 py-1 rounded-full ${isBuying ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                  {isBuying ? 'Buying' : 'Selling'}
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-500 dark:text-gray-400">FII Flow</span>
                  <span className={`text-sm font-medium ${isBuying ? 'text-emerald-500' : 'text-red-500'}`}>
                    {fiiFlow.toFixed(2)}%
                  </span>
                </div>

                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${isBuying ? 'bg-emerald-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(Math.abs(fiiFlow) * 20, 100)}%` }}
                  ></div>
                </div>

                <div className="mt-3 flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Price</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    ₹{stock.price?.toFixed(2) || 'N/A'}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        <p>Showing stocks with significant FII/FPI activity in the last trading session</p>
      </div>
    </Card>
  );
};

const VoiceSearch = ({ onSearch }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript || interimTranscript);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
      if (transcript) {
        onSearch(transcript);
      }
    } else {
      setTranscript('');
      recognitionRef.current.start();
    }
  };

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
        <button
          onClick={toggleListening}
          className={`p-2 rounded-full ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
        >
          <Mic size={18} />
        </button>
      </div>
      {isListening && (
        <div className="absolute bottom-full mb-2 right-0 bg-gray-900 text-white text-sm rounded-lg px-3 py-2">
          {transcript || 'Listening...'}
        </div>
      )}
    </div>
  );
};

const MarketWatch = () => {
  // Core State
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [sort, setSort] = useState({ key: 'marketCap', direction: 'desc' });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState('table');
  const [theme, setTheme] = useState('light');

  // Feature State
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    marketCap: { min: 0, max: 10000000 },
    peRatio: { min: 0, max: 200 },
    eagleViewScore: { min: 0, max: 100 },
    fiiFlow: { min: -5, max: 5 },
    dividendYield: { min: 0, max: 10 }
  });
  const [pinnedStocks, setPinnedStocks] = useState([]);
  const [compareStocks, setCompareStocks] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [alertModalStock, setAlertModalStock] = useState(null);
  const [showVoiceSearch, setShowVoiceSearch] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [showStockDetails, setShowStockDetails] = useState(false);

  const debounce = useCallback((func, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    };
  }, []);

  const debouncedSearch = useMemo(() => debounce(query => setSearchQuery(query), 300), [debounce]);

  useEffect(() => {
    document.documentElement.className = theme;
    document.body.style.background = theme === 'dark'
      ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
      : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
  }, [theme]);

  useEffect(() => {
    const fetchStocks = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_URL}/api/stocks`, {
          params: {
            page,
            limit,
            sort: JSON.stringify({ [sort.key]: sort.direction === 'asc' ? 1 : -1 }),
            filters: JSON.stringify(filters),
            search: searchQuery
          }
        });

        // Map the response data to include both ratios and quote data
        const stocksWithData = response.data.stocks.map(s => ({
          ...s,
          peRatio: s.ratios?.stock_pe || 0,
          marketCap: s.ratios?.market_cap || 0,
          roe: s.ratios?.roe || 0,
          roce: s.ratios?.roce || 0,
          dividendYield: s.ratios?.dividend_yield || 0,
          mock: getMockData(s.symbol), // Add mock data for events/sentiment
          draggable: true
        }));

        setStocks(stocksWithData);
        setTotal(response.data.total);
      } catch (err) {
        setError("Failed to load market data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStocks();
  }, [page, limit, sort, filters, searchQuery]);

  useEffect(() => {
    if (!stocks.length || loading) return;

    const socket = io(SOCKET_URL);
    socket.emit('subscribe_quotes', stocks.map(s => s.instrumentKey).filter(Boolean));

    socket.on('quotes', updatedQuotes => {
      setStocks(prev => prev.map(stock => {
        const u = updatedQuotes.find(q => q.instrumentKey === stock.instrumentKey);
        return u?.quote ? {
          ...stock,
          price: u.quote.last_price,
          change: u.quote.change
        } : stock;
      }));
      checkAlerts();
    });

    return () => socket.disconnect();
  }, [stocks, loading]);

  const checkAlerts = () => {
    alerts.forEach(alert => {
      if (alert.active) {
        const stock = stocks.find(s => s.symbol === alert.stockSymbol);
        if (stock) {
          const currentValue = alert.type === 'price' ? stock.price : stock.volume;
          const targetValue = parseFloat(alert.condition.match(/[\d.]+/)[0]);

          if (
            (alert.condition.includes('above') && currentValue > targetValue) ||
            (alert.condition.includes('below') && currentValue < targetValue) ||
            (alert.condition.includes('crosses') &&
              ((alert.lastValue < targetValue && currentValue >= targetValue) ||
                (alert.lastValue > targetValue && currentValue <= targetValue)))
          ) {
            // Trigger alert notification
            console.log(`Alert: ${alert.stockSymbol} ${alert.condition}`);
            // In a real app, you'd show a notification here
          }
        }
      }
    });
  };

  // Fetch detailed stock data when selected
  const fetchStockDetails = async (symbol) => {
    try {
      const response = await axios.get(`${API_URL}/api/stock/${symbol}`);
      return {
        ...response.data,
        mock: getMockData(symbol) // Add mock data for UI elements
      };
    } catch (error) {
      console.error("Error fetching stock details:", error);
      return null;
    }
  };

  const handleStockSelect = async (stock) => {
    const details = await fetchStockDetails(stock.symbol);
    if (details) {
      setSelectedStock(details);
      setShowStockDetails(true);
    }
  };

  // Sort handler
  const handleSort = useCallback((key, direction) => {
    setSort({ key, direction });
    setPage(1);
  }, []);

  // Filter handler
  const handleFilterChange = useCallback((name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  }, []);

  const handlePinStock = useCallback(stock => {
    if (!pinnedStocks.find(s => s.id === stock.id))
      setPinnedStocks(prev => [stock, ...prev]);
  }, [pinnedStocks]);

  const handleAddToCompare = useCallback(stock => {
    if (compareStocks.length < 4 && !compareStocks.find(s => s.id === stock.id))
      setCompareStocks(prev => [...prev, stock]);
  }, [compareStocks]);

  // Get watchlists from the current stocks
  const topGainers = useMemo(() => [...stocks].sort((a, b) => b.change - a.change).slice(0, 8), [stocks]);
  const topLosers = useMemo(() => [...stocks].sort((a, b) => a.change - b.change).slice(0, 8), [stocks]);
  const highDividend = useMemo(() => [...stocks].sort((a, b) => (b.dividendYield || 0) - (a.dividendYield || 0)).slice(0, 8), [stocks]);
  const underRadar = useMemo(() => [...stocks].filter(s => s.marketCap < 20000).sort((a, b) => b.eagleViewScore - a.eagleViewScore).slice(0, 8), [stocks]);

  const getScoreColor = (score) =>
    score >= 70 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
      score >= 40 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';

  const getSentimentIcon = (sentiment) =>
    sentiment === 'Bullish' ? <TrendingUp size={16} className="text-emerald-500" /> :
      sentiment === 'Bearish' ? <TrendingDown size={16} className="text-red-500" /> :
        <Activity size={16} className="text-gray-500" />;

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''} font-sans antialiased w-screen text-black`}>
      <Navbar theme={theme} setTheme={setTheme} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">Market Dashboard</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Your intelligent, real-time stock screening platform with 15+ unique features
          </p>
        </motion.div>

        {/* Smart Watchlists */}
        <SmartWatchlist stocks={topGainers} title="Top Gainers" onPin={handlePinStock} onAddToCompare={handleAddToCompare} icon={TrendingUp} />
        <SmartWatchlist stocks={topLosers} title="Top Losers" onPin={handlePinStock} onAddToCompare={handleAddToCompare} icon={TrendingDown} />
        <SmartWatchlist stocks={highDividend} title="High Dividend" onPin={handlePinStock} onAddToCompare={handleAddToCompare} icon={Bookmark} />
        <SmartWatchlist stocks={underRadar} title="Under the Radar" onPin={handlePinStock} onAddToCompare={handleAddToCompare} icon={Eye} />

        {/* Institutional Activity */}
        <InstitutionalActivity stocks={stocks} />

        {/* Portfolio Simulator */}
        <PortfolioSimulator portfolio={portfolio} setPortfolio={setPortfolio} />

        {/* Search and Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 flex flex-col lg:flex-row gap-6 items-center justify-between"
        >
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search stocks..."
              onChange={e => debouncedSearch(e.target.value)}
              className="w-full pl-12 pr-6 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 transition-all shadow-lg"
            />
            <button
              onClick={() => setShowVoiceSearch(!showVoiceSearch)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500"
            >
              <Mic size={20} />
            </button>
            {showVoiceSearch && (
              <div className="absolute top-full mt-2 left-0 w-full z-10">
                <VoiceSearch onSearch={(query) => { setSearchQuery(query); setShowVoiceSearch(false); }} />
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <motion.button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-6 py-3 rounded-2xl flex items-center space-x-2 font-medium ${showFilters ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
            >
              <Filter size={18} />
              <span>Filters</span>
            </motion.button>

            <div className="flex items-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-1 shadow-lg">
              {[
                { view: 'table', icon: List, tooltip: 'Table View' },
                { view: 'heatmap', icon: Grid, tooltip: 'Heatmap' },
                { view: 'timeline', icon: Calendar, tooltip: 'Event Timeline' }
              ].map(({ view, icon: Icon, tooltip }) => (
                <motion.button
                  key={view}
                  onClick={() => setActiveView(view)}
                  className={`p-2.5 rounded-xl relative group ${activeView === view ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  whileHover={{ scale: 1.05 }}
                >
                  <Icon size={18} />
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 whitespace-nowrap">
                    {tooltip}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-0 border-t-4 border-gray-900 border-l-transparent border-r-transparent"></div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-8 overflow-hidden"
            >
              <Card className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Object.entries(filters).map(([key, { min, max }]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </label>
                      <div className="flex items-center space-x-4">
                        <input
                          type="number"
                          value={min}
                          onChange={e => handleFilterChange(key, { ...filters[key], min: Number(e.target.value) })}
                          className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                          placeholder="Min"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                          type="number"
                          value={max}
                          onChange={e => handleFilterChange(key, { ...filters[key], max: Number(e.target.value) })}
                          className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                          placeholder="Max"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content View */}
        <Card className="overflow-hidden">
          <AnimatePresence mode="wait">
            {activeView === 'table' && (
              <motion.div
                key="table"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="overflow-x-auto"
              >
                <table className="min-w-full">
                  <thead className="bg-gray-50/80 dark:bg-gray-900/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Company</th>
                      <SortableHeader name="eagleViewScore" sortConfig={sort} onSort={handleSort} tooltip="Proprietary score combining fundamentals, technicals and sentiment">
                        Eagle Score
                      </SortableHeader>
                      <SortableHeader name="price" sortConfig={sort} onSort={handleSort}>Price</SortableHeader>
                      <SortableHeader name="change" sortConfig={sort} onSort={handleSort}>Change</SortableHeader>
                      <SortableHeader name="marketCap" sortConfig={sort} onSort={handleSort}>Mkt Cap</SortableHeader>
                      <SortableHeader name="peRatio" sortConfig={sort} onSort={handleSort}>P/E</SortableHeader>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100/60 dark:divide-gray-800/60">
                    {loading ? (
                      [...Array(10)].map((_, i) => <StockRowSkeleton key={i} />)
                    ) : error ? (
                      <tr>
                        <td colSpan="7" className="text-center p-8 text-red-500">
                          {error}
                        </td>
                      </tr>
                    ) : (
                      stocks.map((stock, i) => (
                        <motion.tr
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData("stock", JSON.stringify(stock))}
                          key={stock.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 group"
                        >
                          <td className="px-6 py-4">
                            <div
                              className="flex items-center space-x-4 cursor-pointer"
                              onClick={() => handleStockSelect(stock)}
                            >
                              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                                {stock.symbol.substring(0, 2)}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white">{stock.symbol}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                  {stock.name}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getScoreColor(stock.eagleViewScore)}`}>
                                {stock.eagleViewScore.toFixed(0)}
                              </span>
                              <Zap size={16} className="text-amber-500" />
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              ₹{stock.price?.toFixed(2) ?? 'N/A'}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              {stock.change > 0 ? (
                                <TrendingUp size={16} className="text-emerald-500" />
                              ) : (
                                <TrendingDown size={16} className="text-red-500" />
                              )}
                              <span className={`font-semibold ${stock.change > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {stock.change?.toFixed(2)} (
                                {stock.change && stock.price ?
                                  (stock.change / (stock.price - stock.change) * 100).toFixed(2) :
                                  '0.00'}%)
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {stock.peRatio?.toFixed(1) || 'N/A'}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="font-medium text-gray-900 dark:text-white">
                              ₹{(stock.marketCap / 10000000).toFixed(2)} Cr
                            </p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setAlertModalStock(stock)}
                                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                              >
                                <Bell size={16} className="text-gray-500" />
                              </button>
                              <button
                                onClick={() => handleAddToCompare(stock)}
                                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                              >
                                <GitCompareArrows size={16} className="text-gray-500" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </motion.div>
            )}

            {activeView === 'heatmap' && (
              <motion.div
                key="heatmap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <HeatmapView stocks={stocks} />
              </motion.div>
            )}

            {activeView === 'timeline' && (
              <motion.div
                key="timeline"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <TimelineView stocksWithData={stocks} />
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Stock Details Modal */}
        <AnimatePresence>
          {showStockDetails && selectedStock && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowStockDetails(false)}
            >
              <Card
                className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedStock.name} ({selectedStock.symbol})
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        {selectedStock.sector} • {selectedStock.industry}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowStockDetails(false)}
                      className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-gray-100 dark:bg-gray-800/50 p-4 rounded-xl">
                      <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">Key Metrics</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Price</span>
                          <span className="font-medium">₹{selectedStock.price?.toFixed(2) || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Change</span>
                          <span className={`font-medium ${selectedStock.change > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {selectedStock.change?.toFixed(2) || 'N/A'} (
                            {selectedStock.change && selectedStock.price ?
                              (selectedStock.change / (selectedStock.price - selectedStock.change) * 100).toFixed(2) :
                              '0.00'}%)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Market Cap</span>
                          <span className="font-medium">
                            ₹{(selectedStock.ratios?.market_cap / 10000000).toFixed(2)} Cr
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">P/E Ratio</span>
                          <span className="font-medium">
                            {selectedStock.ratios?.stock_pe?.toFixed(1) || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Dividend Yield</span>
                          <span className="font-medium">{selectedStock.dividendYield?.toFixed(2) || '0.00'}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Eagle Score</span>
                          <span className={`font-medium ${getScoreColor(selectedStock.eagleViewScore).replace('bg-', 'text-').replace('dark:bg-', 'dark:text-')}`}>
                            {selectedStock.eagleViewScore.toFixed(0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-100 dark:bg-gray-800/50 p-4 rounded-xl">
                      <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">Sentiment & Activity</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Market Sentiment</span>
                          <div className="flex items-center space-x-1">
                            {getSentimentIcon(selectedStock.mock?.sentiment)}
                            <span className="font-medium capitalize">
                              {selectedStock.mock?.sentiment?.toLowerCase() || 'Neutral'}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">FII Flow</span>
                          <span className={`font-medium ${(selectedStock.mock?.fiiFlow || 0) > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {(selectedStock.mock?.fiiFlow || 0).toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Volume</span>
                          <span className="font-medium">
                            {selectedStock.volume ? (selectedStock.volume / 1000).toFixed(1) + 'K' : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Beta</span>
                          <span className="font-medium">{selectedStock.beta?.toFixed(2) || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">52W High</span>
                          <span className="font-medium">₹{selectedStock.week52High?.toFixed(2) || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">52W Low</span>
                          <span className="font-medium">₹{selectedStock.week52Low?.toFixed(2) || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-100 dark:bg-gray-800/50 p-4 rounded-xl">
                      <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">Upcoming Events</h4>
                      {selectedStock.mock?.event ? (
                        <div className="space-y-4">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500">
                              <Calendar size={18} />
                            </div>
                            <div>
                              <p className="font-medium">{selectedStock.mock.event.event}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(selectedStock.mock.event.date).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>

                          {selectedStock.mock.news?.length > 0 && (
                            <div>
                              <h5 className="font-medium mb-2">Recent News</h5>
                              <div className="space-y-2">
                                {selectedStock.mock.news.map((news, i) => (
                                  <div key={i} className="text-sm p-2 bg-white dark:bg-gray-700 rounded-lg">
                                    <p className="font-medium">{news.title}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      {news.source} • {news.sentiment === 'positive' ? (
                                        <span className="text-emerald-500">Positive</span>
                                      ) : (
                                        <span className="text-gray-500">Neutral</span>
                                      )}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400">No upcoming events</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                      <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">Technical Indicators</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { name: 'RSI (14)', value: (Math.random() * 30 + 30).toFixed(1), good: '<30 or >70' },
                          { name: 'MACD', value: (Math.random() * 2 - 1).toFixed(2), good: 'Positive' },
                          { name: 'SMA (50)', value: (selectedStock.price * (0.95 + Math.random() * 0.1)).toFixed(2), good: 'Price above' },
                          { name: 'Volume', value: selectedStock.volume ? (selectedStock.volume / 1000000).toFixed(2) + 'M' : 'N/A', good: 'Increasing' },
                        ].map((indicator, i) => (
                          <div key={i} className="text-sm">
                            <p className="text-gray-600 dark:text-gray-400">{indicator.name}</p>
                            <p className="font-medium mt-1">{indicator.value}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Optimal: {indicator.good}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                      <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">Quick Actions</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => { handlePinStock(selectedStock); setShowStockDetails(false); }}
                          className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg flex flex-col items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          <Star size={20} className="text-amber-500 mb-1" />
                          <span className="text-sm">Add to Watchlist</span>
                        </button>
                        <button
                          onClick={() => { handleAddToCompare(selectedStock); setShowStockDetails(false); }}
                          className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg flex flex-col items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          <GitCompareArrows size={20} className="text-blue-500 mb-1" />
                          <span className="text-sm">Compare</span>
                        </button>
                        <button
                          onClick={() => { setAlertModalStock(selectedStock); setShowStockDetails(false); }}
                          className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg flex flex-col items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          <Bell size={20} className="text-purple-500 mb-1" />
                          <span className="text-sm">Set Alert</span>
                        </button>
                        <button
                          onClick={() => { setPortfolio(p => [...p, selectedStock]); setShowStockDetails(false); }}
                          className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg flex flex-col items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          <PieChart size={20} className="text-emerald-500 mb-1" />
                          <span className="text-sm">Add to Portfolio</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Competitor Comparison */}
      <CompetitorComparison stocks={compareStocks} onClose={() => setCompareStocks([])} />

      {/* Alert Modal */}
      <AnimatePresence>
        {alertModalStock && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setAlertModalStock(null)}
          >
            <Card
              className="w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <CustomAlerts
                alerts={alerts}
                setAlerts={setAlerts}
                stock={alertModalStock}
                onClose={() => setAlertModalStock(null)}
              />
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MarketWatch;