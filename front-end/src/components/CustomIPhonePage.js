import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const CustomIPhonePage = () => {
  const [activeTab, setActiveTab] = useState("market");
  
  const tabs = [
    { id: "market", label: "Market", icon: "📈" },
    { id: "quality", label: "Quality", icon: "🏆" },
    { id: "news", label: "News", icon: "📰" },
    { id: "premium", label: "Premium", icon: "⭐" },
  ];

  const marketNews = [
    {
      headline: "U.S.-China Tariff Truce Boosts Markets",
      summary: "U.S. and China agree to a 90-day tariff relief, driving Dow up 1,200 points.",
      timestamp: "May 12, 2025, 9:48 AM IST",
      source: "Reuters",
    },
    {
      headline: "India-Pakistan Ceasefire Sparks Rally",
      summary: "Sensex soars 2,975 points and Nifty up 3.8% after ceasefire agreement.",
      timestamp: "May 12, 2025, 5:09 PM IST",
      source: "The Hindu BusinessLine",
    },
    {
      headline: "Early Monsoon Forecast Lifts Stocks",
      summary: "FMCG and two-wheeler stocks surge up to 7% as IMD predicts an early monsoon.",
      timestamp: "May 13, 2025, 9:11 AM IST",
      source: "Moneycontrol",
    },
  ];

  const [newsIndex, setNewsIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setNewsIndex((prev) => (prev + 1) % marketNews.length);
    }, 10000); // Matches the interval in Body.js

    return () => clearInterval(interval);
  }, [marketNews.length]);

  const renderContent = () => {
    switch (activeTab) {
      case "market":
        return (
          <div className="px-6 py-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-bold text-black">Market Scanner</h3>
              <span className="text-sm text-blue-400">May 19</span>
            </div>

            <div className="space-y-4 mb-6">
              {["MSFT", "AAPL", "NVDA"].map((ticker) => (
                <motion.div
                  key={ticker}
                  className="bg-gray-800 bg-opacity-70 rounded-lg p-3 flex justify-between"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.random() * 0.2 }}
                >
                  <span className="text-sm font-medium text-white">{ticker}</span>
                  <span className="text-sm text-green-400">
                    +{Math.floor(Math.random() * 5) + 1}%
                  </span>
                </motion.div>
              ))}
            </div>

            <motion.div
              className="h-40 bg-gradient-to-b from-blue-800 to-blue-900 bg-opacity-50 rounded-lg mb-6 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-center">
                <div className="text-sm text-blue-300 mb-2">Accumulation Index</div>
                <div className="text-xl font-bold text-white">78.4</div>
              </div>
            </motion.div>

            <motion.button
              className="w-full bg-blue-500 text-white text-sm rounded-full py-3 font-medium"
              whileTap={{ scale: 0.95 }}
            >
              Scan Markets
            </motion.button>
          </div>
        );

      case "quality":
        return (
          <div className="px-6 py-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-bold text-black">Quality Signals</h3>
              <span className="text-sm text-blue-400">Quality: 9.2</span>
            </div>

            <div className="space-y-2 mb-6">
              {["ROE", "FCF Margin", "Debt/EBITDA", "ROIC"].map((metric) => (
                <motion.div
                  key={metric}
                  className="flex justify-between items-center py-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.random() * 0.2 }}
                >
                  <span className="text-sm text-gray-400">{metric}</span>
                  <div className="flex items-center">
                    <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden mr-2">
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.random() * 70 + 30}%` }}
                        transition={{ duration: 1, delay: Math.random() * 0.5 }}
                      />
                    </div>
                    <span className="text-sm text-white">
                      {Math.floor(Math.random() * 5) + 6}/10
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              className="h-48 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg mb-6 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-sm text-gray-400 mb-3">MSFT Performance</div>
              <div className="h-32 relative">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <motion.path
                    d="M0,50 C20,30 40,60 60,40 S80,50 100,30"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="2"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 2, delay: 0.5 }}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3482F6" />
                      <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </motion.div>
          </div>
        );

      case "news":
        return (
          <div className="px-4 py-3">
            <h3 className="text-sm font-bold mb-3 text-black">Market News</h3>

            <div className="space-y-3">
              {marketNews.map((news, idx) => (
                <motion.div
                  key={news.headline}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: idx === newsIndex ? 1 : 0.5,
                    y: 0,
                    scale: idx === newsIndex ? 1 : 0.98,
                  }}
                  transition={{ duration: 0.4 }}
                  className="bg-black rounded-lg p-2"
                >
                  <h4 className="text-xs font-semibold mb-1 text-white">{news.headline}</h4>
                  <p className="text-[10px] text-gray-400 line-clamp-2">{news.summary}</p>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-gray-500">{news.source}</span>
                    <span className="text-[9px] text-blue-400">{news.timestamp.split(',')[0]}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-3">
              <motion.button
                className="w-full bg-blue-500 text-white text-xs rounded-full py-1.5 font-medium"
                whileTap={{ scale: 0.95 }}
              >
                Refresh
              </motion.button>
            </div>
          </div>
        );

      case "premium":
        return (
          <div className="px-6 py-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-bold text-black">Premium Features</h3>
              <span className="text-sm text-blue-400">Unlock Now</span>
            </div>

            <div className="space-y-4 mb-6">
              {["Institutional Signals", "Quality Analysis", "Price Targets"].map((feature) => (
                <motion.div
                  key={feature}
                  whileHover={{ scale: 1.03 }}
                  className="bg-black rounded-lg p-3 flex justify-between"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.random() * 0.2 }}
                >
                  <span className="text-sm font-medium text-white">{feature}</span>
                  <svg
                    className="w-5 h-5 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </motion.div>
              ))}
            </div>

            <motion.div
              className="bg-blue-600 rounded-lg p-5 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-white">Premium Plan</span>
                <span className="text-xs bg-blue-600 px-2 py-0.5 rounded-full text-white">
                  Save 20%
                </span>
              </div>
              <div className="text-xl font-bold text-white">
                Rs.299<span className="text-sm font-normal">/month</span>
              </div>
              <div className="text-sm text-gray-400 mt-2">Billed annually</div>
            </motion.div>

            <motion.button
              className="w-full bg-blue-500 text-white text-sm rounded-full py-3 font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
            >
              Start 7-Day Free Trial
            </motion.button>
          </div>
        );

      default:
        return <div className="text-black text-sm p-4">Tab content not found</div>;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Status Bar */}
      <div className="flex justify-between items-center px-4 py-2">
        <div className="text-xs font-medium text-black">20:39</div>
        <div className="flex space-x-1">
          <div className="w-3 h-3">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.01 21.49L23.64 7c-.45-.34-4.93-4-11.64-4C5.28 3 .81 6.66.36 7l11.63 14.49.01.01.01-.01z" />
            </svg>
          </div>
          <div className="w-3 h-3">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
            </svg>
          </div>
          <div className="w-3 h-3">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Main Content with auto scroll */}
      <div className="flex-grow overflow-y-auto">
        {renderContent()}
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t border-gray-200 mt-auto">
        <div className="flex justify-around px-2 py-3">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              className={`flex flex-col items-center justify-center ${
                activeTab === tab.id ? "text-blue-500" : "text-gray-500"
              }`}
              onClick={() => setActiveTab(tab.id)}
              whileTap={{ scale: 0.9 }}
            >
              <span className="text-lg mb-0.5">{tab.icon}</span>
              <span className="text-xs">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  className="w-1 h-1 bg-blue-500 rounded-full mt-1"
                  layoutId="activeTabIndicator"
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomIPhonePage;