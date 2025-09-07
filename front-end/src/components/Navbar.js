import React, { useState, useEffect, useCallback, useRef } from "react";
import debounce from "debounce";
import { useNavigate, useLocation, useNavigationType } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase-config";
import StockTicker from "./StockTicker";
import Login from "./login";
import datas from "./merged_file.json";
import "./style.css";
import logo from "./logo1.jpg";

// Import minimal set of icons to maintain a clean look
import {
  MagnifyingGlassIcon,
  Bars3Icon,
  EllipsisHorizontalIcon,
  UserCircleIcon,
  ChevronRightIcon,
  RocketLaunchIcon,
  LinkIcon,
  QuestionMarkCircleIcon,
  ArrowDownTrayIcon,
  ArrowRightOnRectangleIcon
} from "@heroicons/react/24/outline";
import Notifications from "./Notifications";

export default function Navbar() {
  useEffect(() => {
    document.body.style.backgroundColor = "#f5f5f7";
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, []);

  const navigate = useNavigate();

  // Navigation handlers
  const handleWatchlistClick = () => {
    window.scrollTo(0, 0);
    navigate("/watchlist");
    setIsMenuOpen(false);
  };

  const handleScreenerClick = () => {
    window.scrollTo(0, 0);
    navigate("/screener");
    setIsMenuOpen(false);
  };

  const handleHomeClick = () => {
    window.scrollTo(0, 0);
    navigate("/");
    setIsMenuOpen(false);
  };

  const handleCompareClick = () => {
    window.scrollTo(0, 0);
    navigate("/comparestocks");
    setIsMenuOpen(false);
  };

  const handlePortfolioClick = () => {
    window.scrollTo(0, 0);
    navigate("/portfolio");
    setIsMenuOpen(false);
  };

  const handleMarketWacthClick = () => {
    window.scrollTo(0, 0);
    navigate("/marketwatch");
    setIsMenuOpen(false);
  };

  const handleSupportClick = () => {
    window.scrollTo(0, 0);
    navigate("/contact-us");
    setIsMenuOpen(false);
  };

  const handleSubsrciptionClick = () => {
    window.scrollTo(0, 0);
    navigate("/subscribe");
    setIsDropdownOpen(false);
    setIsMenuOpen(false);
  };

  const handleProfileClick = () => {
    if (userDetails) {
      window.scrollTo(0, 0);
      navigate("/profile");
      setIsDropdownOpen(false);
      setIsMenuOpen(false);
    } else {
      setIsDropdownOpen((prev) => !prev);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUserDetails(null);
      window.scrollTo(0, 0);
      navigate("/");
      setIsDropdownOpen(false);
      setShowLogin(false);
    } catch (error) {
      console.error("Error logging out:", error.message);
    }
  };

  const handleLoginClick = () => {
    setShowLogin(true);
    setIsDropdownOpen(false);
  };

  // State management
  const [isConnected, setIsConnected] = useState(false);
  const [feedData, setFeedData] = useState([]);
  const [price1, setPrice1] = useState([]);
  const [price2, setPrice2] = useState([]);
  const [price3, setPrice3] = useState([]);
  const [searchFeed, setSearchFeed] = useState({});
  const [results, setResults] = useState([]);
  const [input, setInput] = useState("");
  const [recentSearches, setRecentSearches] = useState([]);
  const [userDetails, setUserDetails] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const location = useLocation();
  const navType = useNavigationType();
  // Refs for handling clicks outside components
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);
  const loginRef = useRef(null);
  const dropdownTimeoutRef = useRef(null);
  const searchInputRef = useRef(null);

  const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false);
  const moreDropdownRef = useRef(null);

  useEffect(() => {
    if (navType === "PUSH") {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, navType]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
      if (loginRef.current && !loginRef.current.contains(event.target)) {
        setShowLogin(false);
      }
      if (searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(event.target)) {
        setIsMoreDropdownOpen(false);
      }
    };
    if (isDropdownOpen || isMenuOpen || showLogin || isSearchFocused || isMoreDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen, isMenuOpen, showLogin, isSearchFocused, isMoreDropdownOpen]);

  // Fetch user data on component mount
  const fetchUserData = async () => {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        const docRef = doc(db, "Users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserDetails(docSnap.data());
          setShowLogin(false);
        }
      } else {
        setUserDetails(null);
      }
    });
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // Search functionality
  const fetchData = useCallback(
    debounce((value) => {
      const filteredResults = datas.filter(
        (stock) =>
          value &&
          stock &&
          ((stock.name &&
            stock.name.toLowerCase().startsWith(value.toLowerCase())) ||
            (stock.trading_symbol &&
              stock.trading_symbol
                .toLowerCase()
                .startsWith(value.toLowerCase())))
      );
      const instrumentKeys = filteredResults.map(
        (stock) => `${stock.segment}|${stock.trading_symbol}`
      );
      setResults(filteredResults);
      setSearchFeed((prev) => {
        let newFeed = {};
        instrumentKeys.forEach((key) => {
          if (!prev[key]) newFeed[key] = null;
        });
        return { ...prev, ...newFeed };
      });
    }, 500),
    []
  );

  const handleChange = (value) => {
    setInput(value);
    fetchData(value);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    if (input && !recentSearches.includes(input))
      setRecentSearches([input, ...recentSearches]);
    setInput("");
    setResults([]);
    setIsSearchFocused(false);
  };

  const handleResultClick = (search) => {
    navigate(`/${search.trading_symbol}`);
    setIsSearchFocused(false);
    setResults([]);
    setInput('');
    setIsMenuOpen(false);
  };

  const isFO = (symbol) =>
    symbol.includes("CE") || symbol.includes("PE") || symbol.includes("FUT");

  // UI interaction handlers
  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
    clearTimeout(dropdownTimeoutRef.current);
  };

  const handleMouseEnterButton = () => {
    clearTimeout(dropdownTimeoutRef.current);
    setIsDropdownOpen(true);
  };

  const handleMouseLeaveButton = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setIsDropdownOpen(false);
    }, 200);
  };

  const handleMouseEnterDropdown = () => {
    clearTimeout(dropdownTimeoutRef.current);
    setIsDropdownOpen(true);
  };

  const handleMouseLeaveDropdown = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setIsDropdownOpen(false);
    }, 50);
  };

  // Handle clicks outside components
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
      if (loginRef.current && !loginRef.current.contains(event.target)) {
        setShowLogin(false);
      }
      if (searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    };
    if (isDropdownOpen || isMenuOpen || showLogin || isSearchFocused) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen, isMenuOpen, showLogin, isSearchFocused]);

  return (
    <div className="flex flex-col items-center w-screen bg-white text-black sticky top-0 z-[1000] border border-b-gray-300">
      {/* Stock Ticker - Above navbar but below dropdowns */}
      <div className="w-screen z-[1010]">
        <StockTicker/>
      </div>
      <nav className="flex items-center justify-between py-2 w-full max-w-7xl ">
        {/* Left Section: Logo and Menu Toggle */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleMenu}
            className=" hover:text-gray-500 transition-colors sm:hidden"
            aria-label="Menu"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <div
            onClick={handleHomeClick}
            className="flex items-center gap-2 cursor-pointer"
          >
            <img
              src={logo}
              alt="EagleView Logo"
              className="h-8 w-8 rounded-full"
            />
            <h1 className="text-lg font-medium hover:text-gray-600 transition-colors sm:text-xl">
              EagleView
              <span className="text-xs absolute font-normal ml-0.5 mb-4 ">IN</span>
            </h1>
          </div>
        </div>

        {/* Search Bar - Centered on desktop */}
        <div className="hidden sm:flex w-full max-w-md relative z-[120]">
          <form
            onSubmit={handleSearch}
            className="relative w-full"
            ref={searchInputRef}
          >
            <div className={`flex items-center bg-gray-100 rounded-full px-4 py-2 transition-all duration-200 ${isSearchFocused ? 'ring-2 ring-yellow-400 bg-white' : 'hover:bg-gray-200'}`}>
              <MagnifyingGlassIcon className="w-4 h-4 text-gray-500 mr-2" />
              <input
                type="text"
                placeholder="Search investments..."
                value={input}
                onChange={(e) => handleChange(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="bg-transparent w-full text-sm focus:outline-none placeholder-gray-500 text-black"
              />
            </div>
            {results.length > 0 && isSearchFocused && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-2xl shadow-lg max-h-96 overflow-y-auto overflow-x-hidden z-[1050]">
                <div className="pt-3 pb-1 px-4 border-b border-gray-100">
                  <h3 className="text-xs font-medium text-gray-500">Search Results</h3>
                </div>
                <ul className="py-1">
                  {results.map((search, index) => (
                    <li
                      key={index}
                      onClick={() => handleResultClick(search)}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-all duration-200 group"
                      tabIndex={0}
                      role="option"
                      aria-selected={false}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleResultClick(search);
                        }
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-black group-hover:text-blue-600 transition-colors">
                          {search.name}
                        </span>
                        <span className="text-sm font-medium text-black">
                          ₹{search.lastPrice}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <span>{search.trading_symbol}</span>
                        <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${isFO(search.trading_symbol)
                          ? "bg-amber-50 text-amber-600"
                          : "bg-emerald-50 text-emerald-600"
                          }`}>
                          {isFO(search.trading_symbol) ? "F&O" : "Stock"}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </form>
        </div>

        {/* Right Section: Desktop Navigation Links,Notifications, and Profile */}
        <div className="flex items-center gap-6 ">
          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-5">
            <button
              onClick={handleCompareClick}
              className="text-sm font-medium hover:text-gray-200 px-2 py-2 rounded-lg hover:bg-gray-800 transition-all lg:px-3"
            >
              Compare
            </button>
            <button
              onClick={handleScreenerClick}
              className="text-sm font-medium hover:text-gray-200 px-2 py-2 rounded-lg hover:bg-gray-800 transition-all lg:px-3"
            >
              Screener
            </button>
            <button
              onClick={handleWatchlistClick}
              className="text-sm font-medium hover:text-gray-200 px-2 py-2 rounded-lg hover:bg-gray-800 transition-all lg:px-3"
            >
              Watchlist
            </button>
            <button
              onClick={handlePortfolioClick}
              className="text-sm font-medium hover:text-gray-200 px-2 py-2 rounded-lg hover:bg-gray-800 transition-all lg:px-3"
            >
              Portfolio
            </button>
            <button
              onClick={handleSubsrciptionClick}
              className="text-sm font-medium hover:text-gray-200 px-2 py-2 rounded-lg hover:bg-gray-800 transition-all lg:px-3"
            >
              Premium
            </button>

            {/* More Dropdown Button */}
            <div className="relative">
              <button
                onClick={() => setIsMoreDropdownOpen(!isMoreDropdownOpen)}
                className="text-sm font-medium hover:text-gray-200 px-2 py-2 rounded-lg hover:bg-gray-800 transition-all lg:px-3 flex items-center gap-1"
              >
                <EllipsisHorizontalIcon className="w-5 h-5" />
              </button>

              {/* More Dropdown Menu */}
              {isMoreDropdownOpen && (
                <div
                  ref={moreDropdownRef}
                  className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl z-[1050] border border-gray-200 py-1"
                >
                  <button
                    onClick={() => {
                      handleMarketWacthClick();
                      setIsMoreDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Market Watch
                  </button>
                  <button
                    onClick={() => {
                      handleSupportClick();
                      setIsMoreDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Support
                  </button>
                  <div className="border-t border-gray-200 my-1"></div>
                  <div className="px-4 py-2 text-xs text-gray-500">Products</div>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Stocks
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    ETFs
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Smallcases
                  </button>
                  <div className="border-t border-gray-200 my-1"></div>
                  <div className="px-4 py-2 text-xs text-gray-500">Profitfolio</div>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Stock Screener
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Portfolio
                  </button>
                </div>
              )}
            </div>
          </div>
          {/* Mobile Search Icon */}
          <button
            onClick={() => setIsSearchFocused(true)}
            className="sm:hidden  hover:text-gray-600 transition-colors"
          >
            <MagnifyingGlassIcon className="w-6 h-6" />
          </button>

          <Notifications currentUser={userDetails} />

          <div className="relative">
            <button
              onClick={toggleDropdown}
              onMouseEnter={handleMouseEnterButton}
              onMouseLeave={handleMouseLeaveButton}
              className="flex items-center gap-2 hover:text-gray-600 transition-colors"
              aria-label="Account"
            >
              <UserCircleIcon className="w-6 h-6" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div
                ref={dropdownRef}
                onMouseEnter={handleMouseEnterDropdown}
                onMouseLeave={handleMouseLeaveDropdown}
                className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg z-[1050] border border-gray-100 transform origin-top-right transition-all duration-200 animate-fade-in"
                style={{ animationDuration: '0.15s' }}
              >
                {userDetails ? (
                  <>
                    {/* Profile Section */}
                    <div
                      onClick={handleProfileClick}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        {userDetails.photo ? (
                          <img
                            src={userDetails.photo}
                            alt="Profile"
                            className="h-8 w-8 rounded-full object-cover ring-1 ring-gray-200"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-xs">
                              {userDetails.firstName?.charAt(0) || "U"}
                            </span>
                          </div>
                        )}
                        <span className="text-sm font-medium group-hover:text-blue-600 transition-colors">
                          {userDetails.firstName || "User"}
                        </span>
                      </div>
                      <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gray-100 mx-4 "></div>

                    {/* Menu Items */}
                    <div
                      onClick={handleSubsrciptionClick}
                      className="flex items-center gap-3 rounded-lg px-4 py-3 hover:bg-gray-50 cursor-pointer group"
                    >
                      <RocketLaunchIcon className="w-5 h-5 text-gray-500" />
                      <span className="text-sm group-hover:text-blue-600 transition-colors">Go Premium</span>
                    </div>

                    <div
                      onClick={() => console.log("Connected Accounts clicked")}
                      className="flex items-center gap-3 px-4 rounded-lg py-3 hover:bg-gray-50 cursor-pointer group"
                    >
                      <LinkIcon className="w-5 h-5 text-gray-500" />
                      <span className="text-sm group-hover:text-blue-600 transition-colors">Connected Accounts</span>
                    </div>

                    <div
                      onClick={handleSupportClick}
                      className="flex items-center gap-3 px-4 rounded-lg py-3 hover:bg-gray-50 cursor-pointer group"
                    >
                      <QuestionMarkCircleIcon className="w-5 h-5 text-gray-500" />
                      <span className="text-sm group-hover:text-blue-600 transition-colors">Support</span>
                    </div>

                    <div
                      onClick={() => console.log("Download App clicked")}
                      className="flex items-center gap-3 px-4 rounded-lg py-3 hover:bg-gray-50 cursor-pointer group"
                    >
                      <ArrowDownTrayIcon className="w-5 h-5 text-gray-500" />
                      <span className="text-sm group-hover:text-blue-600 transition-colors">Download App</span>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gray-100 mx-4"></div>

                    <div
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 rounded-lg py-3 hover:bg-gray-50 cursor-pointer group"
                    >
                      <ArrowRightOnRectangleIcon className="w-5 h-5 text-gray-500" />
                      <span className="text-sm group-hover:text-blue-600 transition-colors">Sign Out</span>
                    </div>
                  </>
                ) : (
                  <div
                    onClick={handleLoginClick}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <UserCircleIcon className="w-5 h-5 text-gray-500" />
                    <span className="text-sm">Sign In</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Search View */}
      {isSearchFocused && (
        <div className="fixed inset-0 bg-white z-[200] sm:hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Search</h2>
              <button
                onClick={() => setIsSearchFocused(false)}
                className="text-gray-500"
              >
                Cancel
              </button>
            </div>
            <form onSubmit={handleSearch} className="relative w-full">
              <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-blue-400 focus-within:bg-white">
                <MagnifyingGlassIcon className="w-4 h-4 text-gray-500 mr-2" />
                <input
                  type="text"
                  placeholder="Search investments..."
                  value={input}
                  onChange={(e) => handleChange(e.target.value)}
                  autoFocus
                  className="bg-transparent w-full text-sm focus:outline-none placeholder-gray-500 text-black"
                />
              </div>
            </form>

            {results.length > 0 ? (
              <div className="mt-4">
                <div className="pb-2 border-b border-gray-100">
                  <h3 className="text-xs font-medium text-gray-500">Results</h3>
                </div>
                <ul>
                  {results.map((search, index) => (
                    <li
                      key={index}
                      // FIXED: Changed onClick to onMouseDown. This event fires immediately on tap,
                      // preventing a race condition where the component unmounts before navigation
                      // can be processed on mobile devices.
                      onMouseDown={() => handleResultClick(search)}
                      className="px-2 py-3 border-b border-gray-100 last:border-b-0 cursor-pointer"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-black">
                          {search.name}
                        </span>
                        <span className="text-sm font-medium text-black">
                          ₹{search.lastPrice}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <span>{search.trading_symbol}</span>
                        <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${isFO(search.trading_symbol)
                          ? "bg-amber-50 text-amber-600"
                          : "bg-emerald-50 text-emerald-600"
                          }`}>
                          {isFO(search.trading_symbol) ? "F&O" : "Stock"}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              input && (
                <div className="flex flex-col items-center justify-center h-40">
                  <p className="text-gray-500">No results found</p>
                </div>
              )
            )}

            {!input && recentSearches.length > 0 && (
              <div className="mt-4">
                <div className="pb-2 border-b border-gray-100">
                  <h3 className="text-xs font-medium text-gray-500">Recent Searches</h3>
                </div>
                <ul>
                  {recentSearches.slice(0, 5).map((search, index) => (
                    <li
                      key={index}
                      onClick={() => handleChange(search)}
                      className="px-2 py-3 border-b border-gray-100 last:border-b-0 flex items-center"
                    >
                      <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 mr-3" />
                      <span className="text-sm">{search}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Menu - Side Panel Style */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-[1100] sm:hidden">
          <div
            ref={menuRef}
            className="w-3/4 h-full bg-white text-black flex flex-col animate-slide-in-left"
            style={{ animationDuration: '0.3s' }}
          >
            {/* User info at top */}
            {userDetails ? (
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  {userDetails.photo ? (
                    <img
                      src={userDetails.photo}
                      alt="Profile"
                      className="h-10 w-10 rounded-full object-cover ring-1 ring-gray-200"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {userDetails.firstName?.charAt(0) || "U"}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium">{userDetails.firstName || "User"}</h3>
                    <p className="text-xs text-gray-500">{userDetails.email || ""}</p>
                  </div>
                </div>
                <button
                  onClick={handleProfileClick}
                  className="mt-2 text-sm text-blue-600 font-medium"
                >
                  View Profile
                </button>
              </div>
            ) : (
              <div className="p-6 border-b border-gray-100">
                <button
                  onClick={handleLoginClick}
                  className="px-4 py-2 bg-blue-600 rounded-full text-sm font-medium w-full"
                >
                  Sign In
                </button>
              </div>
            )}

            {/* Navigation Items */}
            <div className="flex-1 flex flex-col p-4">
              <nav className="flex flex-col gap-2">
                <button
                  onClick={handleHomeClick}
                  className="flex items-center gap-3 px-4 py-3 text-black hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="text-sm font-medium">Home</span>
                </button>
                <button
                  onClick={handleCompareClick}
                  className="flex items-center gap-3 px-4 py-3 text-black hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="text-sm font-medium">Compare</span>
                </button>
                <button
                  onClick={handleScreenerClick}
                  className="flex items-center gap-3 px-4 py-3 text-black hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="text-sm font-medium">Screener</span>
                </button>
                <button
                  onClick={handleWatchlistClick}
                  className="flex items-center gap-3 px-4 py-3 text-black hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="text-sm font-medium">Watchlist</span>
                </button>
                <button
                  onClick={handlePortfolioClick}
                  className="flex items-center gap-3 px-4 py-3 text-black hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="text-sm font-medium">Portfolio</span>
                </button>
                <button
                  onClick={handleMarketWacthClick}
                  className="flex items-center gap-3 px-4 py-3 text-black hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="text-sm font-medium">Market Watch</span>
                </button>
                <button
                  onClick={handleSubsrciptionClick}
                  className="flex items-center gap-3 px-4 py-3 text-black hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <RocketLaunchIcon className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-medium">Go Premium</span>
                </button>
                <button
                  onClick={handleSupportClick}
                  className="flex items-center gap-3 px-4 py-3 text-black hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <QuestionMarkCircleIcon className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-medium">Support</span>
                </button>
                <button
                  onClick={() => console.log("Download App clicked")}
                  className="flex items-center gap-3 px-4 py-3 text-black hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <ArrowDownTrayIcon className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-medium">Download App</span>
                </button>
              </nav>
            </div>

            {/* Footer Section */}
            {userDetails && (
              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 w-full text-black hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLogin && !userDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[1200] flex items-center justify-center">
          <div
            ref={loginRef}
            className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 animate-fade-in"
            style={{ animationDuration: '0.2s' }}
          >
            <Login setShowLogin={setShowLogin} />
          </div>
        </div>
      )}
    </div>
  );
}
