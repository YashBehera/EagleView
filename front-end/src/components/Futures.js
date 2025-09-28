import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, useAnimation, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Navbar from "./Navbar";
import { useInView } from "framer-motion";
import { TrendingUp, TrendingDown, Activity, Clock, DollarSign, BarChart3, Shield, Zap } from 'lucide-react';
import { useNavigate } from "react-router-dom";

// Reusable components
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

export default function Futures({ auth_token, onViewChange, currentView }) {
    const [selectedContract, setSelectedContract] = useState("ES");
    const [selectedTimeframe, setSelectedTimeframe] = useState("15min");
    const [loading, setLoading] = useState(false);
    const [currentSection, setCurrentSection] = useState("hero");
    const [showLiveData, setShowLiveData] = useState(false);
    const navigate = useNavigate();
    const [isNavigating, setIsNavigating] = useState(false);
    const [pageTransition, setPageTransition] = useState(false);
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { once: true, margin: "-100px" });

    const handleToggleView = () => {
        onViewChange('stocks');
    };

    // Futures contracts data
    const futuresContracts = [
        { symbol: "ES", name: "E-Mini S&P 500", price: "4,892.75", change: "+32.50", changePercent: "+0.67%", volume: "1.2M", openInterest: "2.3M" },
        { symbol: "NQ", name: "E-Mini Nasdaq", price: "17,234.25", change: "+125.75", changePercent: "+0.73%", volume: "892K", openInterest: "1.8M" },
        { symbol: "YM", name: "E-Mini Dow", price: "38,456.00", change: "+215.00", changePercent: "+0.56%", volume: "425K", openInterest: "987K" },
        { symbol: "RTY", name: "E-Mini Russell", price: "2,089.40", change: "-12.30", changePercent: "-0.59%", volume: "312K", openInterest: "654K" },
        { symbol: "GC", name: "Gold Futures", price: "2,045.60", change: "+18.90", changePercent: "+0.93%", volume: "285K", openInterest: "543K" },
        { symbol: "CL", name: "Crude Oil", price: "78.45", change: "+2.15", changePercent: "+2.82%", volume: "1.5M", openInterest: "2.1M" }
    ];

    const tradingStrategies = [
        { title: "Momentum Scalping", type: "High Frequency", color: "bg-red-500", profit: "+$12,450", trades: "234" },
        { title: "Mean Reversion", type: "Algorithm", color: "bg-blue-500", profit: "+$8,320", trades: "87" },
        { title: "Breakout Trading", type: "Pattern", color: "bg-green-500", profit: "+$15,670", trades: "142" },
        { title: "Options Hedging", type: "Risk Management", color: "bg-purple-500", profit: "+$6,890", trades: "56" },
        { title: "Spread Trading", type: "Arbitrage", color: "bg-yellow-500", profit: "+$9,210", trades: "198" }
    ];

    const marketMetrics = [
        { label: "VIX", value: "14.32", change: "-0.45", trend: "down" },
        { label: "Dollar Index", value: "103.45", change: "+0.23", trend: "up" },
        { label: "10Y Yield", value: "4.287%", change: "+0.032", trend: "up" },
        { label: "Bitcoin Futures", value: "43,250", change: "+850", trend: "up" }
    ];

    const timeframes = ["1min", "5min", "15min", "1hr", "4hr", "Daily"];

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

    return (
        <div className="w-screen min-h-screen bg-black text-white font-sans relative z-[0]">
            <Navbar token={auth_token} />

            {/* Toggle Switch */}
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


            {/* Hero Section */}
            <Section id="hero" className="min-h-[70vh] sm:min-h-[80vh] flex items-center justify-center pt-20 sm:pt-24 bg-black relative z-[10]" bgColor="bg-black">
                <motion.div className="text-center px-4 sm:px-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
                        <h2 className="text-blue-400 font-semibold mb-4 text-4xl sm:text-5xl md:text-6xl">EagleView Futures</h2>
                    </motion.div>

                    <motion.h1
                        className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 tracking-tight text-white"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                    >
                        Advanced Futures Trading Platform
                    </motion.h1>

                    <motion.p
                        className="text-sm sm:text-base md:text-lg text-gray-300 max-w-xl sm:max-w-2xl mx-auto mb-6 sm:mb-8"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                    >
                        Trade futures with institutional-grade analytics, real-time data feeds, and AI-powered insights for maximum profitability.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="flex flex-wrap gap-4 justify-center mb-8"
                    >
                        {marketMetrics.map((metric) => (
                            <div key={metric.label} className="bg-gray-900/50 backdrop-blur-sm rounded-xl px-6 py-4 border border-gray-800">
                                <div className="text-xs text-gray-400 mb-1">{metric.label}</div>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-semibold">{metric.value}</span>
                                    <span className={`text-sm ${metric.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                                        {metric.change}
                                    </span>
                                    {metric.trend === 'up' ?
                                        <TrendingUp className="w-3 h-3 text-green-400" /> :
                                        <TrendingDown className="w-3 h-3 text-red-400" />
                                    }
                                </div>
                            </div>
                        ))}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                        className="flex gap-4 justify-center"
                    >
                        <AppleButton color="bg-blue-900">Start Trading</AppleButton>
                        <AppleButton color="bg-gray-800">View Demo</AppleButton>
                    </motion.div>
                </motion.div>
            </Section>

            {/* Background Effects */}
            <div className="fixed left-0 top-1/4 w-48 sm:w-64 h-48 sm:h-64 bg-blue-500 rounded-full filter blur-[80px] sm:blur-[100px] opacity-20 animate-pulse hidden lg:block" />
            <div className="fixed right-0 bottom-1/4 w-64 sm:w-80 h-64 sm:h-80 bg-purple-500 rounded-full filter blur-[100px] sm:blur-[120px] opacity-15 hidden lg:block" />

            {/* Side Navigation */}
            <div className="fixed right-4 sm:right-6 top-1/2 transform -translate-y-1/2 z-[50] hidden md:block">
                <div className="flex flex-col space-y-3">
                    {["hero", "contracts", "strategies", "analytics", "risk", "features", "cta"].map((section) => (
                        <a
                            key={section}
                            href={`#${section}`}
                            className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-300 ${currentSection === section ? "bg-blue-400 scale-125" : "bg-gray-600"
                                }`}
                            aria-label={`Navigate to ${section} section`}
                        />
                    ))}
                </div>
            </div>

            {/* Contracts Section */}
            <Section id="contracts" bgColor="bg-black" className="relative">
                <div className="text-center mb-8 sm:mb-12">
                    <ScrollRevealSection>
                        <h2 className="text-blue-400 font-semibold mb-2 text-base sm:text-lg md:text-xl">Popular Contracts</h2>
                        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold">Real-Time Futures Markets</h3>
                        <p className="text-xs sm:text-sm text-gray-300 mt-2 sm:mt-3 max-w-md sm:max-w-xl mx-auto">
                            Trade the most liquid futures contracts with ultra-low latency execution and deep market depth.
                        </p>
                    </ScrollRevealSection>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {futuresContracts.map((contract, index) => (
                        <ScrollRevealSection key={contract.symbol} delay={index * 0.1}>
                            <motion.div
                                whileHover={{ y: -8, transition: { type: "spring", stiffness: 400 } }}
                                className={`bg-gray-900 rounded-2xl p-6 cursor-pointer transition-all duration-300 border ${selectedContract === contract.symbol ? 'border-blue-400' : 'border-gray-800'
                                    }`}
                                onClick={() => setSelectedContract(contract.symbol)}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="text-lg font-bold text-white">{contract.symbol}</h4>
                                        <p className="text-xs text-gray-400">{contract.name}</p>
                                    </div>
                                    <Activity className={`w-5 h-5 ${selectedContract === contract.symbol ? 'text-blue-400' : 'text-gray-600'
                                        }`} />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <span className="text-2xl font-bold">{contract.price}</span>
                                        <div className="text-right">
                                            <span className={`text-sm font-medium ${contract.change.startsWith('+') ? 'text-green-400' : 'text-red-400'
                                                }`}>
                                                {contract.change}
                                            </span>
                                            <span className={`text-xs block ${contract.change.startsWith('+') ? 'text-green-400' : 'text-red-400'
                                                }`}>
                                                {contract.changePercent}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-800">
                                        <div>
                                            <p className="text-xs text-gray-500">Volume</p>
                                            <p className="text-sm font-medium">{contract.volume}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Open Interest</p>
                                            <p className="text-sm font-medium">{contract.openInterest}</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </ScrollRevealSection>
                    ))}
                </div>
            </Section>

            {/* Trading Strategies Section */}
            <Section id="strategies" bgColor="bg-gray-50" className="relative">
                <div ref={containerRef} className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-24">
                    <div className="max-w-6xl mx-auto px-6">
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
                                    AI-Powered Strategies
                                </span>
                            </div>

                            <h1 className="text-5xl md:text-6xl font-light text-gray-900 mb-6 tracking-tight">
                                Algorithmic Trading
                                <span className="block font-normal text-gray-600">Excellence</span>
                            </h1>

                            <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
                                Deploy battle-tested trading algorithms with real-time performance tracking and risk management
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {tradingStrategies.map((strategy, index) => (
                                <motion.div
                                    key={strategy.title}
                                    initial={{ opacity: 0, y: 40 }}
                                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                                    transition={{ delay: index * 0.1, duration: 0.6 }}
                                    whileHover={{ y: -4 }}
                                    className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
                                >
                                    <div className={`${strategy.color} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
                                        <BarChart3 className="w-6 h-6 text-white" />
                                    </div>

                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{strategy.title}</h3>
                                    <p className="text-sm text-gray-500 mb-4">{strategy.type}</p>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Total Profit</span>
                                            <span className="text-sm font-bold text-green-600">{strategy.profit}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Trades Today</span>
                                            <span className="text-sm font-medium text-gray-900">{strategy.trades}</span>
                                        </div>
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full mt-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                                    >
                                        View Details
                                    </motion.button>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </Section>

            {/* Analytics Dashboard Section */}
            <Section id="analytics" bgColor="bg-gradient-to-br from-gray-900 via-black to-gray-900" className="relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <ScrollRevealSection className="text-center mb-16">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}>
                            <h2 className="text-blue-400 font-medium mb-4 text-lg tracking-wide uppercase">
                                Analytics Dashboard
                            </h2>
                            <h3 className="text-5xl sm:text-6xl font-light text-white mb-6 tracking-tight">
                                Professional Trading
                                <br />
                                <span className="font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                    Analytics
                                </span>
                            </h3>
                            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                                Advanced charting, market depth visualization, and proprietary indicators for informed decision-making.
                            </p>
                        </motion.div>
                    </ScrollRevealSection>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Timeframe Selector */}
                        <div className="lg:col-span-2">
                            <ScrollRevealSection delay={0.1}>
                                <div className="bg-white bg-opacity-5 backdrop-blur-xl rounded-2xl p-6 border border-white border-opacity-10 mb-6">
                                    <h4 className="text-lg font-semibold mb-4">Chart Timeframe</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {timeframes.map((tf) => (
                                            <motion.button
                                                key={tf}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setSelectedTimeframe(tf)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedTimeframe === tf
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-white bg-opacity-10 text-gray-300 hover:bg-opacity-20'
                                                    }`}
                                            >
                                                {tf}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            </ScrollRevealSection>

                            {/* Chart Placeholder */}
                            <ScrollRevealSection delay={0.2}>
                                <div className="bg-white bg-opacity-5 backdrop-blur-xl rounded-2xl p-8 border border-white border-opacity-10 h-96 flex items-center justify-center">
                                    <div className="text-center">
                                        <BarChart3 className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                                        <p className="text-gray-400 mb-4">Advanced Charting with TradingView Integration</p>
                                        <AppleButton onClick={() => setShowLiveData(!showLiveData)}>
                                            {showLiveData ? 'Hide' : 'Show'} Live Chart
                                        </AppleButton>
                                    </div>
                                </div>
                            </ScrollRevealSection>
                        </div>

                        {/* Market Stats Sidebar */}
                        <div className="lg:col-span-1">
                            <ScrollRevealSection delay={0.3}>
                                <div className="bg-white bg-opacity-5 backdrop-blur-xl rounded-2xl p-6 border border-white border-opacity-10 sticky top-8">
                                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-blue-400" />
                                        Market Statistics
                                    </h4>

                                    <div className="space-y-4">
                                        {[
                                            { label: "24h High", value: "4,925.50", change: "+2.1%" },
                                            { label: "24h Low", value: "4,845.25", change: "-0.8%" },
                                            { label: "24h Volume", value: "$12.4B", change: "+15%" },
                                            { label: "Open Interest", value: "$8.7B", change: "+5.2%" }
                                        ].map((stat) => (
                                            <div key={stat.label} className="bg-white bg-opacity-5 rounded-xl p-4">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-sm text-gray-400">{stat.label}</span>
                                                    <span className="text-xs text-green-400">{stat.change}</span>
                                                </div>
                                                <p className="text-lg font-semibold">{stat.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </ScrollRevealSection>
                        </div>
                    </div>
                </div>
            </Section>

            {/* Risk Management Section */}
            <Section id="risk" bgColor="bg-gray-900" className="relative">
                <ScrollRevealSection className="text-center mb-8 sm:mb-12">
                    <h2 className="text-blue-400 font-semibold mb-2 text-base sm:text-lg md:text-xl">Risk Management</h2>
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold">Protect Your Capital</h3>
                    <p className="text-xs sm:text-sm text-gray-300 mt-2 sm:mt-3 max-w-md sm:max-w-xl mx-auto">
                        Advanced risk management tools to safeguard your trading capital and maximize returns.
                    </p>
                </ScrollRevealSection>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        {
                            icon: <Shield className="w-8 h-8" />,
                            title: "Stop Loss Protection",
                            description: "Automatic stop-loss orders with trailing functionality",
                            value: "99.9%",
                            label: "Execution Rate"
                        },
                        {
                            icon: <DollarSign className="w-8 h-8" />,
                            title: "Position Sizing",
                            description: "AI-powered position sizing based on account risk",
                            value: "2%",
                            label: "Max Risk/Trade"
                        },
                        {
                            icon: <Clock className="w-8 h-8" />,
                            title: "Time-Based Exits",
                            description: "Automated exits based on time and volatility",
                            value: "24/7",
                            label: "Monitoring"
                        },
                        {
                            icon: <Zap className="w-8 h-8" />,
                            title: "Risk Analytics",
                            description: "Real-time portfolio risk assessment and alerts",
                            value: "<1ms",
                            label: "Alert Speed"
                        }
                    ].map((feature, index) => (
                        <ScrollRevealSection key={feature.title} delay={index * 0.1}>
                            <motion.div
                                whileHover={{ y: -5 }}
                                className="bg-gray-800 rounded-2xl p-6 text-center h-full"
                            >
                                <div className="bg-blue-900 bg-opacity-30 w-16 h-16 rounded-xl flex items-center justify-center mb-4 mx-auto text-blue-400">
                                    {feature.icon}
                                </div>
                                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                                <p className="text-sm text-gray-300 mb-4">{feature.description}</p>
                                <div className="pt-4 border-t border-gray-700">
                                    <p className="text-2xl font-bold text-blue-400">{feature.value}</p>
                                    <p className="text-xs text-gray-500">{feature.label}</p>
                                </div>
                            </motion.div>
                        </ScrollRevealSection>
                    ))}
                </div>
            </Section>

            {/* Features Grid Section */}
            <Section id="features" bgColor="bg-black" className="relative">
                <ScrollRevealSection className="text-center mb-12">
                    <h2 className="text-blue-400 font-semibold mb-2 text-base sm:text-lg md:text-xl">Platform Features</h2>
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold">Everything You Need to Trade</h3>
                    <p className="text-xs sm:text-sm text-gray-300 mt-2 sm:mt-3 max-w-md sm:max-w-xl mx-auto">
                        Professional tools and features designed for serious futures traders.
                    </p>
                </ScrollRevealSection>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        {
                            title: "Ultra-Low Latency",
                            description: "Sub-millisecond execution with direct market access and colocated servers.",
                            features: ["< 1ms execution", "99.99% uptime", "Direct market access"]
                        },
                        {
                            title: "Advanced Order Types",
                            description: "Complex order types including OCO, bracket orders, and algorithmic execution.",
                            features: ["20+ order types", "Algo execution", "Smart routing"]
                        },
                        {
                            title: "API Integration",
                            description: "RESTful and WebSocket APIs for automated trading and custom integrations.",
                            features: ["REST & WebSocket", "Python/JS SDKs", "Historical data"]
                        }
                    ].map((feature, index) => (
                        <ScrollRevealSection key={feature.title} delay={index * 0.1}>
                            <motion.div
                                whileHover={{ y: -5, scale: 1.02 }}
                                className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700 hover:border-blue-400 transition-all duration-300"
                            >
                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-sm text-gray-300 mb-4">{feature.description}</p>
                                <ul className="space-y-2">
                                    {feature.features.map((item) => (
                                        <li key={item} className="flex items-center text-sm">
                                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        </ScrollRevealSection>
                    ))}
                </div>
            </Section>

            {/* CTA Section */}
            <Section id="cta" bgColor="bg-gradient-to-b from-black to-gray-900" className="relative">
                <div className="max-w-4xl mx-auto text-center">
                    <ScrollRevealSection>
                        <h2 className="text-blue-400 font-semibold mb-4 text-base sm:text-lg md:text-xl">Ready to Trade?</h2>
                        <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6">Start Trading Futures Today</h3>
                        <p className="text-sm sm:text-base text-gray-300 mb-8 max-w-2xl mx-auto">
                            Join thousands of professional traders using EagleView's advanced futures trading platform.
                            Get started with a free demo account and experience the difference.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                            {[
                                { title: "Demo Account", value: "$100,000", subtitle: "Virtual funds to practice" },
                                { title: "Commission", value: "$0.50", subtitle: "Per contract traded" },
                                { title: "Margin", value: "$500", subtitle: "Minimum to start trading" }
                            ].map((item) => (
                                <div key={item.title} className="bg-gray-800 rounded-xl p-6">
                                    <h4 className="text-lg font-semibold mb-2">{item.title}</h4>
                                    <p className="text-3xl font-bold text-blue-400 mb-1">{item.value}</p>
                                    <p className="text-sm text-gray-400">{item.subtitle}</p>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <AppleButton color="bg-blue-600" className="text-base px-8 py-3">
                                Open Live Account
                            </AppleButton>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-8 py-3 border border-gray-600 rounded-full font-medium text-base hover:border-gray-400 transition-colors"
                            >
                                Try Demo Account
                            </motion.button>
                        </div>
                    </ScrollRevealSection>
                </div>
            </Section>
        </div>
    );
}