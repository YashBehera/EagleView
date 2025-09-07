
import {
  ChevronDown, X, Search, Plus, TrendingUp, TrendingDown, Trash2, Edit3, Star,
  Bell, StickyNote, BarChart3, Wallet, MinusCircle,
} from "lucide-react";
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import { motion } from 'framer-motion';
import {
  FaChartLine, FaRocket, FaWallet, FaLightbulb,
  FaBuilding, FaBalanceScale, FaClock, FaChartBar,
  FaUsers, FaArrowRight, FaStar, FaCheck,
  FaChevronRight, FaBell, FaUser, FaArrowUp, FaBrain, FaBriefcase,
  FaShieldAlt, FaHistory, FaFileInvoiceDollar, FaLongArrowAltRight, FaTimes,
  FaSearch, FaFilter, FaSortAmountDown, FaInfoCircle, FaSignOutAlt, FaArrowDown,
  FaMoneyBill, FaChartPie, FaCoins
} from "react-icons/fa";
import Chart from "chart.js/auto";
import { auth } from "./firebase-config";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000'; // Fallback for local dev

const BROKERS = {
  zerodha: {
    name: "Zerodha",
    apiKey: "arrymt32esayamez",
    loginUrl: (apiKey) => `https://kite.zerodha.com/connect/login?api_key=${apiKey}&v=3`,
    authEndpoint: "/zerodha/auth/zerodha",
    portfolioEndpoint: "/zerodha/portfolio",
    profileEndpoint: "/zerodha/profile",
    fundsEndpoint: "/zerodha/funds",
    positionsEndpoint: "/zerodha/positions",
    holdingsEndpoint: "/zerodha/holdings", // Add this line
    orderEndpoint: "/zerodha/orders/:variety",
    ordersEndpoint: "/zerodha/orders",
    orderHistoryEndpoint: "/zerodha/orders/:order_id",
    tradesEndpoint: "/zerodha/trades",
    orderTradesEndpoint: "/zerodha/orders/:order_id/trades",
    logoutEndpoint: "/zerodha/logout",
    supportsOrders: true,
  },
  upstox: {
    name: "Upstox",
    apiKey: "your_upstox_api_key",
    loginUrl: (apiKey) => `https://api-v2.upstox.com/login/authorization/dialog?client_id=${apiKey}&response_type=code&redirect_uri=https://eagle-view-six.vercel.app/portfolio`,
    authEndpoint: "/upstox/auth/upstox",
    portfolioEndpoint: "/upstox/portfolio",
    profileEndpoint: "/upstox/profile",
    fundsEndpoint: "/upstox/funds",
    positionsEndpoint: "/upstox/positions",
    orderEndpoint: "/upstox/orders/place",
    logoutEndpoint: "/upstox/logout",
    supportsOrders: true,
  },
  groww: {
    name: "Groww",
    apiKey: null,
    loginUrl: () => `${API_URL}/groww/auth/redirect`,
    authEndpoint: "/groww/auth/groww",
    portfolioEndpoint: "/groww/portfolio",
    profileEndpoint: "/groww/profile",
    fundsEndpoint: "/groww/funds",
    positionsEndpoint: "/groww/positions",
    orderEndpoint: null,
    logoutEndpoint: "/groww/logout",
    supportsOrders: false,
  },
  dhan: {
    name: "Dhan",
    apiKey: "your_dhan_api_key",
    loginUrl: (apiKey) => `https://api.dhan.co/auth/login?client_id=${apiKey}&response_type=code&redirect_uri=https://eagle-view-six.vercel.app/portfolio`,
    authEndpoint: "/dhan/auth/dhan",
    portfolioEndpoint: "/dhan/portfolio",
    profileEndpoint: "/dhan/profile",
    fundsEndpoint: "/dhan/funds",
    positionsEndpoint: "/dhan/positions",
    orderEndpoint: "/dhan/orders",
    logoutEndpoint: "/dhan/logout",
    supportsOrders: true,
  },
  motilal: {
    name: "Motilal Oswal",
    apiKey: process.env.REACT_APP_MOTILAL_API_KEY || "your_motilal_api_key",
    loginUrl: (apiKey) => `https://api.motilaloswal.com/auth/login?client_id=${apiKey}&response_type=code&redirect_uri=https://eagle-view-six.vercel.app/portfolio`,
    authEndpoint: "/motilal/auth/motilal",
    portfolioEndpoint: "/motilal/portfolio",
    profileEndpoint: "/motilal/profile",
    fundsEndpoint: "/motilal/funds",
    positionsEndpoint: "/motilal/positions",
    orderEndpoint: "/motilal/orders",
    logoutEndpoint: "/motilal/logout",
    supportsOrders: true,
  },
  smallcase: {
    name: "Smallcase",
    apiKey: process.env.REACT_APP_SMALLCASE_CLIENT_ID || "your_smallcase_client_id",
    loginUrl: (apiKey) => `https://api.smallcase.com/gateway/auth/authorize?client_id=${apiKey}&redirect_uri=${encodeURIComponent('https://eagle-view-six.vercel.app/portfolio')}&response_type=code`,
    authEndpoint: "/smallcase/auth/smallcase",
    portfolioEndpoint: "/smallcase/portfolio",
    profileEndpoint: "/smallcase/profile",
    fundsEndpoint: "/smallcase/funds",
    positionsEndpoint: "/smallcase/positions",
    orderEndpoint: null,
    logoutEndpoint: "/smallcase/logout",
    supportsOrders: false,
  },
};

const FrontPage = ({
  onConnectClick,
  isDropdownOpen,
  setPortfolio,
  setFunds,
  setPositions,
  setError,
  setSuccess,
  updateChart,
  isPanModalOpen,
  setIsPanModalOpen,
}) => {
  const [panInput, setPanInput] = useState('');
  const [mobileInput, setMobileInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [panError, setPanError] = useState(null);
  const [mobileError, setMobileError] = useState(null);
  const [otpError, setOtpError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [step, setStep] = useState('pan'); // 'pan', 'otp', 'holdings'
  const [transactionId, setTransactionId] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [watchlistInput, setWatchlistInput] = useState("");
  const [activeTab, setActiveTab] = useState("stocks");
  const navigate = useNavigate();

  // PAN validation regex: 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)
  const validatePan = (pan) => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
  };

  // Mobile number validation: 10 digits starting with 6-9
  const validateMobile = (mobile) => {
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(mobile);
  };

  // Handle PAN and mobile submission
  const handlePanSubmit = async () => {
    setPanError(null);
    setMobileError(null);
    setSuccessMessage(null);

    if (!validatePan(panInput)) {
      setPanError('Please enter a valid PAN (e.g., ABCDE1234F)');
      return;
    }
    if (!validateMobile(mobileInput)) {
      setMobileError('Please enter a valid 10-digit mobile number starting with 6-9');
      return;
    }

    try {
      console.log('Creating transaction with PAN:', panInput, 'Mobile:', mobileInput);
      const transactionResponse = await axios.post(
        `${API_URL}/smallcase/create-transaction`,
        { pan: panInput, mobile: mobileInput },
        { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
      );

      const { transactionId } = transactionResponse.data;
      if (!transactionId) {
        throw new Error('Transaction ID not returned');
      }
      setTransactionId(transactionId);

      console.log('Triggering OTP for transactionId:', transactionId);
      await axios.post(
        `${API_URL}/smallcase/trigger-otp`,
        { transactionId, pan: panInput, mobile: mobileInput },
        { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
      );

      setStep('otp');
      setSuccessMessage('OTP sent to your mobile number');
    } catch (error) {
      console.error('Transaction/OTP error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      setPanError(`Failed to initiate transaction: ${error.response?.data?.message || error.message}`);
    }
  };

  // Handle OTP submission
  const handleOtpSubmit = async () => {
    setOtpError(null);
    setSuccessMessage(null);

    if (!otpInput || otpInput.length < 4) {
      setOtpError('Please enter a valid OTP');
      return;
    }

    try {
      console.log('Verifying OTP for transactionId:', transactionId);
      const response = await axios.post(
        `${API_URL}/smallcase/verify-otp`,
        { transactionId, otp: otpInput },
        { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
      );

      // For mock response or direct holdings
      if (response.data.holdings) {
        const { holdings: mutualFunds, funds } = response.data;
        setPortfolio(mutualFunds);
        setFunds(funds);
        setPositions([]);
        setError(null);
        setSuccess('Mutual fund holdings fetched successfully');
        updateChart(mutualFunds);
        resetModal();
      } else {
        setSuccessMessage('OTP verified, awaiting holdings via webhook');
        setStep('holdings');
      }
    } catch (error) {
      console.error('OTP verification error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      setOtpError(`Failed to verify OTP: ${error.response?.data?.message || error.message}`);
    }
  };

  // Poll for holdings when step is 'holdings'
  useEffect(() => {
    let interval;
    if (step === 'holdings' && transactionId) {
      console.log('Starting polling for holdings with transactionId:', transactionId);
      interval = setInterval(async () => {
        try {
          const response = await axios.get(
            `${API_URL}/smallcase/get-holdings?transactionId=${transactionId}`,
            { timeout: 10000 }
          );
          if (response.data.holdings) {
            const { holdings: mutualFunds, funds } = response.data;
            setPortfolio(mutualFunds);
            setFunds(funds);
            setPositions([]);
            setError(null);
            setSuccess('Mutual fund holdings fetched successfully');
            updateChart(mutualFunds);
            resetModal();
          }
        } catch (error) {
          console.error('Polling error:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
          });
          if (error.response?.status === 404) {
            // Holdings not yet received, continue polling
            console.log('Holdings not found, continuing to poll...');
          } else {
            setError(`Failed to fetch holdings: ${error.response?.data?.message || error.message}`);
            resetModal();
          }
        }
      }, 5000); // Poll every 5 seconds
    }
    return () => clearInterval(interval);
  }, [step, transactionId, setPortfolio, setFunds, setPositions, setError, setSuccess, updateChart]);

  // Reset modal state
  const resetModal = () => {
    setIsPanModalOpen(false);
    setPanInput('');
    setMobileInput('');
    setOtpInput('');
    setPanError(null);
    setMobileError(null);
    setOtpError(null);
    setSuccessMessage(null);
    setStep('pan');
    setTransactionId(null);
  };

  // Subtle parallax effect on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const parallaxElements = document.querySelectorAll('.parallax-element');

      parallaxElements.forEach((element) => {
        const speed = element.getAttribute('data-speed');
        element.style.transform = `translateY(${scrollPosition * speed}px)`;
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Staggered animation for features and cards
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <div className="relative min-h-screen w-screen bg-black text-white overflow-hidden font-sans">
      {activeTab === "stocks" && (
        <>
          {/* Hero Section with Premium Background */}
          <div className="relative py-1 lg:py-3 overflow-hidden bg-gradient-to-b from-gray-900 to-black">
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-900/30 to-purple-900/20"
                animate={{
                  backgroundPosition: ['0% 0%', '100% 100%'],
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  ease: 'linear',
                }}
              />
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMxLjIgMCAyIC44IDIgMnYyMGMwIDEuMi0uOCAyLTIgMkgxOGMtMS4yIDAtMi0uOC0yLTJWMjBjMC0xLjIuOC0yIDItMmgxOHoiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAzKSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9nPjwvc3ZnPg==')] opacity-40" />
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/5 backdrop-blur-3xl"
                  style={{
                    width: `${Math.random() * 300 + 100}px`,
                    height: `${Math.random() * 300 + 100}px`,
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    filter: 'blur(30px)',
                  }}
                  animate={{
                    y: [0, -20, 0],
                    x: [0, Math.random() * 10 - 5, 0],
                    opacity: [0.1, 0.2, 0.1],
                  }}
                  transition={{
                    duration: Math.random() * 8 + 12,
                    repeat: Infinity,
                    delay: Math.random() * 5,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>

            <div className="container mx-auto px-6 relative z-10">

              <div className="flex justify-center mb-12">
                <div className="flex items-center bg-gray-800/80 backdrop-blur-xl rounded-full p-1 border border-gray-700/50 shadow-lg gap-2">
                  {["Stocks", "Mutual Funds", "Gold"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => {
                        if (tab.toLowerCase() === "gold") {
                          navigate("/digital-gold");
                        } else {
                          setActiveTab(tab.toLowerCase().replace(' ', ''));
                        }
                      }} className={`transition-all duration-300 px-6 py-3 rounded-full text-sm font-medium ${activeTab === tab.toLowerCase().replace(' ', '')
                        ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg"
                        : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                        }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center">
                <motion.div
                  className="md:w-1/2 mb-36 md:mt-0"
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
                  <motion.h1
                    className="text-4xl md:text-6xl font-bold mb-6 leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-300"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  >
                    Discover
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                      Invest
                    </span>
                    <br />
                    Excel
                  </motion.h1>
                  <motion.p
                    className="text-lg md:text-xl text-gray-300 mb-8 max-w-lg leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  >
                    Precision tools for the modern investor. Advanced screening, real-time analytics, and institutional-grade insights in a seamless experience.
                  </motion.p>
                  <motion.div
                    className="flex flex-col sm:flex-row gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <motion.button
                      onClick={onConnectClick}
                      className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-lg font-medium rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      Connect Portfolio <FaChevronRight className="text-sm ml-1 opacity-70" />
                    </motion.button>
                    <motion.button
                      onClick={() => setIsPanModalOpen(true)}
                      className="flex items-center justify-center gap-2 px-8 py-4 bg-gray-800 text-white text-lg font-medium rounded-xl border border-gray-700 hover:bg-gray-700 transition-all shadow-lg shadow-black/40 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      Connect PAN <FaUser className="text-sm ml-1 opacity-70" />
                    </motion.button>
                  </motion.div>
                </motion.div>

                <motion.div
                  className="md:w-1/2 flex justify-center parallax-element "
                  data-speed="-0.08"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="relative w-full max-w-lg">
                    <motion.div
                      className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-2xl blur-xl z-0"
                      animate={{
                        rotate: [12, 8, 12],
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                    <motion.div
                      className="absolute -top-6 -left-6 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-xl z-0"
                      animate={{
                        scale: [1, 1.1, 1],
                        x: [0, -5, 0],
                        y: [0, -5, 0],
                      }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                    <motion.div
                      className="bg-gray-900 rounded-2xl overflow-hidden relative z-10 border border-gray-800 shadow-[0_20px_50px_rgba(8,_112,_184,_0.2)]"
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="p-4 bg-gradient-to-r from-gray-800 to-gray-900 flex justify-between items-center border-b border-gray-800">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-2">
                            <span className="h-3 w-3 rounded-full bg-red-400"></span>
                            <span className="h-3 w-3 rounded-full bg-yellow-400"></span>
                            <span className="h-3 w-3 rounded-full bg-green-400"></span>
                          </div>
                          <h3 className="font-medium text-gray-400 text-sm ml-2">Advanced Stock Screener</h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <FaBell className="text-gray-500 text-xs" />
                          <FaUser className="text-gray-500 text-xs" />
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="flex justify-between mb-6 bg-gray-800/50 p-4 rounded-xl">
                          <div>
                            <div className="text-gray-400 text-sm font-medium">Portfolio Value</div>
                            <motion.div
                              className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 1, delay: 1.2 }}
                            >
                              ₹1,243,908.62
                            </motion.div>
                            <div className="text-green-400 text-sm flex items-center font-medium">
                              <motion.div
                                animate={{
                                  y: [0, -2, 0],
                                }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                              >
                                <FaArrowUp className="inline mr-1 text-xs" /> ₹18,243.50 (1.47%)
                              </motion.div>
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-sm font-medium">Cost Basis</div>
                            <motion.div
                              className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 1, delay: 1.4 }}
                            >
                              ₹1,052,600.00
                            </motion.div>
                            <div className="text-blue-400 text-sm font-medium">+18.17% total return</div>
                          </div>
                        </div>
                        <motion.div
                          className="h-36 bg-gray-800/30 rounded-xl mb-5 overflow-hidden backdrop-blur-sm border border-gray-800/50"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 1, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <svg className="w-full h-full" viewBox="0 0 400 140" xmlns="http://www.w3.org/2000/svg">
                            {[...Array(5)].map((_, i) => (
                              <line
                                key={i}
                                x1="0"
                                y1={30 + i * 20}
                                x2="400"
                                y2={30 + i * 20}
                                stroke="rgba(255,255,255,0.05)"
                                strokeWidth="1"
                              />
                            ))}
                            <motion.path
                              d="M0,110 C30,100 60,120 90,80 C120,40 150,90 180,70 C210,50 240,70 270,60 C300,50 330,30 360,40 C390,50 400,50 400,50"
                              stroke="url(#blueGradient)"
                              strokeWidth="3"
                              fill="none"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 2, delay: 1.6, ease: 'easeOut' }}
                            />
                            <motion.path
                              d="M0,110 C30,100 60,120 90,80 C120,40 150,90 180,70 C210,50 240,70 270,60 C300,50 330,30 360,40 C390,50 400,50 400,50 L400,140 L0,140 Z"
                              fill="url(#areaGradient)"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 1.5, delay: 2 }}
                            />
                            <motion.circle
                              cx="0"
                              cy="0"
                              r="4"
                              fill="#fff"
                              initial={{ cx: 0, cy: 110 }}
                              animate={{
                                cx: [0, 90, 180, 270, 360, 400],
                                cy: [110, 80, 70, 60, 40, 50],
                              }}
                              transition={{
                                duration: 3,
                                delay: 3,
                                ease: 'easeInOut',
                              }}
                            />
                            <text x="0" y="135" fill="#6B7280" fontSize="10">
                              9:30 AM
                            </text>
                            <text x="190" y="135" fill="#6B7280" fontSize="10">
                              12:30 PM
                            </text>
                            <text x="370" y="135" fill="#6B7280" fontSize="10">
                              4:00 PM
                            </text>
                            <defs>
                              <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#60A5FA" />
                                <stop offset="100%" stopColor="#7C3AED" />
                              </linearGradient>
                              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="rgba(37, 99, 235, 0.3)" />
                                <stop offset="100%" stopColor="rgba(37, 99, 235, 0)" />
                              </linearGradient>
                            </defs>
                          </svg>
                        </motion.div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm text-gray-400 px-2 mb-1">
                            <div>Stock</div>
                            <div className="flex gap-6">
                              <div>Price</div>
                              <div>Day</div>
                            </div>
                          </div>
                          {[
                            { symbol: 'AAPL', name: 'Apple Inc.', price: '₹218.30', change: '+1.24%', positive: true },
                            { symbol: 'MSFT', name: 'Microsoft Corp.', price: '₹405.18', change: '+0.86%', positive: true },
                            { symbol: 'TSLA', name: 'Tesla Inc.', price: '₹197.42', change: '-1.89%', positive: false },
                            { symbol: 'NVDA', name: 'NVIDIA Corp.', price: '₹924.75', change: '+2.53%', positive: true },
                          ].map((stock, i) => (
                            <motion.div
                              key={stock.symbol}
                              className="flex justify-between items-center p-3 bg-gray-800/30 backdrop-blur-sm rounded-lg cursor-pointer border border-transparent hover:border-gray-700 hover:bg-gray-800/50 transition-all"
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.5, delay: 1.8 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                            >
                              <div className="flex items-center">
                                <div
                                  className={`w-8 h-8 rounded-md mr-3 flex items-center justify-center ${stock.positive ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
                                    }`}
                                >
                                  {stock.symbol.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-medium text-white">{stock.symbol}</div>
                                  <div className="text-xs text-gray-400">{stock.name}</div>
                                </div>
                              </div>
                              <div className="flex gap-6 items-end text-right">
                                <div className="text-white font-medium">{stock.price}</div>
                                <div className={stock.positive ? 'text-green-400' : 'text-red-400'}>{stock.change}</div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </div>
            {isPanModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                <motion.div
                  className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {step === 'pan' ? 'Connect with PAN' : step === 'otp' ? 'Enter OTP' : 'Fetching Holdings'}
                    </h3>
                    <button
                      onClick={resetModal}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                  {step === 'pan' && (
                    <div>
                      <div className="mb-4">
                        <label htmlFor="panInput" className="block text-sm font-medium text-gray-700 mb-2">
                          Enter your PAN
                        </label>
                        <input
                          id="panInput"
                          type="text"
                          className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., ABCDE1234F"
                          value={panInput}
                          onChange={(e) => {
                            setPanInput(e.target.value.toUpperCase());
                            setPanError(null);
                          }}
                          maxLength={10}
                        />
                        {panError && <p className="mt-2 text-sm text-red-600">{panError}</p>}
                      </div>
                      <div className="mb-4">
                        <label htmlFor="mobileInput" className="block text-sm font-medium text-gray-700 mb-2">
                          Enter your Mobile Number
                        </label>
                        <input
                          id="mobileInput"
                          type="text"
                          className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., 9876543210"
                          value={mobileInput}
                          onChange={(e) => {
                            setMobileInput(e.target.value);
                            setMobileError(null);
                          }}
                          maxLength={10}
                        />
                        {mobileError && <p className="mt-2 text-sm text-red-600">{mobileError}</p>}
                      </div>
                    </div>
                  )}
                  {step === 'otp' && (
                    <div className="mb-4">
                      <label htmlFor="otpInput" className="block text-sm font-medium text-gray-700 mb-2">
                        Enter OTP
                      </label>
                      <input
                        id="otpInput"
                        type="text"
                        className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 1234"
                        value={otpInput}
                        onChange={(e) => {
                          setOtpInput(e.target.value);
                          setOtpError(null);
                        }}
                        maxLength={6}
                      />
                      {otpError && <p className="mt-2 text-sm text-red-600">{otpError}</p>}
                    </div>
                  )}
                  {step === 'holdings' && (
                    <div className="text-center">
                      <p className="text-gray-700">Fetching holdings, please wait...</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Holdings will be displayed once received from the server.
                      </p>
                    </div>
                  )}
                  {successMessage && <p className="mt-2 text-sm text-green-600">{successMessage}</p>}
                  {(step === 'pan' || step === 'otp') && (
                    <div className="flex justify-end gap-4">
                      <button
                        onClick={resetModal}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={step === 'pan' ? handlePanSubmit : handleOtpSubmit}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {step === 'pan' ? 'Submit' : 'Verify OTP'}
                      </button>
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </div>
          <div className="container mx-auto px-6 py-24">
            <motion.h2
              className="text-center mb-20 relative inline-block mx-auto"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="text-3xl md:text-4xl font-bold text-center mb-3 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 relative z-10 inline-block">
                Industry-leading Tools for Serious Investors
              </span>
              <motion.div
                className="absolute -bottom-3 left-0 right-0 h-1 bg-blue-500 rounded-full z-0 mx-auto"
                initial={{ width: 0 }}
                whileInView={{ width: '100%' }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4 }}
              />
            </motion.h2>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {[
                {
                  icon: <FaChartLine className="text-2xl" />,
                  title: 'Advanced Screening',
                  description: 'Filter thousands of securities using over 150 technical and fundamental criteria for precise investment discovery.',
                },
                {
                  icon: <FaBrain className="text-2xl" />,
                  title: 'AI-Powered Insights',
                  description: 'Access institutional-grade analysis and tailored recommendations based on your investment objectives.',
                },
                {
                  icon: <FaShieldAlt className="text-2xl" />,
                  title: 'Enterprise Security',
                  description: 'Bank-level encryption and security protocols protect your sensitive financial data at all times.',
                },
                {
                  icon: <FaChartBar className="text-2xl" />,
                  title: 'Real-time Analytics',
                  description: 'Monitor markets with live data and instant updates on your watchlists and portfolio performance.',
                },
                {
                  icon: <FaHistory className="text-2xl" />,
                  title: 'Historical Backtesting',
                  description: 'Test your strategies against decades of market data to optimize your investment approach.',
                },
                {
                  icon: <FaFileInvoiceDollar className="text-2xl" />,
                  title: 'Tax Optimization',
                  description: 'Intelligent tax-loss harvesting recommendations and comprehensive capital gains reporting.',
                },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  className="bg-gray-900 p-8 rounded-2xl border border-gray-800 hover:border-gray-700 transition-all group"
                  variants={itemVariants}
                  whileHover={{
                    y: -6,
                    boxShadow: '0 20px 40px -5px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 text-blue-400 mb-6 group-hover:scale-110 group-hover:text-blue-300 transition-all duration-300 border border-blue-500/20">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
                  <p className="text-gray-400 mb-5 leading-relaxed">{feature.description}</p>
                  <div className="flex items-center text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="mr-2">Explore feature</span>
                    <FaLongArrowAltRight className="transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Testimonials with Animation */}
          <div className="bg-gradient-to-b from-black to-gray-900 py-20">
            <div className="container mx-auto px-6">
              <motion.h2
                className="text-3xl md:text-4xl font-bold text-center mb-3 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                Trusted by Industry Professionals
              </motion.h2>

              <motion.div
                className="flex justify-center mb-16"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <FaStar key={i} className="text-yellow-500 text-xl" />
                  ))}
                </div>
                <p className="ml-3 text-gray-300 font-medium">4.9/5 from over 25,000 users</p>
              </motion.div>

              <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {[
                  {
                    quote: "The screening capabilities are unmatched. I've found high-performing investments that I would have otherwise missed completely.",
                    name: "Michael Chen",
                    title: "Hedge Fund Analyst",
                    avatar: "M"
                  },
                  {
                    quote: "I've used many screeners over my 15-year career, but this platform offers the perfect balance of power and usability. Worth every penny.",
                    name: "Sarah Johnson",
                    title: "Portfolio Manager",
                    avatar: "S"
                  },
                  {
                    quote: "The AI-driven insights saved me countless hours of research and helped me identify overlooked opportunities in emerging markets.",
                    name: "Raj Patel",
                    title: "Private Equity Director",
                    avatar: "R"
                  }
                ].map((testimonial, i) => (
                  <motion.div
                    key={i}
                    className="bg-gray-900 p-6 rounded-2xl border border-gray-800 relative backdrop-blur-sm"
                    variants={itemVariants}
                    whileHover={{ y: -5 }}
                  >
                    {/* Quote mark */}
                    <div className="absolute top-6 right-6 text-4xl text-blue-500/20 font-serif">"</div>

                    <div className="flex items-center mb-5">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                        {testimonial.avatar}
                      </div>
                      <div className="ml-3">
                        <h4 className="font-semibold text-white">{testimonial.name}</h4>
                        <p className="text-sm text-gray-400">{testimonial.title}</p>
                      </div>
                    </div>
                    <p className="text-gray-300 leading-relaxed">{testimonial.quote}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
          <div className="py-16 bg-black">
            <div className="container mx-auto px-6">
              <motion.h4
                className="text-center text-lg font-medium text-gray-400 mb-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                Powered by enterprise-grade data from industry leaders
              </motion.h4>
              <motion.div
                className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
              >
                {['Bloomberg', 'Refinitiv', 'S&P Global', 'FactSet', 'Morningstar'].map((partner, i) => (
                  <motion.div
                    key={i}
                    className="text-xl font-semibold text-gray-500 hover:text-gray-300 transition-colors duration-300"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 * i }}
                    whileHover={{ scale: 1.05 }}
                  >
                    {partner}
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
          <div className="bg-gradient-to-b from-gray-900 to-black py-24">
            <div className="container mx-auto px-6">
              <motion.div
                className="text-center max-w-2xl mx-auto mb-16"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
                  Premium Plans for Every Investor
                </h2>
                <p className="text-gray-400 text-lg">
                  Select the plan that best fits your investment strategy and goals. All plans include core screening capabilities.
                </p>
              </motion.div>
              <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {[
                  {
                    name: 'Standard',
                    price: '₹299',
                    description: 'Essential tools for individual investors',
                    features: [
                      '50+ technical indicators',
                      'Real-time data',
                      '5 custom watchlists',
                      'Basic portfolio tracking',
                      'CSV export capabilities',
                    ],
                    featured: false,
                    btnText: 'Get Started',
                  },
                  {
                    name: 'Professional',
                    price: '₹799',
                    description: 'Advanced tools for serious investors',
                    features: [
                      '150+ technical indicators',
                      'AI-powered insights',
                      'Unlimited watchlists',
                      'Advanced portfolio analytics',
                      'Pattern recognition',
                      'Backtesting capabilities',
                      'Priority support',
                    ],
                    featured: true,
                    btnText: 'Start 14-day Trial',
                  },
                  {
                    name: 'Enterprise',
                    price: '₹1999',
                    description: 'Institutional-grade solutions',
                    features: [
                      'All Professional features',
                      'API access',
                      'Custom integrations',
                      'Multi-user access',
                      'Dedicated account manager',
                      'Custom screening templates',
                      'Advanced data exports',
                    ],
                    featured: false,
                    btnText: 'Contact Sales',
                  },
                ].map((plan, i) => (
                  <motion.div
                    key={i}
                    className={`rounded-2xl overflow-hidden border ${plan.featured ? 'border-blue-500 relative scale-105 z-10' : 'border-gray-800'}`}
                    variants={itemVariants}
                  >
                    {plan.featured && (
                      <div className="absolute top-0 right-0 bg-blue-500 text-xs font-bold px-3 py-1 text-white rounded-bl-lg">
                        MOST POPULAR
                      </div>
                    )}
                    <div className={`p-8 ${plan.featured ? 'bg-gradient-to-b from-gray-800 to-gray-900' : 'bg-gray-900'}`}>
                      <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                      <div className="flex items-end gap-1 mb-2">
                        <div className="text-4xl font-bold text-white">{plan.price}</div>
                        <div className="text-gray-400 pb-1">/month</div>
                      </div>
                      <p className="text-gray-400 mb-6">{plan.description}</p>
                      <motion.button
                        className={`w-full py-3 rounded-xl font-medium transition-all ${plan.featured
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20'
                          : 'bg-gray-800 text-white border border-gray-700'
                          }`}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        {plan.btnText}
                      </motion.button>
                    </div>
                    <div className="bg-gray-900 p-8 border-t border-gray-800">
                      <ul className="space-y-3">
                        {plan.features.map((feature, j) => (
                          <li key={j} className="flex items-center text-gray-300">
                            <FaCheck className="text-green-400 mr-3 text-xs" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
          <div className="py-20 bg-black">
            <div className="container mx-auto px-6">
              <motion.div
                className="max-w-4xl mx-auto bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-10 border border-gray-800 relative overflow-hidden"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <div className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden">
                  <motion.div
                    className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      repeatType: 'reverse',
                    }}
                  />
                  <motion.div
                    className="absolute -bottom-32 -left-32 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{
                      duration: 9,
                      delay: 1,
                      repeat: Infinity,
                      repeatType: 'reverse',
                    }}
                  />
                </div>
                <div className="relative z-10">
                  <motion.h2
                    className="text-3xl md:text-4xl font-bold mb-6 text-center text-white"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                  >
                    Ready to Transform Your Investment Strategy?
                  </motion.h2>
                  <motion.p
                    className="text-gray-300 text-center mb-8 max-w-2xl mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  >
                    Join thousands of institutional and retail investors who use our platform to make data-driven decisions and optimize their portfolios.
                  </motion.p>
                  <motion.div
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
                    <motion.button
                      onClick={onConnectClick}
                      className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20 hover:from-blue-600 hover:to-blue-700 transition-all"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      Start Free Trial
                    </motion.button>
                    <motion.button
                      className="px-8 py-4 bg-gray-800 text-white font-medium rounded-xl border border-gray-700 hover:bg-gray-700 transition-all"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      View Demo
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
      {activeTab === "mutualfunds" && (
        <>
          {/* Enhanced Mutual Funds Hero Section */}
          <div className="relative py-1 lg:py-3 overflow-hidden bg-gradient-to-b from-gray-900 via-purple-950/20 to-black">
            {/* Advanced Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
              {/* Animated Gradient Mesh */}
              <motion.div
                className="absolute top-0 left-0 w-full h-full opacity-60"
                style={{
                  background: `
              radial-gradient(circle at 20% 30%, rgba(147, 51, 234, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 70%, rgba(79, 70, 229, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 40% 80%, rgba(236, 72, 153, 0.2) 0%, transparent 50%)
            `
                }}
                animate={{
                  opacity: [0.4, 0.8, 0.4],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  ease: 'easeInOut',
                }}
              />

              {/* 3D Floating Elements */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  initial={{
                    opacity: 0,
                    scale: 0,
                    rotateX: 0,
                    rotateY: 0,
                  }}
                  animate={{
                    opacity: [0, 0.6, 0],
                    scale: [0, 1, 0],
                    rotateX: [0, 360],
                    rotateY: [0, 180],
                    y: [0, -100, 0],
                    x: [0, Math.random() * 50 - 25, 0],
                  }}
                  transition={{
                    duration: Math.random() * 15 + 10,
                    repeat: Infinity,
                    delay: Math.random() * 5,
                    ease: 'easeInOut',
                  }}
                >
                  <div
                    className="w-8 h-8 bg-gradient-to-br from-purple-400/30 to-indigo-400/30 rounded-lg backdrop-blur-sm border border-purple-300/20"
                    style={{
                      transform: `perspective(1000px) rotateX(${Math.random() * 360}deg) rotateY(${Math.random() * 360}deg)`,
                      boxShadow: '0 0 20px rgba(147, 51, 234, 0.3)',
                    }}
                  />
                </motion.div>
              ))}

              {/* Animated Grid Pattern */}
              <div
                className="absolute inset-0 opacity-10 "
                style={{
                  backgroundImage: `
              linear-gradient(rgba(147, 51, 234, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(147, 51, 234, 0.1) 1px, transparent 1px)
            `,
                  backgroundSize: '50px 50px',
                }}
              />
            </div>

            <div className="container mx-auto px-6 relative z-10 h-screen">
              {/* Enhanced Tab Navigation */}
              <div className="flex justify-center mb-12">
                <div className="flex items-center bg-gray-800/80 backdrop-blur-xl rounded-full p-1 border border-gray-700/50 shadow-lg gap-2">
                  {["Stocks", "Mutual Funds", "Gold"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => {
                        if (tab.toLowerCase() === "gold") {
                          navigate("/digital-gold");
                          setActiveTab(tab.toLowerCase().replace(' ', ''));
                        } else {
                          setActiveTab(tab.toLowerCase().replace(' ', ''));
                        }
                      }} 
                      className={`transition-all duration-300 px-6 py-3 rounded-full text-sm font-medium ${activeTab === tab.toLowerCase().replace(' ', '')
                        ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg"
                        : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                        }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hero Content with 3D Fund Portfolio Sphere */}
              <div className="flex flex-col lg:flex-row items-center gap-16">
                <motion.div
                  className="lg:w-1/2 mb-8 lg:mb-0"
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
                  <motion.h1
                    className="text-4xl md:text-6xl font-bold mb-6 leading-tight tracking-tight"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-300">
                      Smart
                    </span>
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                      Mutual Fund
                    </span>
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-300">
                      Analytics
                    </span>
                  </motion.h1>
                  <motion.p
                    className="text-lg md:text-xl text-gray-300 mb-8 max-w-lg leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  >
                    AI-powered fund selection with advanced risk analytics, performance prediction, and intelligent portfolio optimization for maximum returns.
                  </motion.p>
                  <motion.div
                    className="flex flex-col sm:flex-row gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <motion.button
                      className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-lg font-medium rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg shadow-purple-500/20 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      Explore Funds <FaChevronRight className="text-sm ml-1 opacity-70" />
                    </motion.button>
                    <motion.button
                      className="flex items-center justify-center gap-2 px-8 py-4 bg-gray-800 text-white text-lg font-medium rounded-xl border border-gray-700 hover:bg-gray-700 transition-all shadow-lg shadow-black/40 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      AI Advisor <FaBrain className="text-sm ml-1 opacity-70" />
                    </motion.button>
                  </motion.div>
                </motion.div>

                {/* 3D Fund Portfolio Sphere */}
                <motion.div
                  className="lg:w-1/2 flex justify-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="relative w-full max-w-lg h-96 flex items-center justify-center" style={{ perspective: '1000px' }}>
                    {/* Ambient Glow Effects */}
                    <motion.div
                      className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 blur-3xl"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />

                    {/* Central 3D Sphere */}
                    <motion.div
                      className="relative w-64 h-64 rounded-full bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 shadow-2xl"
                      style={{
                        transformStyle: 'preserve-3d',
                        boxShadow: `
                    0 0 100px rgba(147, 51, 234, 0.6),
                    inset 0 0 50px rgba(255, 255, 255, 0.1),
                    0 20px 40px rgba(0, 0, 0, 0.3)
                  `,
                      }}
                      animate={{
                        rotateY: [0, 360],
                        rotateX: [0, 15, 0],
                      }}
                      transition={{
                        rotateY: { duration: 20, repeat: Infinity, ease: 'linear' },
                        rotateX: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
                      }}
                      whileHover={{
                        scale: 1.1,
                        rotateY: 180,
                      }}
                    >
                      {/* Sphere Surface Pattern */}
                      <div className="absolute inset-0 rounded-full opacity-30">
                        <div
                          className="w-full h-full rounded-full"
                          style={{
                            background: `
                        radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3) 0%, transparent 50%),
                        radial-gradient(circle at 70% 70%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)
                      `,
                          }}
                        />
                      </div>

                      {/* Central Icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                          animate={{
                            rotateY: [0, -360],
                            scale: [1, 1.1, 1],
                          }}
                          transition={{
                            rotateY: { duration: 15, repeat: Infinity, ease: 'linear' },
                            scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
                          }}
                        >
                          <FaChartPie className="text-6xl text-white/90" />
                        </motion.div>
                      </div>
                    </motion.div>

                    {/* Orbiting Fund Categories */}
                    {[
                      { name: 'Large Cap', color: 'from-blue-500 to-blue-600', angle: 0, radius: 140, icon: FaBuilding },
                      { name: 'Mid Cap', color: 'from-green-500 to-green-600', angle: 72, radius: 140, icon: FaChartLine },
                      { name: 'Small Cap', color: 'from-yellow-500 to-yellow-600', angle: 144, radius: 140, icon: FaRocket },
                      { name: 'Debt', color: 'from-red-500 to-red-600', angle: 216, radius: 140, icon: FaShieldAlt },
                      { name: 'Hybrid', color: 'from-purple-500 to-purple-600', angle: 288, radius: 140, icon: FaBalanceScale },
                    ].map((fund, index) => {
                      const IconComponent = fund.icon;
                      return (
                        <motion.div
                          key={fund.name}
                          className="absolute"
                          style={{
                            transformStyle: 'preserve-3d',
                          }}
                          animate={{
                            rotateY: [fund.angle, fund.angle + 360],
                          }}
                          transition={{
                            duration: 25 + index * 2,
                            repeat: Infinity,
                            ease: 'linear',
                          }}
                        >
                          <motion.div
                            className={`w-16 h-16 rounded-xl bg-gradient-to-br ${fund.color} flex items-center justify-center shadow-lg border border-white/20 backdrop-blur-sm`}
                            style={{
                              transform: `translateZ(${fund.radius}px) rotateY(${-fund.angle}deg)`,
                              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                            }}
                            whileHover={{
                              scale: 1.2,
                              rotateZ: 15,
                            }}
                            animate={{
                              y: [0, -10, 0],
                              rotateZ: [0, 5, 0],
                            }}
                            transition={{
                              y: { duration: 3 + index * 0.5, repeat: Infinity, ease: 'easeInOut' },
                              rotateZ: { duration: 4 + index * 0.3, repeat: Infinity, ease: 'easeInOut' },
                            }}
                          >
                            <IconComponent className="text-2xl text-white" />
                          </motion.div>

                          {/* Fund Label */}
                          <motion.div
                            className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-300 whitespace-nowrap bg-gray-900/80 px-2 py-1 rounded backdrop-blur-sm"
                            style={{
                              transform: `translateZ(${fund.radius}px) rotateY(${-fund.angle}deg) translateX(-50%)`,
                            }}
                          >
                            {fund.name}
                          </motion.div>
                        </motion.div>
                      );
                    })}

                    {/* Floating Data Points */}
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-3 h-3 bg-white/60 rounded-full"
                        style={{
                          transformStyle: 'preserve-3d',
                        }}
                        animate={{
                          rotateY: [i * 45, i * 45 + 360],
                          rotateX: [0, 360],
                          scale: [0.5, 1, 0.5],
                        }}
                        transition={{
                          rotateY: { duration: 15 + i, repeat: Infinity, ease: 'linear' },
                          rotateX: { duration: 8 + i * 0.5, repeat: Infinity, ease: 'linear' },
                          scale: { duration: 2 + i * 0.2, repeat: Infinity, ease: 'easeInOut' },
                        }}
                        initial={{
                          x: Math.cos((i * 45) * Math.PI / 180) * (100 + i * 10),
                          y: Math.sin((i * 45) * Math.PI / 180) * (100 + i * 10),
                        }}
                      />
                    ))}

                    {/* Performance Rings */}
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute border border-purple-400/20 rounded-full"
                        style={{
                          width: `${200 + i * 60}px`,
                          height: `${200 + i * 60}px`,
                          transformStyle: 'preserve-3d',
                        }}
                        animate={{
                          rotateX: [0, 360],
                          rotateZ: [0, -360],
                        }}
                        transition={{
                          rotateX: { duration: 20 + i * 5, repeat: Infinity, ease: 'linear' },
                          rotateZ: { duration: 30 + i * 3, repeat: Infinity, ease: 'linear' },
                        }}
                      />
                    ))}

                    {/* Interactive Tooltip */}
                    <motion.div
                      className="absolute top-4 right-4 bg-gray-900/90 backdrop-blur-xl rounded-lg p-3 border border-gray-700/50 text-xs"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.5, duration: 0.5 }}
                    >
                      <div className="text-purple-400 font-medium mb-1">Portfolio Health</div>
                      <div className="text-white font-bold text-lg">94.2%</div>
                      <div className="text-gray-400">Optimized</div>
                    </motion.div>

                    {/* AI Insights Panel */}
                    <motion.div
                      className="absolute bottom-4 left-4 bg-gray-900/90 backdrop-blur-xl rounded-lg p-3 border border-gray-700/50 text-xs max-w-48"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 2, duration: 0.5 }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <FaBrain className="text-purple-400" />
                        <span className="text-purple-400 font-medium">AI Insight</span>
                      </div>
                      <div className="text-gray-300 leading-relaxed">
                        Consider 5% reallocation to small-cap for +2.3% potential returns
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Advanced Features Section */}
          <div className="container mx-auto px-6 py-24">
            <motion.h2
              className="text-center mb-20 relative inline-block mx-auto"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="text-3xl md:text-4xl font-bold text-center mb-3 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 relative z-10 inline-block">
                AI-Powered Investment Intelligence
              </span>
              <motion.div
                className="absolute -bottom-3 left-0 right-0 h-1 bg-purple-500 rounded-full z-0 mx-auto"
                initial={{ width: 0 }}
                whileInView={{ width: '100%' }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4 }}
              />
            </motion.h2>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {[
                {
                  icon: <FaBrain className="text-2xl" />,
                  title: 'AI Fund Selection',
                  description: 'Machine learning algorithms analyze 500+ parameters to identify top-performing funds tailored to your risk profile.',
                },
                {
                  icon: <FaChartPie className="text-2xl" />,
                  title: 'Smart Portfolio Rebalancing',
                  description: 'Automated portfolio optimization with real-time adjustments based on market conditions and performance metrics.',
                },
                {
                  icon: <FaRocket className="text-2xl" />,
                  title: 'Predictive Analytics',
                  description: 'Advanced forecasting models predict fund performance using historical data and market sentiment analysis.',
                },
                {
                  icon: <FaShieldAlt className="text-2xl" />,
                  title: 'Risk Assessment',
                  description: 'Comprehensive risk analysis with stress testing and scenario modeling for informed investment decisions.',
                },
                {
                  icon: <FaChartLine className="text-2xl" />,
                  title: 'Performance Tracking',
                  description: 'Real-time monitoring with detailed analytics, benchmarking, and personalized performance insights.',
                },
                {
                  icon: <FaLightbulb className="text-2xl" />,
                  title: 'Smart Recommendations',
                  description: 'Personalized investment suggestions based on your goals, timeline, and market opportunities.',
                },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  className="bg-gray-900 p-8 rounded-2xl border border-gray-800 hover:border-gray-700 transition-all group"
                  variants={itemVariants}
                  whileHover={{
                    y: -6,
                    boxShadow: '0 20px 40px -5px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-600/20 to-indigo-600/20 text-purple-400 mb-6 group-hover:scale-110 group-hover:text-purple-300 transition-all duration-300 border border-purple-500/20">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
                  <p className="text-gray-400 mb-5 leading-relaxed">{feature.description}</p>
                  <div className="flex items-center text-purple-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="mr-2">Learn more</span>
                    <FaLongArrowAltRight className="transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Revolutionary Coming Soon Section */}
          <div className="container mx-auto px-6 py-32">
            <motion.div
              className="max-w-4xl mx-auto text-center relative"
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
            >
              {/* 3D Card Container */}
              <motion.div
                className="relative bg-gradient-to-br from-gray-900 via-purple-950/30 to-gray-800 rounded-3xl p-16 border border-gray-700/30 overflow-hidden"
                style={{
                  transformStyle: 'preserve-3d',
                  boxShadow: `
              0 25px 50px rgba(0, 0, 0, 0.5),
              0 0 100px rgba(147, 51, 234, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.1)
            `,
                }}
                whileHover={{
                  rotateX: 5,
                  rotateY: 5,
                  scale: 1.02,
                }}
                transition={{ duration: 0.3 }}
              >
                {/* Advanced Background Effects */}
                <div className="absolute inset-0 overflow-hidden">
                  {/* Animated Orbs */}
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full"
                      style={{
                        width: `${Math.random() * 200 + 50}px`,
                        height: `${Math.random() * 200 + 50}px`,
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        background: `radial-gradient(circle, rgba(147, 51, 234, ${Math.random() * 0.3 + 0.1}) 0%, transparent 70%)`,
                        filter: 'blur(40px)',
                      }}
                      animate={{
                        x: [0, Math.random() * 100 - 50, 0],
                        y: [0, Math.random() * 100 - 50, 0],
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 0.6, 0.3],
                      }}
                      transition={{
                        duration: Math.random() * 10 + 15,
                        repeat: Infinity,
                        repeatType: 'reverse',
                        ease: 'easeInOut',
                      }}
                    />
                  ))}

                  {/* Geometric Patterns */}
                  <motion.div
                    className="absolute top-10 right-10 w-32 h-32 border border-purple-400/20 rounded-lg"
                    animate={{
                      rotate: [0, 360],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    style={{
                      transform: 'perspective(1000px) rotateX(45deg) rotateY(45deg)',
                    }}
                  />
                </div>

                <div className="relative z-10">
                  {/* 3D Icon */}
                  <motion.div
                    className="relative w-32 h-32 mx-auto mb-12"
                    initial={{ scale: 0, rotateY: 180 }}
                    animate={{ scale: 1, rotateY: 0 }}
                    transition={{ duration: 1, delay: 0.3 }}
                    whileHover={{
                      rotateY: 360,
                      scale: 1.1,
                    }}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <div
                      className="w-full h-full bg-gradient-to-br from-purple-500 via-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-500/40"
                      style={{
                        transform: 'translateZ(20px)',
                        boxShadow: `
                    0 0 50px rgba(147, 51, 234, 0.6),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2)
                  `,
                      }}
                    >
                      <FaChartPie className="text-5xl text-white" />
                    </div>
                    {/* 3D Shadow */}
                    <div
                      className="absolute inset-0 bg-purple-900/40 rounded-3xl blur-xl"
                      style={{
                        transform: 'translateZ(-10px) translateY(10px)',
                      }}
                    />
                  </motion.div>

                  {/* Enhanced Typography */}
                  <motion.h2
                    className="text-4xl md:text-6xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-indigo-200"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    style={{
                      textShadow: '0 0 30px rgba(147, 51, 234, 0.3)',
                    }}
                  >
                    Next-Gen
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                      Fund Analytics
                    </span>
                  </motion.h2>

                  <motion.p
                    className="text-gray-300 text-xl mb-12 leading-relaxed max-w-2xl mx-auto font-light"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.7 }}
                  >
                    Experience the future of mutual fund investing with quantum-powered analytics,
                    holographic portfolio visualization, and neural network-driven recommendations.
                  </motion.p>

                  {/* Feature Pills */}
                  <motion.div
                    className="flex flex-wrap justify-center gap-4 mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.9 }}
                  >
                    {['Quantum Analytics', '3D Visualization', 'Neural Networks', 'Smart Rebalancing'].map((feature, index) => (
                      <motion.div
                        key={feature}
                        className="px-6 py-3 bg-purple-500/20 backdrop-blur-xl rounded-full border border-purple-400/30 text-purple-200 text-sm font-medium"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 1 + index * 0.1 }}
                        whileHover={{
                          scale: 1.05,
                          backgroundColor: 'rgba(147, 51, 234, 0.3)',
                        }}
                      >
                        {feature}
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* CTA Button */}
                  <motion.button
                    className="group relative px-12 py-6 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600 text-white font-bold text-lg rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/40"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 1.2 }}
                    whileHover={{
                      scale: 1.05,
                      boxShadow: '0 30px 60px rgba(147, 51, 234, 0.5)',
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-700"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '0%' }}
                      transition={{ duration: 0.4 }}
                    />
                    <span className="relative z-10 flex items-center gap-3">
                      Experience the Future
                      <motion.div
                        animate={{
                          rotate: [0, 360],
                          scale: [1, 1.2, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      >
                        ✨
                      </motion.div>
                    </span>
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  )
};

const PerformanceCard = ({ title, value, change, isPositive, isCurrency = true }) => (
  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col">
    <div className="flex justify-between items-center mb-2">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <FaInfoCircle className="text-gray-300 hover:text-gray-500 cursor-pointer" />
    </div>
    <p className="text-xl font-bold text-gray-800">
      {isCurrency ? "₹" : ""}{value}
    </p>
    {change !== undefined && (
      <p className={`text-sm mt-1 ${isPositive ? "text-green-600" : "text-red-600"}`}>
        {isPositive ? "+" : ""}{change}%
      </p>
    )}
  </div>
);

const PortfolioSummary = ({ portfolioData }) => {
  // Deduplicate portfolioData by instrument_token or tradingsymbol
  const uniquePortfolioData = Array.from(
    new Map(portfolioData.map((stock) => [stock.instrument_token || stock.tradingsymbol, stock])).values()
  );

  // Calculate values from the deduplicated portfolio data
  const totalValue = uniquePortfolioData.reduce((sum, stock) => {
    const quantity = stock.quantity || stock.t1_quantity || 0;
    return sum + (quantity * stock.last_price);
  }, 0);

  const totalInvested = uniquePortfolioData.reduce((sum, stock) => {
    const quantity = stock.quantity || stock.t1_quantity || 0;
    return sum + (quantity * stock.average_price);
  }, 0);

  const totalPnL = totalValue - totalInvested;
  const returns = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  const daysPnL = uniquePortfolioData.reduce((sum, stock) => {
    const quantity = stock.quantity || stock.t1_quantity || 0;
    const dayChange = stock.day_change_percentage || 0;
    return sum + (quantity * stock.last_price * dayChange / 100);
  }, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <PerformanceCard
        title="Current Value"
        value={totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
        change={portfolioData.dayChange}
        isPositive={portfolioData.dayChange >= 0}
      />
      <PerformanceCard
        title="Invested Amount"
        value={totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
      />
      <PerformanceCard
        title="Total P&L"
        value={totalPnL.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
        change={returns}
        isPositive={totalPnL >= 0}
      />
      <PerformanceCard
        title="Returns"
        value={`${returns.toFixed(2)}%`}
        isPositive={returns >= 0}
        isCurrency={false}
      />
      <PerformanceCard
        title="Today's P&L"
        value={daysPnL.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
        change={portfolioData.dayChange}
        isPositive={daysPnL >= 0}
      />
    </div>
  );
};

const fetchWatchlists = async (uid, setWatchlists, setError, setLoading) => {
  try {
    setLoading(true);
    const response = await axios.get(`${API_URL}/api/watchlist/${uid}`);
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

const Portfolio = ({ auth_token }) => {
  const [selectedBroker, setSelectedBroker] = useState("zerodha");
  const [accessTokens, setAccessTokens] = useState(
    Object.keys(BROKERS).reduce((acc, broker) => {
      acc[broker] = localStorage.getItem(`${broker}_access_token`) || null;
      return acc;
    }, {})
  );
  const [results, setResults] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [profile, setProfile] = useState(null);
  const [funds, setFunds] = useState(null);
  const [positions, setPositions] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeSection, setActiveSection] = useState("Portfolio");
  const [orderStatus, setOrderStatus] = useState(null);
  const [orders, setOrders] = useState([]);
  const [selectedOrderTrades, setSelectedOrderTrades] = useState(null);
  const [quantityInputs, setQuantityInputs] = useState({});
  const [chartInstance, setChartInstance] = useState(null);
  const [file, setFile] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("tradingsymbol");
  const [sortDirection, setSortDirection] = useState("asc");
  const [viewMode, setViewMode] = useState("all");
  const [gatewayInstance, setGatewayInstance] = useState(null);
  const dropdownRef = useRef(null);
  const [isPanModalOpen, setIsPanModalOpen] = useState(false);
  const [watchlists, setWatchlists] = useState([]); // MongoDB watchlists
  const [watchlistInput, setWatchlistInput] = useState("");
  const [selectedWatchlist, setSelectedWatchlist] = useState(null);
  const [uid, setUid] = useState(null); // User ID for authentication
  const [loading, setLoading] = useState(false);
  // State for order quantity inputs per stock
  const [orderQuantities, setOrderQuantities] = useState({});
  // State for modification inputs (quantity and price) per order
  const [modifyInputs, setModifyInputs] = useState({});
  const [selectedStock, setSelectedStock] = useState(null);
  const [rebalancingRiskProfile, setRebalancingRiskProfile] = useState('moderate');
  const [rebalancingMarketOutlook, setRebalancingMarketOutlook] = useState('neutral');
  const [rebalancingSuggestions, setRebalancingSuggestions] = useState([]);

  const calculateRebalancing = () => {
    // Calculate current sector allocations
    const sectorAllocations = portfolio.reduce((acc, stock) => {
      const sector = stock.sector || 'Others';
      const value = (stock.quantity || stock.t1_quantity || 0) * stock.last_price;
      acc[sector] = (acc[sector] || 0) + value;
      return acc;
    }, {});

    // Calculate total portfolio value
    const totalValue = Object.values(sectorAllocations).reduce((sum, value) => sum + value, 0);

    // Define target allocations based on risk profile and market outlook
    const targetAllocations = {
      conservative: {
        bullish: {
          'Financial Services': 25,
          'Technology': 20,
          'Healthcare': 15,
          'Consumer Goods': 15,
          'Others': 25
        },
        neutral: {
          'Financial Services': 20,
          'Technology': 15,
          'Healthcare': 20,
          'Consumer Goods': 20,
          'Others': 25
        },
        bearish: {
          'Financial Services': 15,
          'Technology': 10,
          'Healthcare': 25,
          'Consumer Goods': 25,
          'Others': 25
        }
      },
      moderate: {
        bullish: {
          'Financial Services': 30,
          'Technology': 25,
          'Healthcare': 15,
          'Consumer Goods': 15,
          'Others': 15
        },
        neutral: {
          'Financial Services': 25,
          'Technology': 20,
          'Healthcare': 20,
          'Consumer Goods': 20,
          'Others': 15
        },
        bearish: {
          'Financial Services': 20,
          'Technology': 15,
          'Healthcare': 25,
          'Consumer Goods': 25,
          'Others': 15
        }
      },
      aggressive: {
        bullish: {
          'Financial Services': 35,
          'Technology': 30,
          'Healthcare': 10,
          'Consumer Goods': 10,
          'Others': 15
        },
        neutral: {
          'Financial Services': 30,
          'Technology': 25,
          'Healthcare': 15,
          'Consumer Goods': 15,
          'Others': 15
        },
        bearish: {
          'Financial Services': 25,
          'Technology': 20,
          'Healthcare': 20,
          'Consumer Goods': 20,
          'Others': 15
        }
      }
    };

    // Get the target allocation for current settings
    const targets = targetAllocations[rebalancingRiskProfile][rebalancingMarketOutlook];

    // Calculate rebalancing suggestions
    const suggestions = [];

    // First calculate current percentages
    const currentPercentages = {};
    Object.keys(sectorAllocations).forEach(sector => {
      currentPercentages[sector] = (sectorAllocations[sector] / totalValue) * 100;
    });

    // Compare with targets and generate suggestions
    Object.keys(targets).forEach(sector => {
      const current = currentPercentages[sector] || 0;
      const target = targets[sector];
      const difference = target - current;

      if (Math.abs(difference) > 2) { // Only suggest changes for >2% difference
        suggestions.push({
          sector,
          symbol: sector, // In a real app, you might pick a representative stock
          currentAllocation: current.toFixed(1),
          targetAllocation: target,
          action: difference > 0 ? 'BUY' : 'SELL',
          amount: Math.abs(difference).toFixed(1)
        });
      }
    });

    setRebalancingSuggestions(suggestions);
  };

  useEffect(() => {
    if (activeSection === "Analysis" && portfolio.length > 0) {
      // Initialize Sector Allocation Chart
      const sectorCtx = document.getElementById('sectorChart')?.getContext('2d');
      if (sectorCtx) {
        const sectorData = portfolio.reduce((acc, stock) => {
          const sector = stock.sector || 'Others';
          const value = (stock.quantity || stock.t1_quantity || 0) * stock.last_price;
          acc[sector] = (acc[sector] || 0) + value;
          return acc;
        }, {});

        const sortedSectors = Object.entries(sectorData)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8);

        new Chart(sectorCtx, {
          type: 'pie',
          data: {
            labels: sortedSectors.map(s => s[0]),
            datasets: [{
              data: sortedSectors.map(s => s[1]),
              backgroundColor: [
                '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
                '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
              ],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
              },
              tooltip: {
                callbacks: {
                  label: function (context) {
                    const label = context.label || '';
                    const value = context.raw;
                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                    const percentage = Math.round((value / total) * 100);
                    return `${label}: ₹${value.toLocaleString('en-IN')} (${percentage}%)`;
                  }
                }
              }
            }
          }
        });
      }
    }
  }, [activeSection, portfolio]);

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

  const resetFilters = () => {
    setSearchQuery("");
    setSortField("tradingsymbol");
    setSortDirection("asc");
    setViewMode("all");
  };

  const addToWatchlist = async (symbol) => {
    if (!uid) {
      setError("Please log in to manage watchlists.");
      return;
    }
    if (!selectedWatchlist) {
      setError("Please select a watchlist.");
      return;
    }
    // Find stock from portfolio to get details
    const stock = portfolio.find(s => s.tradingsymbol === symbol);
    if (!stock) {
      setError("Stock not found in portfolio.");
      return;
    }
    try {
      setLoading(true);
      const stockData = {
        stockSymbol: stock.tradingsymbol,
        stockKey: stock.instrument_token,
        stockName: stock.tradingsymbol, // Adjust if name is available
        lastPrice: parseFloat(stock.last_price) || 0,
        one_day_change: parseFloat(stock.change) || 0,
        openPrice: 0, // Adjust if available
        low: 0, // Adjust if available
        high: 0, // Adjust if available
        price_change: 0 // Adjust if available
      };
      await axios.post(
        `${API_URL}/api/watchlist/add`,
        { uid, watchlistName: selectedWatchlist, stocks: [stockData] },
        { headers: { "Content-Type": "application/json" } }
      );
      setSuccess(`Added ${symbol} to ${selectedWatchlist}`);
      fetchWatchlists(uid, setWatchlists, setError, setLoading);
      setWatchlistInput("");
    } catch (err) {
      setError("Failed to add stock to watchlist.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Remove from watchlist
  const removeFromWatchlist = async (instrumentKey) => {
    if (!uid || !selectedWatchlist) {
      setError("Please log in and select a watchlist.");
      return;
    }
    try {
      setLoading(true);
      await axios.delete(
        `${API_URL}/api/watchlist/remove`,
        {
          data: { uid, watchlistName: selectedWatchlist, instrumentKey },
          headers: { "Content-Type": "application/json" }
        }
      );
      setSuccess("Stock removed successfully.");
      fetchWatchlists(uid, setWatchlists, setError, setLoading);
    } catch (err) {
      setError("Failed to remove stock from watchlist.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBroker === "smallcase" && accessTokens.smallcase && window.scDK) {
      try {
        console.log("Initializing Smallcase SDK...");
        let instance = gatewayInstance;
        if (!instance) {
          instance = new window.scDK({
            gateway: BROKERS.smallcase.apiKey,
            smallcaseAuthToken: accessTokens.smallcase,
            config: {
              amo: true,
            },
          });
          setGatewayInstance(instance);
          console.log("Smallcase SDK initialized successfully:", instance);
        } else {
          instance.init({
            gateway: BROKERS.smallcase.apiKey,
            smallcaseAuthToken: accessTokens.smallcase,
            config: {
              amo: true,
            },
          });
          console.log("Smallcase SDK re-initialized successfully:", instance);
        }
      } catch (error) {
        console.error("Failed to initialize Smallcase SDK:", error);
        setError("Failed to initialize Smallcase gateway. Please try again.");
      }
    }
  }, [selectedBroker, accessTokens, gatewayInstance]);

  const sampleDayChanges = {
    overall: 1.23,
    stocks: {
      "TATAMOTORS": 2.4,
      "RELIANCE": -0.7,
      "INFY": 1.2,
      "TCS": 0.5,
      "HDFCBANK": -0.3,
    }
  };

  const loginWithBroker = (broker) => {
    setSelectedBroker(broker);
    const brokerConfig = BROKERS[broker];
    const loginUrl = brokerConfig.loginUrl(brokerConfig.apiKey);
    console.log(`Redirecting to ${brokerConfig.name} login:`, loginUrl);
    window.location.href = loginUrl;
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const requestToken = urlParams.get("request_token") || urlParams.get("code");
    const status = urlParams.get("status");

    console.log("Current URL:", window.location.href);
    console.log("URL Search Params:", window.location.search);
    console.log("Extracted request_token/code:", requestToken);
    console.log("Extracted status:", status);

    if (requestToken && selectedBroker) {
      const brokerConfig = BROKERS[selectedBroker];
      const paramName = selectedBroker === "smallcase" || selectedBroker === "upstox" || selectedBroker === "dhan" ? "code" : "request_token";
      console.log(`Initiating authentication with ${selectedBroker} ${paramName}:`, requestToken);
      axios
        .get(`${API_URL}${brokerConfig.authEndpoint}?${paramName}=${requestToken}`, {
          headers: { "Content-Type": "application/json" },
        })
        .then((response) => {
          const newAccessToken = response.data.accessToken;
          console.log(`Received ${selectedBroker} access_token:`, newAccessToken);
          setAccessTokens((prev) => ({ ...prev, [selectedBroker]: newAccessToken }));
          localStorage.setItem(`${selectedBroker}_access_token`, newAccessToken);
          setError(null);
          setSuccess(`Connected to ${brokerConfig.name} successfully`);
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch((error) => {
          console.error(`${selectedBroker} authentication failed:`, error.response?.data || error.message);
          setError(`Failed to authenticate with ${brokerConfig.name}. Please try again.`);
          setSuccess(null);
        });
    } else if (status === "error") {
      console.error(`${selectedBroker} login error detected`);
      setError(`${BROKERS[selectedBroker].name} login failed. Please try again.`);
      setSuccess(null);
    }
  }, [selectedBroker]);

  useEffect(() => {
    const accessToken = accessTokens[selectedBroker];
    if (accessToken && activeSection === "Orders" && selectedBroker === "zerodha") {
      console.log(`Fetching orders with ${selectedBroker} access_token:`, accessToken);
      axios
        .get(`${API_URL}${BROKERS[selectedBroker].ordersEndpoint}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then((response) => {
          console.log(`${selectedBroker} orders data:`, response.data);
          setOrders(response.data);
          setError(null);
        })
        .catch((error) => {
          console.error(`Error fetching ${selectedBroker} orders:`, error.response?.data || error.message);
          setError(`Failed to fetch orders: ${error.response?.data?.message || error.message}`);
          setSuccess(null);
        });
    }
  }, [selectedBroker, accessTokens, activeSection]);

  useEffect(() => {
    const accessToken = accessTokens[selectedBroker];
    if (accessToken) {
      console.log(`Fetching portfolio with ${selectedBroker} access_token:`, accessToken);

      // Fetch holdings first
      axios
        .get(`${API_URL}${BROKERS[selectedBroker].holdingsEndpoint}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then((holdingsResponse) => {
          console.log(`${selectedBroker} holdings data:`, holdingsResponse.data);

          // Then fetch regular portfolio
          return axios
            .get(`${API_URL}${BROKERS[selectedBroker].portfolioEndpoint}`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            })
            .then((portfolioResponse) => {
              // Combine holdings and portfolio data
              const combinedData = [
                ...(holdingsResponse.data || []),
                ...(portfolioResponse.data || [])
              ];

              const normalizedPortfolio = combinedData.map((stock) => {
                // Calculate day change if not provided
                const dayChange = stock.day_change_percentage ||
                  (stock.close_price ?
                    ((stock.last_price - stock.close_price) / stock.close_price * 100).toFixed(2) :
                    (Math.random() * 6 - 3).toFixed(2));

                return {
                  instrument_token: stock.instrument_token,
                  tradingsymbol: stock.tradingsymbol,
                  quantity: stock.quantity || stock.t1_quantity || 0,
                  average_price: stock.average_price,
                  last_price: stock.last_price,
                  pnl: stock.pnl || ((stock.last_price - stock.average_price) * (stock.quantity || stock.t1_quantity || 0)).toFixed(2),
                  change: stock.day_change_percentage ||
                    (((stock.last_price - stock.average_price) / stock.average_price) * 100).toFixed(2),
                  dayChange: parseFloat(dayChange),
                  dayPnl: (stock.last_price * (stock.quantity || stock.t1_quantity || 0) * dayChange / 100).toFixed(2),
                  currentValue: (stock.last_price * (stock.quantity || stock.t1_quantity || 0)).toFixed(2),
                  investedValue: (stock.average_price * (stock.quantity || stock.t1_quantity || 0)).toFixed(2),
                  product: stock.product,
                  exchange: stock.exchange,
                  isin: stock.isin,
                  isHolding: !!stock.t1_quantity // Flag to identify holdings
                };
              });

              setPortfolio(normalizedPortfolio);
              setError(null);
              updateChart(normalizedPortfolio);
            });
        })
        .catch((error) => {
          console.error(`Error fetching ${selectedBroker} portfolio/holdings:`, error.response?.data || error.message);
          setError(`Failed to fetch portfolio: ${error.response?.data?.message || error.message}`);
          setSuccess(null);
        });
    }
  }, [selectedBroker, accessTokens]);

  useEffect(() => {
    const accessToken = accessTokens[selectedBroker];
    if (accessToken) {
      console.log(`Fetching funds with ${selectedBroker} access_token:`, accessToken);
      axios
        .get(`${API_URL}${BROKERS[selectedBroker].fundsEndpoint}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then((response) => {
          console.log(`${selectedBroker} funds data:`, response.data);
          setFunds({
            total: response.data.total?.toFixed(2) || 0,
            available: response.data.available?.toFixed(2) || 0,
            used: response.data.used?.toFixed(2) || 0,
          });
          setError(null);
        })
        .catch((error) => {
          console.error(`Error fetching ${selectedBroker} funds:`, error.response?.data || error.message);
          setError(`Failed to fetch funds: ${error.response?.data?.message || error.message}`);
          setSuccess(null);
        });
    }
  }, [selectedBroker, accessTokens]);

  useEffect(() => {
    const accessToken = accessTokens[selectedBroker];
    if (accessToken) {
      console.log(`Fetching positions with ${selectedBroker} access_token:`, accessToken);
      axios
        .get(`${API_URL}${BROKERS[selectedBroker].positionsEndpoint}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then((response) => {
          console.log(`${selectedBroker} positions data:`, response.data);
          const normalizedPositions = response.data.map((position) => {
            const dayChange = (Math.random() * 6 - 3).toFixed(2);
            return {
              instrument_token: position.instrument_token || position.tradingsymbol,
              tradingsymbol: position.tradingsymbol,
              quantity: position.quantity,
              average_price: position.average_price,
              last_price: position.last_price,
              pnl: ((position.last_price - position.average_price) * position.quantity).toFixed(2),
              change: (((position.last_price - position.average_price) / position.average_price) * 100).toFixed(2),
              dayChange: parseFloat(dayChange),
              dayPnl: (position.last_price * position.quantity * dayChange / 100).toFixed(2),
              type: position.product || "Unknown",
            };
          });
          setPositions(normalizedPositions);
          setError(null);
        })
        .catch((error) => {
          console.error(`Error fetching ${selectedBroker} positions:`, error.response?.data || error.message);
          setError(`Failed to fetch positions: ${error.response?.data?.message || error.message}`);
          setSuccess(null);
        });
    }
  }, [selectedBroker, accessTokens]);

  useEffect(() => {
    const accessToken = accessTokens[selectedBroker];
    if (accessToken) {
      console.log(`Fetching profile with ${selectedBroker} access_token:`, accessToken);
      axios
        .get(`${API_URL}${BROKERS[selectedBroker].profileEndpoint}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then((response) => {
          console.log(`${selectedBroker} profile data:`, response.data);
          setProfile(response.data);
          setError(null);
        })
        .catch((error) => {
          console.error(`Error fetching ${selectedBroker} profile:`, error.response?.data || error.message);
          setError(`Failed to fetch profile: ${error.response?.data?.message || error.message}`);
          setSuccess(null);
        });
    }
  }, [selectedBroker, accessTokens]);

  const handleSignOut = async () => {
    const accessToken = accessTokens[selectedBroker];
    if (!accessToken) return;
    try {
      console.log(`Attempting to sign out from ${selectedBroker}`);
      await axios.post(
        `${API_URL}${BROKERS[selectedBroker].logoutEndpoint}`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setAccessTokens((prev) => ({ ...prev, [selectedBroker]: null }));
      setPortfolio([]);
      setFunds(null);
      setPositions([]);
      setProfile(null);
      localStorage.removeItem(`${selectedBroker}_access_token`);
      setError(null);
      setSuccess(null);
      setOrderStatus(null);
      setQuantityInputs({});
      console.log(`Signed out from ${selectedBroker} successfully`);
    } catch (error) {
      console.error(`Sign out from ${selectedBroker} failed:`, error.response?.data || error.message);
      setError(`Failed to sign out from ${BROKERS[selectedBroker].name}. Please try again.`);
    }
  };

  const closeModal = () => {
    setSelectedStock(null);
  };

  const handleStockClick = (stock) => {
    setSelectedStock(stock);
  };

  const placeMarketOrder = async (tradingsymbol, transactionType, quantity, exchange = "NSE", product = "CNC") => {
    if (!quantity || quantity <= 0) {
      setError("Please enter a valid quantity.");
      return;
    }
    if (!tradingsymbol) {
      setError("Invalid stock symbol.");
      return;
    }

    const accessToken = accessTokens[selectedBroker];
    if (!accessToken) {
      setError("No access token provided. Please connect to a broker.");
      return;
    }

    try {
      const formData = new URLSearchParams();
      formData.append("tradingsymbol", tradingsymbol);
      formData.append("exchange", exchange);
      formData.append("transaction_type", transactionType);
      formData.append("order_type", "MARKET");
      formData.append("quantity", parseInt(quantity));
      formData.append("product", product);
      formData.append("validity", "DAY");

      const response = await axios.post(
        `${API_URL}${BROKERS[selectedBroker].orderEndpoint.replace(':variety', 'regular')}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/x-www-form-urlencoded",
            "X-Kite-Version": "3",
          },
        }
      );

      setOrderStatus(`Order placed successfully! Order ID: ${response.data.order_id}`);
      setError(null);

      // Refresh orders
      const ordersResponse = await axios.get(`${API_URL}${BROKERS[selectedBroker].ordersEndpoint}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setOrders(ordersResponse.data);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
      setError(`Failed to place order: ${errorMessage}`);
    }
  };

  const modifyOrder = async (order, newQuantity, newPrice) => {
    if (!newQuantity || newQuantity <= 0) {
      setError("Please enter a valid quantity.");
      return;
    }
    const accessToken = accessTokens[selectedBroker];
    try {
      const response = await axios.put(
        `${API_URL}${BROKERS[selectedBroker].orderEndpoint.replace(':variety', order.variety)}/${order.order_id}`,
        {
          tradingsymbol: order.tradingsymbol,
          exchange: order.exchange || "NSE",
          transaction_type: order.transaction_type,
          order_type: order.order_type,
          quantity: parseInt(newQuantity),
          product: order.product || "CNC",
          validity: order.validity || "DAY",
          ...(newPrice && order.order_type !== "MARKET" && { price: parseFloat(newPrice) }),
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setOrderStatus(`Order modified successfully! Order ID: ${response.data.order_id}`);
      setError(null);
      // Refresh orders
      const ordersResponse = await axios.get(`${API_URL}${BROKERS[selectedBroker].ordersEndpoint}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setOrders(ordersResponse.data);
    } catch (error) {
      setError(`Failed to modify order: ${error.response?.data?.message || error.message}`);
    }
  };

  const cancelOrder = async (order) => {
    const accessToken = accessTokens[selectedBroker];
    try {
      const response = await axios.delete(
        `${API_URL}${BROKERS[selectedBroker].orderEndpoint.replace(':variety', order.variety)}/${order.order_id}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setOrderStatus(`Order cancelled successfully! Order ID: ${response.data.order_id}`);
      setError(null);
      // Refresh orders
      const ordersResponse = await axios.get(`${API_URL}${BROKERS[selectedBroker].ordersEndpoint}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setOrders(ordersResponse.data);
    } catch (error) {
      setError(`Failed to cancel order: ${error.response?.data?.message || error.message}`);
    }
  };

  const fetchOrderTrades = async (order_id) => {
    const accessToken = accessTokens[selectedBroker];
    try {
      const response = await axios.get(
        `${API_URL}${BROKERS[selectedBroker].orderTradesEndpoint.replace(':order_id', order_id)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setSelectedOrderTrades(response.data);
      setError(null);
    } catch (error) {
      setError(`Failed to fetch trades: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleQuantityChange = (instrumentToken, value) => {
    setQuantityInputs((prev) => ({
      ...prev,
      [instrumentToken]: value,
    }));
  };

  const updateChart = (portfolio) => {
    // Sector Chart
    const sectorCtx = document.getElementById('sectorChart')?.getContext('2d');
    if (sectorCtx) {
      const sectorData = portfolio.reduce((sectors, stock) => {
        const sector = stock.sector || 'Others';
        const value = (stock.quantity || stock.t1_quantity || 0) * parseFloat(stock.last_price || 0);
        sectors[sector] = (sectors[sector] || 0) + value;
        return sectors;
      }, {});
      new Chart(sectorCtx, {
        type: 'pie',
        data: {
          labels: Object.keys(sectorData),
          datasets: [{
            data: Object.values(sectorData),
            backgroundColor: ['#2563EB', '#7C3AED', '#EC4899', '#10B981', '#F59E0B'],
          }],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'top' },
            tooltip: {
              callbacks: {
                label: (context) => `${context.label}: ₹${context.raw.toLocaleString('en-IN')}`,
              },
            },
          },
        },
      });
    }

    // Historical Performance Chart
    const performanceCtx = document.getElementById('performanceChart')?.getContext('2d');
    if (performanceCtx) {
      // Placeholder: Fetch historical data from API or compute from portfolio
      const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const data = portfolio.length > 0
        ? labels.map((_, i) => portfolio.reduce((sum, stock) => sum + (parseFloat(stock.pnl || 0) * (1 + i * 0.1)), 0))
        : labels.map(() => 0);
      new Chart(performanceCtx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Portfolio Value',
            data,
            borderColor: '#2563EB',
            fill: true,
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
          }],
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: false },
          },
          plugins: {
            legend: { display: true },
          },
        },
      });
    }
  };

  const calculatePortfolioSummary = () => {
    let totalValue = 0;
    let totalInvested = 0;
    let dayChange = 0;
    let stockCount = 0;

    portfolio.forEach((stock) => {
      const qty = stock.quantity || stock.t1_quantity || 0;
      const invested = qty * stock.average_price;
      const current = qty * stock.last_price;
      totalInvested += invested;
      totalValue += current;

      // Calculate weighted day change
      if (stock.day_change_percentage) {
        dayChange += stock.day_change_percentage * (current / totalValue);
        stockCount++;
      }
    });

    const totalPnL = totalValue - totalInvested;
    const returns = totalInvested > 0 ? (totalPnL / totalInvested * 100) : 0;

    return {
      totalValue,
      totalInvested,
      totalPnL,
      returns,
      dayChange,
      portfolio // pass the raw portfolio data for calculations
    };
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsDropdownOpen(false);
    }
  };

  useEffect(() => {
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const toggleDropdown = () => {
    console.log('Toggling dropdown, current isDropdownOpen:', isDropdownOpen);
    setIsDropdownOpen((prev) => !prev);
  };

  const onConnectClick = () => {
    console.log('Connect Portfolio clicked');
    toggleDropdown();
  };

  const toggleSortDirection = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const renderWatchlistSection = () => {
    // Function to filter and sort watchlist stocks
    const filteredWatchlist = () => {
      if (!selectedWatchlist) return [];

      // Find the selected watchlist
      const watchlist = watchlists.find(wl => wl.name === selectedWatchlist);
      if (!watchlist || !watchlist.stocks) return [];

      let stocks = [...watchlist.stocks];

      // Apply search filter
      if (searchQuery) {
        stocks = stocks.filter(stock =>
          stock.stockSymbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stock.stockName.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Apply sorting
      stocks.sort((a, b) => {
        const aValue = sortField === "lastPrice" || sortField === "one_day_change"
          ? parseFloat(a[sortField])
          : a[sortField === "tradingsymbol" ? "stockSymbol" : sortField];
        const bValue = sortField === "lastPrice" || sortField === "one_day_change"
          ? parseFloat(b[sortField])
          : b[sortField === "tradingsymbol" ? "stockSymbol" : sortField];
        const direction = sortDirection === "asc" ? 1 : -1;

        if (typeof aValue === "string") {
          return direction * aValue.localeCompare(bValue);
        }
        return direction * (aValue - bValue);
      });

      return stocks;
    };

    // Handle quantity input change for placing new orders
    const handleQuantityChange = (stockKey, value) => {
      setOrderQuantities(prev => ({
        ...prev,
        [stockKey]: value,
      }));
    };

    // Handle modification input change (quantity or price) for existing orders
    const handleModifyInputChange = (orderId, field, value) => {
      setModifyInputs(prev => ({
        ...prev,
        [orderId]: {
          ...prev[orderId],
          [field]: value,
        },
      }));
    };

    // Get open orders for a specific stock
    const getStockOrders = (stockSymbol) => {
      return orders.filter(
        order => order.tradingsymbol === stockSymbol &&
          (order.status === "OPEN" || order.status === "PENDING")
      );
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Header Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-indigo-50/20 to-purple-50/30"></div>
          <div className="relative px-6 py-12">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h1 className="text-5xl font-thin text-gray-900 tracking-tight mb-4">
                  Watchlist
                </h1>
                <p className="text-xl text-gray-600 font-light max-w-2xl mx-auto">
                  Monitor your investments with precision and elegance
                </p>
              </div>

              {/* Control Panel */}
              <div className="backdrop-blur-xl bg-white/80 rounded-3xl border border-white/20 shadow-2xl p-8 max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Watchlist Selector */}
                  <div className="relative group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Watchlist</label>
                    <div className="relative">
                      <select
                        className="w-full appearance-none bg-gray-50/80 backdrop-blur-sm border-0 rounded-2xl px-4 py-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-300 text-base font-medium"
                        value={selectedWatchlist || ""}
                        onChange={(e) => setSelectedWatchlist(e.target.value || null)}
                      >
                        <option value="">Select Watchlist</option>
                        {watchlists.map(watchlist => (
                          <option key={watchlist.name} value={watchlist.name}>
                            {watchlist.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50/80 backdrop-blur-sm border-0 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-300 text-base"
                        placeholder="Search stocks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Add Stock */}
                  <div className="relative group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Add Stock</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          className="w-full px-4 py-4 bg-gray-50/80 backdrop-blur-sm border-0 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-300 text-base uppercase"
                          placeholder="SYMBOL"
                          value={watchlistInput}
                          onChange={(e) => setWatchlistInput(e.target.value.toUpperCase())}
                          onKeyPress={(e) => {
                            if (e.key === "Enter" && watchlistInput) {
                              addToWatchlist(watchlistInput);
                            }
                          }}
                        />
                      </div>
                      <button
                        onClick={() => addToWatchlist(watchlistInput)}
                        className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:transform-none"
                        disabled={loading || !watchlistInput || !selectedWatchlist}
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 pb-12">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600 text-lg font-light">Loading portfolio...</p>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-red-600" />
                </div>
                <p className="text-red-600 text-lg font-medium">{error}</p>
              </div>
            ) : selectedWatchlist && filteredWatchlist().length > 0 ? (
              <div className="backdrop-blur-xl bg-white/80 rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
                {/* Table Header */}
                <div className="bg-gradient-to-r from-gray-50/80 to-white/80 backdrop-blur-sm border-b border-gray-100/50 px-8 py-6">
                  <div className="grid grid-cols-12 gap-4 items-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <div
                      className="col-span-4 cursor-pointer flex items-center hover:text-gray-700 transition-colors"
                      onClick={() => toggleSortDirection("tradingsymbol")}
                    >
                      <span>Symbol</span>
                      {sortField === "tradingsymbol" && (
                        <span className="ml-2 text-blue-600">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                    <div
                      className="col-span-3 cursor-pointer flex items-center hover:text-gray-700 transition-colors"
                      onClick={() => toggleSortDirection("lastPrice")}
                    >
                      <span>Price</span>
                      {sortField === "lastPrice" && (
                        <span className="ml-2 text-blue-600">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                    <div
                      className="col-span-3 cursor-pointer flex items-center hover:text-gray-700 transition-colors"
                      onClick={() => toggleSortDirection("one_day_change")}
                    >
                      <span>Change</span>
                      {sortField === "one_day_change" && (
                        <span className="ml-2 text-blue-600">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                    <div className="col-span-2">Actions</div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-100/50">
                  {filteredWatchlist().map((stock, index) => {
                    const stockOrders = getStockOrders(stock.stockSymbol);
                    const changePercent = parseFloat(stock.one_day_change || 0);
                    const isPositive = changePercent >= 0;

                    return (
                      <div
                        key={stock.stockKey}
                        className="group hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/20 transition-all duration-300 px-8 py-6"
                        style={{ animationDelay: `${index * 50}ms` }}
                        onClick={() => handleStockClick(stock)}
                      >
                        <div className="grid grid-cols-12 gap-4 items-center">
                          {/* Symbol */}
                          <div className="col-span-3">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mr-3">
                                <span className="text-sm font-bold text-blue-700">
                                  {stock.stockSymbol.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <div className="text-lg font-semibold text-gray-900">
                                  {stock.stockSymbol}
                                </div>
                                <div className="text-sm text-gray-500 font-light">
                                  {stock.stockName}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="col-span-2">
                            <div className="text-xl font-semibold text-gray-900">
                              ₹{parseFloat(stock.lastPrice || 0).toFixed(2)}
                            </div>
                          </div>

                          {/* Change */}
                          <div className="col-span-2">
                            <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                              {isPositive ? (
                                <TrendingUp className="w-4 h-4 mr-1" />
                              ) : (
                                <TrendingDown className="w-4 h-4 mr-1" />
                              )}
                              <span className="text-lg font-semibold">
                                {isPositive ? "+" : ""}{changePercent.toFixed(2)}%
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="col-span-2">
                            <button
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-300 transform hover:scale-110 active:scale-95"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFromWatchlist(stock.stockKey);
                              }}
                              disabled={loading}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Orders */}
                          <div className="col-span-2">
                            {stockOrders.length > 0 ? (
                              <div className="space-y-2">
                                {stockOrders.map(order => (
                                  <div key={order.order_id} className="bg-gray-50 rounded-xl p-3 space-y-2">
                                    <div className="text-xs text-gray-600 font-medium">
                                      {order.transaction_type} {order.quantity} @ {order.order_type === "MARKET" ? "Market" : `$${parseFloat(order.price).toFixed(2)}`}
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="number"
                                        min="1"
                                        className="w-14 px-2 py-1 bg-white border-0 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all"
                                        placeholder="Qty"
                                        defaultValue={order.quantity}
                                        onChange={(e) => handleModifyInputChange(order.order_id, "quantity", e.target.value)}
                                      />
                                      {order.order_type !== "MARKET" && (
                                        <input
                                          type="number"
                                          min="0"
                                          step="0.05"
                                          className="w-16 px-2 py-1 bg-white border-0 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all"
                                          placeholder="Price"
                                          defaultValue={order.price}
                                          onChange={(e) => handleModifyInputChange(order.order_id, "price", e.target.value)}
                                        />
                                      )}
                                      <button
                                        className="p-1 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                        onClick={() => modifyOrder(order, modifyInputs[order.order_id]?.quantity, modifyInputs[order.order_id]?.price)}
                                        disabled={loading}
                                      >
                                        <Edit3 className="w-3 h-3" />
                                      </button>
                                      <button
                                        className="p-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                        onClick={() => cancelOrder(order)}
                                        disabled={loading}
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400 font-light">No orders</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-32">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
                  <Star className="w-12 h-12 text-blue-600" />
                </div>
                <h3 className="text-3xl font-thin text-gray-900 mb-4">
                  {selectedWatchlist ? "Portfolio is empty" : "No portfolio selected"}
                </h3>
                <p className="text-xl text-gray-500 font-light max-w-md mx-auto leading-relaxed">
                  {selectedWatchlist
                    ? "Add your first stock to start tracking your investments."
                    : "Select a portfolio to view your stocks and manage orders."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Order Modal */}
        {selectedStock && (
          filteredWatchlist().map((stock, index) => {
            return (
              <div
                key={stock.stockKey}
              >
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[70vh] overflow-y-auto shadow-2xl transform transition-all duration-300 mt-10">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
                      <div className="flex items-center">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mr-3">
                          <span className="text-xs sm:text-sm font-bold text-blue-700">
                            {selectedStock.stockSymbol.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                            {selectedStock.stockSymbol}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-500">
                            BSE ₹{parseFloat(selectedStock.lastPrice).toFixed(2)}
                            <span className={`ml-2 ${parseFloat(selectedStock.one_day_change) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {parseFloat(selectedStock.one_day_change) >= 0 ? '+' : ''}{parseFloat(selectedStock.one_day_change).toFixed(2)}%
                            </span>
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={closeModal}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Close modal"
                      >
                        <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                      </button>
                    </div>


                    {/* Buy/Sell Buttons */}
                    <div className="flex gap-3 p-4 sm:p-6 pb-4 text-black">
                      <input
                        type="number"
                        min="1"
                        className="w-20 px-3 py-2 bg-gray-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-300"
                        placeholder="Qty"
                        value={orderQuantities[selectedStock.stockKey] || ""}
                        onChange={(e) => handleQuantityChange(selectedStock.stockKey, e.target.value)}
                      />
                      <button
                        className="flex-1 py-2.5 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs sm:text-sm font-medium rounded-xl hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => placeMarketOrder(selectedStock.stockSymbol, "BUY", orderQuantities[selectedStock.stockKey])}
                        disabled={loading || !orderQuantities[selectedStock.stockKey] || !accessTokens[selectedBroker]}
                      >
                        BUY
                      </button>
                      <button
                        className="flex-1 py-2.5 sm:py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs sm:text-sm font-medium rounded-xl hover:from-red-600 hover:to-rose-600 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => placeMarketOrder(selectedStock.stockSymbol, "SELL", orderQuantities[selectedStock.stockKey])}
                        disabled={loading || !orderQuantities[selectedStock.stockKey] || !accessTokens[selectedBroker]}
                      >
                        SELL
                      </button>
                    </div>

                    {/* View Chart Button */}
                    <div className="px-4 sm:px-6 pb-4">
                      <button className="flex items-center justify-center w-full text-blue-600 text-xs sm:text-sm font-medium hover:underline">
                        <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                        View chart →
                      </button>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center justify-around px-4 sm:px-6 py-4 border-t border-gray-100">
                      <button className="flex flex-col items-center space-y-1 text-blue-600 hover:text-blue-700 transition-colors">
                        <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="text-[0.65rem] sm:text-xs">Set alert</span>
                      </button>
                      <button className="flex flex-col items-center space-y-1 text-blue-600 hover:text-blue-700 transition-colors">
                        <StickyNote className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="text-[0.65rem] sm:text-xs">Add notes</span>
                      </button>
                      <button className="flex flex-col items-center space-y-1 text-blue-600 hover:text-blue-700 transition-colors">
                        <span className="text-base sm:text-lg">→</span>
                        <span className="text-[0.65rem] sm:text-xs">Create GTT</span>
                      </button>
                    </div>

                    {/* Bid/Offer Table */}
                    <div className="px-4 sm:px-6 py-4 border-t border-gray-100">
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-[0.65rem] sm:text-xs font-medium text-gray-500 mb-3">
                        <span>Bid</span>
                        <span className="hidden sm:block">Orders</span>
                        <span>Qty</span>
                        <span>Offer</span>
                        <span className="hidden sm:block">Orders</span>
                        <span>Qty</span>
                      </div>

                      {/* Sample bid/offer rows */}
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-[0.65rem] sm:text-xs py-1">
                          <span className="text-blue-600">0.00</span>
                          <span className="text-blue-600 hidden sm:block">0</span>
                          <span className="text-blue-600">0</span>
                          <span className="text-red-600">0.00</span>
                          <span className="text-red-600 hidden sm:block">0</span>
                          <span className="text-red-600">0</span>
                        </div>
                      ))}

                      {/* Total row */}
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-[0.65rem] sm:text-xs py-2 border-t border-gray-100 mt-2 font-medium">
                        <span>Total</span>
                        <span className="hidden sm:block"></span>
                        <span className="text-blue-600">0</span>
                        <span>Total</span>
                        <span className="hidden sm:block"></span>
                        <span className="text-red-600">0</span>
                      </div>
                    </div>

                    {/* Day's Range */}
                    <div className="px-4 sm:px-6 py-4 border-t border-gray-100">
                      <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-3">Day's range</h4>

                      <div className="flex justify-between text-[0.65rem] sm:text-xs text-gray-500 mb-2">
                        <div>
                          <span className="block">Low</span>
                          <span className="font-medium text-gray-900">1,549.25</span>
                        </div>
                        <div className="text-right">
                          <span className="block">High</span>
                          <span className="font-medium text-gray-900">1,586.50</span>
                        </div>
                      </div>

                      {/* Range bar */}
                      <div className="relative h-2 bg-gray-200 rounded-full mb-4">
                        <div className="absolute left-0 top-0 h-2 bg-green-500 rounded-full" style={{ width: '40%' }}></div>
                        <div className="absolute left-0 top-1 w-2 h-2 bg-green-600 rounded-full transform -translate-y-1"></div>
                        <div className="absolute left-1/3 top-1 w-0 h-0 border-l-2 border-r-2 border-b-3 border-transparent border-b-gray-600 transform -translate-y-1"></div>
                      </div>

                      {/* Open/Previous Close */}
                      <div className="flex justify-between text-[0.65rem] sm:text-xs">
                        <div>
                          <span className="text-gray-500">Open</span>
                          <span className="ml-2 font-medium text-gray-900">1,550.00</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Prev. close</span>
                          <span className="ml-2 font-medium text-gray-900">1,549.20</span>
                        </div>
                      </div>
                    </div>

                    {/* Volume */}
                    <div className="px-4 sm:px-6 py-4 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-gray-500">Volume</span>
                        <span className="text-xs sm:text-sm font-medium text-gray-900">0</span>
                      </div>
                    </div>

                    {/* Orders Section */}
                    {getStockOrders(selectedStock.stockSymbol).length > 0 && (
                      <div className="px-4 sm:px-6 pb-6 border-t border-gray-100">
                        <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-3">Open Orders</h4>
                        <div className="space-y-2">
                          {getStockOrders(selectedStock.stockSymbol).map(order => (
                            <div key={order.order_id} className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                              <div>
                                <div className="text-xs sm:text-sm font-medium text-gray-900">
                                  {order.transaction_type} {order.quantity}
                                </div>
                                <div className="text-[0.65rem] sm:text-xs text-gray-500">
                                  {order.order_type === "MARKET" ? "Market" : `₹${parseFloat(order.price).toFixed(2)}`}
                                </div>
                              </div>
                              <div className="flex space-x-1">
                                <button className="p-1 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors" aria-label="Edit order">
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button className="p-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors" aria-label="Cancel order">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  // In your frontend component where you display the portfolio table
  const filteredPortfolio = portfolio
    .map((stock) => ({
      ...stock,
      quantity: stock.quantity || stock.t1_quantity || 0,
      investedValue: (stock.quantity || stock.t1_quantity || 0) * stock.average_price,
      currentValue: (stock.quantity || stock.t1_quantity || 0) * stock.last_price,
      change: ((stock.last_price - stock.average_price) / stock.average_price * 100).toFixed(2),
    }))
    .filter((stock, index, self) =>
      // Remove duplicates by checking if this is the first occurrence of this symbol+exchange
      index === self.findIndex((s) => (
        s.tradingsymbol === stock.tradingsymbol &&
        s.exchange === stock.exchange
      ))
    )
    .filter((stock) => {
      if (searchQuery) {
        return stock.tradingsymbol.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    })
    .filter((stock) => {
      if (viewMode === "profit") return parseFloat(stock.pnl) > 0;
      if (viewMode === "loss") return parseFloat(stock.pnl) < 0;
      return true;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      const direction = sortDirection === "asc" ? 1 : -1;
      if (typeof aValue === "string") {
        return direction * aValue.localeCompare(bValue);
      }
      return direction * (aValue - bValue);
    });


  const renderOrdersSection = () => {
    if (selectedBroker !== "zerodha" || !accessTokens[selectedBroker]) {
      return (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl shadow-sm text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Connect to view orders</h3>
          <p className="text-gray-500 mb-6 max-w-md">Connect your broker to view and place orders.</p>
          <button
            onClick={accessTokens[selectedBroker] ? () => setActiveSection("Portfolio") : () => setIsDropdownOpen(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
          >
            {accessTokens[selectedBroker] ? "Refresh" : "Connect Broker"}
          </button>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Symbol
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.order_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.order_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.tradingsymbol}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.transaction_type} {order.order_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₹{order.price ? parseFloat(order.price).toFixed(2) : "Market"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.status}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {(order.status === "OPEN" || order.status === "PENDING") && (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="1"
                            className="w-16 px-2 py-1 border-0 bg-gray-100 rounded-lg text-sm focus:ring-0 focus:outline-none focus:bg-gray-200 transition-all"
                            placeholder="Qty"
                            defaultValue={order.quantity}
                            onChange={(e) => handleQuantityChange(order.order_id, e.target.value)}
                          />
                          {order.order_type !== "MARKET" && (
                            <input
                              type="number"
                              min="0"
                              step="0.05"
                              className="w-20 px-2 py-1 border-0 bg-gray-100 rounded-lg text-sm focus:ring-0 focus:outline-none focus:bg-gray-200 transition-all"
                              placeholder="Price"
                              defaultValue={order.price}
                              onChange={(e) => handleQuantityChange(`${order.order_id}_price`, e.target.value)}
                            />
                          )}
                          <button
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full hover:bg-blue-700 transition-colors"
                            onClick={() => modifyOrder(order, quantityInputs[order.order_id], quantityInputs[`${order.order_id}_price`])}
                          >
                            Modify
                          </button>
                          <button
                            className="px-3 py-1 bg-red-600 text-white text-xs rounded-full hover:bg-red-700 transition-colors"
                            onClick={() => cancelOrder(order)}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                      <button
                        className="px-3 py-1 bg-gray-200 text-gray-800 text-xs rounded-full hover:bg-gray-300 transition-colors mt-2"
                        onClick={() => fetchOrderTrades(order.order_id)}
                      >
                        View Trades
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500 max-w-md">You don't have any orders at the moment.</p>
          </div>
        )}
        {selectedOrderTrades && (
          <div className="p-6 border-t border-gray-100">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Trade History</h3>
            {selectedOrderTrades.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trade ID
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Symbol
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {selectedOrderTrades.map((trade) => (
                      <tr key={trade.trade_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {trade.trade_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {trade.tradingsymbol}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {trade.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ₹{parseFloat(trade.average_price).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(trade.trade_time).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No trades found for this order.</p>
            )}
            <button
              className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              onClick={() => setSelectedOrderTrades(null)}
            >
              Close Trade History
            </button>
          </div>
        )}
      </div>
    );
  };

  const portfolioData = calculatePortfolioSummary();

  // Calculate Portfolio Quantum Score (Placeholder)
  const calculateQuantumScore = (portfolio, portfolioData) => {
    // Simulate Quantum Score: Weighted combination of P&L, sector diversity, and volatility
    const totalPnl = portfolio.reduce((sum, stock) => sum + parseFloat(stock.pnl || 0), 0);
    const uniqueSectors = new Set(portfolio.map(stock => stock.sector || 'Others')).size;
    const avgBeta = portfolio.length > 0 ? portfolio.reduce((sum, stock) => sum + (stock.beta || 1), 0) / portfolio.length : 1;
    const normalizedPnl = Math.min(1, totalPnl / portfolioData.totalValue); // Normalize P&L to [0,1]
    const normalizedDiversity = Math.min(1, uniqueSectors / 10); // Assume max 10 sectors
    const normalizedStability = Math.max(0, 1 - avgBeta / 2); // Lower beta = more stable
    return Math.round((normalizedPnl * 40 + normalizedDiversity * 30 + normalizedStability * 30)); // Weighted score out of 100
  };

  // Calculate Risk-Quantum Ratio (Placeholder)
  const calculateRiskQuantumRatio = (portfolio, portfolioData) => {
    // Simulate Risk-Quantum Ratio: Return-to-risk ratio
    const totalPnl = portfolio.reduce((sum, stock) => sum + parseFloat(stock.pnl || 0), 0);
    const avgBeta = portfolio.length > 0 ? portfolio.reduce((sum, stock) => sum + (stock.beta || 1), 0) / portfolio.length : 1;
    const annualizedReturn = (totalPnl / portfolioData.totalValue) * 100;
    return (annualizedReturn / avgBeta).toFixed(2);
  };

  // Calculate AI Confidence Score (Placeholder)
  const calculateAIConfidenceScore = (portfolio) => {
    // Simulate AI Confidence: Percentage of stocks with positive P&L
    const positivePnlCount = portfolio.filter(stock => parseFloat(stock.pnl || 0) > 0).length;
    return portfolio.length > 0 ? Math.round((positivePnlCount / portfolio.length) * 100) : 0;
  };

  const calculateAnomalies = (portfolio) => {
    // Simulate Anomalies: Count stocks with significant daily changes (>5%)
    return portfolio.filter(stock => Math.abs(parseFloat(stock.day_change_percentage || 0)) > 5).length;
  };

  // Get Market Sentiment (Placeholder)
  const getMarketSentiment = (portfolio) => {
    // Simulate Market Sentiment: Based on average daily change
    const avgChange = portfolio.length > 0
      ? portfolio.reduce((sum, stock) => sum + parseFloat(stock.day_change_percentage || 0), 0) / portfolio.length
      : 0;
    if (avgChange > 1) return "Bullish";
    if (avgChange < -1) return "Bearish";
    return "Neutral";
  };

  // Get AI Recommendations (Placeholder)
  const getAIRecommendations = (portfolio, portfolioData) => {
    // Simulate AI Recommendations: Suggest actions based on sector performance
    const sectorPerformance = portfolio.reduce((sectors, stock) => {
      const sector = stock.sector || 'Others';
      const value = (stock.quantity || stock.t1_quantity || 0) * parseFloat(stock.last_price || 0);
      sectors[sector] = (sectors[sector] || { value: 0, pnl: 0 });
      sectors[sector].value += value;
      sectors[sector].pnl += parseFloat(stock.pnl || 0);
      return sectors;
    }, {});
    const recommendations = [];
    Object.entries(sectorPerformance).forEach(([sector, data]) => {
      const sectorWeight = (data.value / portfolioData.totalValue) * 100;
      const sectorReturn = (data.pnl / data.value) * 100;
      if (sectorReturn > 2 && sectorWeight < 30) {
        recommendations.push({
          text: `Increase ${sector} exposure by 3-5%`,
          reason: `Strong performance: ${sectorReturn.toFixed(1)}% return`,
          action: 'Increase'
        });
      } else if (sectorReturn < -2 && sectorWeight > 10) {
        recommendations.push({
          text: `Reduce ${sector} holdings by 2-3%`,
          reason: `Underperformance: ${sectorReturn.toFixed(1)}% return`,
          action: 'Reduce'
        });
      }
    });
    return recommendations.slice(0, 2); // Limit to top 2 recommendations
  };

  return (
    <div className="min-h-screen w-screen bg-gray-100 font-sans">
      <Navbar auth_token={auth_token} />
      {accessTokens[selectedBroker] ? (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
          {accessTokens[selectedBroker] ? (
            <div className="max-w-7xl mx-auto px-6 py-8">
              {/* Status Messages */}
              {error && (
                <div className="mb-6 p-4 rounded-2xl bg-red-50 text-red-600 border border-red-100 flex items-center animate-slideDown">
                  <div className="w-5 h-5 bg-red-200 rounded-full flex items-center justify-center mr-3">
                    <FaTimes className="w-3 h-3" />
                  </div>
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-6 p-4 rounded-2xl bg-green-50 text-green-600 border border-green-100 flex items-center animate-slideDown">
                  <div className="w-5 h-5 bg-green-200 rounded-full flex items-center justify-center mr-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  {success}
                </div>
              )}


              {/* Navigation */}
              <div className="flex justify-center mb-12">
                <div className="flex items-center bg-white/80 backdrop-blur-xl rounded-full p-1 border border-gray-100/50 shadow-sm gap-2">
                  {["Portfolio", "Positions", "Orders", "Analysis", "Watchlist", "Funds"].map((section) => (
                    <button
                      key={section}
                      onClick={() => setActiveSection(section)}
                      className={`transition-all duration-300 px-6 py-3 rounded-full text-sm font-medium ${activeSection === section
                        ? "bg-black text-white shadow-lg"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                    >
                      {section}
                    </button>
                  ))}
                  {accessTokens[selectedBroker] && (
                    <button
                      onClick={() => handleSignOut()}
                      className="flex items-center space-x-2 px-6 py-3 text-sm font-medium text-red-600 bg-red-50 rounded-full hover:bg-red-100 transition-all duration-200"
                    >
                      <FaSignOutAlt className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Portfolio Section */}
              {activeSection === "Portfolio" && (
                <>
                  <PortfolioSummary portfolioData={portfolioData.portfolio} />

                  {portfolio.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2 space-y-6">
                        {/* Search & Filter */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-gray-100/50 shadow-sm">
                          <div className="flex flex-wrap items-center gap-4">
                            <div className="relative flex-grow">
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <FaSearch className="w-4 h-4 text-gray-400" />
                              </div>
                              <input
                                type="text"
                                className="block w-full pl-12 pr-4 py-4 border-0 rounded-2xl bg-gray-50 focus:ring-0 focus:outline-none focus:bg-gray-100 transition-all duration-200 text-gray-900 placeholder-gray-500"
                                placeholder="Search stocks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                              />
                            </div>

                            <div className="flex rounded-2xl bg-gray-50 p-1">
                              {["All", "Profit", "Loss"].map((mode) => (
                                <button
                                  key={mode}
                                  onClick={() => setViewMode(mode.toLowerCase())}
                                  className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${viewMode === mode.toLowerCase()
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"
                                    }`}
                                >
                                  {mode}
                                </button>
                              ))}
                            </div>

                            <button
                              onClick={() => toggleSortDirection(sortField)}
                              className="flex items-center space-x-2 px-4 py-3 rounded-2xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all duration-200"
                            >
                              <FaSortAmountDown className="w-4 h-4" />
                              <span className="text-sm font-medium">Sort</span>
                            </button>

                            {(searchQuery || viewMode !== "all") && (
                              <button
                                onClick={resetFilters}
                                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Portfolio Table */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-100/50 shadow-sm overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="min-w-full">
                              <thead>
                                <tr className="border-b border-gray-100">
                                  <th className="px-6 py-5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Symbol
                                  </th>
                                  <th className="px-6 py-5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Qty
                                  </th>
                                  <th className="px-6 py-5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Avg Price
                                  </th>
                                  <th className="px-6 py-5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    LTP
                                  </th>
                                  <th className="px-6 py-5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Invested
                                  </th>
                                  <th className="px-6 py-5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Current
                                  </th>
                                  <th className="px-6 py-5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    P&L
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {filteredPortfolio.map((stock) => (
                                  <tr key={stock.instrument_token} className="hover:bg-gray-50/50 transition-colors duration-200">
                                    <td className="px-6 py-5">
                                      <div className="flex items-center">
                                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                                          <span className="text-xs font-semibold text-gray-600">
                                            {stock.tradingsymbol.charAt(0)}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-sm font-semibold text-gray-900 block">{stock.tradingsymbol}</span>
                                          <span className="text-xs text-gray-500">{stock.exchange}</span>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-5 text-sm text-gray-600">
                                      {stock.quantity || stock.t1_quantity || 0}
                                    </td>
                                    <td className="px-6 py-5 text-sm text-gray-600">
                                      ₹{parseFloat(stock.average_price).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-5 text-sm text-gray-600">
                                      ₹{parseFloat(stock.last_price).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-5 text-sm text-gray-600">
                                      ₹{parseFloat((stock.quantity || stock.t1_quantity || 0) * stock.average_price).toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-6 py-5 text-sm text-gray-600">
                                      ₹{parseFloat((stock.quantity || stock.t1_quantity || 0) * stock.last_price).toLocaleString('en-IN')}
                                    </td>
                                    <td className={`px-6 py-5 text-sm font-semibold ${parseFloat(stock.pnl) >= 0 ? "text-green-600" : "text-red-600"}`}>
                                      {parseFloat(stock.pnl) >= 0 ? "+" : ""}₹{parseFloat(stock.pnl).toLocaleString('en-IN')}
                                      <div className={`text-xs ${parseFloat(stock.change) >= 0 ? "text-green-500" : "text-red-500"}`}>
                                        ({parseFloat(stock.change) >= 0 ? "+" : ""}{stock.change}%)
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                      </div>

                      {/* Allocation Chart */}
                      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-100/50 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Portfolio Allocation</h3>
                        <div className="h-64">
                          <canvas id="allocationChart"></canvas>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-16 border border-gray-100/50 shadow-sm text-center">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FaWallet className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Your portfolio is empty</h3>
                      <p className="text-gray-500 mb-8 max-w-md mx-auto">Connect your broker or start investing to see your holdings here.</p>
                      <button
                        onClick={() => setIsDropdownOpen(true)}
                        className="inline-flex items-center px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-all duration-200 font-medium"
                      >
                        Connect Broker
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Other Sections */}
              {activeSection === "Analysis" && (
                <div className="space-y-8 text-black">
                  {/* Performance Overview */}
                  <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-gray-100/50 shadow-sm">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Performance Overview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gray-50 rounded-2xl p-6">
                        <div className="flex items-center mb-4">
                          <div className="p-3 bg-blue-100 rounded-2xl mr-4">
                            <TrendingUp className="text-blue-600 w-5 h-5" />
                          </div>
                          <h4 className="font-semibold text-gray-900">Annualized Return</h4>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 mb-2">
                          {portfolio.length > 0
                            ? `${(portfolio.reduce((sum, stock) => sum + parseFloat(stock.pnl || 0), 0) / portfolioData.totalValue * 100).toFixed(2)}%`
                            : "0.00%"}
                        </p>
                        <p className="text-gray-600 text-sm">Since inception</p>
                      </div>
                      <div className="bg-gray-50 rounded-2xl p-6">
                        <div className="flex items-center mb-4">
                          <div className="p-3 bg-green-100 rounded-2xl mr-4">
                            <BarChart3 className="text-green-600 w-5 h-5" />
                          </div>
                          <h4 className="font-semibold text-gray-900">Best Performer</h4>
                        </div>
                        {portfolio.length > 0 ? (
                          <>
                            <p className="text-2xl font-bold text-gray-900 mb-1">
                              {portfolio.reduce((max, stock) => (parseFloat(stock.pnl || 0) > parseFloat(max.pnl || 0) ? stock : max), portfolio[0]).tradingsymbol}
                            </p>
                            <p className="text-green-600 text-sm">
                              +₹{parseFloat(portfolio.reduce((max, stock) => (parseFloat(stock.pnl || 0) > parseFloat(max.pnl || 0) ? stock : max), portfolio[0]).pnl).toFixed(2)}
                            </p>
                          </>
                        ) : (
                          <p className="text-gray-500">No data</p>
                        )}
                      </div>
                      <div className="bg-gray-50 rounded-2xl p-6">
                        <div className="flex items-center mb-4">
                          <div className="p-3 bg-red-100 rounded-2xl mr-4">
                            <TrendingDown className="text-red-600 w-5 h-5" />
                          </div>
                          <h4 className="font-semibold text-gray-900">Worst Performer</h4>
                        </div>
                        {portfolio.length > 0 ? (
                          <>
                            <p className="text-2xl font-bold text-gray-900 mb-1">
                              {portfolio.reduce((min, stock) => (parseFloat(stock.pnl || 0) < parseFloat(min.pnl || 0) ? stock : min), portfolio[0]).tradingsymbol}
                            </p>
                            <p className="text-red-600 text-sm">
                              ₹{parseFloat(portfolio.reduce((min, stock) => (parseFloat(stock.pnl || 0) < parseFloat(min.pnl || 0) ? stock : min), portfolio[0]).pnl).toFixed(2)}
                            </p>
                          </>
                        ) : (
                          <p className="text-gray-500">No data</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sector Allocation */}
                  <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-gray-100/50 shadow-sm">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Sector Allocation</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="h-80">
                        <canvas id="sectorChart"></canvas>
                      </div>
                      <div className="space-y-4">
                        {portfolio.length > 0 ? (
                          Object.entries(
                            portfolio.reduce((sectors, stock) => {
                              const sector = stock.sector || 'Others';
                              const value = (stock.quantity || stock.t1_quantity || 0) * parseFloat(stock.last_price || 0);
                              sectors[sector] = (sectors[sector] || 0) + value;
                              return sectors;
                            }, {})
                          )
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 5)
                            .map(([sectorName, sectorValue]) => (
                              <div key={sectorName} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="font-medium text-gray-700">{sectorName}</span>
                                  <span className="text-gray-900">
                                    ₹{sectorValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${(sectorValue / portfolioData.totalValue) * 100}%` }}
                                  ></div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500">
                                  <span>{((sectorValue / portfolioData.totalValue) * 100).toFixed(1)}% of portfolio</span>
                                  <span>{portfolio.filter(s => (s.sector || 'Others') === sectorName).length} holdings</span>
                                </div>
                              </div>
                            ))
                        ) : (
                          <p className="text-gray-500">No sector data available</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Smart Rebalancing Tool */}
                  <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-gray-100/50 shadow-sm">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Smart Rebalancing</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div>
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Risk Profile</label>
                          <select
                            className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                            onChange={(e) => setRebalancingRiskProfile(e.target.value)}
                          >
                            <option value="conservative">Conservative</option>
                            <option value="moderate">Moderate</option>
                            <option value="aggressive">Aggressive</option>
                          </select>
                        </div>
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Market Outlook</label>
                          <select
                            className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                            onChange={(e) => setRebalancingMarketOutlook(e.target.value)}
                          >
                            <option value="bullish">Bullish</option>
                            <option value="neutral">Neutral</option>
                            <option value="bearish">Bearish</option>
                          </select>
                        </div>
                        <button
                          className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                          onClick={calculateRebalancing}
                        >
                          Calculate Optimal Allocation
                        </button>
                      </div>
                      <div>
                        {rebalancingSuggestions.length > 0 ? (
                          <div className="space-y-4">
                            <h4 className="font-medium text-gray-700">Suggested Adjustments</h4>
                            <div className="overflow-y-auto max-h-96">
                              {rebalancingSuggestions.map((suggestion, index) => (
                                <div key={index} className="p-4 bg-gray-50 rounded-xl mb-2">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium">{suggestion.symbol || suggestion.sector}</span>
                                    <span className={`text-sm ${suggestion.action === 'BUY' ? 'text-green-600' : 'text-red-600'}`}>
                                      {suggestion.action} {suggestion.amount}%
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-xs text-gray-500">
                                    <span>Current: {suggestion.currentAllocation}%</span>
                                    <span>Target: {suggestion.targetAllocation}%</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-gray-400">
                            <p>Enter your risk profile and market outlook to get rebalancing suggestions</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Risk Analysis */}
                  <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-gray-100/50 shadow-sm">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Risk Analysis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-3">Volatility</h4>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex justify-between mb-2">
                            <span className="text-sm text-gray-600">Portfolio Beta</span>
                            <span className="font-medium">
                              {portfolio.length > 0
                                ? (portfolio.reduce((sum, stock) => sum + (stock.beta || 1), 0) / portfolio.length).toFixed(2)
                                : "N/A"}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mb-4">
                            {portfolio.length > 0
                              ? `Your portfolio is ${(portfolio.reduce((sum, stock) => sum + (stock.beta || 1), 0) / portfolio.length * 100 - 100).toFixed(0)}% more volatile than the market`
                              : "No volatility data available"}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-purple-600 h-2 rounded-full"
                              style={{ width: portfolio.length > 0 ? `${Math.min((portfolio.reduce((sum, stock) => sum + (stock.beta || 1), 0) / portfolio.length) * 50, 100)}%` : '0%' }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700 mb-3">Diversification</h4>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex justify-between mb-2">
                            <span className="text-sm text-gray-600">Concentration Risk</span>
                            <span className="font-medium">
                              {portfolio.length > 0
                                ? portfolio
                                  .sort((a, b) => ((b.quantity || b.t1_quantity) * b.last_price) - ((a.quantity || a.t1_quantity) * a.last_price))
                                  .slice(0, 3)
                                  .reduce((sum, stock) => sum + ((stock.quantity || stock.t1_quantity) * stock.last_price) / portfolioData.totalValue * 100, 0) > 50
                                  ? "High"
                                  : "Medium"
                                : "N/A"}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mb-4">
                            {portfolio.length > 0
                              ? `Top 3 holdings comprise ${portfolio
                                .sort((a, b) => ((b.quantity || b.t1_quantity) * b.last_price) - ((a.quantity || a.t1_quantity) * a.last_price))
                                .slice(0, 3)
                                .reduce((sum, stock) => sum + ((stock.quantity || stock.t1_quantity) * stock.last_price) / portfolioData.totalValue * 100, 0)
                                .toFixed(1)}% of your portfolio`
                              : "No diversification data available"}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-yellow-500 h-2 rounded-full"
                              style={{
                                width: portfolio.length > 0
                                  ? `${portfolio
                                    .sort((a, b) => ((b.quantity || b.t1_quantity) * b.last_price) - ((a.quantity || a.t1_quantity) * a.last_price))
                                    .slice(0, 3)
                                    .reduce((sum, stock) => sum + ((stock.quantity || stock.t1_quantity) * stock.last_price) / portfolioData.totalValue * 100, 0)
                                    .toFixed(1)}%`
                                  : '0%'
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Historical Performance Chart */}
                  <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-gray-100/50 shadow-sm">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Historical Performance</h3>
                    <div className="h-80">
                      <canvas id="performanceChart"></canvas>
                    </div>
                  </div>

                  {/* Detailed Holdings */}
                  <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-100/50 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="text-xl font-semibold text-gray-900">Detailed Holdings</h3>
                      <button className="text-sm text-blue-600 hover:text-blue-700">Export as CSV</button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sector</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% of Portfolio</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P&L</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Daily Change</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {portfolio
                            .sort((a, b) => {
                              const aValue = (a.quantity || a.t1_quantity || 0) * parseFloat(a.last_price || 0);
                              const bValue = (b.quantity || b.t1_quantity || 0) * parseFloat(b.last_price || 0);
                              return bValue - aValue;
                            })
                            .map((stock) => {
                              const value = (stock.quantity || stock.t1_quantity || 0) * parseFloat(stock.last_price || 0);
                              const portfolioPercent = (value / portfolioData.totalValue) * 100;

                              return (
                                <tr key={stock.instrument_token} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                                        <span className="text-xs font-semibold text-gray-600">
                                          {stock.tradingsymbol.charAt(0)}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-sm font-semibold text-gray-900 block">{stock.tradingsymbol}</span>
                                        <span className="text-xs text-gray-500">{stock.exchange}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {stock.sector || 'Unknown'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    <div className="flex items-center">
                                      <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                                        <div
                                          className="bg-blue-600 h-1.5 rounded-full"
                                          style={{ width: `${portfolioPercent}%` }}
                                        ></div>
                                      </div>
                                      {portfolioPercent.toFixed(1)}%
                                    </div>
                                  </td>
                                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${parseFloat(stock.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {parseFloat(stock.pnl || 0) >= 0 ? '+' : ''}₹{parseFloat(stock.pnl || 0).toFixed(2)}
                                  </td>
                                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${parseFloat(stock.day_change_percentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {parseFloat(stock.day_change_percentage || 0) >= 0 ? '+' : ''}{parseFloat(stock.day_change_percentage || 0).toFixed(2)}%
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Quantum Analytics */}
                  <div className="mb-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                        <FaRocket className="text-purple-600" />
                      </div>
                      <h4 className="text-xl font-semibold">Quantum Analytics</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6">
                        <div className="text-sm text-purple-600 mb-2">Portfolio Quantum Score</div>
                        <div className="text-4xl font-bold text-gray-900 mb-2">
                          {portfolio.length > 0 ? `${calculateQuantumScore(portfolio, portfolioData)}/100` : "N/A"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {portfolio.length > 0 ? "Based on performance, diversity, and stability" : "No data available"}
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6">
                        <div className="text-sm text-blue-600 mb-2">Risk-Quantum Ratio</div>
                        <div className="text-4xl font-bold text-gray-900 mb-2">
                          {portfolio.length > 0 ? calculateRiskQuantumRatio(portfolio, portfolioData) : "N/A"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {portfolio.length > 0 ? "Balance between return and risk" : "No data available"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3D Visualization */}
                  <div className="mb-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <FaChartPie className="text-blue-600" />
                      </div>
                      <h4 className="text-xl font-semibold">3D Portfolio Visualization</h4>
                    </div>
                    <div className="relative h-96 bg-gradient-to-br from-gray-50 to-white rounded-2xl overflow-hidden border border-gray-100">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative w-64 h-64">
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 shadow-inner"></div>
                          {portfolio.length > 0 ? (
                            Object.entries(
                              portfolio.reduce((sectors, stock) => {
                                const sector = stock.sector || 'Others';
                                const value = (stock.quantity || stock.t1_quantity || 0) * parseFloat(stock.last_price || 0);
                                sectors[sector] = (sectors[sector] || 0) + value;
                                return sectors;
                              }, {})
                            ).slice(0, 5).map(([sector, value], i) => {
                              const angle = (i * 72) * (Math.PI / 180);
                              const x = 120 * Math.cos(angle);
                              const y = 120 * Math.sin(angle);
                              return (
                                <div
                                  key={sector}
                                  className="absolute w-12 h-12 bg-white rounded-xl shadow-md flex items-center justify-center"
                                  style={{
                                    transform: `translate(${x}px, ${y}px)`,
                                    animation: `float-3d 8s ease-in-out infinite ${i * 0.2}s`
                                  }}
                                >
                                  <span className="text-xs font-medium">{sector}</span>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-gray-500">No sectors available</p>
                          )}
                          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
                            {portfolio.length > 0 &&
                              Object.keys(
                                portfolio.reduce((sectors, stock) => {
                                  const sector = stock.sector || 'Others';
                                  sectors[sector] = true;
                                  return sectors;
                                }, {})
                              ).slice(0, 5).map((_, i) => {
                                const angle1 = (i * 72) * (Math.PI / 180);
                                const angle2 = ((i + 1) * 72) * (Math.PI / 180);
                                return (
                                  <line
                                    key={i}
                                    x1={100 + 60 * Math.cos(angle1)}
                                    y1={100 + 60 * Math.sin(angle1)}
                                    x2={100 + 60 * Math.cos(angle2)}
                                    y2={100 + 60 * Math.sin(angle2)}
                                    stroke="rgba(99, 102, 241, 0.3)"
                                    strokeWidth="1"
                                  />
                                );
                              })}
                          </svg>
                        </div>
                      </div>
                      <div className="absolute bottom-4 left-0 right-0 text-center text-sm text-gray-500">
                        Rotate with mouse | Zoom with scroll
                      </div>
                    </div>
                  </div>

                  {/* Neural Network Insights */}
                  <div className="mb-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                        <FaBrain className="text-green-600" />
                      </div>
                      <h4 className="text-xl font-semibold">Neural Network Insights</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6">
                        <div className="text-sm text-green-600 mb-2">AI Confidence Score</div>
                        <div className="text-3xl font-bold text-gray-900 mb-2">
                          {portfolio.length > 0 ? `${calculateAIConfidenceScore(portfolio)}%` : "N/A"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {portfolio.length > 0 ? "Confidence in current allocations" : "No data available"}
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-6">
                        <div className="text-sm text-yellow-600 mb-2">Anomaly Detection</div>
                        <div className="text-3xl font-bold text-gray-900 mb-2">
                          {portfolio.length > 0 ? calculateAnomalies(portfolio) : "N/A"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {portfolio.length > 0 ? "Potential issues detected" : "No data available"}
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-6">
                        <div className="text-sm text-red-600 mb-2">Market Sentiment</div>
                        <div className="text-3xl font-bold text-gray-900 mb-2">
                          {portfolio.length > 0 ? getMarketSentiment(portfolio) : "N/A"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {portfolio.length > 0 ? "Based on portfolio performance" : "No data available"}
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 bg-white rounded-2xl p-6 border border-gray-100">
                      <h5 className="font-medium mb-3">Top AI Recommendations</h5>
                      <ul className="space-y-3">
                        {portfolio.length > 0 && getAIRecommendations(portfolio, portfolioData).length > 0 ? (
                          getAIRecommendations(portfolio, portfolioData).map((rec, i) => (
                            <li key={i} className="flex items-start">
                              <div className={`p-1 rounded-full mr-3 mt-1 ${rec.action === 'Increase' ? 'bg-blue-100' : 'bg-red-100'}`}>
                                {rec.action === 'Increase' ? (
                                  <FaArrowUp className="text-blue-600 w-3 h-3" />
                                ) : (
                                  <FaArrowDown className="text-red-600 w-3 h-3" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{rec.text}</p>
                                <p className="text-xs text-gray-500">{rec.reason}</p>
                              </div>
                            </li>
                          ))
                        ) : (
                          <p className="text-gray-500">No recommendations available</p>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Smart Rebalancing (Second Instance) */}
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <FaBalanceScale className="text-indigo-600" />
                      </div>
                      <h4 className="text-xl font-semibold">Smart Rebalancing</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Risk Profile</label>
                        <select
                          className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                          value={rebalancingRiskProfile}
                          onChange={(e) => setRebalancingRiskProfile(e.target.value)}
                        >
                          <option value="conservative">Conservative</option>
                          <option value="moderate">Moderate</option>
                          <option value="aggressive">Aggressive</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Market Outlook</label>
                        <select
                          className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                          value={rebalancingMarketOutlook}
                          onChange={(e) => setRebalancingMarketOutlook(e.target.value)}
                        >
                          <option value="bearish">Bearish</option>
                          <option value="neutral">Neutral</option>
                          <option value="bullish">Bullish</option>
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={calculateRebalancing}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors mb-6"
                    >
                      Calculate Rebalancing
                    </button>
                    {rebalancingSuggestions.length > 0 && (
                      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        <div className="grid grid-cols-12 bg-gray-50 p-4 border-b border-gray-100">
                          <div className="col-span-4 font-medium text-sm text-gray-500">Sector</div>
                          <div className="col-span-2 font-medium text-sm text-gray-500">Current</div>
                          <div className="col-span-2 font-medium text-sm text-gray-500">Target</div>
                          <div className="col-span-2 font-medium text-sm text-gray-500">Action</div>
                          <div className="col-span-2 font-medium text-sm text-gray-500">Amount</div>
                        </div>
                        {rebalancingSuggestions.map((suggestion, i) => (
                          <div key={i} className="grid grid-cols-12 p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50">
                            <div className="col-span-4 font-medium">{suggestion.sector}</div>
                            <div className="col-span-2">{suggestion.currentAllocation}%</div>
                            <div className="col-span-2">{suggestion.targetAllocation}%</div>
                            <div className={`col-span-2 font-medium ${suggestion.action === 'BUY' ? 'text-green-600' : 'text-red-600'}`}>
                              {suggestion.action}
                            </div>
                            <div className="col-span-2">{suggestion.amount}%</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeSection === "Watchlist" && (
                renderWatchlistSection()
              )}

              {activeSection === "Orders" && (
                renderOrdersSection()
              )}

              {activeSection === "Positions" && (
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  {positions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Symbol
                            </th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Type
                            </th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Qty
                            </th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Avg. Price
                            </th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              LTP
                            </th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              P&L
                            </th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Change %
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {positions.map((position) => (
                            <tr key={position.instrument_token} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {position.tradingsymbol}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {position.type}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {position.quantity}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                ₹{parseFloat(position.average_price).toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                ₹{parseFloat(position.last_price).toFixed(2)}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${parseFloat(position.pnl) >= 0 ? "text-green-500" : "text-red-500"}`}>
                                ₹{parseFloat(position.pnl).toLocaleString('en-IN')}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm ${parseFloat(position.change) >= 0 ? "text-green-500" : "text-red-500"}`}>
                                {parseFloat(position.change) >= 0 ? "+" : ""}{position.change}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-16 text-center">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-medium text-gray-900 mb-2">No open positions</h3>
                      <p className="text-gray-500 max-w-md">You don't have any open positions at the moment.</p>
                    </div>
                  )}
                </div>
              )}

              {activeSection === "Funds" && (
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-gray-100/50 shadow-sm">
                  <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6 sm:mb-8">
                    Funds Overview
                  </h3>
                  {loading ? (
                    <div className="text-center text-gray-600 text-sm sm:text-base">
                      Loading funds data...
                    </div>
                  ) : error ? (
                    <div className="text-center text-red-600 text-sm sm:text-base bg-red-50 rounded-2xl p-4">
                      {error}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {[
                        {
                          icon: FaMoneyBill,
                          title: "Total Funds",
                          value: `₹${funds.total}`,
                          desc: "Total balance including available and used funds.",
                          color: "blue",
                        },
                        {
                          icon: Wallet,
                          title: "Available Funds",
                          value: `₹${funds.available}`,
                          desc: "Funds available for trading or withdrawal.",
                          color: "green",
                        },
                        {
                          icon: MinusCircle,
                          title: "Used Funds",
                          value: `₹${funds.used}`,
                          desc: "Funds allocated to open positions or orders.",
                          color: "yellow",
                        },
                      ].map((item, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 rounded-2xl p-4 sm:p-6 hover:bg-gray-100 transition-colors duration-200"
                        >
                          <div className="flex items-center mb-3 sm:mb-4">
                            <div className={`p-2.5 sm:p-3 bg-${item.color}-100 rounded-2xl mr-3 sm:mr-4`}>
                              <item.icon className={`text-${item.color}-600 w-4 h-4 sm:w-5 sm:h-5`} />
                            </div>
                            <h4 className="text-sm sm:text-base font-semibold text-gray-900">
                              {item.title}
                            </h4>
                          </div>
                          <p className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                            {item.value}
                          </p>
                          <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="min-h-screen flex items-center justify-center p-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-black rounded-3xl flex items-center justify-center mx-auto mb-8">
                  <div className="w-12 h-12 bg-white rounded-2xl"></div>
                </div>
                <h2 className="text-3xl font-semibold text-gray-900 mb-4">Welcome to Portfolio</h2>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">Connect your broker account to start managing your investments with our elegant platform.</p>
                <button
                  onClick={() => setIsDropdownOpen(true)}
                  className="inline-flex items-center px-8 py-4 bg-black text-white rounded-full hover:bg-gray-800 transition-all duration-200 font-medium text-lg"
                >
                  Get Started
                </button>
              </div>
            </div>
          )}

          {/* Broker Selection Modal */}
          {isDropdownOpen && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-6">
              <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md animate-slideUp">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">Connect Broker</h3>
                      <p className="text-sm text-gray-500 mt-1">Choose your trading platform</p>
                    </div>
                    <button
                      onClick={() => setIsDropdownOpen(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-all duration-200"
                    >
                      <FaTimes className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {Object.keys(BROKERS).map((broker) => (
                      <button
                        key={broker}
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setSuccess(`Connected to ${BROKERS[broker].name} successfully!`);
                          setTimeout(() => setSuccess(null), 3000);
                        }}
                        className="w-full flex items-center p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all duration-200 text-left"
                      >
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mr-4 shadow-sm">
                          <span className="text-gray-800 font-semibold">
                            {BROKERS[broker].name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">{BROKERS[broker].name}</span>
                          <p className="text-sm text-gray-500">Connect your account</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <p className="text-xs text-gray-500 text-center leading-relaxed">
                      Your data is encrypted and secure. We never store your login credentials.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <style jsx>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown { animation: slideDown 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
      `}</style>
        </div>
      ) : (
        <div>
          <FrontPage
            onConnectClick={onConnectClick}
            isDropdownOpen={isDropdownOpen}
            setPortfolio={setPortfolio}
            setFunds={setFunds}
            setPositions={setPositions}
            setError={setError}
            setSuccess={setSuccess}
            updateChart={updateChart}
            isPanModalOpen={isPanModalOpen}
            setIsPanModalOpen={setIsPanModalOpen}
          />
          {isDropdownOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
              <div
                ref={dropdownRef}
                className="absolute left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-xl border border-gray-100 w-80 animate-fadeIn"
              >
                <div className="p-5 pb-3">
                  <div className="flex items-center mb-3">
                    <div className="h-12 w-12 rounded-lg bg-slate-900 flex items-center justify-center mr-3">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 12H19M5 17H19M5 7H19" stroke="white" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm font-normal">Trade, track and manage investments on</p>
                      <h3 className="text-gray-900 font-bold text-lg">EagleView</h3>
                    </div>
                    <button
                      onClick={() => setIsDropdownOpen(false)}
                      className="ml-auto text-gray-400 hover:text-gray-600"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center mb-5">
                    <span className="text-gray-800 font-medium">How does this work?</span>
                    <a href="#" className="text-blue-500 font-medium">Know more</a>
                  </div>
                </div>
                <h4 className="text-gray-800 font-semibold text-lg px-5 mb-4">Login with your broker</h4>
                <div className="grid grid-cols-3 grid-rows-2 gap-0 mb-5">
                  {Object.keys(BROKERS).slice(0, 8).map((broker, index) => (
                    <button
                      key={broker}
                      onClick={() => loginWithBroker(broker)}
                      className="flex flex-col items-center justify-center py-5 border-t border-r last:border-r-0 even:border-r-0 hover:bg-blue-50 transition-colors"
                      style={{
                        borderLeftWidth: index % 2 === 0 ? '0' : '1px',
                        borderTopWidth: index < 2 ? '0' : '1px'
                      }}
                    >
                      <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                        {BROKERS[broker].icon || (
                          <span className="text-gray-800 font-semibold text-lg">
                            {BROKERS[broker].name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <span className="text-gray-800 font-medium text-sm">{BROKERS[broker].name}</span>
                    </button>
                  ))}
                  {Object.keys(BROKERS).length > 8 && (
                    <button
                      onClick={() => { }}
                      className="flex flex-col items-center justify-center py-5 border-t hover:bg-blue-50 transition-colors"
                    >
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                        <span className="text-blue-600 font-bold">+{Object.keys(BROKERS).length - 8}</span>
                      </div>
                      <span className="text-blue-600 font-medium text-sm">More</span>
                    </button>
                  )}
                </div>
                <div className="px-5 pb-5">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-4 bg-white text-sm text-gray-500">Don't have a broker account?</span>
                    </div>
                  </div>
                  <button
                    onClick={() => { }}
                    className="mt-5 w-full py-3 rounded-lg border border-blue-500 text-blue-500 font-medium hover:bg-blue-50 transition-colors"
                  >
                    Open an account online
                  </button>
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="fixed top-4 right-4 p-4 bg-red-100 text-red-700 rounded-lg shadow z-50">
              {error}
            </div>
          )}
          {success && (
            <div className="fixed top-4 right-4 p-4 bg-green-100 text-green-700 rounded-lg shadow z-50">
              {success}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Portfolio;