import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Navbar from "../components/Navbar";
import datas from "../components/final_datas.json";
import axios from "axios";
import { auth } from "../components/firebase-config";
import Profile from "../components/profile";
import Register from "../components/register";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  AppleNotificationProvider,
  useAppleNotification
} from '../components/AppleComponents';
import debounce from "lodash/debounce";
import { motion,AnimatePresence } from "framer-motion";
import { ChartBarIcon,ListIcon,GridIcon,XIcon,ChevronLeftIcon,
  CheckCircleIcon,CheckIcon,ChevronRightIcon,SortAscIcon,LockIcon
 } from "lucide-react";
 import { FaExclamation } from "react-icons/fa";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000'; // Fallback for local dev

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const ChevronUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const CrossIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const BookmarkIcon = ({ filled }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
  </svg>
);

const AddCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const fetchWatchlists = async (uid, setWatchlists, setError, setLoading) => {
  try {
    setLoading(true);
    const response = await axios.get(
      `${API_URL}/api/watchlist/${uid}`
    );
    setWatchlists(response.data.watchlists);
  } catch (err) {
    console.error("Error fetching watchlists:", err);
    if (err.response && err.response.status === 404) {
      setError("User not found or no watchlists available.");
    } else {
      setError("Failed to load watchlists.");
    }
  } finally {
    setLoading(false);
  }
};

const createOrUpdateUser = async (user) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/`,
      {
        uid: user.uid,
        firstName: user.displayName || "User",
        email: user.email,
        photo: user.photoURL || "",
      },
      { headers: { "Content-Type": "application/json" } }
    );
    console.log("User created/updated successfully:", response.data);
  } catch (error) {
    console.error("Error creating/updating user:", error);
    throw error;
  }
};

// Constants for data freshness
const DB_FRESHNESS_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

const SkeletonLoader = () => (
  <div className="animate-pulse">
    <table className="min-w-full">
      <thead>
        <tr className="border-b" style={{ borderColor: 'var(--apple-border)' }}>
          <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Symbol</th>
          <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Name</th>
          <th className="py-3 px-4 text-right text-sm font-medium text-gray-500">LTP</th>
          <th className="py-3 px-4 text-right text-sm font-medium text-gray-500">Change %</th>
          <th className="py-3 px-4 text-right text-sm font-medium text-gray-500">Open</th>
          <th className="py-3 px-4 text-right text-sm font-medium text-gray-500">High/Low</th>
          <th className="py-3 px-4 text-right w-10"></th>
        </tr>
      </thead>
      <tbody>
        {Array(10)
          .fill()
          .map((_, index) => (
            <tr key={index} className="border-b" style={{ borderColor: 'var(--apple-border)' }}>
              <td className="py-3 px-4">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </td>
              <td className="py-3 px-4">
                <div className="h-4 bg-gray-200 rounded w-48"></div>
              </td>
              <td className="py-3 px-4 text-right">
                <div className="h-4 bg-gray-200 rounded w-16 ml-auto"></div>
              </td>
              <td className="py-3 px-4 text-right">
                <div className="h-4 bg-gray-200 rounded w-16 ml-auto"></div>
              </td>
              <td className="py-3 px-4 text-right">
                <div className="h-4 bg-gray-200 rounded w-16 ml-auto"></div>
              </td>
              <td className="py-3 px-4 text-right">
                <div className="h-4 bg-gray-200 rounded w-24 ml-auto"></div>
              </td>
              <td className="py-3 px-4 text-right">
                <div className="h-4 bg-gray-200 rounded w-6 ml-auto"></div>
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  </div>
);

// Inner component to handle notification logic
const WatchlistContent = ({
  results,
  setResults,
  searchFeed,
  setSearchFeed,
  filteredSearchResults,
  setFilteredSearchResults,
  currentPage,
  setCurrentPage,
  selectedStocks,
  setSelectedStocks,
  searchTerm,
  setSearchTerm,
  uid,
  setUid,
  watchlists,
  setWatchlists,
  selectedWatchlist,
  setSelectedWatchlist,
  newWatchlistName,
  setNewWatchlistName,
  loading,
  setLoading,
  error,
  setError,
  isDropdownOpen,
  setIsDropdownOpen,
  isWatchlistOpen,
  setIsWatchlistOpen,
  isCreateModalOpen,
  setIsCreateModalOpen,
  isAddModalOpen,
  setIsAddModalOpen,
  isRemoveStockModalOpen,
  setIsRemoveStockModalOpen,
  stockToRemove,
  setStockToRemove,
  isRemoveWatchlistModalOpen,
  setIsRemoveWatchlistModalOpen,
  dropdownRef,
  userDetails,
  setUserDetails,
  hasRegistered,
  setHasRegistered,
  recentlyAddedStock,
  setRecentlyAddedStock,
  showCheckbox,
  setShowCheckbox
}) => {
  const { addNotification } = useAppleNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'grid' or 'list'
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const stocksPerPage = 10;

  const toggleCheckboxMode = () => {
    setShowCheckbox((prev) => !prev);
  };
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  const handleCheckboxChange = (stock, checked) => {
    setSelectedStocks((prev) => {
      const newSelectedStocks = { ...prev };
      if (checked) {
        newSelectedStocks[stock.instrument_key] = {
          stockSymbol: stock.trading_symbol,
          stockKey: stock.instrument_key,
          stockName: stock.name,
          lastPrice: stock.lastPrice,
          openPrice: stock.openPrice,
          low: stock.low,
          high: stock.high,
          one_day_change: stock.one_day_change,
          price_change: stock.price_change,
        };
        setRecentlyAddedStock(stock.instrument_key);
        setTimeout(() => setRecentlyAddedStock(null), 1000);
      } else {
        delete newSelectedStocks[stock.instrument_key];
      }
      return newSelectedStocks;
    });
  };

  const isStockSelected = (instrumentKey) => !!selectedStocks[instrumentKey];

  const handleCreateWatchlist = async () => {
    if (!uid) {
      setIsDropdownOpen(true);
      return;
    }

    if (!newWatchlistName.trim()) {
      addNotification("Please enter a watchlist name", "error");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/api/watchlist/create`,
        { uid, watchlistName: newWatchlistName },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.status === 200) {
        addNotification(`Watchlist "${newWatchlistName}" created successfully`, "success");
        setWatchlists(response.data.watchlists);
        setNewWatchlistName("");
        setIsCreateModalOpen(false);
        if (!selectedWatchlist) {
          setSelectedWatchlist(response.data.watchlists[0]?.name || null);
        }
      } else {
        addNotification("Failed to create watchlist.");
      }
    } catch (error) {
      console.error("Error creating watchlist:", error);
      if (error.response?.status === 400) {
        addNotification(error.response.data.message || "Watchlist name already exists.");
      } else if (error.response?.status === 404) {
        addNotification("User not found. Please try logging in again.");
      } else {
        addNotification("An error occurred while creating the watchlist.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWatchlist = async (watchlistName) => {
    if (!uid) {
      setIsDropdownOpen(true);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.delete(
        `${API_URL}/api/watchlist/delete`,
        {
          data: { uid, watchlistName },
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.status === 200) {
        addNotification("Watchlist deleted successfully!");
        setWatchlists(response.data.watchlists);
        setIsRemoveWatchlistModalOpen(false);
        if (selectedWatchlist === watchlistName) {
          setSelectedWatchlist(response.data.watchlists[0]?.name || null);
        }
      } else {
        addNotification("Failed to delete watchlist.");
      }
    } catch (error) {
      addNotification("An error occurred while deleting the watchlist.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!uid) {
      setIsDropdownOpen(true);
      return;
    }

    if (!selectedWatchlist) {
      addNotification("Please select a watchlist to add stocks to.");
      return;
    }

    const selectedStockArray = Object.values(selectedStocks);
    if (selectedStockArray.length === 0) {
      addNotification("No stocks selected.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/api/watchlist/add`,
        { uid, watchlistName: selectedWatchlist, stocks: selectedStockArray },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.status === 200) {
        addNotification("Stocks added to watchlist successfully!");
        fetchWatchlists(uid, setWatchlists, setError, setLoading);
        setIsAddModalOpen(false);
        setSelectedStocks({});
        setShowCheckbox(false);
      } else {
        addNotification("Failed to add stocks to watchlist.");
      }
    } catch (error) {
      addNotification("An error occurred while adding stocks to watchlist.");
    } finally {
      setLoading(false);
    }
  };

  const removeStockFromWatchlist = async (watchlistName, instrumentKey) => {
    setStockToRemove({ watchlistName, instrumentKey });
    setIsRemoveStockModalOpen(true);
  };

  const confirmRemoveStock = async () => {
    if (!stockToRemove) return;

    const { watchlistName, instrumentKey } = stockToRemove;

    try {
      setLoading(true);
      const response = await axios.delete(
        `${API_URL}/api/watchlist/remove`,
        {
          data: { uid, watchlistName, instrumentKey },
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.status === 200) {
        addNotification("Stock removed successfully.");
        fetchWatchlists(uid, setWatchlists, setError, setLoading);
        setIsRemoveStockModalOpen(false);
        setStockToRemove(null);
      } else {
        throw new Error("Failed to remove stock from server.");
      }
    } catch (error) {
      addNotification("Failed to remove stock from watchlist.");
      fetchWatchlists(uid, setWatchlists, setError, setLoading);
    } finally {
      setLoading(false);
    }
  };

  const StockCard = ({ stock, isSelected, onToggle }) => (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -2 }}
      className={`
        relative overflow-hidden rounded-2xl p-4 
        bg-gradient-to-br from-white to-gray-50
        border border-gray-200 shadow-sm
        hover:shadow-md transition-all duration-200
        ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        ${recentlyAddedStock === stock.instrument_key ? 'animate-pulse bg-green-50' : ''}
      `}
    >
      {showCheckbox && (
        <div className="absolute top-4 left-4">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => handleCheckboxChange(stock, e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-5 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-md peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-sm after:h-4 after:w-4 after:transition-all peer-checked:after:opacity-100 after:opacity-0">
              <svg className="w-3 h-3 text-white absolute top-1 left-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </label>
        </div>
      )}

      <div className={`${showCheckbox ? 'pl-10' : ''}`}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">{stock.trading_symbol}</h3>
            <p className="text-sm text-gray-500 truncate max-w-[200px]">{stock.name}</p>
          </div>
          <button
            onClick={() => onToggle(stock, !isSelected)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <BookmarkIcon 
              filled={isSelected} 
              className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}
            />
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-2xl font-bold text-gray-900">₹{stock.lastPrice}</span>
            <span className={`
              text-sm font-medium px-2 py-1 rounded-full
              ${parseFloat(stock.one_day_change) > 0 
                ? 'text-green-700 bg-green-100' 
                : parseFloat(stock.one_day_change) < 0 
                  ? 'text-red-700 bg-red-100' 
                  : 'text-gray-700 bg-gray-100'}
            `}>
              {parseFloat(stock.one_day_change) > 0 ? '↑' : parseFloat(stock.one_day_change) < 0 ? '↓' : ''}
              {Math.abs(parseFloat(stock.one_day_change))}%
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-gray-500">Open</p>
              <p className="font-medium text-gray-900">₹{stock.openPrice}</p>
            </div>
            <div>
              <p className="text-gray-500">High</p>
              <p className="font-medium text-green-600">₹{stock.high}</p>
            </div>
            <div>
              <p className="text-gray-500">Low</p>
              <p className="font-medium text-red-600">₹{stock.low}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
  // Memoized filtered results
  const filteredResults = useMemo(() => {
    return filteredSearchResults.length > 0 ? filteredSearchResults : results;
  }, [filteredSearchResults, results]);

  const indexOfLastStock = Math.min(
    currentPage * stocksPerPage,
    filteredResults.length
  );
  const indexOfFirstStock = (currentPage - 1) * stocksPerPage;
  const currentStocks = filteredResults.slice(
    indexOfFirstStock,
    indexOfLastStock
  );

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const sortedStocks = useMemo(() => {
    if (!sortConfig.key) return currentStocks;
    
    return [...currentStocks].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });
  }, [currentStocks, sortConfig]);

  const nextPage = () => {
    if (currentPage < Math.ceil(filteredResults.length / stocksPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 w-screen text-black">
      {/* Enhanced Fixed Navbar */}
      <motion.div 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200"
      >
        <Navbar />
      </motion.div>

      {/* Main Content with Professional Layout */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="pt-20 px-4 sm:px-3 lg:px-8 mx-auto"
      >
        {/* Enhanced Header */}
        <div className="py-8">
          <motion.h1 
            variants={itemVariants}
            className="text-4xl font-bold text-gray-900 text-center mb-2"
          >
            Stock Watchlist
          </motion.h1>
          <motion.p 
            variants={itemVariants}
            className="text-center text-gray-600"
          >
            Track and manage your favorite stocks
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pb-8">
          {/* Enhanced Watchlist Sidebar */}
          <motion.div 
            variants={itemVariants}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">My Watchlists</h2>
                  <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
                    {watchlists.length}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsCreateModalOpen(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium py-3 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <PlusIcon className="w-5 h-5" />
                    Create Watchlist
                  </motion.button>
  
                  <div className="mt-4 space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                    <AnimatePresence>
                      {watchlists.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-center py-8"
                        >
                          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookmarkIcon className="w-10 h-10 text-gray-400" />
                          </div>
                          <p className="text-gray-500 text-sm">No watchlists yet</p>
                          <p className="text-gray-400 text-xs mt-1">Create one to get started</p>
                        </motion.div>
                      ) : (
                        watchlists.map((watchlist, index) => (
                          <motion.div
                            key={watchlist.name}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ x: 4 }}
                            onClick={() => setSelectedWatchlist(watchlist.name)}
                            className={`
                              group relative p-4 rounded-xl cursor-pointer transition-all duration-200
                              ${selectedWatchlist === watchlist.name 
                                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-500' 
                                : 'hover:bg-gray-50 border-2 border-transparent'}
                            `}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h3 className={`font-medium ${selectedWatchlist === watchlist.name ? 'text-blue-700' : 'text-gray-900'}`}>
                                  {watchlist.name}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">
                                  {watchlist.stocks?.length || 0} stocks
                                </p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsRemoveWatchlistModalOpen(true);
                                  setSelectedWatchlist(watchlist.name);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-lg transition-all duration-200"
                              >
                                <TrashIcon className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
  
              {/* Selected Watchlist Details */}
              {selectedWatchlist && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
                    <h3 className="text-lg font-semibold text-gray-900">{selectedWatchlist}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {watchlists.find(w => w.name === selectedWatchlist)?.stocks?.length || 0} stocks tracked
                    </p>
                  </div>
  
                  <div className="p-4">
                    {watchlists.find(w => w.name === selectedWatchlist)?.stocks?.length > 0 ? (
                      <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                        <AnimatePresence>
                          {watchlists
                            .find(w => w.name === selectedWatchlist)
                            ?.stocks.map((stock, index) => (
                              <motion.div
                                key={stock.stockKey}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ delay: index * 0.05 }}
                                className={`
                                  group p-4 rounded-xl border border-gray-200 hover:border-gray-300
                                  hover:shadow-sm transition-all duration-200
                                  ${recentlyAddedStock === stock.stockKey ? 'ring-2 ring-green-500 bg-green-50' : 'bg-white'}
                                `}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-baseline gap-2">
                                      <h4 className="font-semibold text-gray-900">{stock.stockSymbol}</h4>
                                      <span className={`
                                        text-xs font-medium px-2 py-0.5 rounded-full
                                        ${parseFloat(stock.one_day_change) > 0 
                                          ? 'text-green-700 bg-green-100' 
                                          : parseFloat(stock.one_day_change) < 0 
                                            ? 'text-red-700 bg-red-100' 
                                            : 'text-gray-700 bg-gray-100'}
                                      `}>
                                        {parseFloat(stock.one_day_change) > 0 ? '+' : ''}{stock.one_day_change}%
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-500 truncate mt-1">{stock.stockName}</p>
                                    <div className="flex items-baseline gap-3 mt-2">
                                      <span className="text-lg font-semibold text-gray-900">₹{stock.lastPrice}</span>
                                      <span className="text-xs text-gray-500">
                                        H: ₹{stock.high} L: ₹{stock.low}
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => removeStockFromWatchlist(selectedWatchlist, stock.stockKey)}
                                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-lg transition-all duration-200"
                                  >
                                    <TrashIcon className="w-4 h-4 text-red-500" />
                                  </button>
                                </div>
                              </motion.div>
                            ))}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <ChartBarIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-sm">No stocks in this watchlist</p>
                        <p className="text-gray-400 text-xs mt-1">Add stocks from the market view</p>
                      </div>
                    )}
  
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsAddModalOpen(true)}
                      className="w-full mt-4 bg-white border-2 border-dashed border-gray-300 text-gray-600 font-medium py-3 px-4 rounded-xl hover:border-gray-400 hover:text-gray-700 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <AddCircleIcon className="w-5 h-5" />
                      Add Stocks
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </motion.div>
  
            {/* Enhanced Market View */}
            <motion.div 
              variants={itemVariants}
              className="lg:col-span-3"
            >
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div className="flex-1 w-full sm:w-auto">
                      <div className="relative">
                        <input
                          type="text"
                          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                          placeholder="Search stocks by symbol or name..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
                          >
                            <CrossIcon className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
  
                    <div className="flex gap-2">
                      <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                          onClick={() => setViewMode('list')}
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                            viewMode === 'list' 
                              ? 'bg-white text-gray-900 shadow-sm' 
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <ListIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                            viewMode === 'grid' 
                              ? 'bg-white text-gray-900 shadow-sm' 
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <GridIcon className="w-4 h-4" />
                        </button>
                      </div>
  
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={toggleCheckboxMode}
                        className={`
                          px-4 py-2 rounded-lg font-medium transition-all duration-200
                          ${showCheckbox 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                        `}
                      >
                        {showCheckbox ? 'Cancel Selection' : 'Select Multiple'}
                      </motion.button>
  
                      {showCheckbox && Object.keys(selectedStocks).length > 0 && (
                        <motion.button
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setIsAddModalOpen(true)}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium px-4 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
                        >
                          <CheckIcon className="w-4 h-4" />
                          Add {Object.keys(selectedStocks).length} Selected
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>
  
                {loading ? (
                  <div className="p-8">
                    <div className="flex justify-center items-center h-64">
                      <div className="relative">
                        <div className="w-12 h-12 border-4 border-gray-200 rounded-full"></div>
                        <div className="w-12 h-12 border-4 border-blue-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {viewMode === 'grid' ? (
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        <AnimatePresence>
                          {sortedStocks.map((stock) => (
                            <StockCard
                              key={stock.instrument_key}
                              stock={stock}
                              isSelected={isStockSelected(stock.instrument_key)}
                              onToggle={handleCheckboxChange}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              {showCheckbox && (
                                <th className="px-6 py-4 text-left">
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                                                              const newSelected = {};
                                      currentStocks.forEach(stock => {
                                        newSelected[stock.instrument_key] = {
                                          stockSymbol: stock.trading_symbol,
                                          stockKey: stock.instrument_key,
                                          stockName: stock.name,
                                          lastPrice: stock.lastPrice,
                                          openPrice: stock.openPrice,
                                          low: stock.low,
                                          high: stock.high,
                                          one_day_change: stock.one_day_change,
                                          price_change: stock.price_change,
                                        };
                                      });
                                      setSelectedStocks(newSelected);
                                    } else {
                                      setSelectedStocks({});
                                    }
                                  }}
                                  checked={Object.keys(selectedStocks).length === currentStocks.length && currentStocks.length > 0}
                                />
                              </th>
                            )}
                            <th 
                              className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSort('trading_symbol')}
                            >
                              <div className="flex items-center gap-1">
                                Symbol
                                <SortAscIcon className="w-4 h-4" />
                              </div>
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Company
                            </th>
                            <th 
                              className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSort('lastPrice')}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Last Price
                                <SortAscIcon className="w-4 h-4" />
                              </div>
                            </th>
                            <th 
                              className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSort('one_day_change')}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Change %
                                <SortAscIcon className="w-4 h-4" />
                              </div>
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Open
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              High/Low
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          <AnimatePresence>
                            {sortedStocks.map((stock, index) => (
                              <motion.tr
                                key={stock.instrument_key}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ delay: index * 0.02 }}
                                className={`
                                  hover:bg-gray-50 transition-colors
                                  ${recentlyAddedStock === stock.instrument_key ? 'bg-green-50 animate-pulse' : ''}
                                  ${isStockSelected(stock.instrument_key) ? 'bg-blue-50' : ''}
                                `}
                              >
                                {showCheckbox && (
                                  <td className="px-6 py-4">
                                    <input
                                      type="checkbox"
                                      checked={isStockSelected(stock.instrument_key)}
                                      onChange={(e) => handleCheckboxChange(stock, e.target.checked)}
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                  </td>
                                )}
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{stock.trading_symbol}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm text-gray-500 truncate max-w-xs">{stock.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                  <div className="text-sm font-medium text-gray-900">₹{stock.lastPrice}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                  <span className={`
                                    inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                    ${parseFloat(stock.one_day_change) > 0 
                                      ? 'text-green-800 bg-green-100' 
                                      : parseFloat(stock.one_day_change) < 0 
                                        ? 'text-red-800 bg-red-100' 
                                        : 'text-gray-800 bg-gray-100'}
                                  `}>
                                    {parseFloat(stock.one_day_change) > 0 ? '↑' : parseFloat(stock.one_day_change) < 0 ? '↓' : '→'}
                                    {Math.abs(parseFloat(stock.one_day_change))}%
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                                  ₹{stock.openPrice}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                  <span className="text-green-600">₹{stock.high}</span>
                                  <span className="text-gray-400 mx-1">/</span>
                                  <span className="text-red-600">₹{stock.low}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                  <button
                                    onClick={() => handleCheckboxChange(stock, !isStockSelected(stock.instrument_key))}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                  >
                                    <BookmarkIcon 
                                      filled={isStockSelected(stock.instrument_key)} 
                                      className={`w-5 h-5 ${isStockSelected(stock.instrument_key) ? 'text-blue-600' : 'text-gray-400'}`}
                                    />
                                  </button>
                                </td>
                              </motion.tr>
                            ))}
                          </AnimatePresence>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Enhanced Pagination */}
                  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="text-sm text-gray-700">
                        Showing <span className="font-medium">{indexOfFirstStock + 1}</span> to{' '}
                        <span className="font-medium">{indexOfLastStock}</span> of{' '}
                        <span className="font-medium">{filteredResults.length}</span> results
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={prevPage}
                          disabled={currentPage === 1}
                          className={`
                            p-2 rounded-lg border transition-all duration-200
                            ${currentPage === 1 
                              ? 'border-gray-200 text-gray-300 cursor-not-allowed' 
                              : 'border-gray-300 text-gray-700 hover:bg-gray-100'}
                          `}
                        >
                          <ChevronLeftIcon className="w-5 h-5" />
                        </button>
                        
                        <div className="flex gap-1">
                          {[...Array(Math.ceil(filteredResults.length / stocksPerPage))].map((_, index) => {
                            const pageNumber = index + 1;
                            const isCurrentPage = pageNumber === currentPage;
                            const isNearCurrentPage = Math.abs(pageNumber - currentPage) <= 2;
                            const isFirstOrLastPage = pageNumber === 1 || pageNumber === Math.ceil(filteredResults.length / stocksPerPage);
                            
                            if (!isNearCurrentPage && !isFirstOrLastPage) {
                              if (pageNumber === currentPage - 3 || pageNumber === currentPage + 3) {
                                return <span key={index} className="px-2 text-gray-400">...</span>;
                              }
                              return null;
                            }
                            
                            return (
                              <button
                                key={index}
                                onClick={() => setCurrentPage(pageNumber)}
                                className={`
                                  px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200
                                  ${isCurrentPage 
                                    ? 'bg-blue-600 text-white' 
                                    : 'text-gray-700 hover:bg-gray-100'}
                                `}
                              >
                                {pageNumber}
                              </button>
                            );
                          })}
                        </div>
                        
                        <button
                          onClick={nextPage}
                          disabled={currentPage === Math.ceil(filteredResults.length / stocksPerPage)}
                          className={`
                            p-2 rounded-lg border transition-all duration-200
                            ${currentPage === Math.ceil(filteredResults.length / stocksPerPage) 
                              ? 'border-gray-200 text-gray-300 cursor-not-allowed' 
                              : 'border-gray-300 text-gray-700 hover:bg-gray-100'}
                          `}
                        >
                          <ChevronRightIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Enhanced Modals with Animations */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Create New Watchlist</h3>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                placeholder="Enter watchlist name..."
                value={newWatchlistName}
                onChange={(e) => setNewWatchlistName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateWatchlist()}
              />
              <div className="flex justify-end gap-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setNewWatchlistName("");
                  }}
                  className="px-6 py-2.5 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-200"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreateWatchlist}
                    disabled={isLoading || !newWatchlistName.trim()}
                    className={`
                      px-6 py-2.5 rounded-xl font-medium text-white transition-all duration-200
                      ${isLoading || !newWatchlistName.trim()
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg'}
                    `}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating...
                      </div>
                    ) : (
                      'Create Watchlist'
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
  
          {/* Enhanced Add Stocks Modal */}
          {isAddModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl"
              >
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-gray-900">Add Stocks to Watchlist</h3>
                    <button
                      onClick={() => setIsAddModalOpen(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <XIcon className="w-6 h-6 text-gray-400" />
                    </button>
                  </div>
                </div>
  
                {!uid ? (
                  <div className="p-12 text-center">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <LockIcon className="w-10 h-10 text-blue-600" />
                    </div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h4>
                    <p className="text-gray-600 mb-6">Please log in to add stocks to your watchlist</p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setIsAddModalOpen(false);
                        setIsDropdownOpen(true);
                      }}
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      Log In Now
                    </motion.button>
                  </div>
                ) : (
                  <div className="p-6 space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Watchlist
                      </label>
                      <select
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                        value={selectedWatchlist || ""}
                        onChange={(e) => setSelectedWatchlist(e.target.value)}
                      >
                        <option value="" disabled>Choose a watchlist</option>
                        {watchlists.map((watchlist) => (
                          <option key={watchlist.name} value={watchlist.name}>
                            {watchlist.name} ({watchlist.stocks?.length || 0} stocks)
                          </option>
                        ))}
                      </select>
                    </div>
  
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium text-gray-700">
                          Selected Stocks ({Object.keys(selectedStocks).length})
                        </label>
                        {Object.keys(selectedStocks).length > 0 && (
                          <button
                            onClick={() => setSelectedStocks({})}
                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
  
                      {Object.keys(selectedStocks).length > 0 ? (
                        <div className="max-h-64 overflow-y-auto space-y-2 p-4 bg-gray-50 rounded-xl border border-gray-200">
                          <AnimatePresence>
                            {Object.values(selectedStocks).map((stock, index) => (
                              <motion.div
                                key={stock.stockKey}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ delay: index * 0.02 }}
                                className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200"
                              >
                                <div className="flex-1">
                                  <div className="flex items-baseline gap-2">
                                    <span className="font-semibold text-gray-900">{stock.stockSymbol}</span>
                                    <span className="text-xs text-gray-500">₹{stock.lastPrice}</span>
                                  </div>
                                  <p className="text-xs text-gray-600 truncate">{stock.stockName}</p>
                                </div>
                                <button
                                  onClick={() => handleCheckboxChange({ instrument_key: stock.stockKey }, false)}
                                  className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <XIcon className="w-4 h-4 text-red-500" />
                                </button>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <div className="p-12 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                          <CheckCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600">No stocks selected</p>
                          <p className="text-sm text-gray-500 mt-1">Select stocks from the market view</p>
                        </div>
                      )}
                    </div>
  
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsAddModalOpen(false)}
                        className="px-6 py-2.5 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-200"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSubmit}
                        disabled={isLoading || Object.keys(selectedStocks).length === 0 || !selectedWatchlist}
                        className={`
                          px-6 py-2.5 rounded-xl font-medium text-white transition-all duration-200
                          ${isLoading || Object.keys(selectedStocks).length === 0 || !selectedWatchlist
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg'}
                        `}
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Adding...
                          </div>
                        ) : (
                          `Add ${Object.keys(selectedStocks).length} Stocks`
                        )}
                      </motion.button>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
  
          {/* Enhanced Remove Stock Modal */}
          {isRemoveStockModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaExclamation className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Remove Stock?</h3>
                  <p className="text-gray-600 mb-6">
                    This stock will be removed from your watchlist. This action cannot be undone.
                  </p>
                  <div className="flex justify-center gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsRemoveStockModalOpen(false)}
                      className="px-6 py-2.5 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-200"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={confirmRemoveStock}
                      disabled={isLoading}
                      className="px-6 py-2.5 rounded-xl font-medium text-white bg-red-600 hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Removing...
                          </div>
                        ) : (
                          'Remove Stock'
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
    
            {/* Enhanced Delete Watchlist Modal */}
            {isRemoveWatchlistModalOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrashIcon className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Watchlist?</h3>
                    <p className="text-gray-600 mb-2">
                      Are you sure you want to delete
                    </p>
                    <p className="font-semibold text-gray-900 mb-4">"{selectedWatchlist}"</p>
                    <p className="text-sm text-gray-500 mb-6">
                      This will permanently delete the watchlist and all its stocks. This action cannot be undone.
                    </p>
                    <div className="flex justify-center gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsRemoveWatchlistModalOpen(false)}
                        className="px-6 py-2.5 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-200"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleDeleteWatchlist(selectedWatchlist)}
                        disabled={isLoading}
                        className="px-6 py-2.5 rounded-xl font-medium text-white bg-red-600 hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Deleting...
                          </div>
                        ) : (
                          'Delete Watchlist'
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
    
            {/* Enhanced User Authentication Modal */}
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              >
                <motion.div
                  ref={dropdownRef}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-2xl font-bold text-white">
                        {!uid ? 'Welcome' : 'Account'}
                      </h3>
                      <button
                        onClick={() => setIsDropdownOpen(false)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <XIcon className="w-6 h-6 text-white" />
                      </button>
                    </div>
                  </div>
    
                  <div className="p-6">
                    {!uid ? (
                      <Register onRegistered={() => setHasRegistered(true)} />
                    ) : (
                      <Profile setUserDetails={setUserDetails} />
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
    
          {/* Enhanced Toast Notifications */}
          <ToastContainer
            position="bottom-right"
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            toastClassName={() => 
              "relative flex p-4 mb-4 rounded-xl shadow-lg overflow-hidden bg-white border border-gray-200"
            }
            bodyClassName={() => "text-sm font-medium text-gray-900"}
            progressClassName={() => "bg-gradient-to-r from-blue-500 to-indigo-500"}
          />
    
          {/* Custom Styles */}
          <style jsx>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
    
            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
    
            .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
              height: 6px;
            }
    
            .custom-scrollbar::-webkit-scrollbar-track {
              background: #f3f4f6;
              border-radius: 3px;
            }
    
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: #d1d5db;
              border-radius: 3px;
            }
    
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: #9ca3af;
            }
    
            /* Professional transitions */
            * {
              transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
              transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
              transition-duration: 150ms;
            }
    
            /* Loading animations */
            @keyframes pulse {
              0%, 100% {
                opacity: 1;
              }
              50% {
                opacity: 0.5;
              }
            }
    
            .animate-pulse {
              animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
    
            /* Stock highlight animation */
            @keyframes highlight {
              0% {
                background-color: rgba(34, 197, 94, 0.2);
                transform: scale(1);
              }
              50% {
                background-color: rgba(34, 197, 94, 0.3);
                transform: scale(1.01);
              }
              100% {
                background-color: rgba(34, 197, 94, 0.2);
                transform: scale(1);
              }
            }
    
            .stock-row-highlight {
              animation: highlight 1s ease-in-out;
            }
    
            /* Professional shadows */
            .shadow-sm {
              box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            }
    
            .shadow-md {
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }
    
            .shadow-lg {
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            }
    
            .shadow-2xl {
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            }
    
            /* Glassmorphism effect */
            .glass-effect {
              background: rgba(255, 255, 255, 0.7);
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255, 255, 255, 0.2);
            }
    
            /* Professional hover states */
            .hover-lift {
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
    
            .hover-lift:hover {
              transform: translateY(-2px);
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            }
    
            /* Responsive design improvements */
            @media (max-width: 640px) {
              .modal-content {
                max-height: 90vh;
                overflow-y: auto;
              }
            }
    
            /* Print styles */
            @media print {
              .no-print {
                display: none !important;
              }
            }
          `}</style>
        </div>
      );
};

export default function Watchlist() {
  const [results, setResults] = useState(
    datas.map((stock) => ({
      ...stock,
      lastPrice: "N/A",
      openPrice: "N/A",
      high: "N/A",
      low: "N/A",
      one_day_change: "0.00",
      price_change: "N/A",
    }))
  );
  const [searchFeed, setSearchFeed] = useState({});
  const [showCheckbox, setShowCheckbox] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStocks, setSelectedStocks] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSearchResults, setFilteredSearchResults] = useState([]);
  const [uid, setUid] = useState(null);
  const [watchlists, setWatchlists] = useState([]);
  const [selectedWatchlist, setSelectedWatchlist] = useState(null);
  const [newWatchlistName, setNewWatchlistName] = useState("");
  const [loading, setLoading] = useState(false); // Initialize as false to show static data immediately
  const [error, setError] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRemoveStockModalOpen, setIsRemoveStockModalOpen] = useState(false);
  const [stockToRemove, setStockToRemove] = useState(null);
  const [isRemoveWatchlistModalOpen, setIsRemoveWatchlistModalOpen] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [hasRegistered, setHasRegistered] = useState(false);
  const [recentlyAddedStock, setRecentlyAddedStock] = useState(null);
  const dropdownRef = useRef(null);

  // Debounced search function
  const debounceSearch = useCallback(
    debounce((term, results, setFilteredSearchResults) => {
      const searchResults = results.filter(
        (stock) =>
          stock.name.toLowerCase().startsWith(term.toLowerCase()) ||
          stock.trading_symbol.toLowerCase().startsWith(term.toLowerCase())
      );
      setFilteredSearchResults(searchResults);
    }, 300),
    []
  );

  useEffect(() => {
    debounceSearch(searchTerm, results, setFilteredSearchResults);
  }, [searchTerm, results, debounceSearch]);

  // Fetch stocks from MongoDB quotes collection
  const fetchStocksFromDB = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/quote`);
      const dbStocks = response.data;

      if (dbStocks?.length > 0) {
        const dbStockMap = new Map(
          dbStocks.map((s) => [s.quote.symbol, s.quote])
        );

        const updatedResults = datas.map((staticStock) => {
          const dbStock = dbStockMap.get(staticStock.trading_symbol);
          if (dbStock) {
            const lastPrice = dbStock.last_price?.toFixed(2) ?? "N/A";
            const openPrice = dbStock.ohlc?.open?.toFixed(2) ?? "N/A";
            const high = dbStock.ohlc?.high?.toFixed(2) ?? "N/A";
            const low = dbStock.ohlc?.low?.toFixed(2) ?? "N/A";
            const closePrice = dbStock.ohlc?.close ?? null;
            const one_day_change = closePrice
              ? ((dbStock.net_change / closePrice) * 100).toFixed(2)
              : "0.00";
            const price_change = dbStock.net_change?.toFixed(2) ?? "N/A";

            return {
              ...staticStock,
              lastPrice,
              openPrice,
              high,
              low,
              one_day_change,
              price_change,
              trading_symbol: dbStock.symbol || staticStock.trading_symbol,
            };
          }
          return {
            ...staticStock,
            lastPrice: "N/A",
            openPrice: "N/A",
            high: "N/A",
            low: "N/A",
            one_day_change: "0.00",
            price_change: "N/A",
          };
        });

        setResults(updatedResults);
      }
    } catch (error) {
      console.error("Error fetching stocks:", error);
      setError("Failed to load stock data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocksFromDB();
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUid(user.uid);
        try {
          await createOrUpdateUser(user);
          fetchWatchlists(user.uid, setWatchlists, setError, setLoading);
        } catch (error) {
          setError("Failed to initialize user data.");
          setLoading(false);
        }
      } else {
        setUid(null);
        setWatchlists([]);
        setSelectedWatchlist(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Add custom CSS styles
  useEffect(() => {
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }
      
      @keyframes slideIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
      
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      
      @keyframes highlight {
        0% { background-color: rgba(0, 122, 255, 0.2); }
        100% { background-color: transparent; }
      }
      
      :root {
        --apple-blue: #0071e3;
        --apple-blue-dark: #0058b0;
        --apple-gray: #f5f5f7;
        --apple-text: #1d1d1f;
        --apple-secondary-text: #86868b;
        --apple-border: rgba(0, 0, 0, 0.1);
        --apple-highlight: rgba(0, 112, 245, 0.1);
        --apple-red: #ff3b30;
        --apple-green: #34c759;
      }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      
      .apple-scrollbar::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      
      .apple-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      
      .apple-scrollbar::-webkit-scrollbar-thumb {
        background-color: rgba(0, 0, 0, 0.2);
        border-radius: 20px;
        border: 2px solid transparent;
      }
      
      .apple-scrollbar::-webkit-scrollbar-thumb:hover {
        background-color: rgba(0, 0, 0, 0.3);
      }
      
      .apple-card {
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      
      .apple-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
      }
      
      .apple-button {
        transition: all 0.2s ease;
        backface-visibility: hidden;
      }
      
      .apple-button:active {
        transform: scale(0.98);
      }
      
      .stock-row-highlight {
        animation: highlight 2s ease-out;
      }
      
      .apple-list-item {
        transition: background-color 0.2s ease, transform 0.2s ease;
      }
      
      .apple-list-item:hover {
        transform: translateX(3px);
      }
      
      .apple-modal {
        animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }
      
      .shimmer-effect {
        background: linear-gradient(
          to right, 
          rgba(255, 255, 255, 0.1) 0%, 
          rgba(255, 255, 255, 0.2) 20%, 
          rgba(255, 255, 255, 0.1) 40%
        );
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite linear;
      }
      
      .animate-pulse .h-4 {
        animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <AppleNotificationProvider>
      <WatchlistContent
        results={results}
        setResults={setResults}
        searchFeed={searchFeed}
        setSearchFeed={setSearchFeed}
        filteredSearchResults={filteredSearchResults}
        setFilteredSearchResults={setFilteredSearchResults}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        selectedStocks={selectedStocks}
        setSelectedStocks={setSelectedStocks}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        uid={uid}
        setUid={setUid}
        watchlists={watchlists}
        setWatchlists={setWatchlists}
        selectedWatchlist={selectedWatchlist}
        setSelectedWatchlist={setSelectedWatchlist}
        newWatchlistName={newWatchlistName}
        setNewWatchlistName={setNewWatchlistName}
        loading={loading}
        setLoading={setLoading}
        error={error}
        setError={setError}
        isDropdownOpen={isDropdownOpen}
        setIsDropdownOpen={setIsDropdownOpen}
        isWatchlistOpen={isWatchlistOpen}
        setIsWatchlistOpen={setIsWatchlistOpen}
        isCreateModalOpen={isCreateModalOpen}
        setIsCreateModalOpen={setIsCreateModalOpen}
        isAddModalOpen={isAddModalOpen}
        setIsAddModalOpen={setIsAddModalOpen}
        isRemoveStockModalOpen={isRemoveStockModalOpen}
        setIsRemoveStockModalOpen={setIsRemoveStockModalOpen}
        stockToRemove={stockToRemove}
        setStockToRemove={setStockToRemove}
        isRemoveWatchlistModalOpen={isRemoveWatchlistModalOpen}
        setIsRemoveWatchlistModalOpen={setIsRemoveWatchlistModalOpen}
        dropdownRef={dropdownRef}
        userDetails={userDetails}
        setUserDetails={setUserDetails}
        hasRegistered={hasRegistered}
        setHasRegistered={setHasRegistered}
        recentlyAddedStock={recentlyAddedStock}
        setRecentlyAddedStock={setRecentlyAddedStock}
        showCheckbox={showCheckbox}
        setShowCheckbox={setShowCheckbox}
      />
    </AppleNotificationProvider>
  );
}