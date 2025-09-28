import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import Navbar from "./Navbar";
import iphone16 from "./iphone16.png";
import iphone16b from "./iphone16Price.png";
import { useInView } from "framer-motion";
import { TrendingUp, TrendingDown, Star } from 'lucide-react';

// Apple-style scrolling section
const ScrollRevealSection = ({ children, className = "", delay = 0 }) => {
  const controls = useAnimation();
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          controls.start({
            opacity: 1,
            y: 0,
            transition: {
              duration: 0.8,
              ease: [0.25, 0.1, 0.25, 1],
              delay,
            },
          });
        }
      },
      { threshold: 0.2 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [controls, delay]);

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={controls} className={className}>
      {children}
    </motion.div>
  );
};

// Custom components with EagleView branding
const Section = ({ children, className = "", id = "", bgColor = "bg-white" }) => (
  <section
    id={id}
    className={`w-full py-12 sm:py-16 md:py-20 overflow-hidden ${bgColor} ${className} relative z-[10]`}
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
  </section>
);

const AppleButton = React.memo(({ children, color = "bg-blue-900", onClick, className = "" }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className={`${color} text-white px-4 py-2 sm:px-6 sm:py-2.5 rounded-full font-medium text-sm sm:text-base font-sans ${className} relative z-[20] min-h-[44px]`}
    onClick={onClick}
    aria-label={children}
  >
    {children}
  </motion.button>
));

// EagleView stock website component with real-time market news
export default function Body({ auth_token, onViewChange, currentView }) {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSector, setSelectedSector] = useState("Technology");
  const [loading, setLoading] = useState(false);
  const [currentSection, setCurrentSection] = useState("hero");
  const [newsItems, setNewsItems] = useState([]);
  const [newsIndex, setNewsIndex] = useState(0);
  const [isNewsPaused, setIsNewsPaused] = useState(false);
  const heroRef = useRef(null);
  const [showDeviceContent, setShowDeviceContent] = useState(false);
  const [activeCard, setActiveCard] = useState(null);
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [showSlowAccumulation, setShowSlowAccumulation] = useState(false);

  const handleToggleView = () => {
    onViewChange('futures');
  };

  const slowAccumulationStocks = [
    { name: 'Berkshire Hathaway', growth: '+0.3%', qualityScore: 9.5, accumulation: 'High' },
    { name: 'Coca-Cola Co.', growth: '+0.8%', qualityScore: 8.9, accumulation: 'Medium' },
    { name: 'Procter & Gamble', growth: '+0.5%', qualityScore: 8.7, accumulation: 'High' },
    { name: 'Walmart Inc.', growth: '+0.9%', qualityScore: 8.4, accumulation: 'Medium' }
  ];

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  const getTrendIndicator = (trend) => {
    switch (trend) {
      case 'up': return { symbol: '↗', color: 'text-emerald-500' };
      case 'down': return { symbol: '↘', color: 'text-red-500' };
      default: return { symbol: '→', color: 'text-gray-400' };
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.6,
        ease: [0.25, 0.25, 0, 1]
      }
    })
  };

  const featuredStocks = [
    {
      name: 'Apple Inc.',
      sector: 'Technology',
      marketCap: '$2.8T',
      growth: '+2.4%',
      qualityScore: 9.2,
      price: '$175.23'
    },
    {
      name: 'Microsoft Corp.',
      sector: 'Technology',
      marketCap: '$2.5T',
      growth: '+1.8%',
      qualityScore: 9.0,
      price: '$342.56'
    },
    {
      name: 'Johnson & Johnson',
      sector: 'Healthcare',
      marketCap: '$450B',
      growth: '+0.8%',
      qualityScore: 8.7,
      price: '$162.45'
    },
    {
      name: 'Pfizer Inc.',
      sector: 'Healthcare',
      marketCap: '$280B',
      growth: '-1.2%',
      qualityScore: 7.9,
      price: '$42.18'
    },
    {
      name: 'JPMorgan Chase',
      sector: 'Finance',
      marketCap: '$480B',
      growth: '+3.1%',
      qualityScore: 8.5,
      price: '$158.92'
    },
    {
      name: 'Bank of America',
      sector: 'Finance',
      marketCap: '$290B',
      growth: '+2.7%',
      qualityScore: 8.1,
      price: '$34.76'
    },
    {
      name: 'ExxonMobil',
      sector: 'Energy',
      marketCap: '$420B',
      growth: '+4.2%',
      qualityScore: 7.6,
      price: '$108.45'
    },
    {
      name: 'Chevron Corp.',
      sector: 'Energy',
      marketCap: '$310B',
      growth: '+3.8%',
      qualityScore: 7.8,
      price: '$162.31'
    },
    {
      name: 'Amazon.com',
      sector: 'Consumer',
      marketCap: '$1.4T',
      growth: '+1.9%',
      qualityScore: 8.8,
      price: '$142.87'
    },
    {
      name: 'Tesla Inc.',
      sector: 'Consumer',
      marketCap: '$800B',
      growth: '+5.6%',
      qualityScore: 8.3,
      price: '$248.91'
    }
  ];

  const insights = [
    { title: "Slow Accumulation Strategy", type: "Strategy", color: "bg-blue-500" },
    { title: "Quality at Fair Price", type: "Framework", color: "bg-purple-500" },
    { title: "Low P/E Investing", type: "Guide", color: "bg-green-500" },
    { title: "DCF Analysis Masterclass", type: "Tutorial", color: "bg-yellow-500" },
    { title: "Volume Surge Detector", type: "Tool", color: "bg-red-500" },
  ];

  const sectors = ['Technology', 'Healthcare', 'Finance', 'Energy', 'Consumer'];

  const marketNews = [
    {
      headline: "U.S.-China Tariff Truce Boosts Markets",
      summary: "U.S. and China agree to a 90-day tariff relief, driving Dow up 1,200 points and Tesla shares up 6.6%.",
      timestamp: "May 12, 2025, 9:48 AM IST",
      source: "Reuters",
    },
    {
      headline: "India-Pakistan Ceasefire Sparks Rally",
      summary: "Sensex soars 2,975 points and Nifty up 3.8% after ceasefire agreement, with realty stocks gaining 5.9%.",
      timestamp: "May 12, 2025, 5:09 PM IST",
      source: "The Hindu BusinessLine",
    },
    {
      headline: "Early Monsoon Forecast Lifts Stocks",
      summary: "FMCG and two-wheeler stocks surge up to 7% as IMD predicts an early monsoon in 2025.",
      timestamp: "May 13, 2025, 9:11 AM IST",
      source: "Moneycontrol",
    },
    {
      headline: "Fidelity Outage Frustrates Investors",
      summary: "Fidelity trading platforms faced outages during Monday's market rally, locking out investors.",
      timestamp: "May 12, 2025, 9:48 AM IST",
      source: "The Economic Times",
    },
  ];

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setNewsItems(marketNews);
      setLoading(false);
    }, 1000);

    const interval = setInterval(() => {
      if (!isNewsPaused) {
        setNewsIndex((prev) => (prev + 1) % marketNews.length);
      }
    }, 10000);

    const contentTimer = setTimeout(() => {
      setShowDeviceContent(true);
    }, 500);

    return () => {
      clearInterval(interval);
      clearTimeout(contentTimer);
    };
  }, [isNewsPaused]);

  useEffect(() => {
    const sections = document.querySelectorAll("section");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setCurrentSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3 }
    );

    sections.forEach((section) => observer.observe(section));
    return () => sections.forEach((section) => observer.unobserve(section));
  }, []);

  const displaySlowAccumulationStocks = useCallback(() => {
    setSelectedCategory("slowAccumulation");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const toggleNewsPause = () => {
    setIsNewsPaused((prev) => !prev);
  };

  return (
    <div className="w-screen min-h-screen bg-black text-white font-sans relative z-[0]">
      <Navbar token={auth_token} />

      <motion.div
        className="absolute top-24 left-1/2 transform -translate-x-1/2 z-[60]"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.button
          onClick={handleToggleView}
          className="group relative flex items-center gap-3 bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-full px-4 py-2 hover:bg-gray-900/90 transition-colors duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          aria-label="Toggle between Stocks and Futures"
        >
          <span className={`text-sm font-medium transition-colors duration-200 ${currentView === 'stocks' ? 'text-white' : 'text-gray-500'
            }`}>
            Stocks
          </span>

          <div className="relative w-11 h-6 bg-gray-800 rounded-full">
            <motion.div
              className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm"
              animate={{
                x: currentView === 'futures' ? 20 : 0,
                backgroundColor: currentView === 'futures' ? '#3B82F6' : '#FFFFFF'
              }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30
              }}
            />
          </div>

          <span className={`text-sm font-medium transition-colors duration-200 ${currentView === 'futures' ? 'text-white' : 'text-gray-500'
            }`}>
            Futures
          </span>
        </motion.button>
      </motion.div>

      <motion.div
        className="w-screen min-h-screen bg-black text-white font-sans relative z-[0]"
        initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        exit={{
          opacity: 0,
          scale: 0.95,
          filter: "blur(10px)",
          transition: {
            duration: 0.6,
            ease: [0.43, 0.13, 0.23, 0.96]
          }
        }}
      >
        <Section
          id="hero"
          className="min-h-[70vh] sm:min-h-[80vh] flex items-center justify-center pt-20 sm:pt-24 bg-black relative z-[10]"
          bgColor="bg-black"
        >
          <motion.div ref={heroRef} className="text-center px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h2 className="text-blue-400 font-semibold mb-4 text-4xl sm:text-5xl md:text-6xl">EagleView</h2>
            </motion.div>

            <motion.h1
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 tracking-tight text-white"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              Uncover Hidden Market Opportunities
            </motion.h1>

            <motion.p
              className="text-sm sm:text-base md:text-lg text-gray-300 max-w-xl sm:max-w-2xl mx-auto mb-6 sm:mb-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              EagleView's Precision Analytics Platform empowers investors with proprietary tools to identify undervalued stocks and outperform the market.
            </motion.p>

            <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 items-center justify-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="flex flex-col items-center lg:items-start space-y-4 sm:space-y-6 w-full lg:w-1/2"
              >
                <div className="text-center lg:text-left">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2">Precision Analytics</h3>
                  <p className="text-xs sm:text-sm text-gray-400 max-w-md">
                    Leverage EagleView's proprietary algorithms to detect institutional accumulation and quality investments.
                  </p>
                </div>
                <AppleButton color="bg-blue-900">Get Started</AppleButton>
              </motion.div>
              <div className="w-full lg:w-1/2 flex justify-center">
                <img
                  src={iphone16}
                  alt="EagleView App Screenshot"
                  className="w-full max-w-[300px] sm:max-w-[400px] md:max-w-[500px] h-auto object-contain"
                />
              </div>
            </div>
          </motion.div>
        </Section>

        <div className="fixed left-0 top-1/4 w-48 sm:w-64 h-48 sm:h-64 bg-blue-500 rounded-full filter blur-[80px] sm:blur-[100px] opacity-20 animate-pulse hidden lg:block" />
        <div className="fixed right-0 bottom-1/4 w-64 sm:w-80 h-64 sm:h-80 bg-purple-500 rounded-full filter blur-[100px] sm:blur-[120px] opacity-15 hidden lg:block" />

        <div className="fixed right-4 sm:right-6 top-1/2 transform -translate-y-1/2 z-[50] hidden md:block">
          <div className="flex flex-col space-y-3">
            {["hero", "insights", "market-pulse", "premium", "features", "performance", "cta"].map((section) => (
              <a
                key={section}
                href={`#${section}`}
                className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-300 ${currentSection === section ? "bg-blue-400 scale-125" : "bg-gray-600"}`}
                aria-label={`Navigate to ${section} section`}
              />
            ))}
          </div>
        </div>

        <Section id="insights" bgColor="bg-black" className="relative">

          <div className="text-center mb-8 sm:mb-12">
            <ScrollRevealSection>
              <h2 className="text-blue-400 font-semibold mb-2 text-base sm:text-lg md:text-xl">EagleView Insights</h2>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold">Actionable Stock Intelligence</h3>
              <p className="text-xs sm:text-sm text-gray-300 mt-2 sm:mt-3 max-w-md sm:max-w-xl mx-auto">
                Discover strategies and tools to stay ahead of the market with EagleView's proprietary analytics.
              </p>
            </ScrollRevealSection>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
            {insights.map((insight, index) => (
              <ScrollRevealSection key={insight.title} delay={index * 0.1}>
                <motion.div
                  whileHover={{
                    y: -8,
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                    transition: { type: "spring", stiffness: 400, damping: 17 },
                  }}
                  className="bg-gray-900 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 relative z-[20]"
                >
                  <div className={`${insight.color} h-1.5`}></div>
                  <div className="p-4 sm:p-5">
                    <span className="text-[10px] sm:text-xs font-medium text-gray-400">{insight.type}</span>
                    <h4 className="text-sm sm:text-base font-semibold mt-1">{insight.title}</h4>
                    <div className="mt-3 sm:mt-4 flex justify-between items-center">
                      <span className="text-blue-400 text-[10px] sm:text-xs">Learn more</span>
                      <svg
                        className="w-3 sm:w-4 h-3 sm:h-4 text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </motion.div>
              </ScrollRevealSection>
            ))}
          </div>
        </Section>

        <Section id="market-pulse" bgColor="bg-gray-50" className="relative">
          <div
            ref={containerRef}
            className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-24"
          >
            <div className="max-w-6xl mx-auto px-6">
              {/* Header */}
              <motion.div
                className="text-center mb-20"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.8, ease: [0.25, 0.25, 0, 1] }}
              >
                <div className="inline-flex items-center space-x-2 mb-8">
                  <motion.div
                    className="w-2 h-2 bg-emerald-500 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="text-sm font-medium text-gray-500 tracking-wider uppercase">
                    Market Pulse
                  </span>
                </div>

                <h1 className="text-5xl md:text-6xl font-light text-gray-900 mb-6 tracking-tight">
                  Real-Time Market
                  <span className="block font-normal text-gray-600">Updates</span>
                </h1>

                <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
                  Stay informed with curated market insights and analysis from trusted sources worldwide
                </p>
              </motion.div>

              {/* Content */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-32">
                  <motion.div
                    className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full mb-6"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.p
                    className="text-gray-500 font-light"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Loading market data...
                  </motion.p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                    {newsItems.map((news, index) => {
                      const trend = getTrendIndicator(news.trend);

                      return (
                        <motion.article
                          key={news.id}
                          custom={index}
                          variants={cardVariants}
                          initial="hidden"
                          animate={isInView ? "visible" : "hidden"}
                          onHoverStart={() => setActiveCard(news.id)}
                          onHoverEnd={() => setActiveCard(null)}
                          className="group relative"
                        >
                          <motion.div
                            className="bg-white border border-gray-100 rounded-2xl p-8 h-full cursor-pointer transition-all duration-300 hover:border-gray-200"
                            whileHover={{ y: -4 }}
                            layout
                          >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center space-x-3">
                                <span className="text-xs font-medium text-gray-400 tracking-wide uppercase">
                                  {news.source}
                                </span>
                                <div className="w-1 h-1 bg-gray-300 rounded-full" />
                                <span className="text-xs text-gray-500">
                                  {news.timestamp}
                                </span>
                              </div>

                              <motion.div
                                className={`text-lg font-light ${trend.color}`}
                                animate={{
                                  scale: activeCard === news.id ? 1.2 : 1,
                                  rotate: activeCard === news.id ? 12 : 0
                                }}
                                transition={{ duration: 0.2 }}
                              >
                                {trend.symbol}
                              </motion.div>
                            </div>

                            {/* Content */}
                            <div className="mb-6">
                              <h2 className="text-xl font-medium text-gray-900 mb-3 leading-snug group-hover:text-gray-700 transition-colors duration-300">
                                {news.headline}
                              </h2>
                              <p className="text-gray-600 leading-relaxed font-light">
                                {news.summary}
                              </p>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600">
                                {news.category}
                              </span>

                              <motion.button
                                className="flex items-center space-x-2 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors duration-200"
                                whileHover={{ x: 4 }}
                              >
                                <span>Read more</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                                </svg>
                              </motion.button>
                            </div>
                          </motion.div>
                        </motion.article>
                      );
                    })}
                  </div>

                  {/* Control */}
                  <motion.div
                    className="flex justify-center"
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                  >
                    <motion.button
                      onClick={toggleNewsPause}
                      className="group flex items-center space-x-4 bg-white border border-gray-200 hover:border-gray-300 px-8 py-4 rounded-full transition-all duration-300 shadow-sm hover:shadow-md"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <motion.div
                        className={`w-3 h-3 rounded-full transition-colors duration-300 ${isNewsPaused ? 'bg-emerald-500' : 'bg-orange-400'
                          }`}
                        animate={{
                          scale: isNewsPaused ? [1, 1.2, 1] : 1
                        }}
                        transition={{
                          duration: 0.6,
                          repeat: isNewsPaused ? 0 : Infinity
                        }}
                      />

                      <span className="font-medium text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                        {isNewsPaused ? 'Resume Updates' : 'Pause Updates'}
                      </span>

                      <motion.div
                        animate={{ rotate: isNewsPaused ? 0 : 180 }}
                        transition={{ duration: 0.3 }}
                      >
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </motion.div>
                    </motion.button>
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </Section>

        <Section className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            {/* Header */}
            <ScrollRevealSection className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
              >
                <h2 className="text-blue-400 font-medium mb-4 text-lg tracking-wide uppercase">
                  Premium Experience
                </h2>
                <h3 className="text-5xl sm:text-6xl font-light text-white mb-6 tracking-tight">
                  Quality-Focused
                  <br />
                  <span className="font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Investing
                  </span>
                </h3>
                <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                  Identify high-quality businesses trading at reasonable prices through advanced metrics.
                </p>
              </motion.div>
            </ScrollRevealSection>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
              {/* Left Column - Sector Analysis */}
              <div className="lg:col-span-2">
                <ScrollRevealSection delay={1} className="mb-8">
                  <h4 className="text-2xl font-semibold text-white mb-4">Sector Analysis</h4>
                  <p className="text-gray-300 mb-8 text-lg leading-relaxed">
                    Focus your research on promising sectors with EagleView's proprietary quality metrics.
                  </p>

                  {/* Sector Buttons */}
                  <div className="flex flex-wrap gap-3 mb-8">
                    {sectors.map((sector) => (
                      <motion.button
                        key={sector}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`
                      px-6 py-3 rounded-full text-sm font-medium transition-all duration-300
                      ${selectedSector === sector
                            ? "bg-white text-black shadow-lg"
                            : "bg-white bg-opacity-10 text-white hover:bg-opacity-20 border border-white border-opacity-20"
                          }
                      backdrop-blur-sm
                    `}
                        onClick={() => setSelectedSector(sector)}
                      >
                        {sector}
                      </motion.button>
                    ))}
                  </div>
                </ScrollRevealSection>

                {/* Stock Cards */}
                <ScrollRevealSection delay={2}>
                  <div className="space-y-4">
                    <AnimatePresence mode="wait">
                      {featuredStocks
                        .filter((stock) => stock.sector === selectedSector)
                        .map((stock, index) => (
                          <motion.div
                            key={stock.name}
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="bg-white bg-opacity-5 backdrop-blur-xl rounded-2xl p-6 border border-white border-opacity-10 hover:bg-opacity-10 transition-all duration-300"
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h5 className="text-lg font-semibold text-white">{stock.name}</h5>
                                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                  <span>Market Cap: {stock.marketCap}</span>
                                  <span>Price: {stock.price}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-2 mb-2">
                                  {stock.growth.startsWith('+') ? (
                                    <TrendingUp className="w-4 h-4 text-green-400" />
                                  ) : (
                                    <TrendingDown className="w-4 h-4 text-red-400" />
                                  )}
                                  <span
                                    className={`text-lg font-semibold ${stock.growth.startsWith('+') ? 'text-green-400' : 'text-red-400'
                                      }`}
                                  >
                                    {stock.growth}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-400">Quality:</span>
                                  <span className="text-sm font-semibold text-white">{stock.qualityScore}</span>
                                  <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${stock.qualityScore * 10}%` }}
                                      transition={{ duration: 1, delay: 0.5 }}
                                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                    </AnimatePresence>
                  </div>
                </ScrollRevealSection>

                <ScrollRevealSection delay={3} className="mt-8">
                  <AppleButton onClick={displaySlowAccumulationStocks}>
                    {showSlowAccumulation ? 'Hide' : 'View'} Slow Accumulation Stocks
                  </AppleButton>
                </ScrollRevealSection>
              </div>

              {/* Right Column - Slow Accumulation Stocks */}
              <div className="lg:col-span-1">
                <AnimatePresence>
                  {showSlowAccumulation && (
                    <motion.div
                      initial={{ opacity: 0, y: 50, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -50, scale: 0.9 }}
                      transition={{ duration: 0.6 }}
                      className="bg-white bg-opacity-5 backdrop-blur-xl rounded-3xl p-8 border border-white border-opacity-10 sticky top-8"
                    >
                      <h4 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                        Slow Accumulation
                      </h4>
                      <div className="space-y-4">
                        {slowAccumulationStocks.map((stock, index) => (
                          <motion.div
                            key={stock.name}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            className="bg-white bg-opacity-5 rounded-xl p-4 border border-white border-opacity-5"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h6 className="text-sm font-medium text-white">{stock.name}</h6>
                              <span className={`text-xs font-semibold ${stock.growth.startsWith('+') ? 'text-green-400' : 'text-red-400'
                                }`}>
                                {stock.growth}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">Quality:</span>
                                <span className="text-xs font-medium text-white">{stock.qualityScore}</span>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full ${stock.accumulation === 'High'
                                ? 'bg-green-400 bg-opacity-20 text-green-400'
                                : 'bg-yellow-400 bg-opacity-20 text-yellow-400'
                                }`}>
                                {stock.accumulation}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </Section>

        <Section id="features" bgColor="bg-gray-900" className="relative">
          <ScrollRevealSection className="text-center mb-8 sm:mb-12">
            <h2 className="text-blue-400 font-semibold mb-2 text-base sm:text-lg md:text-xl">Core Features</h2>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold">Insider-Level Visibility</h3>
            <p className="text-xs sm:text-sm text-gray-300 mt-2 sm:mt-3 max-w-md sm:max-w-xl mx-auto">
              Access tools that help you see what institutional investors are quietly accumulating.
            </p>
          </ScrollRevealSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                title: "Volume Analysis",
                description: "Detect institutional accumulation through proprietary volume analysis algorithms.",
                icon: (
                  <svg
                    className="w-6 sm:w-8 h-6 sm:h-8 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                ),
              },
              {
                title: "Quality Metrics",
                description: "Evaluate business quality through 28 proprietary financial metrics and ratios.",
                icon: (
                  <svg
                    className="w-6 sm:w-8 h-6 sm:h-8 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                ),
              },
              {
                title: "Pattern Recognition",
                description: "Identify chart patterns associated with institutional accumulation phases.",
                icon: (
                  <svg
                    className="w-6 sm:w-8 h-6 sm:h-8 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                    />
                  </svg>
                ),
              },
            ].map((feature, index) => (
              <ScrollRevealSection key={feature.title} delay={index * 0.1}>
                <motion.div
                  whileHover={{ y: -5 }}
                  className="bg-gray-800 rounded-2xl p-4 sm:p-6 h-full"
                >
                  <div className="bg-blue-900 bg-opacity-30 w-12 sm:w-16 h-12 sm:h-16 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-300">{feature.description}</p>
                </motion.div>
              </ScrollRevealSection>
            ))}
          </div>
        </Section>

        <Section id="performance" bgColor="bg-gradient-to-b from-gray-900 to-black" className="relative">
          <ScrollRevealSection className="text-center mb-8 sm:mb-12">
            <h2 className="text-blue-400 font-semibold mb-2 text-base sm:text-lg md:text-xl">Performance</h2>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold">Proven Track Record</h3>
            <p className="text-xs sm:text-sm text-gray-300 mt-2 sm:mt-3 max-w-md sm:max-w-xl mx-auto">
              EagleView's premium stock selections have consistently outperformed the market.
            </p>
          </ScrollRevealSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-center">
            <ScrollRevealSection>
              <div className="bg-gray-800 rounded-2xl p-4 sm:p-6">
                <h4 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Performance Metrics</h4>

                {[
                  { label: "Annual Return", value: "+24.7%", benchmark: "S&P: +9.8%" },
                  { label: "Win Rate", value: "81%", benchmark: "381/470 positions" },
                  { label: "Avg. Holding Period", value: "16.4 months", benchmark: "" },
                ].map((metric) => (
                  <div key={metric.label} className="mb-3 sm:mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs sm:text-sm text-gray-400">{metric.label}</span>
                      <div className="text-right">
                        <span className="text-xs sm:text-sm font-medium">{metric.value}</span>
                        {metric.benchmark && (
                          <span className="text-[10px] sm:text-xs text-gray-500 block">{metric.benchmark}</span>
                        )}
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${Math.random() * 30 + 65}%` }}
                        transition={{ duration: 1, delay: Math.random() * 0.5 }}
                        viewport={{ once: true }}
                      />
                    </div>
                  </div>
                ))}

                <AppleButton color="bg-blue-800" className="mt-2">View Full Performance</AppleButton>
              </div>
            </ScrollRevealSection>

            <ScrollRevealSection delay={0.2}>
              <div className="bg-gray-800 rounded-2xl p-4 sm:p-6">
                <div className="flex justify-between items-center mb-3 sm:mb-4">
                  <h4 className="text-base sm:text-lg font-bold">Equity Growth</h4>
                  <div className="flex space-x-2">
                    <span className="inline-flex items-center text-[10px] sm:text-xs">
                      <span className="w-2 h-2 rounded-full bg-blue-400 mr-1"></span>
                      EagleView
                    </span>
                    <span className="inline-flex items-center text-[10px] sm:text-xs">
                      <span className="w-2 h-2 rounded-full bg-gray-400 mr-1"></span>
                      S&P 500
                    </span>
                  </div>
                </div>

                <div className="h-48 sm:h-60 relative">
                  <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
                    <motion.path
                      d="M0,35 C10,32 20,34 30,30 C40,26 50,28 60,25 C70,22 80,24 90,20 L100,15"
                      fill="none"
                      stroke="#9CA3AF"
                      strokeWidth="1"
                      strokeDasharray="1,1"
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      transition={{ duration: 2 }}
                      viewport={{ once: true }}
                    />

                    <motion.path
                      d="M0,35 C10,30 20,28 30,20 C40,12 50,15 60,10 C70,5 80,8 90,2 L100,0"
                      fill="none"
                      stroke="url(#eagleview-gradient)"
                      strokeWidth="2"
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      transition={{ duration: 2, delay: 0.5 }}
                      viewport={{ once: true }}
                    />

                    <defs>
                      <linearGradient id="eagleview-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3482F6" />
                        <stop offset="100%" stopColor="#8B5CF6" />
                      </linearGradient>
                    </defs>
                  </svg>

                  <div className="flex justify-between text-[10px] sm:text-xs text-gray-500 mt-2">
                    <span>2020</span>
                    <span>2021</span>
                    <span>2022</span>
                    <span>2023</span>
                    <span>2024</span>
                    <span>2025</span>
                  </div>
                </div>
              </div>
            </ScrollRevealSection>
          </div>
        </Section>

        <Section id="cta" bgColor="bg-black" className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center">
            <ScrollRevealSection>
              <h2 className="text-blue-400 font-semibold mb-2 text-base sm:text-lg md:text-xl">Join EagleView</h2>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">Start Your Investment Journey</h3>
              <p className="text-xs sm:text-sm text-gray-300 mb-4 sm:mb-6">
                Get access to EagleView's premium analytics tools and join thousands of investors who have transformed their approach to the market.
              </p>

              <div className="space-y-3 sm:space-y-4">
                {[
                  "Institutional-grade analytics for individual investors",
                  "30+ proprietary financial metrics and indicators",
                  "Real-time market news and alerts",
                  "Comprehensive video training library",
                ].map((feature) => (
                  <div key={feature} className="flex items-center">
                    <svg
                      className="w-4 sm:w-5 h-4 sm:h-5 text-blue-400 mr-2 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-xs sm:text-sm text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
                <AppleButton color="bg-blue-600">Start Free Trial</AppleButton>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 sm:px-6 py-2 sm:py-2.5 border border-gray-600 rounded-full font-medium text-sm sm:text-base min-h-[44px]"
                >
                  View Plans
                </motion.button>
              </div>
            </ScrollRevealSection>

            <div className="w-full flex justify-center">
              <img
                src={iphone16b}
                alt="EagleView Premium Pricing"
                className="max-w-[500px] sm:max-w-[1000px]"
              />
            </div>
          </div>
        </Section>
      </motion.div>

    </div>
  );
}
