import React, { useState, useEffect, useCallback } from "react";
import {
  FaFilter, FaTimes, FaSearch, FaLock,
  FaChevronRight, FaArrowLeft, FaStar,
  FaChartLine, FaBalanceScale, FaRocket,
  FaSlidersH, FaEye,
  FaRegLightbulb, FaChartBar, FaThList, FaLayerGroup,
  FaLightbulb, FaArrowRight, FaBookmark,
  FaPlus, FaDollarSign, FaFileAlt, FaArrowUp
} from "react-icons/fa";
import Navbar from "./Navbar";
import axios from 'axios';
import io from 'socket.io-client';

const Screener = ({ auth_token }) => {
  // State variables
  const [filters, setFilters] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [selectedScreen, setSelectedScreen] = useState("");
  const [customStocks, setCustomStocks] = useState([]);
  const [isCustomFilterModalOpen, setIsCustomFilterModalOpen] = useState(false);
  const [customFilterFormula, setCustomFilterFormula] = useState("");
  const [customFilterName, setCustomFilterName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem("watchlist");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeTab, setActiveTab] = useState("stock-screener");
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [hoverCardIndex, setHoverCardIndex] = useState(null);
  const [animateHero, setAnimateHero] = useState(true);
  const [activeFilterCategory, setActiveFilterCategory] = useState("Basic");
  const [animatedElements, setAnimatedElements] = useState({});
  const [ltpData, setLtpData] = useState({});
  const [loading, setLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(20);
  const [selectedStock, setSelectedStock] = useState(null);
  const itemsPerPage = 20;
  const [totalStocks, setTotalStocks] = useState(0);
  const [socket, setSocket] = useState(null);
  const [quoteSubscriptions, setQuoteSubscriptions] = useState([]);
  const [alternateDataQuery, setAlternateDataQuery] = useState("");
  const [onlyDec2024, setOnlyDec2024] = useState(false);
  const [hasSuperstarInvestors, setHasSuperstarInvestors] = useState(false);
  const [isSME, setIsSME] = useState(false);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

  // New state for financial query builder
  const [financialQuery, setFinancialQuery] = useState({
    field: '',
    operator: '',
    value: '',
    fullQuery: ''
  });
  const [queryList, setQueryList] = useState([]);
  const [showFieldDropdown, setShowFieldDropdown] = useState(false);
  const [showOperatorDropdown, setShowOperatorDropdown] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Financial fields and operators
  // In Screener.js, update the financialFields array with these extracted fields:
  const financialFields = [
    // From Balance Sheet tab
    "Accounts Payable",
    "Accounts Receivable",
    "Advances",
    "Assets",
    "Borrowings",
    "Capital Work in Progress",
    "Cash & Bank Balances",
    "Cash & balance with Reserve Bank of India",
    "Contingent Liabilities",
    "Current Assets",
    "Current Liabilities",
    "Debt",
    "Deposits",
    "Enterprise Value",
    "Financial Leverage",
    "Gross Block",
    "Inventory",
    "Investments",
    "Liabilities",
    "Long Term Investment",
    "Net Block",
    "Non Current Assets",
    "Non Current Liabilities",
    "Number of Shares",
    "Reserves",
    "Revaluation Reserve",
    "Secured Loans",
    "Share Capital",
    "Share Warrants",
    "Shareholders Funds",
    "Short Term Investments",
    "Term Loans",
    "Total Capital Employed",
    "Unsecured Loans",
    "Working Capital",

    // Common financial metrics
    "Market Capitalization",
    "Market Cap To Sales",
    "PE Ratio",
    "Price To Book",
    "EV To EBITDA",
    "ROE",
    "ROCE",
    "Debt To Equity",
    "Current Ratio",

    // Growth metrics
    "10yr Growth",
    "5yr Growth",
    "3yr Growth",
    "1yr Growth",

    // Average metrics
    "10yr Avg",
    "5yr Avg",
    "3yr Avg",
    "1yr Avg"
  ];

  const operators = ["<", "<=", "=", ">", ">=", "!="];

  // Handler functions for financial query builder
  const handleFieldSelect = (field) => {
    setFinancialQuery(prev => ({
      ...prev,
      field,
      operator: '',
      value: ''
    }));
    setShowFieldDropdown(false);
    setShowOperatorDropdown(true);
    setActiveDropdown('operator');
  };

  const handleOperatorSelect = (operator) => {
    setFinancialQuery(prev => ({
      ...prev,
      operator
    }));
    setShowOperatorDropdown(false);
    setActiveDropdown('value');
  };

  const handleValueChange = (e) => {
    setFinancialQuery(prev => ({
      ...prev,
      value: e.target.value
    }));
  };

  const buildQueryString = () => {
    const { field, operator, value } = financialQuery;
    if (field && operator && value) {
      return `${field} ${operator} ${value}`;
    }
    return '';
  };


  const handleAddQuery = () => {
    const queryString = buildQueryString();
    if (queryString) {
      setQueryList(prev => [...prev, queryString]);
      setFinancialQuery({
        field: '',
        operator: '',
        value: '',
        fullQuery: queryString
      });
      setActiveDropdown(null);
    }
  };

  const handleClearQuery = () => {
    setFinancialQuery({
      field: '',
      operator: '',
      value: '',
      fullQuery: ''
    });
    setQueryList([]);
    setShowFieldDropdown(false);
    setShowOperatorDropdown(false);
    setActiveDropdown(null);
  };

  // Persist watchlist to local storage
  useEffect(() => {
    localStorage.setItem("watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  // Initialize WebSocket connection
  useEffect(() => {
    const socketIo = io(API_URL, {
      withCredentials: true,
    });
    setSocket(socketIo);

    socketIo.on('connect', () => {
      console.log('Connected to WebSocket:', socketIo.id);
    });

    socketIo.on('quotes', (data) => {
      setLtpData((prev) => {
        const updated = { ...prev };
        data.forEach(({ instrumentKey, quote }) => {
          if (quote) {
            updated[instrumentKey] = {
              last_price: quote.last_price,
              change: ((quote.last_price - quote.ohlc.open) / quote.ohlc.open * 100).toFixed(2),
            };
          }
        });
        return updated;
      });
    });

    socketIo.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
    });

    return () => {
      socketIo.disconnect();
      setSocket(null);
    };
  }, [API_URL]);

  useEffect(() => {
    const queryString = buildQueryString();
    setFinancialQuery(prev => ({ ...prev, fullQuery: queryString }));
  }, [financialQuery.field, financialQuery.operator, financialQuery.value]);

  // Utility function to calculate market cap
  const calculateMarketCap = (faceValue, equityCapital, ltp) => {
    if (faceValue === undefined || equityCapital === undefined || ltp === undefined || ltp === "N/A") {
      return "N/A";
    }
    const equityCapitalNum = typeof equityCapital === 'string'
      ? parseFloat(equityCapital.replace(/,/g, ""))
      : Number(equityCapital);
    const faceValueNum = typeof faceValue === 'string'
      ? parseFloat(faceValue.replace(/,/g, ""))
      : Number(faceValue);
    const ltpNum = typeof ltp === 'string'
      ? parseFloat(ltp.replace(/,/g, ""))
      : Number(ltp);
    if (isNaN(equityCapitalNum) || isNaN(faceValueNum) || isNaN(ltpNum)) return "N/A";
    if (faceValueNum <= 0 || equityCapitalNum <= 0) return "N/A";
    try {
      const sharesOutstanding = equityCapitalNum / faceValueNum;
      const marketCapInCrores = (sharesOutstanding * ltpNum) / 10000000;
      return marketCapInCrores.toFixed(2);
    } catch {
      return "N/A";
    }
  };

  // Format numbers with commas and appropriate units
  const formatNumber = (value) => {
    if (value === null || value === undefined || isNaN(value) || value === "N/A") return "N/A";
    if (value >= 10000000) return `${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `${(value / 100000).toFixed(2)} L`;
    return value.toLocaleString("en-IN");
  };

  // Categorize market cap
  const getMarketCapCategory = (marketCap) => {
    if (!marketCap || marketCap === "N/A" || isNaN(marketCap)) return "N/A";
    marketCap = parseFloat(marketCap);
    if (marketCap >= 20000) return "Large Cap";
    if (marketCap >= 5000) return "Mid Cap";
    return "Small Cap";
  };

  // Handle natural language query search
  const handleQuerySearch = (query) => {
    if (!query) return;
    const lowerQuery = query.toLowerCase();
    const newFilters = [];

    if (lowerQuery.includes("pe") || lowerQuery.includes("p/e")) {
      const peMatch = lowerQuery.match(/pe\s*(?:<|<=|=|>)\s*(\d+)/i);
      if (peMatch) {
        newFilters.push({
          key: "stock_pe",
          label: "PE Ratio",
          type: "range",
          min: 0,
          max: parseFloat(peMatch[1]),
        });
      }
    }
    if (lowerQuery.includes("revenue growth")) {
      const growthMatch = lowerQuery.match(/revenue growth\s*(?:>|>=)\s*(\d+)/i);
      if (growthMatch) {
        newFilters.push({
          key: "revenueGrowth",
          label: "Revenue Growth (%)",
          type: "range",
          min: parseFloat(growthMatch[1]),
          max: 500,
        });
      }
    }

    setFilters(newFilters);
    setSearchQuery("");
    setSelectedScreen("");
    setCurrentPage(1);
    setDisplayCount(20);
  };

  // Apply quick filter templates
  const applyQuickFilter = (filterName) => {
    const filterMap = {
      'High Growth': [{ key: 'revenueGrowth', min: 20, max: 500 }],
      'Value Picks': [{ key: 'stock_pe', min: 0, max: 15 }],
      'Strong Moat': [{ key: 'promoterHolding', min: 50, max: 100 }],
      'Rising Stars': [{ key: 'revenueGrowth', min: 30, max: 100 }],
    };

    const selectedFilters = filterMap[filterName] || [];
    setFilters(
      selectedFilters.map((f) => ({
        ...filterOptions.find((opt) => opt.key === f.key),
        min: f.min,
        max: f.max,
      }))
    );
    setSelectedScreen(filterName);
    setCurrentPage(1);
    setDisplayCount(20);
    setSearchQuery("");
    setCustomStocks([]);
  };

  // Fetch stocks method
  const fetchStocks = async () => {
    setLoading(true);
    try {
      const filterObj = {};

      if (activeTab === "stock-screener") {
        filters.forEach((filter) => {
          filterObj[filter.key] = { min: filter.min, max: filter.max };
        });
      }

      if (activeTab === "advanced-screener") {
        // Process queryList for financial queries
        if (queryList.length > 0) {
          filterObj.$and = queryList.map(query => {
            // Simple parsing for demonstration - in real app, you'd need more robust parsing
            if (query.includes(">")) {
              const [field, value] = query.split(">");
              return { [field.trim()]: { $gt: parseFloat(value.trim()) } };
            } else if (query.includes("<")) {
              const [field, value] = query.split("<");
              return { [field.trim()]: { $lt: parseFloat(value.trim()) } };
            } else if (query.includes("=")) {
              const [field, value] = query.split("=");
              return { [field.trim()]: parseFloat(value.trim()) };
            }
            return {};
          }).filter(item => Object.keys(item).length > 0);
        }

        // Add alternate data query filtering (simplified)
        if (alternateDataQuery) {
          const altLower = alternateDataQuery.toLowerCase();
          if (altLower.includes("technology")) {
            filterObj.sector = "Technology";
          }
          if (altLower.includes("banking")) {
            filterObj.sector = "Banking";
          }
          // Add more sophisticated parsing as needed
        }

        if (onlyDec2024) {
          filterObj.resultMonth = "December";
          filterObj.resultYear = 2024;
        }

        if (hasSuperstarInvestors) {
          filterObj.superstarInvestors = { $exists: true, $ne: [] };
        }

        if (isSME) {
          filterObj.isSME = true;
          filterObj.marketCap = { $lt: 500 };
        }
      }

      const sortObj = sortConfig.key
        ? { [sortConfig.key]: sortConfig.direction === 'asc' ? 1 : -1 }
        : { eagleViewScore: -1 };

      const response = await axios.get(`${API_URL}/api/stocks`, {
        params: {
          page: currentPage,
          limit: displayCount,
          filters: JSON.stringify(filterObj),
          sort: JSON.stringify(sortObj),
          search: searchQuery || undefined,
        },
      });

      const { stocks: fetchedStocks, total } = response.data;

      const enhancedStocks = fetchedStocks.map(stock => {
        let marketCapCalculated = stock.marketCap;
        if (!marketCapCalculated || marketCapCalculated === 0) {
          marketCapCalculated = calculateMarketCap(
            stock.faceValue,
            stock.equityCapital,
            ltpData[stock.instrumentKey]?.last_price || stock.price
          );
          if (marketCapCalculated !== "N/A") marketCapCalculated = parseFloat(marketCapCalculated);
          else marketCapCalculated = 0;
        }
        return {
          ...stock,
          marketCap: marketCapCalculated || 0,
          peRatio: stock.peRatio || stock.stock_pe || "N/A",
          price: ltpData[stock.instrumentKey]?.last_price || stock.price || 0,
          change: ltpData[stock.instrumentKey]?.change || stock.change || 0 ,
          eagleViewScore: stock.eagleViewScore || 0,
          roe: stock.roe || 0,
          roce: stock.roce || 0,
          dividendYield: stock.dividendYield || 0,
          revenueGrowth: stock.revenueGrowth || 0,
          promoterHolding: stock.promoterHolding || 0,
          instrumentKey: stock.instrumentKey || "",
          tradingSymbol: stock.tradingSymbol || stock.symbol || "",
          name: stock.name || "",
          sector: stock.sector || "N/A"
        };
      });

      setStocks(enhancedStocks);
      setFilteredStocks(enhancedStocks);
      setTotalStocks(total);

      const instrumentKeys = enhancedStocks
        .map((stock) => stock.instrumentKey)
        .filter((key) => key && !quoteSubscriptions.includes(key));

      if (instrumentKeys.length > 0 && socket) {
        socket.emit('subscribe_quotes', instrumentKeys);
        setQuoteSubscriptions((prev) => [...new Set([...prev, ...instrumentKeys])]);
      }
    } catch (error) {
      console.error('Error fetching stocks:', error);
      setStocks([]);
      setFilteredStocks([]);
      setTotalStocks(0);
    } finally {
      setLoading(false);
    }
  };

  const openFilterPanel = useCallback(() => {
    const initialTempFilters = filterOptions.reduce((acc, opt) => {
      const currentFilter = filters.find(f => f.key === opt.key);
      return {
        ...acc,
        [opt.key]: currentFilter
          ? { min: currentFilter.min, max: currentFilter.max }
          : { min: opt.min, max: opt.max }
      };
    }, {});

    setTempFilters(initialTempFilters);
    setIsFilterPanelOpen(true);
  }, [filters]);

  // Load stocks when dependencies change
  useEffect(() => {
    if (activeTab === "stock-screener" || activeTab === "advanced-screener") {
      fetchStocks();
    }
  }, [
    currentPage,
    displayCount,
    filters,
    sortConfig,
    searchQuery,
    socket,
    quoteSubscriptions,
    alternateDataQuery,
    onlyDec2024,
    hasSuperstarInvestors,
    isSME,
    activeTab,
    queryList // Add queryList to dependencies
  ]);

  // Clear all filters
  const clearFilters = () => {
    setFilters([]);
    setSearchQuery("");
    setSelectedScreen("");
    setCustomStocks([]);
    setFinancialQuery({
      field: '',
      operator: '',
      value: '',
      fullQuery: ''
    });
    setQueryList([]);
    setAlternateDataQuery("");
    setOnlyDec2024(false);
    setHasSuperstarInvestors(false);
    setIsSME(false);
    setCurrentPage(1);
  };

  // Reset and switch to stock screener
  const resetAllAndGoStockScreener = () => {
    clearFilters();
    setActiveTab("stock-screener");
    setIsFilterPanelOpen(false);
  };

  // Pagination computation
  const totalPages = Math.ceil(totalStocks / itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Toggle stock in watchlist
  const toggleWatchlist = (stock) => {
    const symbolToCompare = stock.tradingSymbol || stock.symbol;
    if (watchlist.some((item) => (item.tradingSymbol || item.symbol) === symbolToCompare)) {
      removeFromWatchlist(stock);
    } else {
      addToWatchlist(stock);
    }
  };


  const addToWatchlist = (stock) => {
    const symbolToCompare = stock.tradingSymbol || stock.symbol;
    if (!watchlist.some((item) => (item.tradingSymbol || item.symbol) === symbolToCompare)) {
      setWatchlist([...watchlist, stock]);
      const notification = document.createElement("div");
      notification.className = "fixed bottom-4 right-4 bg-white bg-opacity-90 text-gray-800 p-4 rounded-lg shadow-xl flex items-center gap-2 z-60 animate-notification";
      notification.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <span>${stock.name} added to watchlist</span>
      `;
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.className += " fade-out";
        setTimeout(() => document.body.removeChild(notification), 300);
      }, 3000);
    }
  };

  const removeFromWatchlist = (stock) => {
    const symbolToCompare = stock.tradingSymbol || stock.symbol;
    setWatchlist(watchlist.filter((item) => (item.tradingSymbol || item.symbol) !== symbolToCompare));
    const notification = document.createElement("div");
    notification.className = "fixed bottom-4 right-4 bg-white bg-opacity-90 text-gray-800 p-4 rounded-lg shadow-xl flex items-center gap-2 z-50 animate-notification";
    notification.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
      </svg>
      <span>${stock.name} removed from watchlist</span>
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.className += " fade-out";
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
  };

  // Open stock details modal
  const openStockDetails = async (stock) => {
    try {
      const response = await axios.get(`${API_URL}/api/stock/${stock.tradingSymbol || stock.symbol}`);
      setSelectedStock({
        ...stock,
        details: response.data
      });
    } catch (error) {
      console.error('Error fetching stock details:', error);
      // Still set the stock even if details fail to load
      setSelectedStock(stock);
    }
  };

  // Remove filter by index
  const removeFilter = (index) => {
    const updatedFilters = filters.filter((_, i) => i !== index);
    setFilters(updatedFilters);
  };

  // Remove query by index
  const removeQuery = (index) => {
    setQueryList(prev => prev.filter((_, i) => i !== index));
  };

  // Apply temporary filters
  const applyTempFilters = () => {
    const newFilters = Object.entries(tempFilters)
      .filter(([key, value]) => {
        const option = filterOptions.find(opt => opt.key === key);
        return (
          value.min !== option.min ||
          value.max !== option.max
        );
      })
      .map(([key, value]) => {
        const option = filterOptions.find(opt => opt.key === key);
        return {
          ...option,
          min: value.min !== undefined ? Number(value.min) : option.min,
          max: value.max !== undefined ? Number(value.max) : option.max,
        };
      });

    setFilters(newFilters);
    setIsFilterPanelOpen(false);
    setCurrentPage(1);
    setDisplayCount(20);
  };

  // Handle sort
  const handleSort = (key) => {
    const backendKeyMap = {
      'name': 'name',
      'marketCap': 'marketCap',
      'price': 'price',
      'change': 'change',
      'peRatio': 'peRatio',
      'roe': 'roe',
      'eagleViewScore': 'eagleViewScore',
      'dividendYield': 'dividendYield',
      'revenueGrowth': 'revenueGrowth',
      'promoterHolding': 'promoterHolding'
    };

    const backendKey = backendKeyMap[key] || key;

    setSortConfig((prev) => ({
      key: backendKey,
      direction: prev.key === backendKey && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Filter options
  const filterOptions = [
    { key: 'marketCap', label: 'Market Cap (₹ Cr)', type: 'range', min: 0, max: 1000000, category: 'Basic' },
    { key: 'peRatio', label: 'PE Ratio', type: 'range', min: 0, max: 100, category: 'Basic' },
    { key: 'revenueGrowth', label: '1Y Revenue Growth (%)', type: 'range', min: -100, max: 500, category: 'Financials' },
    { key: 'roe', label: 'Return on Equity (%)', type: 'range', min: -50, max: 100, category: 'Financials' },
    { key: 'dividendYield', label: 'Dividend Yield (%)', type: 'range', min: 0, max: 15, category: 'Financials' },
    { key: 'promoterHolding', label: 'Promoter Holding (%)', type: 'range', min: 0, max: 100, category: 'Ownership' },
  ];

  const [tempFilters, setTempFilters] = useState(() =>
    filterOptions.reduce((acc, opt) => ({
      ...acc,
      [opt.key]: {
        min: opt.min,
        max: opt.max
      },
    }), {})
  );

  // Get unique filter categories
  const filterCategories = [...new Set(filterOptions.map(filter => filter.category))];

  // Pre-built screens
  const preBuiltScreens = [
    { name: "EagleView Top Picks", filters: [{ key: "stock_pe", min: 0, max: 20 }, { key: "revenueGrowth", min: 10, max: 500 }] },
    { name: "Undervalued Gems", filters: [{ key: "stock_pe", min: 0, max: 15 }, { key: "promoterHolding", min: 50, max: 100 }] },
    { name: "High Flyers", filters: [{ key: "revenueGrowth", min: 20, max: 500 }, { key: "netProfit", min: 100, max: 100000 }] },
    { name: "Dividend Kings", filters: [{ key: "netProfit", min: 500, max: 100000 }] },
    { name: "Steady Compounders", filters: [{ key: "volatility", min: 0, max: 20 }] },
  ];

  // Featured filters
  const featuredFilters = [
    { name: "High Growth", description: "Stocks with >20% revenue growth", icon: <FaChartLine /> },
    { name: "Value Picks", description: "Low P/E ratio stocks", icon: <FaBalanceScale /> },
    { name: "Strong Moat", description: "High promoter holding", icon: <FaLock /> },
    { name: "Rising Stars", description: "High momentum stocks", icon: <FaRegLightbulb /> },
  ];

  // Score color function
  const getScoreColor = (score) => {
    if (score >= 80) return "bg-blue-500";
    if (score >= 60) return "bg-green-500";
    if (score >= 40) return "bg-yellow-500";
    if (score >= 20) return "bg-orange-500";
    return "bg-red-500";
  };

  // Animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimateHero(prev => !prev);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Tab labels and keys
  const tabs = [
    { key: "stock-screener", label: "Stock Screener" },
    { key: "advanced-screener", label: "Advanced Screener" },
    { key: "saved", label: "Saved" }
  ];

  return (
    <div className="min-h-screen w-screen font-sans text-gray-900 bg-gradient-to-br from-gray-50 to-blue-50 overflow-x-hidden">
      {/* Navbar */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-lg shadow-sm border-b border-gray-100">
        <Navbar />
      </div>

      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .floating {
          animation: float 4s ease-in-out infinite;
        }
        .pulse {
          animation: pulse 3s infinite;
        }
        .fadeIn {
          animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .glass-effect {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }
        .animate-notification {
          animation: fadeIn 0.3s ease forwards;
        }
        .fade-out {
          animation: fadeIn 0.3s ease reverse forwards;
          opacity: 0 !important;
        }
        .scrollbar-hide::-webkit-scrollbar {
         display: none;
       }
       .scrollbar-hide {
         -ms-overflow-style: none;
         scrollbar-width: none;
       }
      `}</style>

      <div className="w-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-24">
        {/* Tabs Header */}
        <div className="mb-8 flex justify-center space-x-2">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                px-6 py-2 rounded-full text-sm font-medium transition-all duration-300
                ${activeTab === tab.key
                  ? 'bg-black text-white dark:bg-white dark:text-black'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* STOCK SCREENER TAB */}
        {activeTab === "stock-screener" && (
          <>
            {/* Search bar - Made responsive */}
            <div className="max-w-2xl mx-auto mb-4 sm:mb-6 px-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search stocks, sectors, or strategies"
                  className="w-full px-4 py-2 sm:py-3 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 transition-all duration-300 text-sm sm:text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-black text-white p-1 sm:p-2 rounded-full hover:scale-105 transition-transform text-xs">
                  <FaSearch />
                </button>
              </div>
            </div>

            {/* Active Filters - Made responsive */}
            {filters.length > 0 && (
              <div className="max-w-4xl mx-auto mb-4 px-2">
                <div className="flex flex-wrap items-center gap-2">
                  {filters.map((filter, index) => (
                    <div
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium transition-all duration-200"
                    >
                      <span className="truncate max-w-[100px] sm:max-w-none">{filter.label}</span>
                      <button
                        onClick={() => removeFilter(index)}
                        className="w-3 h-3 rounded-full bg-gray-300 hover:bg-red-500 text-gray-600 hover:text-white flex items-center justify-center transition-all duration-200"
                      >
                        <FaTimes size={8} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={clearFilters}
                    className="ml-auto text-xs font-medium text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-full transition-all duration-200"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}

            {/* Filter Button - Made responsive */}
            <div className="mb-4 sm:mb-6 max-w-4xl mx-auto px-2">
              <button
                onClick={openFilterPanel}
                className="group inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg hover:shadow-xl hover:bg-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                type="button"
              >
                <div className="text-gray-600 group-hover:text-blue-500 transition-colors duration-300 transform group-hover:scale-110">
                  <FaSlidersH className="w-4 h-4" />
                </div>
                <span className="text-gray-900 font-medium tracking-tight group-hover:text-blue-600 transition-colors duration-300">
                  Add Filters
                </span>
              </button>
            </div>

            {/* Stocks Table - Made responsive with card view for mobile */}
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-apple-card overflow-hidden border border-gray-100/20 max-w-7xl mx-auto">
              {loading ? (
                <div className="p-6 sm:p-12">
                  <div className="space-y-4 sm:space-y-6">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 sm:space-x-6 animate-pulse" aria-hidden="true">
                        <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gray-200/60 rounded-2xl"></div>
                        <div className="flex-1 space-y-2 sm:space-y-3">
                          <div className="h-3 sm:h-4 bg-gray-200/60 rounded-full w-1/3"></div>
                          <div className="h-2 sm:h-3 bg-gray-200/40 rounded-full w-1/4"></div>
                        </div>
                        <div className="w-16 sm:w-24 h-3 sm:h-4 bg-gray-200/60 rounded-full"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (!Array.isArray(filteredStocks) || filteredStocks.length === 0) ? (
                <div className="text-center py-12 sm:py-24 px-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100/60 rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <FaSearch size={24} className="text-gray-400" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3 tracking-tight">No stocks found</h3>
                  <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-lg">Try adjusting your filters or search criteria</p>
                  <button
                    onClick={clearFilters}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-8 py-2 sm:py-4 rounded-2xl font-medium text-sm sm:text-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                    type="button"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block relative">
                    <div className="overflow-x-auto scrollbar-hide">
                      <table className="w-full min-w-[900px] border-separate border-spacing-0">
                        <thead className="bg-gray-50/30">
                          <tr>
                            {[
                              { key: 'name', label: 'Stock' },
                              { key: 'marketCap', label: 'Market Cap' },
                              { key: 'price', label: 'Price' },
                              { key: 'change', label: 'Change' },
                              { key: 'peRatio', label: 'P/E Ratio' },
                              { key: 'roe', label: 'ROE' },
                              { label: 'Actions' }
                            ].map(({ key, label }) => (
                              <th
                                key={label}
                                onClick={() => key && handleSort(key)}
                                className="px-4 sm:px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 transition-colors group"
                              >
                                <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                                  <span className="text-xs">{label}</span>
                                  {key && sortConfig.key === key && (
                                    <span className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                    </span>
                                  )}
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStocks.map((stock, index) => (
                            <tr
                              key={stock.id || index}
                              className="transition-all duration-300 hover:bg-gray-50/50 hover:scale-[1.01] origin-center group"
                            >
                              <td className="px-4 sm:px-6 py-3 border-t border-gray-100/50">
                                <div className="flex items-center space-x-3">
                                  <div>
                                    <div className="font-semibold text-[#1d1d1f] group-hover:text-blue-700 transition-colors text-sm">
                                      {stock.name}
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center">
                                      <span>{stock.tradingSymbol || stock.symbol}</span>
                                      {stock.sector && stock.sector !== "N/A" && (
                                        <>
                                          <span className="mx-1 sm:mx-2 text-gray-300">•</span>
                                          <span className="bg-gray-100 px-2 py-1 rounded-full text-xs font-medium">
                                            {stock.sector}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 sm:px-6 py-3 border-t border-gray-100/50 text-right">
                                <div className="font-semibold text-[#1d1d1f] text-sm">
                                  {stock.marketCap !== "N/A" && !isNaN(stock.marketCap)
                                    ? `₹${formatNumber(stock.marketCap)}`
                                    : "N/A"}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {getMarketCapCategory(stock.marketCap)}
                                </div>
                              </td>
                              <td className="px-4 sm:px-6 py-3 border-t border-gray-100/50 text-right">
                                <div className="font-semibold text-[#1d1d1f] bg-gray-100/50 px-2 py-1 rounded-full inline-block text-sm">
                                  ₹{formatNumber(ltpData[stock.instrumentKey]?.last_price || stock.price)}
                                </div>
                              </td>
                              <td className="px-4 sm:px-6 py-3 border-t border-gray-100/50 text-right">
                                <div className={`font-semibold ${stock.change >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'} px-2 py-1 rounded-full inline-block text-sm`}>
                                  {stock.change !== undefined && stock.change !== null
                                    ? `${stock.change >= 0 ? '+' : ''}${parseFloat(stock.change).toFixed(2)}%`
                                    : 'N/A'}
                                </div>
                              </td>
                              <td className="px-4 sm:px-6 py-3 border-t border-gray-100/50 text-right">
                                <div className="font-semibold text-[#1d1d1f] bg-gray-100/50 px-2 py-1 rounded-full inline-block text-sm">
                                  {stock.peRatio}
                                </div>
                              </td>
                              <td className="px-4 sm:px-6 py-3 border-t border-gray-100/50 text-right">
                                <div className={`font-semibold ${stock.roe > 15 ? 'text-green-600 bg-green-50' : 'text-[#1d1d1f] bg-gray-100/50'} px-2 py-1 rounded-full inline-block text-sm`}>
                                  {stock.roe ? `${stock.roe.toFixed(2)}%` : 'N/A'}
                                </div>
                              </td>
                              <td className="px-4 sm:px-6 py-3 border-t border-gray-100/50 text-center">
                                <div className="flex items-center justify-center space-x-2">
                                  <button
                                    onClick={() => toggleWatchlist(stock)}
                                    className={`p-1 sm:p-2 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 ${watchlist.some((w) => w.tradingSymbol === (stock.tradingSymbol || stock.symbol))
                                      ? 'bg-yellow-100 text-yellow-600'
                                      : 'bg-gray-100 text-gray-400 hover:text-yellow-600'}`}
                                    title={watchlist.some((w) => w.tradingSymbol === (stock.tradingSymbol || stock.symbol))
                                      ? 'Remove from Watchlist'
                                      : 'Add to Watchlist'}
                                  >
                                    <FaBookmark size={14} />
                                  </button>
                                  <button
                                    onClick={() => openStockDetails(stock)}
                                    className="p-1 sm:p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all duration-300 hover:scale-110 active:scale-95"
                                    title="View Details"
                                  >
                                    <FaEye size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden p-4">
                    {filteredStocks.map((stock, index) => (
                      <div key={stock.id || index} className="bg-white rounded-xl shadow-md p-4 mb-4 border border-gray-100">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900 text-sm">{stock.name}</h3>
                            <p className="text-xs text-gray-500">{stock.tradingSymbol || stock.symbol}</p>
                            {stock.sector && stock.sector !== "N/A" && (
                              <span className="inline-block bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-700 mt-1">
                                {stock.sector}
                              </span>
                            )}
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => toggleWatchlist(stock)}
                              className={`p-1 rounded-full ${watchlist.some((w) => w.tradingSymbol === (stock.tradingSymbol || stock.symbol))
                                ? 'bg-yellow-100 text-yellow-600'
                                : 'bg-gray-100 text-gray-400'}`}
                            >
                              <FaBookmark size={12} />
                            </button>
                            <button
                              onClick={() => openStockDetails(stock)}
                              className="p-1 rounded-full bg-blue-100 text-blue-600"
                            >
                              <FaEye size={12} />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <p className="text-gray-500">Price</p>
                            <p className="font-medium">₹{formatNumber(ltpData[stock.instrumentKey]?.last_price || stock.price)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Change</p>
                            <p className={`font-medium ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {stock.change !== undefined && stock.change !== null
                                ? `${stock.change >= 0 ? '+' : ''}${parseFloat(stock.change).toFixed(2)}%`
                                : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Market Cap</p>
                            <p className="font-medium">
                              {stock.marketCap !== "N/A" && !isNaN(stock.marketCap)
                                ? `₹${formatNumber(stock.marketCap)}`
                                : "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">P/E Ratio</p>
                            <p className="font-medium">{stock.peRatio}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">ROE</p>
                            <p className="font-medium">{stock.roe ? `${stock.roe.toFixed(2)}%` : 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Cap Size</p>
                            <p className="font-medium">{getMarketCapCategory(stock.marketCap)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Filter Panel - Made responsive */}
            {isFilterPanelOpen && (
              <div className="fixed inset-0 bg-black/30 backdrop-blur-xl z-50 flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
                <div className="bg-white/90 backdrop-blur-2xl rounded-2xl sm:rounded-[24px] shadow-2xl border border-white/20 w-full max-w-full sm:max-w-6xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden">
                  <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-100/30 flex items-center justify-between">
                    <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">
                      Filters
                    </h3>
                    <button
                      onClick={() => {
                        setIsFilterPanelOpen(false);
                        setTempFilters(
                          filterOptions.reduce((acc, opt) => ({
                            ...acc,
                            [opt.key]: { min: opt.min, max: opt.max },
                          }), {})
                        );
                      }}
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-100/60 hover:bg-gray-200/60 flex items-center justify-center transition-all duration-300 backdrop-blur-sm"
                      aria-label="Close filter panel"
                      type="button"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 14 14"
                        fill="none"
                        className="text-gray-600"
                      >
                        <path
                          d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row max-h-[calc(90vh-120px)] sm:max-h-[calc(85vh-140px)]">
                    {/* Sidebar */}
                    <div className="w-full sm:w-72 bg-gray-50/50 border-b sm:border-b-0 sm:border-r border-gray-100/30 p-4 sm:p-6 overflow-y-auto">
                      <h4 className="text-lg font-medium text-gray-900 mb-4 sm:mb-6 tracking-tight">
                        Categories
                      </h4>
                      <div className="space-y-2">
                        {filterCategories.map((category) => (
                          <button
                            key={category}
                            onClick={() => setActiveFilterCategory(category)}
                            className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-medium transition-all duration-300 text-sm sm:text-base ${activeFilterCategory === category
                              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                              : 'text-gray-700 hover:bg-gray-100/60 hover:backdrop-blur-sm'
                              }`}
                            type="button"
                          >
                            {category}
                          </button>
                        ))}
                        <button
                          onClick={() => setIsCustomFilterModalOpen(true)}
                          className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-medium text-gray-700 hover:bg-gray-100/60 transition-all duration-300 flex items-center mt-4 sm:mt-6 border border-gray-200/50 text-sm sm:text-base"
                          type="button"
                        >
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 12 12"
                            fill="none"
                            className="mr-2 sm:mr-3 text-blue-500"
                          >
                            <path
                              d="M6 1V11M1 6H11"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                          </svg>
                          Create Custom Filter
                        </button>
                      </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 p-4 sm:p-8 overflow-y-auto">
                      <h4 className="text-lg font-medium text-gray-900 mb-4 sm:mb-8 tracking-tight">
                        {activeFilterCategory} Filters
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                        {filterOptions
                          .filter((opt) => opt.category === activeFilterCategory)
                          .map((filter) => (
                            <div key={filter.key} className="space-y-3 sm:space-y-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                                {filter.label}
                              </label>
                              <div className="space-y-2 sm:space-y-3">
                                <div className="flex items-center space-x-2 sm:space-x-3">
                                  <div className="flex-1">
                                    <input
                                      type="number"
                                      placeholder="Min"
                                      value={tempFilters[filter.key]?.min ?? ''}
                                      onChange={(e) =>
                                        setTempFilters({
                                          ...tempFilters,
                                          [filter.key]: {
                                            ...tempFilters[filter.key],
                                            min: e.target.value,
                                          },
                                        })
                                      }
                                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50/70 border border-gray-200/50 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 placeholder:text-gray-400 text-sm"
                                    />
                                  </div>
                                  <div className="flex-shrink-0">
                                    <div className="w-4 sm:w-8 h-px bg-gray-300"></div>
                                  </div>
                                  <div className="flex-1">
                                    <input
                                      type="number"
                                      placeholder="Max"
                                      value={tempFilters[filter.key]?.max ?? ''}
                                      onChange={(e) =>
                                        setTempFilters({
                                          ...tempFilters,
                                          [filter.key]: {
                                            ...tempFilters[filter.key],
                                            max: e.target.value,
                                          },
                                        })
                                      }
                                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50/70 border border-gray-200/50 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 placeholder:text-gray-400 text-sm"
                                    />
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    setTempFilters({
                                      ...tempFilters,
                                      [filter.key]: { min: filter.min, max: filter.max }
                                    });
                                  }}
                                  className="text-blue-500 hover:text-blue-600 text-xs sm:text-sm font-medium transition-colors duration-300"
                                  type="button"
                                >
                                  Reset to Default
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-4 sm:px-8 py-4 sm:py-6 border-t border-gray-100/30 flex justify-end space-x-2 sm:space-x-3 bg-gray-50/30">
                    <button
                      onClick={() => {
                        setIsFilterPanelOpen(false);
                        setTempFilters(
                          filterOptions.reduce((acc, opt) => ({
                            ...acc,
                            [opt.key]: { min: opt.min, max: opt.max },
                          }), {})
                        );
                      }}
                      className="px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-gray-600 hover:bg-gray-100/60 transition-all duration-300 font-medium text-sm sm:text-base"
                      type="button"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={applyTempFilters}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-medium transition-all duration-300 shadow-lg shadow-blue-500/20 text-sm sm:text-base"
                      type="button"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Filter Modal - Made responsive */}
            {isCustomFilterModalOpen && (
              <div className="fixed inset-0 bg-black/20 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
                <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 w-full max-w-full sm:max-w-md p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight">Create Custom Filter</h3>
                    <button
                      onClick={() => setIsCustomFilterModalOpen(false)}
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200"
                      type="button"
                      aria-label="Close custom filter modal"
                    >
                      <FaTimes size={12} className="text-gray-600" />
                    </button>
                  </div>
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Filter Name
                      </label>
                      <input
                        type="text"
                        value={customFilterName}
                        onChange={(e) => setCustomFilterName(e.target.value)}
                        placeholder="e.g., High Growth Low Debt"
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                        aria-label="Custom filter name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Formula
                      </label>
                      <textarea
                        value={customFilterFormula}
                        onChange={(e) => setCustomFilterFormula(e.target.value)}
                        placeholder="e.g., stock_pe < 15 && revenueGrowth > 20"
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none text-sm"
                        rows={3}
                        aria-label="Custom filter formula"
                      />
                    </div>
                  </div>
                  <div className="mt-6 sm:mt-8 flex justify-end space-x-2 sm:space-x-3">
                    <button
                      onClick={() => setIsCustomFilterModalOpen(false)}
                      className="px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-gray-600 hover:bg-gray-100 transition-all duration-200 font-medium text-sm sm:text-base"
                      type="button"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (customFilterName && customFilterFormula) {
                          setFilters(prev => [
                            ...prev,
                            {
                              key: `custom_${customFilterName.toLowerCase().replace(/\s/g, '_')}`,
                              label: customFilterName,
                              type: 'custom',
                              formula: customFilterFormula,
                            },
                          ]);
                          setCustomFilterName('');
                          setCustomFilterFormula('');
                          setIsCustomFilterModalOpen(false);
                        }
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all duration-200 shadow-lg shadow-blue-500/25 text-sm sm:text-base"
                      type="button"
                    >
                      Save Filter
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Stock Details Modal - Made responsive */}
            {selectedStock && (
              <div className="fixed inset-0 bg-black/20 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
                <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 w-full max-w-full sm:max-w-4xl max-h-[90vh] overflow-hidden">
                  <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-100/50 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">
                        {selectedStock.name}
                      </h3>
                      <p className="text-gray-500 text-xs sm:text-sm mt-1">
                        {selectedStock.tradingSymbol}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedStock(null)}
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200"
                      type="button"
                      aria-label="Close stock details modal"
                    >
                      <FaTimes size={12} className="text-gray-600" />
                    </button>
                  </div>
                  <div className="p-4 sm:p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-4 sm:mb-6 tracking-tight">Key Metrics</h4>
                        <div className="space-y-3 sm:space-y-4">
                          <div className="flex justify-between items-center py-2 sm:py-3 border-b border-gray-100">
                            <span className="text-gray-600 text-sm">Market Cap</span>
                            <span className="font-medium text-gray-900 text-sm">
                              {selectedStock.marketCap !== "N/A" && selectedStock.marketCap !== 0 ? (
                                `₹${formatNumber(selectedStock.marketCap)}`
                              ) : (
                                "N/A"
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 sm:py-3 border-b border-gray-100">
                            <span className="text-gray-600 text-sm">Current Price</span>
                            <span className="font-medium text-gray-900 text-sm">
                              ₹{formatNumber(ltpData[selectedStock.instrumentKey]?.last_price || selectedStock.price)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 sm:py-3 border-b border-gray-100">
                            <span className="text-gray-600 text-sm">P/E Ratio</span>
                            <span className="font-medium text-gray-900 text-sm">{selectedStock.peRatio}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 sm:py-3 border-b border-gray-100">
                            <span className="text-gray-600 text-sm">ROE</span>
                            <span className="font-medium text-gray-900 text-sm">{selectedStock.roe ? selectedStock.roe.toFixed(2) : 'N/A'}%</span>
                          </div>
                          <div className="flex justify-between items-center py-2 sm:py-3">
                            <span className="text-gray-600 text-sm">Dividend Yield</span>
                            <span className="font-medium text-gray-900 text-sm">{selectedStock.dividendYield ? selectedStock.dividendYield.toFixed(2) : '0.00'}%</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-4 sm:mb-6 tracking-tight">Company Overview</h4>
                        <p className="text-gray-600 leading-relaxed mb-4 sm:mb-6 text-sm">
                          {selectedStock.details?.description || 'No company description available.'}
                        </p>
                        <div className="space-y-3 sm:space-y-4">
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Sector</h5>
                            <span className="inline-block bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-700">
                              {selectedStock.sector || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Eagle View Score</h5>
                            <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full ${getScoreColor(selectedStock.eagleViewScore || 0)} flex items-center justify-center text-white font-semibold text-base sm:text-lg shadow-lg`}>
                              {selectedStock.eagleViewScore || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 sm:px-8 py-4 sm:py-6 border-t border-gray-100/50 flex justify-end">
                    <button
                      onClick={() => toggleWatchlist(selectedStock)}
                      className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all duration-200 shadow-lg ${watchlist.some((w) => w.tradingSymbol === (selectedStock.tradingSymbol || selectedStock.symbol))
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      type="button"
                    >
                      {watchlist.some((w) => w.tradingSymbol === (selectedStock.tradingSymbol || selectedStock.symbol))
                        ? 'Remove from Watchlist'
                        : 'Add to Watchlist'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ADVANCED SCREENER TAB */}
        {activeTab === "advanced-screener" && (
  <>
    <div className="bg-white rounded-lg md:rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Two-column layout for larger screens, stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Financial Query Section */}
        <div>
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">FINANCIAL QUERY</h3>
            <button
              onClick={handleClearQuery}
              className="text-xs md:text-sm text-gray-500 hover:text-red-500"
              type="button"
            >
              Clear
            </button>
          </div>

          <div className="space-y-3 md:space-y-4">
            {/* Field Selection */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search financial fields..."
                className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={financialQuery.field}
                onChange={(e) => {
                  setFinancialQuery(prev => ({ ...prev, field: e.target.value }));
                  setShowFieldDropdown(e.target.value.length > 0);
                }}
                onFocus={() => {
                  if (financialQuery.field.length > 0) {
                    setShowFieldDropdown(true);
                  }
                }}
                onBlur={() => setTimeout(() => setShowFieldDropdown(false), 200)}
              />
              {showFieldDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {financialFields
                    .filter(field =>
                      field.toLowerCase().includes(financialQuery.field.toLowerCase())
                    )
                    .map((field) => (
                      <div
                        key={field}
                        className="px-3 md:px-4 py-2 cursor-pointer hover:bg-blue-50 text-sm md:text-base"
                        onClick={() => {
                          handleFieldSelect(field);
                          setShowFieldDropdown(false);
                        }}
                      >
                        {field}
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Operator and Value Inputs */}
            {financialQuery.field && (
              <div className="grid grid-cols-12 gap-2">
                {/* Operator Selection */}
                <div className="col-span-4 md:col-span-3 relative">
                  <input
                    type="text"
                    placeholder="Operator"
                    className="w-full px-2 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={financialQuery.operator}
                    onFocus={() => {
                      setShowOperatorDropdown(true);
                      setActiveDropdown('operator');
                    }}
                    readOnly
                  />
                  {showOperatorDropdown && activeDropdown === 'operator' && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                      {operators.map((op) => (
                        <div
                          key={op}
                          className="px-3 md:px-4 py-2 cursor-pointer hover:bg-blue-50 text-sm md:text-base"
                          onClick={() => handleOperatorSelect(op)}
                        >
                          {op}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Value Input */}
                <div className="col-span-5 md:col-span-6">
                  <input
                    type="text"
                    placeholder="Value"
                    className="w-full px-2 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={financialQuery.value}
                    onChange={handleValueChange}
                    onFocus={() => setActiveDropdown('value')}
                  />
                </div>

                {/* Add Button */}
                <div className="col-span-3">
                  <button
                    onClick={handleAddQuery}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-2 md:px-4 py-2 md:py-3 text-sm md:text-base rounded-lg font-medium"
                    disabled={!financialQuery.field || !financialQuery.operator || !financialQuery.value}
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Example queries */}
            <div className="mt-2 md:mt-3">
              <p className="text-xs md:text-sm text-gray-500">Try searching for:</p>
              <div className="flex flex-wrap gap-1 md:gap-2 mt-1 md:mt-2">
                {[
                  "Accounts Payable > 100",
                  "Current Assets / Current Liabilities > 1.5",
                  "Debt To Equity < 1",
                  "ROE > 15",
                  "5yr Growth Revenue > 20%"
                ].map((query, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      // Simple parsing for example queries
                      const parts = query.split(/([<>=/]+)/);
                      if (parts.length >= 3) {
                        setFinancialQuery({
                          field: parts[0].trim(),
                          operator: parts[1].trim(),
                          value: parts[2].trim(),
                          fullQuery: query
                        });
                      }
                      setShowFieldDropdown(false);
                    }}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-full"
                    type="button"
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Alternate Data Query Section */}
        <div>
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">ALTERNATE DATA QUERY</h3>
            <button
              onClick={() => setAlternateDataQuery('')}
              className="text-xs md:text-sm text-gray-500 hover:text-red-500"
              type="button"
              aria-label="Clear alternate data query"
            >
              Clear
            </button>
          </div>
          <div className="relative">
            <textarea
              rows={4}
              placeholder="Example: Companies getting revenue from China"
              className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              value={alternateDataQuery}
              onChange={(e) => setAlternateDataQuery(e.target.value)}
              aria-label="Alternate data query input"
            />
          </div>
          <div className="mt-2 md:mt-3">
            <p className="text-xs md:text-sm text-gray-500">Try these:</p>
            <div className="flex flex-wrap gap-1 md:gap-2 mt-1 md:mt-2">
              {[
                "Revenue from China > 10%",
                "Companies in Technology sector",
                "Market share > 20%",
                "Companies with December results"
              ].map((query, i) => (
                <button
                  key={i}
                  onClick={() => setAlternateDataQuery(query)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-full"
                  type="button"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Checkboxes for additional filters - responsive layout */}
      <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-4 md:mb-6 max-w-4xl mx-auto px-1 md:px-2">
        <label className="flex items-center space-x-2 text-gray-700 text-sm md:text-base">
          <input
            type="checkbox"
            checked={onlyDec2024}
            onChange={() => setOnlyDec2024(!onlyDec2024)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span>Dec 2024 Results</span>
        </label>
        <label className="flex items-center space-x-2 text-gray-700 text-sm md:text-base">
          <input
            type="checkbox"
            checked={hasSuperstarInvestors}
            onChange={() => setHasSuperstarInvestors(!hasSuperstarInvestors)}
            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
          <span>Superstar Investors</span>
        </label>
        <label className="flex items-center space-x-2 text-gray-700 text-sm md:text-base">
          <input
            type="checkbox"
            checked={isSME}
            onChange={() => setIsSME(!isSME)}
            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <span>SME</span>
        </label>
      </div>

      {/* Sample Queries */}
      <div>
        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Sample Queries</h3>
        <div className="space-y-3 md:space-y-4 max-w-4xl mx-auto">
          <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-1 md:mb-2 text-sm md:text-base">FINANCIAL QUERY</h4>
                <p className="text-xs md:text-sm text-gray-600">
                  3yr avg ROE {'>'} 15% and<br />
                  Operating Profit Margin {'>'} 11% and<br />
                  1yr Growth Net Profit {'>'} 19% and<br />
                  3yr Growth Net Profit {'>'} 19%
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-1 md:mb-2 text-sm md:text-base">ALTERNATE DATA QUERY</h4>
                <p className="text-xs md:text-sm text-gray-600">
                  market share {'>'} 20% and<br />
                  revenue from India {'>'} 10%
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setQueryList(prev => [...prev, "3yr avg ROE > 15% and Operating Profit Margin > 11% and 1yr Growth Net Profit > 19% and 3yr Growth Net Profit > 19%"]);
                setAlternateDataQuery("market share > 20% and revenue from India > 10%");
              }}
              className="mt-2 md:mt-3 text-xs md:text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-4 py-1 md:py-2 rounded-lg"
              type="button"
            >
              Run This Query
            </button>
          </div>
          <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-1 md:mb-2 text-sm md:text-base">FINANCIAL QUERY</h4>
                <p className="text-xs md:text-sm text-gray-600">
                  latest quarter mutual fund holding {'>'} last quarter mutual fund holding and<br />
                  PE {'<'} 10 and PE {'>'} 1
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-1 md:mb-2 text-sm md:text-base">ALTERNATE DATA QUERY</h4>
                <p className="text-xs md:text-sm text-gray-600">
                  companies not in financial services and<br />
                  market share {'>'} 25%
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setQueryList(prev => [...prev, "latest quarter mutual fund holding > last quarter mutual fund holding and PE < 10 and PE > 1"]);
                setAlternateDataQuery("companies not in financial services and market share > 25%");
              }}
              className="mt-2 md:mt-3 text-xs md:text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-4 py-1 md:py-2 rounded-lg"
              type="button"
            >
              Run This Query
            </button>
          </div>
        </div>
      </div>

      {/* Search Stocks Button */}
      <div className="mt-4 md:mt-6 text-center">
        <button
          onClick={() => {
            setCurrentPage(1);
            fetchStocks();
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 md:px-8 md:py-3 rounded-lg font-medium transition-all shadow-lg hover:shadow-xl text-sm md:text-base"
          type="button"
        >
          SEARCH STOCKS
        </button>
      </div>

      {/* Active Filters Display */}
      {(filters.length > 0 || selectedScreen || queryList.length > 0 || alternateDataQuery || onlyDec2024 || hasSuperstarInvestors || isSME) && (
        <div className="mb-4 md:mb-6 mt-4 md:mt-6">
          <div className="flex flex-wrap items-center gap-2 md:gap-3 max-w-7xl mx-auto">
            <span className="text-xs md:text-sm font-medium text-gray-700">Active Filters:</span>
            {selectedScreen && (
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-2 md:px-4 py-1 md:py-2 rounded-xl flex items-center font-medium text-xs md:text-sm">
                <FaFilter className="mr-1 md:mr-2" size={12} />
                {selectedScreen}
                <button
                  onClick={() => setSelectedScreen("")}
                  className="ml-1 md:ml-2 text-purple-500 hover:text-purple-700"
                  type="button"
                  aria-label="Remove selected screen filter"
                >
                  <FaTimes size={10} />
                </button>
              </div>
            )}
            {filters.map((filter, index) => (
              <div key={index} className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 px-2 md:px-4 py-1 md:py-2 rounded-xl flex items-center font-medium text-xs md:text-sm">
                <span>{filter.label}: {filter.min} - {filter.max}</span>
                <button
                  onClick={() => removeFilter(index)}
                  className="ml-1 md:ml-2 text-blue-500 hover:text-blue-700"
                  type="button"
                  aria-label={`Remove filter ${filter.label}`}
                >
                  <FaTimes size={10} />
                </button>
              </div>
            ))}
            {queryList.map((query, index) => (
              <div key={index} className="bg-gradient-to-r from-green-100 to-green-200 text-green-700 px-2 md:px-4 py-1 md:py-2 rounded-xl flex items-center font-medium text-xs md:text-sm">
                <FaDollarSign className="mr-1 md:mr-2" size={12} />
                {query.length > 20 ? `${query.substring(0, 20)}...` : query}
                <button
                  onClick={() => removeQuery(index)}
                  className="ml-1 md:ml-2 text-green-500 hover:text-green-700"
                  type="button"
                  aria-label="Remove financial query"
                >
                  <FaTimes size={10} />
                </button>
              </div>
            ))}
            {alternateDataQuery && (
              <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-700 px-2 md:px-4 py-1 md:py-2 rounded-xl flex items-center font-medium text-xs md:text-sm">
                <FaChartLine className="mr-1 md:mr-2" size={12} />
                {alternateDataQuery.length > 20 ? `${alternateDataQuery.substring(0, 20)}...` : alternateDataQuery}
                <button
                  onClick={() => setAlternateDataQuery("")}
                  className="ml-1 md:ml-2 text-yellow-500 hover:text-yellow-700"
                  type="button"
                  aria-label="Remove alternate data query"
                >
                  <FaTimes size={10} />
                </button>
              </div>
            )}
            {onlyDec2024 && (
              <div className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 px-2 md:px-4 py-1 md:py-2 rounded-xl flex items-center font-medium text-xs md:text-sm">
                Dec 2024 Results
                <button
                  onClick={() => setOnlyDec2024(false)}
                  className="ml-1 md:ml-2 text-blue-500 hover:text-blue-700"
                  type="button"
                  aria-label="Remove Dec 2024 results filter"
                >
                  <FaTimes size={10} />
                </button>
              </div>
            )}
            {hasSuperstarInvestors && (
              <div className="bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 px-2 md:px-4 py-1 md:py-2 rounded-xl flex items-center font-medium text-xs md:text-sm">
                Superstar Investors
                <button
                  onClick={() => setHasSuperstarInvestors(false)}
                  className="ml-1 md:ml-2 text-purple-500 hover:text-purple-700"
                  type="button"
                  aria-label="Remove superstar investors filter"
                >
                  <FaTimes size={10} />
                </button>
              </div>
            )}
            {isSME && (
              <div className="bg-gradient-to-r from-green-100 to-green-200 text-green-700 px-2 md:px-4 py-1 md:py-2 rounded-xl flex items-center font-medium text-xs md:text-sm">
                SME
                <button
                  onClick={() => setIsSME(false)}
                  className="ml-1 md:ml-2 text-green-500 hover:text-green-700"
                  type="button"
                  aria-label="Remove SME filter"
                >
                  <FaTimes size={10} />
                </button>
              </div>
            )}
            <button
              onClick={clearFilters}
              className="text-gray-500 hover:text-red-500 px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm flex items-center transition-colors ml-auto"
              type="button"
            >
              Clear All <FaTimes size={10} className="ml-1" />
            </button>
          </div>
        </div>
      )}

      {/* Stocks Display - Table for desktop, Cards for mobile */}
      <div className="bg-white rounded-lg md:rounded-2xl shadow-lg overflow-hidden border border-gray-100 mt-4 md:mt-6">
        {loading ? (
          <div className="p-4 md:p-8">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4" aria-hidden="true">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="w-12 md:w-16 h-4 bg-gray-200 rounded"></div>
                  <div className="w-12 md:w-16 h-4 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (!Array.isArray(filteredStocks) || filteredStocks.length === 0) ? (
          <div className="text-center py-8 md:py-16">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
              <FaSearch size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 md:mb-3">No stocks match your criteria</h3>
            <p className="text-gray-600 mb-4 md:mb-6 text-sm md:text-base">Try adjusting your filters or search query</p>
            <button
              onClick={clearFilters}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg font-medium transition-all text-sm md:text-base"
              type="button"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="relative">
            {/* Desktop Table View */}
            <div className="hidden md:block relative overflow-x-auto scrollbar-hide">
              <table className="w-full min-w-[900px] border-separate border-spacing-0">
                {/* Table Header */}
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      { key: 'name', label: 'Stock' },
                      { key: 'marketCap', label: 'Market Cap' },
                      { key: 'price', label: 'Price' },
                      { key: 'change', label: 'Change' },
                      { key: 'peRatio', label: 'P/E' },
                      { key: 'roe', label: 'ROE' },
                      { label: 'Actions' }
                    ].map(({ key, label }) => (
                      <th
                        onClick={() => key && handleSort(key)}
                        className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 transition-colors group"
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <span>{label}</span>
                          {sortConfig.key === key && (
                            <span className="text-blue-500">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody>
                  {filteredStocks.map((stock, index) => (
                    <tr
                      key={stock.id || index}
                      className="transition-all duration-300 hover:bg-gray-50"
                    >
                      {/* Stock Name Column */}
                      <td className="px-6 py-4 border-t border-gray-100">
                        <div className="flex items-center space-x-4">
                          <div>
                            <div className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                              {stock.name}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <span>{stock.tradingSymbol || stock.symbol}</span>
                              {stock.sector && stock.sector !== "N/A" && (
                                <>
                                  <span className="mx-2 text-gray-300">•</span>
                                  <span className="bg-gray-100 px-2 py-1 rounded-full text-xs font-medium">
                                    {stock.sector}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Market Cap Column */}
                      <td className="px-6 py-4 border-t border-gray-100 text-right">
                        <div className="font-semibold text-gray-900">
                          {stock.marketCap !== "N/A" && !isNaN(stock.marketCap)
                            ? `₹${formatNumber(stock.marketCap)}`
                            : "N/A"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getMarketCapCategory(stock.marketCap)}
                        </div>
                      </td>

                      {/* Price Column */}
                      <td className="px-6 py-4 border-t border-gray-100 text-right">
                        <div className="font-semibold text-gray-900 bg-gray-100 px-3 py-1 rounded-full inline-block">
                          ₹{formatNumber(ltpData[stock.instrumentKey]?.last_price || stock.price)}
                        </div>
                      </td>

                      {/* Change Column */}
                      <td className="px-6 py-4 border-t border-gray-100 text-right">
                        <div className={`font-semibold ${ltpData[stock.instrumentKey].change >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'} px-3 py-1 rounded-full inline-block`}>
                          {(ltpData[stock.instrumentKey]?.change || stock.change)
                            ? `${ltpData[stock.instrumentKey].change >= 0 ? '+' : ''}${parseFloat(ltpData[stock.instrumentKey].change).toFixed(2)}%`
                            : 'N/A'}
                        </div>
                      </td>

                      {/* PE Ratio Column */}
                      <td className="px-6 py-4 border-t border-gray-100 text-right">
                        <div className="font-semibold text-gray-900 bg-gray-100 px-3 py-1 rounded-full inline-block">
                          {stock.peRatio}
                        </div>
                      </td>

                      {/* ROE Column */}
                      <td className="px-6 py-4 border-t border-gray-100 text-right">
                        <div className={`font-semibold ${stock.roe > 15 ? 'text-green-600 bg-green-50' : 'text-gray-900 bg-gray-100'} px-3 py-1 rounded-full inline-block`}>
                          {stock.roe ? `${stock.roe.toFixed(2)}%` : 'N/A'}
                        </div>
                      </td>

                      {/* Actions Column */}
                      <td className="px-6 py-4 border-t border-gray-100 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => toggleWatchlist(stock)}
                            className={`p-2 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 ${watchlist.some((w) => w.tradingSymbol === (stock.tradingSymbol || stock.symbol))
                              ? 'bg-yellow-100 text-yellow-600'
                              : 'bg-gray-100 text-gray-400 hover:text-yellow-600'}`}
                            title={watchlist.some((w) => w.tradingSymbol === (stock.tradingSymbol || stock.symbol))
                              ? 'Remove from Watchlist'
                              : 'Add to Watchlist'}
                          >
                            <FaBookmark size={16} />
                          </button>
                          <button
                            onClick={() => openStockDetails(stock)}
                            className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all duration-300 hover:scale-110 active:scale-95"
                            title="View Details"
                          >
                            <FaEye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3 p-3">
              {filteredStocks.map((stock, index) => (
                <div key={stock.id || index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  {/* Stock Name and Actions */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-semibold text-gray-900">{stock.name}</div>
                      <div className="text-sm text-gray-500 flex items-center mt-1">
                        <span>{stock.tradingSymbol || stock.symbol}</span>
                        {stock.sector && stock.sector !== "N/A" && (
                          <>
                            <span className="mx-2 text-gray-300">•</span>
                            <span className="bg-gray-100 px-2 py-1 rounded-full text-xs font-medium">
                              {stock.sector}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => toggleWatchlist(stock)}
                        className={`p-2 rounded-full transition-all duration-300 ${watchlist.some((w) => w.tradingSymbol === (stock.tradingSymbol || stock.symbol))
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-gray-100 text-gray-400'}`}
                        title={watchlist.some((w) => w.tradingSymbol === (stock.tradingSymbol || stock.symbol))
                          ? 'Remove from Watchlist'
                          : 'Add to Watchlist'}
                      >
                        <FaBookmark size={16} />
                      </button>
                      <button
                        onClick={() => openStockDetails(stock)}
                        className="p-2 rounded-full bg-blue-100 text-blue-600"
                        title="View Details"
                      >
                        <FaEye size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Stock Data Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-500">Market Cap</div>
                      <div className="font-semibold text-gray-900">
                        {stock.marketCap !== "N/A" && !isNaN(stock.marketCap)
                          ? `₹${formatNumber(stock.marketCap)}`
                          : "N/A"}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {getMarketCapCategory(stock.marketCap)}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-500">Price</div>
                      <div className="font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded-full inline-block">
                        ₹{formatNumber(ltpData[stock.instrumentKey]?.last_price || stock.price)}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-500">Change</div>
                      <div className={`font-semibold ${stock.change >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'} px-2 py-1 rounded-full inline-block`}>
                        {stock.change !== undefined && stock.change !== null
                          ? `${stock.change >= 0 ? '+' : ''}${parseFloat(stock.change).toFixed(2)}%`
                          : 'N/A'}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-500">P/E</div>
                      <div className="font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded-full inline-block">
                        {stock.peRatio}
                      </div>
                    </div>
                    
                    <div className="col-span-2">
                      <div className="text-xs text-gray-500">ROE</div>
                      <div className={`font-semibold ${stock.roe > 15 ? 'text-green-600 bg-green-50' : 'text-gray-900 bg-gray-100'} px-2 py-1 rounded-full inline-block`}>
                        {stock.roe ? `${stock.roe.toFixed(2)}%` : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  </>
)}

        {/* SAVED TAB */}
        {activeTab === "saved" && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Saved Items</h2>

              {/* Saved Screens */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <FaBookmark className="mr-2 text-blue-500" />
                  Saved Screens
                </h3>
                {watchlist.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {watchlist.map((stock) => (
                      <div
                        key={stock.id}
                        className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{stock.name}</h4>
                            <p className="text-sm text-gray-500">{stock.tradingSymbol || stock.symbol}</p>
                          </div>
                          <button
                            onClick={() => removeFromWatchlist(stock)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            type="button"
                          >
                            <FaTimes />
                          </button>
                        </div>
                        <div className="mt-3 flex justify-between items-center">
                          <span className="text-gray-700">
                            ₹{formatNumber(ltpData[stock.instrumentKey]?.last_price || stock.price)}
                          </span>
                          <button
                            onClick={() => openStockDetails(stock)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            type="button"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaBookmark className="text-gray-400" size={24} />
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No saved items yet</h4>
                    <p className="text-gray-600 mb-4">Add stocks to your watchlist to see them here</p>
                    <button
                      onClick={() => setActiveTab("stock-screener")}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                      type="button"
                    >
                      Browse Stocks
                    </button>
                  </div>
                )}
              </div>

              {/* Saved Filters */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <FaFilter className="mr-2 text-blue-500" />
                  Saved Filters
                </h3>
                <div className="space-y-3">
                  {filters.length > 0 ? (
                    filters.map((filter, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{filter.label}</h4>
                            <p className="text-sm text-gray-500">
                              {filter.min} - {filter.max}
                            </p>
                          </div>
                          <button
                            onClick={() => removeFilter(index)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            type="button"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaFilter className="text-gray-400" size={24} />
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No saved filters</h4>
                      <p className="text-gray-600 mb-4">Create and save filters to see them here</p>
                      <button
                        onClick={() => setActiveTab("stock-screener")}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                        type="button"
                      >
                        Create Filters
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}
                type="button"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${currentPage === pageNum ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                    type="button"
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}
                type="button"
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
  
};

export default Screener;