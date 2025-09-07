import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSpring, animated } from "react-spring";
import axios from "axios";
import {
  Search,
  X,
  Plus,
  ChevronDown,
  ChevronUp,
  Activity,
  DollarSign,
  TrendingUp,
  BarChart2,
  PieChart,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Shield,
  Target,
  Layers,
  Building2,
  Calculator,
  FileText,
  Users,
  Award,
  CheckCircle,
  AlertTriangle,
  Info,
  Download,
  Share2,
  Bookmark,
  Filter,
  SortAsc,
  Eye,
  TrendingDown
} from "lucide-react";
import Navbar from "./Navbar";
import { StockRatingRadar, BalanceSheetTreeMap, SalesProfitBarGraph, ShareholdingPatternBarGraph } from "./StockDetails";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

// Professional Status Badge Component
const StatusBadge = ({ status, text }) => {
  const statusConfig = {
    success: { color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: <CheckCircle className="w-3 h-3" /> },
    warning: { color: "bg-amber-100 text-amber-800 border-amber-200", icon: <AlertTriangle className="w-3 h-3" /> },
    info: { color: "bg-blue-100 text-blue-800 border-blue-200", icon: <Info className="w-3 h-3" /> },
    error: { color: "bg-red-100 text-red-800 border-red-200", icon: <X className="w-3 h-3" /> }
  };

  const config = statusConfig[status] || statusConfig.info;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${config.color}`}>
      {config.icon}
      {text}
    </div>
  );
};

// Professional Metric Card Component
const MetricCard = ({ title, value, change, trend, icon, color = "blue" }) => {
  const colorClasses = {
    blue: "from-blue-50 to-blue-100 border-blue-200 text-blue-900",
    green: "from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-900",
    red: "from-red-50 to-red-100 border-red-200 text-red-900",
    purple: "from-purple-50 to-purple-100 border-purple-200 text-purple-900",
    orange: "from-orange-50 to-orange-100 border-orange-200 text-orange-900"
  };

  return (
    <motion.div
      className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-4 hover:shadow-md transition-all duration-200`}
      whileHover={{ y: -2 }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="p-2 bg-white/60 rounded-lg">
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
            }`}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> :
              trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> : null}
            {change}
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">{title}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </motion.div>
  );
};

// Professional Data Table Component
const ProfessionalTable = ({ data, columns, title, subtitle }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filterValue, setFilterValue] = useState('');

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const filteredData = useMemo(() => {
    if (!filterValue) return sortedData;
    return sortedData.filter(row =>
      Object.values(row).some(value =>
        value?.toString().toLowerCase().includes(filterValue.toLowerCase())
      )
    );
  }, [sortedData, filterValue]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Filter data..."
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    <SortAsc className="w-3 h-3 opacity-50" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.map((row, index) => (
              <motion.tr
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-gray-50 transition-colors"
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No data matches your criteria</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
};

// Enhanced Financial Table with Professional Design
const FinancialTable = ({ data, type, stockName }) => {
  if (!data || !Object.keys(data).length) {
    return (
      <motion.div
        className="bg-white border border-gray-200 rounded-xl p-12 text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <BarChart2 className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Financial Data Available</h3>
        <p className="text-gray-600 mb-4">Financial information for {stockName} is currently unavailable</p>
        <StatusBadge status="warning" text="Data Unavailable" />
      </motion.div>
    );
  }

  const years = Object.keys(data).sort();
  const getTableTitle = () => {
    switch (type) {
      case "balanceSheet": return "Balance Sheet Analysis";
      case "cashFlow": return "Cash Flow Statement";
      default: return "Profit & Loss Statement";
    }
  };

  const getTableIcon = () => {
    switch (type) {
      case "balanceSheet": return <Building2 className="w-5 h-5" />;
      case "cashFlow": return <DollarSign className="w-5 h-5" />;
      default: return <TrendingUp className="w-5 h-5" />;
    }
  };

  let fields = [];
  if (type === "balanceSheet") {
    fields = [
      "total assets", "fixed assets", "investments", "other assets",
      "total liabilities", "equity capital", "reserves", "borrowings",
      "short term borrowings", "trade payables", "other liability items"
    ];
  } else if (type === "cashFlow") {
    fields = [...new Set(Object.values(data).flatMap(Object.keys))];
  } else if (type === "profitLoss") {
    fields = [
      "Sales", "Expenses", "Operating Profit", "OPM %", "Other Income",
      "Interest", "Depreciation", "Profit before tax", "Tax %", "Net Profit",
      "EPS in Rs", "Dividend Payout %"
    ];
  }

  const normalize = (str) => str?.toLowerCase().replace(/\s/g, "");
  const availableFields = [...new Set(Object.values(data).flatMap(obj => Object.keys(obj).map(normalize)))];
  fields = fields.filter(field => availableFields.includes(normalize(field)));

  if (!fields.length) {
    const firstNonEmptyYear = years.find(year => Object.keys(data[year]).length);
    fields = firstNonEmptyYear ? Object.keys(data[firstNonEmptyYear]) : [];
  }

  const ttmValues = {};
  fields.forEach((field) => {
    const latestYear = years[years.length - 1];
    ttmValues[field] = data[latestYear][field] || "N/A";
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white border border-gray-200 rounded-xl overflow-hidden"
    >
      {/* Professional Header */}
      <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              {getTableIcon()}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{getTableTitle()}</h3>
              <p className="text-sm text-gray-600">
                {stockName} • Consolidated Figures in ₹ Crores
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status="success" text="Live Data" />
            <button className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider sticky left-0 bg-gray-50 border-r border-gray-200">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-gray-500" />
                  Financial Metrics
                </div>
              </th>
              {years.map((year) => (
                <th
                  key={year}
                  className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider"
                >
                  Mar {year.slice(0, 4)}
                </th>
              ))}
              <th className="px-6 py-4 text-right text-xs font-semibold text-blue-700 uppercase tracking-wider bg-blue-50">
                <div className="flex items-center justify-end gap-2">
                  <Zap className="w-4 h-4" />
                  TTM
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {fields.map((field, index) => (
              <motion.tr
                key={field}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.02 }}
                className="hover:bg-gray-50 transition-colors group"
              >
                <td className="px-6 py-4 text-sm font-medium text-gray-900 sticky left-0 bg-white group-hover:bg-gray-50 border-r border-gray-200">
                  <div className="flex items-center gap-3">
                    {field === "Sales" || field === "Expenses" || field === "Net Profit" ? (
                      <>
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="font-semibold">{field}</span>
                      </>
                    ) : field.includes("%") ? (
                      <>
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-purple-700 font-medium">{field}</span>
                      </>
                    ) : (
                      <>
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <span className="text-gray-700 pl-2">{field}</span>
                      </>
                    )}
                  </div>
                </td>
                {years.map((year) => (
                  <td
                    key={`${field}-${year}`}
                    className="px-6 py-4 text-sm text-gray-700 text-right font-mono"
                  >
                    {data[year][field] !== null && data[year][field] !== undefined
                      ? data[year][field]
                      : "—"}
                  </td>
                ))}
                <td className="px-6 py-4 text-sm text-gray-900 text-right font-mono font-semibold bg-blue-50">
                  {ttmValues[field]}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Professional Footer Metrics */}
      <div className="px-6 py-6 bg-gray-50 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            {
              title: "Sales Growth (CAGR)",
              values: { "10Y": "45%", "5Y": "45%", "3Y": "45%", "TTM": "10%" },
              color: "blue",
              icon: <TrendingUp className="w-4 h-4" />
            },
            {
              title: "Profit Growth (CAGR)",
              values: { "10Y": "71%", "5Y": "71%", "3Y": "18%", "TTM": "18%" },
              color: "green",
              icon: <ArrowUpRight className="w-4 h-4" />
            },
            {
              title: "Stock Price (CAGR)",
              values: { "10Y": "29%", "5Y": "29%", "3Y": "29%", "1Y": "29%" },
              color: "purple",
              icon: <Star className="w-4 h-4" />
            },
            {
              title: "Return on Equity",
              values: { "10Y": "41%", "5Y": "41%", "3Y": "41%", "TTM": "41%" },
              color: "orange",
              icon: <Target className="w-4 h-4" />
            },
          ].map((metric, index) => (
            <MetricCard
              key={index}
              title={metric.title}
              value={metric.values.TTM}
              icon={metric.icon}
              color={metric.color}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// Rest of your utility functions remain the same...
const fetchMarketQuote = async (instrumentKey) => {
  try {
    const response = await axios.get(`${API_URL}/api/stock/quote/${instrumentKey}`);
    return response.data.quote;
  } catch (error) {
    console.error(`Error fetching market quote for ${instrumentKey}:`, error);
    return null;
  }
};

const calculateMarketCap = (faceValue, equityCapital, ltp) => {
  if (!faceValue || !equityCapital || !ltp) return "N/A";
  const equityCapitalNum = parseFloat(equityCapital.replace(/,/g, ""));
  const faceValueNum = parseFloat(faceValue);
  const ltpNum = parseFloat(ltp);
  const sharesOutstanding = equityCapitalNum / faceValueNum;
  const marketCapInCrores = sharesOutstanding * ltpNum;
  return marketCapInCrores.toFixed(2);
};

const calculateROCE = (financialData) => {
  if (!financialData || !financialData.profit_loss || !financialData.balance_sheet) return "N/A";
  const latestYear = Object.keys(financialData.profit_loss).sort().pop();
  const profitLoss = financialData.profit_loss[latestYear];
  const balanceSheet = financialData.balance_sheet[latestYear];

  const operatingProfit = parseFloat(profitLoss["Operating Profit"]?.replace(/,/g, "") || "0");
  const otherIncome = parseFloat(profitLoss["Other Income"]?.replace(/,/g, "") || "0");
  const interest = parseFloat(profitLoss["Interest"]?.replace(/,/g, "") || "0");
  const depreciation = parseFloat(profitLoss["Depreciation"]?.replace(/,/g, "") || "0");
  const equityCapital = parseFloat(balanceSheet["equity capital"]?.replace(/,/g, "") || "0");
  const reserves = parseFloat(balanceSheet["reserves"]?.replace(/,/g, "") || "0");
  const borrowings = parseFloat(balanceSheet["borrowings"]?.replace(/,/g, "") || "0");

  const ebit = operatingProfit + otherIncome - interest - depreciation;
  const totalCapitalEmployed = equityCapital + reserves + borrowings;

  if (totalCapitalEmployed === 0) return "N/A";
  return ((ebit / totalCapitalEmployed) * 100).toFixed(2);
};

const calculateROE = (financialData) => {
  if (!financialData || !financialData.profit_loss || !financialData.balance_sheet) return "N/A";
  const latestYear = Object.keys(financialData.profit_loss).sort().pop();
  const profitLoss = financialData.profit_loss[latestYear];
  const balanceSheet = financialData.balance_sheet[latestYear];

  const netProfit = parseFloat(profitLoss["Net Profit"]?.replace(/,/g, "") || "0");
  const equityCapital = parseFloat(balanceSheet["equity capital"]?.replace(/,/g, "") || "0");
  const reserves = parseFloat(balanceSheet["reserves"]?.replace(/,/g, "") || "0");

  const totalEquity = equityCapital + reserves;
  if (totalEquity === 0) return "N/A";
  return ((netProfit / totalEquity) * 100).toFixed(2);
};

const calculateBookValue = (financialData) => {
  if (!financialData || !financialData.balance_sheet) return "N/A";
  const latestYear = Object.keys(financialData.balance_sheet).sort().pop();
  const balanceSheet = financialData.balance_sheet[latestYear];
  const equityCapital = parseFloat(balanceSheet["equity capital"]?.replace(/,/g, "") || "0");
  const reserves = parseFloat(balanceSheet["reserves"]?.replace(/,/g, "") || "0");
  return (equityCapital + reserves).toFixed(2);
};

const calculateDividendYield = (financialData) => {
  if (!financialData || !financialData.profit_loss) return "N/A";
  const latestYear = Object.keys(financialData.profit_loss).sort().pop();
  const profitLoss = financialData.profit_loss[latestYear];
  const dividendPayout = parseFloat(profitLoss["Dividend Payout %"]?.replace(/,|%/g, "") || "0");
  return `${dividendPayout.toFixed(2)}%`;
};

const parsePercentage = (value) => {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    return parseFloat(value.replace("%", "") || "0");
  }
  return 0;
};

const calculateRatings = (financialData, shareholdingData, marketCap) => {
  if (!financialData || !shareholdingData || !marketCap) return null;

  const latestYearPL = Object.keys(financialData.profit_loss).sort().pop();
  const profitLoss = financialData.profit_loss[latestYearPL];
  const balanceSheet = financialData.balance_sheet[latestYearPL];

  const latestYearSH = Object.keys(shareholdingData.shareholding_pattern).sort().pop();
  const latestQuarterSH = Object.keys(shareholdingData.shareholding_pattern[latestYearSH]).sort().pop();
  const shareholding = shareholdingData.shareholding_pattern[latestYearSH][latestQuarterSH];

  const weights = {
    salesGrowth: 0.25,
    profitGrowth: 0.25,
    marketCap: 0.15,
    roe: 0.20,
    promoterHolding: 0.10,
    debtToEquity: 0.05,
  };

  const salesGrowth = profitLoss["Sales"]
    ? Math.min((parseFloat(profitLoss["Sales"].replace(/,/g, "")) / 1000) * 10, 100)
    : 0;
  const profitGrowth = profitLoss["Net Profit"]
    ? Math.min((parseFloat(profitLoss["Net Profit"].replace(/,/g, "")) / 100) * 10, 100)
    : 0;
  const marketCapScore = parseFloat(marketCap)
    ? Math.min((parseFloat(marketCap) / 10000) * 10, 100)
    : 0;
  const roe = balanceSheet["reserves"] && balanceSheet["equity capital"]
    ? Math.min(
      (parseFloat(profitLoss["Net Profit"].replace(/,/g, "")) /
        (parseFloat(balanceSheet["reserves"].replace(/,/g, "")) +
          parseFloat(balanceSheet["equity capital"].replace(/,/g, ""))) *
        100) * 2,
      100
    )
    : 0;
  const promoterHolding = shareholding["promoters"]
    ? Math.min(parsePercentage(shareholding["promoters"]), 100)
    : 0;
  const debtToEquity = balanceSheet["borrowings"] && balanceSheet["equity capital"]
    ? Math.min(
      100 -
      (parseFloat(balanceSheet["borrowings"].replace(/,/g, "")) /
        (parseFloat(balanceSheet["equity capital"].replace(/,/g, "")) +
          parseFloat(balanceSheet["reserves"].replace(/,/g, ""))) *
        100,
        100)
    )
    : 50;

  const overallScore = (
    salesGrowth * weights.salesGrowth +
    profitGrowth * weights.profitGrowth +
    marketCapScore * weights.marketCap +
    roe * weights.roe +
    promoterHolding * weights.promoterHolding +
    debtToEquity * weights.debtToEquity
  ).toFixed(1);

  return {
    ratings: [
      { index: "Sales Growth", stock: salesGrowth, description: "Measures revenue growth over time." },
      { index: "Profit Growth", stock: profitGrowth, description: "Indicates profitability improvement." },
      { index: "Market Cap", stock: marketCapScore, description: "Reflects company size and stability." },
      { index: "ROE", stock: roe, description: "Return on Equity shows profit efficiency." },
      { index: "Promoter Holding", stock: promoterHolding, description: "Promoter stake indicates confidence." },
      { index: "Debt to Equity", stock: debtToEquity, description: "Lower ratio means less financial risk." },
    ],
    overallScore,
  };
};

// Professional Tabs Component
const ProfessionalTabs = ({ stockData, activeTab, setActiveTab, renderContent }) => {
  return (
    <div className="space-y-6">
      {/* Enhanced Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {stockData.map((data, index) => (
            <motion.button
              key={index}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${activeTab === index
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              onClick={() => setActiveTab(index)}
              whileHover={{ y: -1 }}
              whileTap={{ y: 0 }}
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${activeTab === index ? "bg-blue-500" : "bg-gray-300"
                  }`} />
                <div className="text-left">
                  <div className="font-semibold">
                    {data?.symbol || `Stock ${index + 1}`}
                  </div>
                  {data?.symbol && (
                    <div className="text-xs text-gray-500 font-normal">
                      {data.name?.slice(0, 20)}...
                    </div>
                  )}
                </div>
                {data?.symbol && (
                  <StatusBadge status="success" text="Active" />
                )}
              </div>
            </motion.button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {stockData[activeTab] && (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent(stockData[activeTab])}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Main Component
export default function CompareStocks() {
  const [stocks, setStocks] = useState([null, null]);
  const [searchTerms, setSearchTerms] = useState(["", ""]);
  const [suggestions, setSuggestions] = useState([[], []]);
  const [stockData, setStockData] = useState([null, null]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAnimation, setShowAnimation] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const [activeTabEagleView, setActiveTabEagleView] = useState(0);
  const [activeTabBalanceSheet, setActiveTabBalanceSheet] = useState(0);
  const [activeTabCashFlow, setActiveTabCashFlow] = useState(0);
  const [activeTabIncomeSheet, setActiveTabIncomeSheet] = useState(0);
  const [activeTabShareholding, setActiveTabShareholding] = useState(0);

  // Professional Animation Configuration
  const backgroundProps = useSpring({
    from: { opacity: 0 },
    to: { opacity: 1 },
    config: { duration: 1000 },
  });

  const headerProps = useSpring({
    from: { opacity: 0, transform: "translateY(-30px)" },
    to: { opacity: 1, transform: "translateY(0)" },
    config: { tension: 280, friction: 60 },
  });

  useEffect(() => {
    const timer = setTimeout(() => setShowAnimation(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Fetch stock data when stocks change
  useEffect(() => {
    const fetchStockData = async () => {
      if (!stocks.some(stock => stock)) return;
      setIsLoading(true);
      setError(null);

      try {
        const newStockData = await Promise.all(stocks.map(async (stock, index) => {
          if (!stock) return null;
          const { trading_symbol } = stock;
          try {
            const response = await axios.get(`${API_URL}/api/stock/${trading_symbol}`);
            const { financials, ratios, quote } = response.data;

            if (!financials) {
              console.warn(`No financial data for ${trading_symbol}`);
              setError(`No financial data available for ${trading_symbol}.`);
              return null;
            }

            let ltp = "N/A";
            let highLow = "N/A";
            if (quote && quote.instrument_key) {
              const quoteData = await fetchMarketQuote(quote.instrument_key);
              if (quoteData) {
                ltp = quoteData.last_price;
                highLow = `${quoteData.ohlc.high || "N/A"} - ${quoteData.ohlc.low || "N/A"}`;
              }
            }

            const financialData = {
              balance_sheet: financials.balance_sheet || {},
              cash_flow: financials.cash_flow || {},
              profit_loss: financials.profit_loss || {},
              shareholding_pattern: financials.shareholding_pattern || {},
            };

            const shareholdingData = {
              shareholding_pattern: financials.shareholding_pattern || {},
            };

            const marketCap = calculateMarketCap(
              ratios?.face_value,
              financials?.balance_sheet?.["2024"]?.["equity capital"],
              ltp
            );

            const ratingsData = calculateRatings(financialData, shareholdingData, marketCap);

            return {
              symbol: trading_symbol,
              name: financials?.company_name || trading_symbol,
              marketCap,
              ltp,
              highLow,
              peRatio: ratios?.stock_pe ? Number(ratios.stock_pe) : "N/A",
              bookValue: calculateBookValue(financialData),
              dividendYield: calculateDividendYield(financialData),
              roce: calculateROCE(financialData),
              roe: calculateROE(financialData),
              faceValue: ratios?.face_value || "N/A",
              financialData,
              shareholdingData,
              ratingsData,
            };
          } catch (err) {
            console.error(`Error fetching data for ${trading_symbol}:`, err);
            setError(`Failed to load data for ${trading_symbol}.`);
            return null;
          }
        }));

        setStockData(newStockData);
      } catch (err) {
        console.error("Error fetching stock data:", err);
        setError("Failed to load stock data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStockData();
  }, [stocks]);

  // Handle stock search
  const handleSearch = (index) => async (e) => {
    const term = e.target.value.toUpperCase();
    const newSearchTerms = [...searchTerms];
    newSearchTerms[index] = term;
    setSearchTerms(newSearchTerms);

    if (term.length < 2) {
      const newSuggestions = [...suggestions];
      newSuggestions[index] = [];
      setSuggestions(newSuggestions);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/api/stock/search/${term}`);
      const newSuggestions = [...suggestions];
      newSuggestions[index] = response.data.stocks || [];
      setSuggestions(newSuggestions);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
      setError("Failed to load stock suggestions.");
    }
  };

  // Select a stock from suggestions
  const selectStock = (index) => (suggestion) => {
    const newStocks = [...stocks];
    newStocks[index] = suggestion;
    setStocks(newStocks);

    const newSearchTerms = [...searchTerms];
    newSearchTerms[index] = suggestion.trading_symbol;
    setSearchTerms(newSearchTerms);

    const newSuggestions = [...suggestions];
    newSuggestions[index] = [];
    setSuggestions(newSuggestions);
  };

  // Clear selected stock
  const clearStock = (index) => () => {
    const newStocks = [...stocks];
    newStocks[index] = null;
    setStocks(newStocks);

    const newSearchTerms = [...searchTerms];
    newSearchTerms[index] = "";
    setSearchTerms(newSearchTerms);

    const newStockData = [...stockData];
    newStockData[index] = null;
    setStockData(newStockData);
  };

  // Add new stock input
  const addStockInput = () => {
    if (stocks.length < 4) {
      setStocks([...stocks, null]);
      setSearchTerms([...searchTerms, ""]);
      setSuggestions([...suggestions, []]);
      setStockData([...stockData, null]);
    }
  };

  // Remove stock input
  const removeStockInput = (index) => () => {
    if (stocks.length > 2) {
      setStocks(stocks.filter((_, i) => i !== index));
      setSearchTerms(searchTerms.filter((_, i) => i !== index));
      setSuggestions(suggestions.filter((_, i) => i !== index));
      setStockData(stockData.filter((_, i) => i !== index));
    }
  };

  // Toggle expandable section
  const toggleSection = (sectionId) => {
    setActiveSection(activeSection === sectionId ? null : sectionId);
  };

  return (
    <div className="min-h-screen bg-gray-50 w-screen">
      {/* Professional Background */}
      <animated.div
        style={backgroundProps}
        className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 -z-10"
      />

      {/* Professional Loading State */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200 max-w-sm w-full mx-4">
              <div className="flex flex-col items-center">
                <div className="relative mb-6">
                  <div className="w-12 h-12 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 w-12 h-12 border-3 border-transparent border-r-indigo-600 rounded-full animate-spin" style={{ animationDelay: '0.15s' }}></div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyzing Financial Data</h3>
                <p className="text-sm text-gray-600 text-center">
                  Fetching comprehensive financial metrics and market data...
                </p>
                <div className="mt-4 w-full bg-gray-200 rounded-full h-1">
                  <motion.div
                    className="bg-blue-600 h-1 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Professional Intro Animation */}
      <AnimatePresence>
        {showAnimation && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center"
            >
              <motion.div
                className="inline-flex items-center gap-3 mb-6"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="p-3 bg-blue-600 rounded-xl">
                  <BarChart2 className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl font-bold text-white">
                  Stock<span className="text-blue-400">Vision</span>
                  <span className="text-yellow-400"> Pro</span>
                </div>
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="text-xl text-gray-300 font-light"
              >
                Professional Stock Analysis Platform
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.4 }}
                className="mt-6 flex justify-center space-x-1"
              >
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-blue-400 rounded-full"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed top-0 left-0 right-0 z-40">
        <Navbar />
      </div>

      <main className="pt-16">
        {/* Professional Header */}
        <animated.div style={headerProps}>
          <div className="bg-white border-b border-gray-200 shadow-sm">
            <div className="container mx-auto px-6 py-12">
              <div className="max-w-4xl mx-auto text-center">
                <motion.div
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Award className="w-4 h-4" />
                  Professional Stock Analysis
                </motion.div>

                <motion.h1
                  className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 tracking-tight"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                >
                  Compare Stocks with
                  <span className="block text-blue-600 mt-2">
                    Institutional-Grade Analysis
                  </span>
                </motion.h1>

                <motion.p
                  className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  Make data-driven investment decisions with comprehensive financial analysis,
                  real-time market data, and professional-grade metrics used by institutional investors.
                </motion.p>

                <motion.div
                  className="flex flex-wrap justify-center gap-6 text-sm text-gray-600"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  {[
                    { icon: <Shield className="w-4 h-4" />, text: "Bank-Grade Security" },
                    { icon: <Zap className="w-4 h-4" />, text: "Real-Time Data" },
                    { icon: <Calculator className="w-4 h-4" />, text: "Advanced Analytics" },
                    { icon: <Award className="w-4 h-4" />, text: "Professional Tools" }
                  ].map((feature, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                    >
                      <div className="text-blue-600">{feature.icon}</div>
                      {feature.text}
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>
          </div>
        </animated.div>

        {/* Professional Search Interface */}
        <div className="container mx-auto px-6 py-12">
          <motion.div
            className="max-w-5xl mx-auto"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              {/* Search Header */}
              <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Search className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Stock Selection</h2>
                      <p className="text-gray-600 mt-1">Choose up to 4 stocks for comprehensive comparison</p>
                    </div>
                  </div>
                  <StatusBadge status="info" text={`${stocks.filter(s => s).length}/4 Selected`} />
                </div>
              </div>

              {/* Search Inputs */}
              <div className="p-8 space-y-6">
                {stocks.map((stock, index) => (
                  <motion.div
                    key={index}
                    className="relative"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index, duration: 0.5 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </div>

                      <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={searchTerms[index]}
                          onChange={handleSearch(index)}
                          placeholder={`Search for stock ${index + 1} (e.g., ${['RELIANCE', 'TCS', 'INFY', 'HDFC'][index] || 'WIPRO'
                            })...`}
                          className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
                        />
                        {stocks[index] && (
                          <button
                            onClick={clearStock(index)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>

                      {stocks.length > 2 && (
                        <button
                          onClick={removeStockInput(index)}
                          className="flex-shrink-0 p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-gray-200 hover:border-red-200"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    {/* Professional Suggestions Dropdown */}
                    <AnimatePresence>
                      {suggestions[index]?.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          className="absolute left-12 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-20 max-h-64 overflow-y-auto"
                        >
                          {suggestions[index].map((suggestion, suggestionIndex) => (
                            <motion.button
                              key={suggestion.trading_symbol}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: suggestionIndex * 0.03 }}
                              onClick={() => selectStock(index)(suggestion)}
                              className="w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 first:rounded-t-xl last:rounded-b-xl"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                                    {suggestion.trading_symbol.slice(0, 2)}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-900">{suggestion.trading_symbol}</div>
                                    <div className="text-sm text-gray-600">{suggestion.name}</div>
                                  </div>
                                </div>
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              </div>
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}

                {/* Add Stock Button */}
                {stocks.length < 4 && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    onClick={addStockInput}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 font-medium"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Plus className="w-5 h-5" />
                    Add Another Stock for Comparison
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Professional Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="container mx-auto px-6 mb-8"
            >
              <div className="max-w-5xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 p-2 bg-red-100 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-red-900 mb-1">Data Loading Error</h3>
                      <p className="text-red-700">{error}</p>
                      <button
                        onClick={() => setError(null)}
                        className="mt-3 text-sm text-red-600 hover:text-red-800 font-medium"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Professional Comparison Results */}
        {stockData.some(data => data && data.symbol) && (
          <div className="container mx-auto px-6 pb-20">
            <div className="max-w-7xl mx-auto space-y-8">

              {/* Professional Key Metrics Dashboard */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-xl">
                          <Activity className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">Key Performance Metrics</h2>
                          <p className="text-gray-600 mt-1">Comprehensive financial comparison across selected stocks</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status="success" text="Live Data" />
                        <button className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider sticky left-0 bg-gray-50 border-r border-gray-200">
                            <div className="flex items-center gap-2">
                              <BarChart2 className="w-4 h-4 text-gray-500" />
                              Financial Metric
                            </div>
                          </th>
                          {stockData.map((data, index) => (
                            <th key={index} className="px-8 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-48">
                              {data && data.symbol ? (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.1 * index }}
                                  className="space-y-2"
                                >
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                    <span className="font-bold text-base text-gray-900">{data.symbol}</span>
                                  </div>
                                  <div className="text-xs text-gray-600 font-normal bg-gray-100 px-3 py-1 rounded-full">
                                    {data.name?.slice(0, 25)}...
                                  </div>
                                  <StatusBadge status="success" text="Active" />
                                </motion.div>
                              ) : (
                                <div className="text-gray-400 font-normal">
                                  <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-2"></div>
                                  Select Stock {index + 1}
                                </div>
                              )}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {[
                          {
                            label: "Market Capitalization",
                            key: "marketCap",
                            suffix: " Cr",
                            icon: <Building2 className="w-4 h-4 text-green-600" />,
                            format: (value) => value !== "N/A" ? `₹${value} Cr` : "N/A"
                          },
                          {
                            label: "Current Trading Price",
                            key: "ltp",
                            icon: <TrendingUp className="w-4 h-4 text-blue-600" />,
                            format: (value) => value !== "N/A" ? `₹${value}` : "N/A"
                          },
                          {
                            label: "52W High / Low",
                            key: "highLow",
                            icon: <Activity className="w-4 h-4 text-purple-600" />,
                            format: (value) => value !== "N/A" ? `₹${value}` : "N/A"
                          },
                          {
                            label: "Price-to-Earnings Ratio",
                            key: "peRatio",
                            icon: <Calculator className="w-4 h-4 text-yellow-600" />,
                            format: (value) => value !== "N/A" ? `${value}x` : "N/A"
                          },
                          {
                            label: "Book Value per Share",
                            key: "bookValue",
                            icon: <FileText className="w-4 h-4 text-green-600" />,
                            format: (value) => value !== "N/A" ? `₹${value}` : "N/A"
                          },
                          {
                            label: "Dividend Yield",
                            key: "dividendYield",
                            icon: <PieChart className="w-4 h-4 text-blue-600" />,
                            format: (value) => value
                          },
                          {
                            label: "Return on Capital Employed",
                            key: "roce",
                            icon: <TrendingUp className="w-4 h-4 text-indigo-600" />,
                            format: (value) => value !== "N/A" ? `${value}%` : "N/A"
                          },
                          {
                            label: "Return on Equity",
                            key: "roe",
                            icon: <Target className="w-4 h-4 text-indigo-600" />,
                            format: (value) => value !== "N/A" ? `${value}%` : "N/A"
                          },
                          {
                            label: "Face Value",
                            key: "faceValue",
                            icon: <DollarSign className="w-4 h-4 text-green-600" />,
                            format: (value) => value !== "N/A" ? `₹${value}` : "N/A"
                          },
                        ].map((metric, index) => (
                          <motion.tr
                            key={metric.label}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.05 * index }}
                            className="hover:bg-gray-50 transition-colors group"
                          >
                            <td className="px-8 py-6 text-sm font-medium text-gray-900 sticky left-0 bg-white group-hover:bg-gray-50 border-r border-gray-200">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                                  {metric.icon}
                                </div>
                                <span className="font-semibold">{metric.label}</span>
                              </div>
                            </td>
                            {stockData.map((data, stockIndex) => (
                              <td
                                key={stockIndex}
                                className="px-8 py-6 text-center"
                              >
                                {data && data[metric.key] !== undefined ? (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.1 * stockIndex + 0.02 * index }}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                  >
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span className="text-sm font-semibold text-gray-900">
                                      {metric.format ? metric.format(data[metric.key]) : data[metric.key]}
                                    </span>
                                  </motion.div>
                                ) : (
                                  <div className="text-gray-400 font-medium">—</div>
                                )}
                              </td>
                            ))}
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>

              {/* Professional Analysis Sections */}
              <div className="space-y-6">
                {[
                  {
                    id: "eagleview",
                    title: "EagleView Rating Analysis",
                    description: "Comprehensive performance scoring based on multiple financial parameters",
                    icon: <Eye className="w-6 h-6" />,
                    color: "from-blue-500 to-blue-600",
                    bgColor: "bg-blue-50",
                    borderColor: "border-blue-200",
                    activeTab: activeTabEagleView,
                    setActiveTab: setActiveTabEagleView,
                    component: (data) => (
                      <StockRatingRadar
                        ratingsData={data.ratingsData}
                        stockName={data.name || data.symbol || 'N/A'}
                        allStockData={stockData}
                      />
                    ),
                  },
                  {
                    id: "balancesheet",
                    title: "Balance Sheet Analysis",
                    description: "Detailed breakdown of assets, liabilities, and shareholder equity",
                    icon: <Building2 className="w-6 h-6" />,
                    color: "from-green-500 to-green-600",
                    bgColor: "bg-green-50",
                    borderColor: "border-green-200",
                    activeTab: activeTabBalanceSheet,
                    setActiveTab: setActiveTabBalanceSheet,
                    component: (data) => (
                      <div className="space-y-8">
                        {Object.keys(data.financialData?.balance_sheet || {}).length ? (
                          <>
                            <FinancialTable
                              data={data.financialData.balance_sheet}
                              type="balanceSheet"
                              stockName={data.name || data.symbol || "Balance Sheet"}
                            />
                            <BalanceSheetTreeMap
                              data={data.financialData}
                              stockName={data.name || data.symbol || "Balance Sheet"}
                            />
                          </>
                        ) : (
                          <div className="bg-gray-50 rounded-xl p-12 text-center border border-gray-200">
                            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Balance Sheet Data</h3>
                            <p className="text-gray-600 mb-4">Balance sheet information for {data.symbol} is currently unavailable</p>
                            <StatusBadge status="warning" text="Data Unavailable" />
                          </div>
                        )}
                      </div>
                    ),
                  },
                  {
                    id: "cashflow",
                    title: "Cash Flow Analysis",
                    description: "Operating, investing, and financing cash flow activities",
                    icon: <DollarSign className="w-6 h-6" />,
                    color: "from-purple-500 to-purple-600",
                    bgColor: "bg-purple-50",
                    borderColor: "border-purple-200",
                    activeTab: activeTabCashFlow,
                    setActiveTab: setActiveTabCashFlow,
                    component: (data) => (
                      <div>
                        {Object.keys(data.financialData?.cash_flow || {}).length ? (
                          <FinancialTable
                            data={data.financialData.cash_flow}
                            type="cashFlow"
                            stockName={data.name || data.symbol || "Cash Flow"}
                          />
                        ) : (
                          <div className="bg-gray-50 rounded-xl p-12 text-center border border-gray-200">
                            <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Cash Flow Data</h3>
                            <p className="text-gray-600 mb-4">Cash flow information for {data.symbol} is currently unavailable</p>
                            <StatusBadge status="warning" text="Data Unavailable" />
                          </div>
                        )}
                      </div>
                    ),
                  },
                  {
                    id: "incomesheet",
                    title: "Income Statement Analysis",
                    description: "Revenue, expenses, and profitability metrics over time",
                    icon: <TrendingUp className="w-6 h-6" />,
                    color: "from-orange-500 to-orange-600",
                    bgColor: "bg-orange-50",
                    borderColor: "border-orange-200",
                    activeTab: activeTabIncomeSheet,
                    setActiveTab: setActiveTabIncomeSheet,
                    component: (data) => (
                      <div className="space-y-8">
                        {Object.keys(data.financialData?.profit_loss || {}).length ? (
                          <>
                            <FinancialTable
                              data={data.financialData.profit_loss}
                              type="profitLoss"
                              stockName={data.name || data.symbol || "Income Statement"}
                            />
                            <SalesProfitBarGraph
                              data={data.financialData}
                              stockName={data.name || data.symbol || "Income Statement"}
                            />
                          </>
                        ) : (
                          <div className="bg-gray-50 rounded-xl p-12 text-center border border-gray-200">
                            <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Income Statement Data</h3>
                            <p className="text-gray-600 mb-4">Income statement information for {data.symbol} is currently unavailable</p>
                            <StatusBadge status="warning" text="Data Unavailable" />
                          </div>
                        )}
                      </div>
                    ),
                  },
                  {
                    id: "shareholding",
                    title: "Shareholding Pattern Analysis",
                    description: "Ownership structure and distribution across investor categories",
                    icon: <Users className="w-6 h-6" />,
                    color: "from-pink-500 to-pink-600",
                    bgColor: "bg-pink-50",
                    borderColor: "border-pink-200",
                    activeTab: activeTabShareholding,
                    setActiveTab: setActiveTabShareholding,
                    component: (data) => (
                      <div>
                        {Object.keys(data.shareholdingData?.shareholding_pattern || {}).length ? (
                          <ShareholdingPatternBarGraph
                            data={data.shareholdingData}
                            stockName={data.name || data.symbol || "Shareholding"}
                          />
                        ) : (
                          <div className="bg-gray-50 rounded-xl p-12 text-center border border-gray-200">
                            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Shareholding Data</h3>
                            <p className="text-gray-600 mb-4">Shareholding pattern information for {data.symbol} is currently unavailable</p>
                            <StatusBadge status="warning" text="Data Unavailable" />
                          </div>
                        )}
                      </div>
                    ),
                  },
                ].map((section, index) => (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 * index }}
                  >
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                      <button
                        className={`w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-all duration-200 ${activeSection === section.id ? section.bgColor : ''
                          }`}
                        onClick={() => toggleSection(section.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl bg-gradient-to-r ${section.color} text-white shadow-lg`}>
                            {section.icon}
                          </div>
                          <div className="text-left">
                            <h3 className="text-xl font-bold text-gray-900">{section.title}</h3>
                            <p className="text-gray-600 mt-1 font-medium">{section.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <StatusBadge
                            status={activeSection === section.id ? "success" : "info"}
                            text={activeSection === section.id ? "Expanded" : "Click to Expand"}
                          />
                          <motion.div
                            animate={{ rotate: activeSection === section.id ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="p-2 bg-gray-100 rounded-lg"
                          >
                            <ChevronDown className="w-5 h-5 text-gray-600" />
                          </motion.div>
                        </div>
                      </button>

                      <AnimatePresence>
                        {activeSection === section.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                            className="overflow-hidden border-t border-gray-200"
                          >
                            <div className="p-8">
                              <ProfessionalTabs
                                stockData={stockData}
                                activeTab={section.activeTab}
                                setActiveTab={section.setActiveTab}
                                renderContent={section.component}
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Professional Footer */}
        {stockData.some(data => data && data.symbol) && (
          <div className="bg-gray-900 py-16">
            <div className="container mx-auto px-6">
              <div className="max-w-4xl mx-auto text-center">
                <motion.h3
                  className="text-3xl font-bold text-white mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  Analysis Complete
                </motion.h3>
                <motion.p
                  className="text-gray-300 text-lg mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  You've successfully analyzed {stockData.filter(data => data && data.symbol).length} stocks with institutional-grade metrics.
                  Use these insights to make informed investment decisions.
                </motion.p>

                <div className="grid md:grid-cols-3 gap-8 mb-12">
                  {[
                    {
                      icon: <Shield className="w-8 h-8" />,
                      title: "Institutional Quality",
                      description: "Professional-grade analysis tools used by fund managers and analysts",
                      color: "from-green-400 to-emerald-500"
                    },
                    {
                      icon: <Zap className="w-8 h-8" />,
                      title: "Real-Time Insights",
                      description: "Live market data and instant financial metric calculations",
                      color: "from-blue-400 to-indigo-500"
                    },
                    {
                      icon: <Award className="w-8 h-8" />,
                      title: "Comprehensive Coverage",
                      description: "Complete financial analysis across all major market segments",
                      color: "from-purple-400 to-pink-500"
                    }
                  ].map((feature, index) => (
                    <motion.div
                      key={index}
                      className="bg-gray-800 rounded-2xl p-8 border border-gray-700 hover:border-gray-600 transition-all"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      whileHover={{ y: -5 }}
                    >
                      <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${feature.color} mb-6`}>
                        {feature.icon}
                      </div>
                      <h4 className="text-xl font-bold text-white mb-3">{feature.title}</h4>
                      <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  className="flex flex-col sm:flex-row gap-4 justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <motion.button
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  >
                    <Plus className="w-5 h-5" />
                    Compare More Stocks
                  </motion.button>

                  <motion.button
                    className="px-8 py-4 bg-gray-800 text-white font-semibold rounded-xl border border-gray-600 hover:bg-gray-700 hover:border-gray-500 transition-all flex items-center gap-2"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Download className="w-5 h-5" />
                    Export Analysis
                  </motion.button>
                </motion.div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Professional Floating Action Menu */}
      {stockData.some(data => data && data.symbol) && (
        <motion.div
          className="fixed bottom-8 right-8 z-30"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.5 }}
        >
          <div className="flex flex-col gap-3">
            <motion.button
              className="p-4 bg-white text-gray-700 rounded-full shadow-lg hover:shadow-xl border border-gray-200 hover:bg-gray-50 transition-all"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              title="Back to Top"
            >
              <ChevronUp className="w-5 h-5" />
            </motion.button>

            <motion.button
              className="p-4 bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl hover:bg-blue-700 transition-all"
              whileHover={{ scale: 1.1, rotate: -5 }}
              whileTap={{ scale: 0.9 }}
              title="Bookmark Analysis"
            >
              <Bookmark className="w-5 h-5" />
            </motion.button>

            <motion.button
              className="p-4 bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl hover:bg-green-700 transition-all"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              title="Share Analysis"
            >
              <Share2 className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Professional Custom Styles */}
      <style jsx>{`
        /* Professional scrollbar styling */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #f8fafc;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #1d4ed8);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #1e40af);
        }

        /* Professional focus styles */
        .focus-visible:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        /* Professional animation delays */
        .animation-delay-100 { animation-delay: 100ms; }
        .animation-delay-200 { animation-delay: 200ms; }
        .animation-delay-300 { animation-delay: 300ms; }
        .animation-delay-400 { animation-delay: 400ms; }
        .animation-delay-500 { animation-delay: 500ms; }

        /* Professional shadow utilities */
        .shadow-professional {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .shadow-professional-lg {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        .shadow-professional-xl {
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        /* Professional gradient text */
        .gradient-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Professional backdrop blur fallback */
        @supports not (backdrop-filter: blur(12px)) {
          .backdrop-blur-sm {
            background-color: rgba(255, 255, 255, 0.85);
          }
          .backdrop-blur-xl {
            background-color: rgba(255, 255, 255, 0.9);
          }
        }

        /* Professional table enhancements */
        .professional-table {
          border-collapse: separate;
          border-spacing: 0;
        }
        .professional-table th:first-child {
          border-top-left-radius: 0.75rem;
        }
        .professional-table th:last-child {
          border-top-right-radius: 0.75rem;
        }
        .professional-table tr:last-child td:first-child {
          border-bottom-left-radius: 0.75rem;
        }
        .professional-table tr:last-child td:last-child {
          border-bottom-right-radius: 0.75rem;
        }

        /* Professional loading animation */
        @keyframes professional-pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        .professional-pulse {
          animation: professional-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        /* Professional hover effects */
        .professional-hover {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .professional-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        /* Professional border animations */
        .professional-border {
          position: relative;
          overflow: hidden;
        }
        .professional-border::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #3b82f6, transparent);
          transition: left 0.5s;
        }
        .professional-border:hover::before {
          left: 100%;
        }

        /* Professional typography */
        .professional-heading {
          font-weight: 700;
          letter-spacing: -0.025em;
          line-height: 1.2;
        }
        .professional-body {
          font-weight: 400;
          line-height: 1.6;
          color: #374151;
        }
        .professional-caption {
          font-weight: 500;
          font-size: 0.875rem;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Professional responsive utilities */
        @media (max-width: 640px) {
          .professional-mobile-stack > * {
            width: 100% !important;
            margin-bottom: 1rem;
          }
          .professional-mobile-hide {
            display: none !important;
          }
        }

        /* Professional print styles */
        @media print {
          .professional-no-print {
            display: none !important;
          }
          .professional-print-break {
            page-break-after: always;
          }
        }
      `}</style>
    </div>
  );
}