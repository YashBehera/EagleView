import React, { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { motion, useAnimation, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
    FaChartLine, FaArrowRight,
    FaChevronRight, FaBriefcase,
    FaShieldAlt, FaCoins
} from "react-icons/fa";
import { Line } from 'react-chartjs-2';
import {
    Check,
    X,
    CreditCard,
    Lock,
    AlertCircle,
    CheckCircle2,
    Gift
} from "lucide-react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const CONSTANTS = {
    PERIODS: ['1M', '3M', '6M', '1Y', '3Y', '5Y'],
    INVESTMENT_FREQUENCIES: ['Daily', 'Weekly', 'Monthly', 'One-time'],
    MIN_INVESTMENT: 10,
    MAX_INVESTMENT: 10000000,
    GOLD_CAGR: 0.1378,
    CURRENT_GOLD_PRICE: 6842,
    ANIMATION_DURATION: 0.3,
    CHART_UPDATE_DEBOUNCE: 300,
};

const MIN_INVESTMENT = 10;
const MAX_INVESTMENT = 10000000;
const GOLD_CAGR = 0.1378; // 13.78%
const PAYMENT_FREQUENCIES = [
    { id: 'one-time', label: 'One-time', description: 'Single payment' },
    { id: 'daily', label: 'Daily', description: 'Charged daily' },
    { id: 'weekly', label: 'Weekly', description: 'Charged weekly' },
    { id: 'monthly', label: 'Monthly', description: 'Charged monthly' },
    { id: 'quarterly', label: 'Quarterly', description: 'Charged every 3 months' },
    { id: 'yearly', label: 'Yearly', description: 'Charged yearly' }
];
const GOLD_PRICE_PER_GRAM = 10944.86;
const GST_PERCENTAGE = 0.03; // 3% GST


const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
};

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => {
            console.log("Razorpay script loaded");
            resolve(true);
        };
        script.onerror = () => {
            console.error("Failed to load Razorpay script");
            resolve(false);
        };
        document.body.appendChild(script);
    });
};

const StatusBadge = ({ type, children, className = "" }) => {
    const variants = {
        success: "bg-emerald-100 text-emerald-800 border-emerald-200",
        warning: "bg-amber-100 text-amber-800 border-amber-200",
        info: "bg-blue-100 text-blue-800 border-blue-200",
        premium: "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-200"
    };

    return (
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${variants[type]} ${className}`}>
            {children}
        </div>
    );
};

const FrontPage = ({ setShowGoldPage }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("gold");

    return (
        <div>
            <Navbar />
            <div className="relative py-1 lg:py-3 overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900">
                <div className="absolute inset-0 overflow-hidden">
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-yellow-900/20 via-amber-900/15 to-orange-900/10"
                        animate={{
                            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                        }}
                        transition={{
                            duration: 30,
                            repeat: Infinity,
                            ease: 'linear',
                        }}
                    />
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMxLjIgMCAyIC44IDIgMnYyMGMwIDEuMi0uOCAyLTIgMkgxOGMtMS4yIDAtMi0uOC0yLTJWMjBjMC0xLjIuOC0yIDItMmgxOHoiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAzKSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9nPjwvc3ZnPg==')] opacity-30" />
                    {[...Array(8)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute rounded-full bg-gradient-to-br from-yellow-500/15 to-amber-500/8 backdrop-blur-3xl"
                            style={{
                                width: `${Math.random() * 400 + 150}px`,
                                height: `${Math.random() * 400 + 150}px`,
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                filter: 'blur(40px)',
                            }}
                            animate={{
                                y: [0, -30, 0],
                                x: [0, Math.random() * 20 - 10, 0],
                                opacity: [0.1, 0.3, 0.1],
                                scale: [1, 1.2, 1],
                            }}
                            transition={{
                                duration: Math.random() * 10 + 15,
                                repeat: Infinity,
                                delay: Math.random() * 5,
                                ease: 'easeInOut',
                            }}
                        />
                    ))}
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={`sparkle-${i}`}
                            className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                            }}
                            animate={{
                                opacity: [0, 1, 0],
                                scale: [0, 1, 0],
                            }}
                            transition={{
                                duration: Math.random() * 3 + 2,
                                repeat: Infinity,
                                delay: Math.random() * 5,
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
                                    onClick={() => setActiveTab(tab.toLowerCase().replace(' ', ''))}
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

                    <div className="text-center max-w-5xl mx-auto">
                        <motion.div
                            className="mb-8"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <motion.h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-4 leading-none tracking-tight">
                                <motion.span
                                    className="block text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-300"
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.8, delay: 0.4 }}
                                >
                                    Digital
                                </motion.span>
                                <motion.span
                                    className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 relative"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.8, delay: 0.6, type: "spring", bounce: 0.3 }}
                                >
                                    Gold
                                    <motion.div
                                        className="absolute inset-0 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-400 blur-xl opacity-50"
                                        animate={{ opacity: [0.3, 0.7, 0.3] }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                    >
                                        Gold
                                    </motion.div>
                                </motion.span>
                                <motion.span
                                    className="block text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-300"
                                    initial={{ opacity: 0, x: 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.8, delay: 0.8 }}
                                >
                                    Investment
                                </motion.span>
                            </motion.h1>
                        </motion.div>

                        <motion.p
                            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed font-light"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 1, ease: [0.22, 1, 0.36, 1] }}
                        >
                            Secure your wealth with{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-400 font-semibold">
                                digital gold investments
                            </span>
                            . Real-time pricing, instant transactions, and portfolio diversification with the world's most trusted store of value.
                        </motion.p>

                        <motion.div
                            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <motion.button
                                className="group relative px-10 py-5 bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-lg font-bold rounded-2xl overflow-hidden shadow-2xl shadow-yellow-500/30"
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowGoldPage(true)}
                            >
                                <span className="relative z-10 flex items-center gap-3">
                                    Start Investing
                                    <motion.div
                                        animate={{ x: [0, 5, 0] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                    >
                                        <FaChevronRight className="text-lg" />
                                    </motion.div>
                                </span>
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-amber-700"
                                    initial={{ x: "-100%" }}
                                    whileHover={{ x: "0%" }}
                                    transition={{ duration: 0.4 }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-amber-600 blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />
                            </motion.button>

                            <motion.button
                                className="group px-10 py-5 bg-gray-800/60 backdrop-blur-sm text-white text-lg font-bold rounded-2xl border border-gray-600/50 hover:border-yellow-500/50 transition-all shadow-xl hover:shadow-2xl hover:shadow-yellow-500/10"
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <span className="flex items-center gap-3">
                                    View Live Rates
                                    <motion.div
                                        animate={{ rotate: [0, 360] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    >
                                        <FaCoins className="text-lg text-yellow-400" />
                                    </motion.div>
                                </span>
                            </motion.button>
                        </motion.div>

                        <motion.div
                            className="mt-16 relative"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8, delay: 1.4 }}
                        >
                            <div className="flex flex-wrap justify-center items-center gap-8">
                                {[
                                    {
                                        icon: "🏆",
                                        text: "Industry Leader",
                                        subtext: "Gold Investment Platform"
                                    },
                                    {
                                        icon: "🔐",
                                        text: "Regulatory Compliant",
                                        subtext: "Licensed & Insured"
                                    },
                                    {
                                        icon: "⚡",
                                        text: "Instant Settlement",
                                        subtext: "24/7 Trading"
                                    },
                                    {
                                        icon: "🌍",
                                        text: "Global Markets",
                                        subtext: "Multi-Currency Support"
                                    }
                                ].map((badge, index) => (
                                    <motion.div
                                        key={index}
                                        className="group flex items-center gap-3 px-6 py-3 bg-gray-800/40 backdrop-blur-sm rounded-full border border-gray-700/50 hover:border-yellow-500/50 transition-all duration-300"
                                        initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.8, delay: 2 + index * 0.15 }}
                                        whileHover={{ scale: 1.05, y: -2 }}
                                    >
                                        <motion.span
                                            className="text-2xl"
                                            animate={{
                                                y: [0, -3, 0],
                                                rotate: [0, 5, -5, 0]
                                            }}
                                            transition={{
                                                duration: 3,
                                                repeat: Infinity,
                                                delay: index * 0.5,
                                                ease: "easeInOut"
                                            }}
                                        >
                                            {badge.icon}
                                        </motion.span>
                                        <div className="text-left">
                                            <div className="text-white font-semibold text-sm group-hover:text-yellow-400 transition-colors">
                                                {badge.text}
                                            </div>
                                            <div className="text-gray-400 text-xs">
                                                {badge.subtext}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <motion.div
                                className="mt-12 flex justify-center"
                                initial={{ opacity: 0, scaleX: 0 }}
                                animate={{ opacity: 1, scaleX: 1 }}
                                transition={{ duration: 1, delay: 2.5 }}
                            >
                                <div className="relative w-64 h-px">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400 to-transparent"
                                        animate={{
                                            x: ['-100%', '100%']
                                        }}
                                        transition={{
                                            duration: 3,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                    />
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </div>

            <div className="relative py-24 bg-gradient-to-b from-black to-gray-900 overflow-hidden">
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gMTAwIDAgTCAwIDAgMCAxMDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20" />
                </div>

                <div className="container mx-auto px-6 relative z-10">
                    <motion.div
                        className="max-w-6xl mx-auto"
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="relative bg-gradient-to-br from-gray-900/80 via-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-3xl p-8 md:p-16 border border-gray-700/30 overflow-hidden mb-12 shadow-2xl">
                            <div className="absolute inset-0 overflow-hidden">
                                <motion.div
                                    className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-yellow-500/20 to-amber-500/10 rounded-full blur-3xl"
                                    animate={{
                                        scale: [1, 1.4, 1],
                                        rotate: [0, 180, 360],
                                    }}
                                    transition={{
                                        duration: 25,
                                        repeat: Infinity,
                                        ease: "linear",
                                    }}
                                />
                                <motion.div
                                    className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-yellow-600/15 to-amber-600/10 rounded-full blur-3xl"
                                    animate={{
                                        scale: [1.3, 1, 1.3],
                                        rotate: [360, 180, 0],
                                    }}
                                    transition={{
                                        duration: 30,
                                        repeat: Infinity,
                                        ease: "linear",
                                    }}
                                />
                                <motion.div
                                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-full blur-2xl"
                                    animate={{
                                        scale: [1, 1.2, 1],
                                        opacity: [0.3, 0.6, 0.3],
                                    }}
                                    transition={{
                                        duration: 8,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    }}
                                />
                            </div>

                            <div className="relative z-10 text-center">
                                <motion.div
                                    className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-3xl mb-10 shadow-2xl shadow-yellow-500/40 relative"
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ duration: 1, delay: 0.3, type: "spring", bounce: 0.4 }}
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                >
                                    <FaCoins className="text-5xl text-white" />
                                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-3xl blur-xl opacity-50" />
                                </motion.div>

                                <motion.h2
                                    className="text-5xl md:text-6xl lg:text-7xl font-black mb-8 leading-tight"
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: 0.5 }}
                                >
                                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 mb-2">
                                        Digital Gold Investment
                                    </span>
                                    <motion.span
                                        className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 relative"
                                        animate={{
                                            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                                        }}
                                        transition={{ duration: 5, repeat: Infinity }}
                                    >
                                        Coming Soon
                                        <div className="absolute inset-0 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-400 blur-sm opacity-50">
                                            Coming Soon
                                        </div>
                                    </motion.span>
                                </motion.h2>

                                <motion.p
                                    className="text-gray-300 text-xl md:text-2xl mb-12 max-w-4xl mx-auto leading-relaxed font-light"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: 0.7 }}
                                >
                                    Experience the future of gold investing with our{" "}
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-400 font-semibold">
                                        revolutionary digital platform
                                    </span>
                                    . Buy, sell, and store gold with institutional-grade security, real-time market data, and seamless portfolio integration.
                                </motion.p>

                                <motion.div
                                    className="flex flex-col sm:flex-row gap-6 justify-center mb-16"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: 0.9 }}
                                >
                                    <motion.button
                                        className="group relative px-10 py-5 bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-bold text-lg rounded-2xl shadow-2xl shadow-yellow-500/40 overflow-hidden"
                                        whileHover={{ scale: 1.05, y: -3 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => window.open("https://example.com/gold-investments", "_blank")}
                                    >
                                        <span className="relative z-10 flex items-center gap-3">
                                            Get Early Access
                                            <motion.div
                                                animate={{ x: [0, 5, 0] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                            >
                                                <FaChevronRight className="text-lg" />
                                            </motion.div>
                                        </span>
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-amber-700"
                                            initial={{ x: "-100%" }}
                                            whileHover={{ x: "0%" }}
                                            transition={{ duration: 0.4 }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-amber-600 blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />
                                    </motion.button>

                                    <motion.button
                                        className="group px-10 py-5 bg-gray-800/60 backdrop-blur-sm text-white font-bold text-lg rounded-2xl border border-gray-600/50 hover:border-yellow-500/50 transition-all shadow-xl hover:shadow-2xl hover:shadow-yellow-500/10"
                                        whileHover={{ scale: 1.05, y: -3 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <span className="flex items-center gap-3">
                                            Learn More
                                            <motion.div
                                                animate={{ rotate: [0, 360] }}
                                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                            >
                                                📚
                                            </motion.div>
                                        </span>
                                    </motion.button>
                                </motion.div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 mb-12">
                            {[
                                {
                                    icon: <FaShieldAlt className="text-4xl" />,
                                    title: "Bank-Grade Security",
                                    description: "Your gold investments are protected with institutional-level security protocols and multi-layer encryption",
                                    color: "from-green-500/20 to-emerald-500/10",
                                    accentColor: "text-emerald-400",
                                    borderColor: "border-emerald-500/30",
                                    glowColor: "shadow-emerald-500/20",
                                    stats: { label: "Security Level", value: "Military Grade" }
                                },
                                {
                                    icon: <FaChartLine className="text-4xl" />,
                                    title: "Real-Time Pricing",
                                    description: "Live market data and instant price updates for informed investment decisions with global market integration",
                                    color: "from-blue-500/20 to-cyan-500/10",
                                    accentColor: "text-blue-400",
                                    borderColor: "border-blue-500/30",
                                    glowColor: "shadow-blue-500/20",
                                    stats: { label: "Update Speed", value: "< 100ms" }
                                },
                                {
                                    icon: <FaBriefcase className="text-4xl" />,
                                    title: "Portfolio Integration",
                                    description: "Seamlessly manage gold alongside your stocks and mutual funds with comprehensive analytics and reporting",
                                    color: "from-purple-500/20 to-violet-500/10",
                                    accentColor: "text-purple-400",
                                    borderColor: "border-purple-500/30",
                                    glowColor: "shadow-purple-500/20",
                                    stats: { label: "Assets Supported", value: "All Types" }
                                }
                            ].map((feature, index) => (
                                <motion.div
                                    key={index}
                                    className={`group relative bg-gradient-to-br ${feature.color} backdrop-blur-sm rounded-3xl p-8 border ${feature.borderColor} hover:border-yellow-500/50 transition-all duration-500 overflow-hidden hover:${feature.glowColor} hover:shadow-2xl`}
                                    initial={{ opacity: 0, y: 40 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.8, delay: index * 0.2 }}
                                    whileHover={{ y: -12, scale: 1.03 }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800/30 to-gray-900/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <div className="absolute inset-0 overflow-hidden">
                                        {[...Array(6)].map((_, i) => (
                                            <motion.div
                                                key={i}
                                                className={`absolute w-1 h-1 ${feature.accentColor} rounded-full opacity-0 group-hover:opacity-60`}
                                                style={{
                                                    left: `${Math.random() * 100}%`,
                                                    top: `${Math.random() * 100}%`,
                                                }}
                                                animate={{
                                                    y: [0, -20, 0],
                                                    opacity: [0, 0.6, 0],
                                                    scale: [0, 1, 0],
                                                }}
                                                transition={{
                                                    duration: 3,
                                                    repeat: Infinity,
                                                    delay: i * 0.5,
                                                    ease: "easeInOut",
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl ${feature.color} opacity-50 rounded-bl-3xl`} />
                                    <div className="relative z-10">
                                        <motion.div
                                            className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl mb-6 ${feature.accentColor} border ${feature.borderColor} group-hover:border-yellow-500/50 transition-all duration-300`}
                                            whileHover={{
                                                scale: 1.15,
                                                rotate: [0, -5, 5, 0],
                                                boxShadow: `0 20px 40px ${feature.glowColor}`
                                            }}
                                            transition={{ type: "spring", bounce: 0.6 }}
                                        >
                                            {feature.icon}
                                            <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300`} />
                                        </motion.div>
                                        <motion.h3
                                            className="text-2xl font-bold text-white mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-yellow-400 group-hover:to-amber-400 transition-all duration-300"
                                            whileHover={{ x: 5 }}
                                        >
                                            {feature.title}
                                        </motion.h3>
                                        <p className="text-gray-400 leading-relaxed text-base group-hover:text-gray-300 transition-colors duration-300 mb-6">
                                            {feature.description}
                                        </p>
                                        <motion.div
                                            className={`inline-flex items-center gap-3 px-4 py-2 bg-gray-800/60 backdrop-blur-sm rounded-full border ${feature.borderColor} group-hover:border-yellow-500/50 transition-all duration-300`}
                                            initial={{ opacity: 0, y: 10 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                                            whileHover={{ scale: 1.05 }}
                                        >
                                            <div className={`w-2 h-2 ${feature.accentColor.replace('text-', 'bg-')} rounded-full animate-pulse`} />
                                            <div className="text-sm">
                                                <span className="text-gray-400">{feature.stats.label}: </span>
                                                <span className={`font-semibold ${feature.accentColor}`}>{feature.stats.value}</span>
                                            </div>
                                        </motion.div>
                                        <motion.div
                                            className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300"
                                            initial={{ x: -10 }}
                                            whileHover={{ x: 0 }}
                                        >
                                            <FaArrowRight className={`text-xl ${feature.accentColor}`} />
                                        </motion.div>
                                    </div>
                                    <motion.div
                                        className="absolute inset-0 rounded-3xl"
                                        style={{
                                            background: `conic-gradient(from 0deg, transparent, ${feature.borderColor.split('/')[0].replace('border-', '')}, transparent)`,
                                            padding: '2px',
                                            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                                            WebkitMaskComposite: 'exclude',
                                            opacity: 0,
                                        }}
                                        whileHover={{ opacity: 0.3 }}
                                        animate={{
                                            rotate: [0, 360],
                                        }}
                                        transition={{
                                            rotate: {
                                                duration: 10,
                                                repeat: Infinity,
                                                ease: "linear",
                                            },
                                            opacity: {
                                                duration: 0.3,
                                            },
                                        }}
                                    />
                                </motion.div>
                            ))}
                        </div>

                        <motion.div
                            className="relative bg-gradient-to-r from-yellow-500/15 via-amber-500/15 to-orange-500/15 border border-yellow-500/30 rounded-3xl p-8 text-center overflow-hidden"
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 1.2 }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-amber-500/5 blur-xl" />
                            <div className="relative z-10">
                                <div className="flex items-center justify-center gap-4 text-yellow-400 mb-4">
                                    <motion.div
                                        className="text-3xl"
                                        animate={{
                                            scale: [1, 1.3, 1],
                                            rotate: [0, 10, -10, 0]
                                        }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        🔔
                                    </motion.div>
                                    <span className="text-2xl font-bold">Be the first to know!</span>
                                </div>
                                <p className="text-gray-300 text-lg mb-6 max-w-2xl mx-auto">
                                    Join our exclusive waitlist to get early access, special launch offers, and be among the first to experience the future of digital gold investing
                                </p>
                                <motion.div
                                    className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto"
                                    whileHover={{ scale: 1.02 }}
                                >
                                    <input
                                        type="email"
                                        placeholder="Enter your email"
                                        className="flex-1 px-6 py-4 bg-gray-800/60 backdrop-blur-sm border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20"
                                    />
                                    <motion.button
                                        className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-semibold rounded-xl shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 transition-all"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Join Waitlist
                                    </motion.button>
                                </motion.div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

const GoldPage = ({ setShowGoldPage }) => {
    // State management with localStorage persistence for user preferences
    const [selectedAmount, setSelectedAmount] = useState(1000);
    const [selectedPeriod, setSelectedPeriod] = useState('5Y');
    const [investmentFrequency, setInvestmentFrequency] = useState('Monthly');
    const [investmentPeriod, setInvestmentPeriod] = useState(4);
    const [expandedFaq, setExpandedFaq] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [paymentFrequency, setPaymentFrequency] = useState('one-time');
    const [coupon, setCoupon] = useState("");
    const [discountApplied, setDiscountApplied] = useState(null);
    const [paymentError, setPaymentError] = useState(null);
    const [isPaymentLoading, setIsPaymentLoading] = useState(false);
    const [showBuyModal, setShowBuyModal] = useState(false);

const handleGoldPayment = async (amount, paymentType, frequency) => {
    try {
        // Load Razorpay script
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
            alert("Failed to load payment system. Please try again.");
            return;
        }

        const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";
        const response = await fetch(`${BASE_URL}/razorpay/order`, {
            method: "POST",
            body: JSON.stringify({
                amount: amount * 100, // Convert to paise - using the current amount parameter
                currency: "INR",
                receipt: `gold_${Date.now()}`,
                notes: {
                    type: "gold",
                    frequency: paymentType === 'SIP' ? frequency.toLowerCase() : 'one-time',
                    grams: (amount / GOLD_PRICE_PER_GRAM).toFixed(4), // Calculate grams based on current amount
                    user_id: "user_123"
                },
            }),
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const order = await response.json();

        const options = {
            key: order.key_id || "rzp_test_ghTeekIY3ZvfG3",
            amount: order.amount, // This will reflect the current amount
            currency: order.currency,
            name: "Digital Gold Purchase",
            description: `Buy ${(amount / GOLD_PRICE_PER_GRAM).toFixed(4)}g Gold`, // Updated description with current amount
            image: "https://example.com/your_logo",
            order_id: order.id,
            handler: async function (response) {
                try {
                    const validateRes = await fetch(`${BASE_URL}/razorpay/order/validate`, {
                        method: "POST",
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        }),
                        headers: {
                            "Content-Type": "application/json",
                        },
                    });

                    if (!validateRes.ok) {
                        throw new Error(`Validation failed! status: ${validateRes.status}`);
                    }

                    const jsonRes = await validateRes.json();
                    if (jsonRes.status === "success") {
                        alert("Payment successful! Your gold has been purchased.");
                        setShowBuyModal(false);
                    } else {
                        alert("Payment validation failed. Please contact support.");
                    }
                } catch (validateError) {
                    console.error("Validate error:", validateError.message);
                    alert("Payment validation failed. Please contact support.");
                }
            },
            prefill: {
                name: "John Doe",
                email: "john@example.com",
                contact: "9000000000",
            },
            notes: {
                address: "Digital Gold Office",
            },
            theme: {
                color: "#3B82F6",
            },
        };

        const rzp1 = new window.Razorpay(options);
        rzp1.on("payment.failed", function (response) {
            alert(`Payment failed: ${response.error.description}. Please try again.`);
            console.error("Payment failed:", response.error);
        });
        rzp1.open();
    } catch (error) {
        console.error("Payment error:", error.message);
        alert(`Failed to initiate payment: ${error.message}. Please try again.`);
    }
};

    // Add this coupon application function
    const applyGoldCoupon = () => {
        if (!coupon) return;

        let newAmount = selectedAmount;
        let discountMessage = "";

        if (coupon.toUpperCase() === "GOLD20") {
            newAmount = Math.round(selectedAmount * 0.8);
            discountMessage = `20% discount applied! You saved ₹${selectedAmount - newAmount}`;
        } else if (coupon.toUpperCase() === "GOLD10") {
            newAmount = Math.round(selectedAmount * 0.9);
            discountMessage = `10% discount applied! You saved ₹${selectedAmount - newAmount}`;
        } else {
            setDiscountApplied({ error: "Invalid coupon code" });
            return;
        }

        setSelectedAmount(newAmount);
        setDiscountApplied({ message: discountMessage });
    };

    // Custom hooks
    const useScrollPosition = () => {
        const [scrollY, setScrollY] = useState(0);

        useEffect(() => {
            const handleScroll = debounce(() => setScrollY(window.scrollY), 16);
            window.addEventListener('scroll', handleScroll, { passive: true });
            return () => window.removeEventListener('scroll', handleScroll);
        }, []);

        return scrollY;
    };
    const scrollY = useScrollPosition();
    const isScrolled = scrollY > 50;

    const InvestmentCalculator = ({
        selectedAmount,
        setSelectedAmount,
        investmentFrequency,
        setInvestmentFrequency,
        investmentPeriod,
        setInvestmentPeriod
    }) => {
        const [errors, setErrors] = useState({});
        const [isCalculating, setIsCalculating] = useState(false);
        const [showAdvanced, setShowAdvanced] = useState(false);

        // Modal states
        const [buyAmount, setBuyAmount] = useState(selectedAmount || 201);
        const [buyInGrams, setBuyInGrams] = useState(false);
        const [sipFrequency, setSipFrequency] = useState('Daily');
        const [investmentType, setInvestmentType] = useState('SIP');

        // Constants
        const goldPricePerGram = 10944.86;
        const gramsAmount = (buyAmount / goldPricePerGram).toFixed(4);

        const handleAmountChange = useCallback((value) => {
            const error = validateAmount(value);
            setErrors(prev => ({ ...prev, amount: error }));
            if (!error) {
                setSelectedAmount(Number(value));
            }
        }, [setSelectedAmount]);

        const calculateReturns = useMemo(() => {
            if (errors.amount) return { invested: 0, currentValue: 0, returns: 0, returnPercent: 0 };

            setIsCalculating(true);
            setTimeout(() => setIsCalculating(false), 500);

            const monthlyAmount = investmentFrequency === 'One-time' ? 0 : selectedAmount;
            const oneTimeAmount = investmentFrequency === 'One-time' ? selectedAmount : 0;
            const totalMonths = investmentPeriod * 12;

            const invested = oneTimeAmount + (monthlyAmount * totalMonths);
            const currentValue = invested * Math.pow(1 + GOLD_CAGR, investmentPeriod);

            return {
                invested,
                currentValue,
                returns: currentValue - invested,
                returnPercent: ((currentValue - invested) / invested * 100).toFixed(2)
            };
        }, [selectedAmount, investmentFrequency, investmentPeriod, errors.amount]);

        return (
            <>
                <motion.div
                    className="bg-gray-900/50 backdrop-blur-xl rounded-3xl p-8 border border-gray-800 shadow-2xl h-full"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 rounded-2xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold">Investment Calculator</h3>
                        </div>
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
                        >
                            {showAdvanced ? 'Simple' : 'Advanced'}
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Amount Input */}
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-3">
                                Investment Amount
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-yellow-400 font-semibold">
                                    ₹
                                </div>
                                <input
                                    type="number"
                                    min={MIN_INVESTMENT}
                                    max={MAX_INVESTMENT}
                                    className={`w-full pl-10 pr-4 py-4 bg-gray-800/50 border-2 rounded-2xl text-white text-xl font-semibold focus:outline-none transition-all ${errors.amount
                                        ? 'border-red-500 focus:border-red-400'
                                        : 'border-gray-700 focus:border-yellow-500'
                                        }`}
                                    placeholder="10,000"
                                    onChange={(e) => handleAmountChange(e.target.value)}
                                    defaultValue={selectedAmount}
                                    aria-label="Investment amount in rupees"
                                />
                                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex gap-2">
                                    {[10000, 25000, 50000].map((amount) => (
                                        <button
                                            key={amount}
                                            onClick={() => handleAmountChange(amount)}
                                            className="px-3 py-1 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg text-xs font-medium text-gray-300 hover:text-white transition-all"
                                        >
                                            {amount / 1000}K
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {errors.amount && (
                                <motion.p
                                    className="flex items-center gap-2 text-red-400 text-sm mt-2"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {errors.amount}
                                </motion.p>
                            )}
                        </div>

                        {/* Frequency Selection */}
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-3">
                                Investment Type
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {['One-time', 'Monthly'].map((freq) => (
                                    <motion.button
                                        key={freq}
                                        onClick={() => setInvestmentFrequency(freq)}
                                        className={`relative py-4 px-6 rounded-2xl font-semibold transition-all ${investmentFrequency === freq
                                            ? 'bg-yellow-500 text-gray-900 shadow-lg shadow-yellow-500/25'
                                            : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border-2 border-gray-700'
                                            }`}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div className="flex items-center justify-center gap-3">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                {freq === 'One-time' ? (
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                ) : (
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                )}
                                            </svg>
                                            <span>{freq}</span>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* Period Selection */}
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-3">
                                Investment Period
                            </label>
                            <div className="space-y-3">
                                <div className="relative px-2">
                                    <input
                                        type="range"
                                        min="1"
                                        max="30"
                                        value={investmentPeriod}
                                        onChange={(e) => setInvestmentPeriod(Number(e.target.value))}
                                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                                        style={{
                                            background: `linear-gradient(to right, #eab308 0%, #eab308 ${(investmentPeriod / 30) * 100}%, #374151 ${(investmentPeriod / 30) * 100}%, #374151 100%)`
                                        }}
                                    />
                                    <div className="absolute left-0 -bottom-6 text-xs text-gray-500">1Y</div>
                                    <div className="absolute right-0 -bottom-6 text-xs text-gray-500">30Y</div>
                                </div>
                                <div className="flex items-center justify-center mt-8">
                                    <div className="bg-gray-800/50 rounded-2xl px-8 py-4 border-2 border-gray-700">
                                        <span className="text-3xl font-bold text-yellow-400">{investmentPeriod}</span>
                                        <span className="text-lg text-gray-400 ml-2">years</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Results */}
                        <AnimatePresence mode="wait">
                            {isCalculating ? (
                                <motion.div
                                    className="flex items-center justify-center py-12"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <LoadingSpinner />
                                    <span className="ml-3 text-gray-300">Calculating returns...</span>
                                </motion.div>
                            ) : (
                                <motion.div
                                    className="space-y-4"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700">
                                            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Total Investment</p>
                                            <p className="text-xl font-bold text-gray-200">
                                                {formatCurrency(calculateReturns.invested)}
                                            </p>
                                        </div>
                                        <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700">
                                            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Expected Returns</p>
                                            <p className="text-xl font-bold text-green-400">
                                                +{formatCurrency(calculateReturns.returns)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-3xl p-6 border border-green-500/20">
                                        <div className="text-center space-y-2">
                                            <p className="text-sm uppercase tracking-wider text-gray-400">Total Portfolio Value</p>
                                            <p className="text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                                                {formatCurrency(calculateReturns.currentValue)}
                                            </p>
                                            <div className="flex items-center justify-center gap-2 pt-2">
                                                <span className="px-3 py-1 bg-green-500/20 rounded-full text-green-400 text-sm font-medium">
                                                    +{calculateReturns.returnPercent}% returns
                                                </span>
                                                <span className="text-gray-500 text-sm">
                                                    in {investmentPeriod} years
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* CTA Button */}
                        <motion.button
                            className={`w-full py-4 font-bold rounded-2xl text-lg transition-all duration-300 ${errors.amount
                                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-yellow-500 to-amber-600 text-gray-900 hover:shadow-xl hover:shadow-yellow-500/25'
                                }`}
                            whileHover={errors.amount ? {} : { scale: 1.02 }}
                            whileTap={errors.amount ? {} : { scale: 0.98 }}
                            disabled={!!errors.amount}
                            onClick={() => !errors.amount && setShowBuyModal(true)}
                        >
                            <span className="flex items-center justify-center gap-3">
                                {errors.amount ? (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Fix errors to continue
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        Start Investing Now
                                    </>
                                )}
                            </span>
                        </motion.button>

                        {/* Additional Info */}
                        <div className="pt-4 border-t border-gray-800">
                            <div className="flex items-start gap-3 text-xs text-gray-500">
                                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="leading-relaxed">
                                    Returns calculated at {(GOLD_CAGR * 100).toFixed(2)}% CAGR based on historical gold performance.
                                    Actual returns may vary.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Buy Digital Gold Modal */}
                <AnimatePresence>
                {showBuyModal && (
    <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
    >
        {/* Backdrop */}
        <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowBuyModal(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        />

        {/* Modal Content */}
        <motion.div
            className="relative bg-white rounded-2xl p-5 max-w-lg w-full shadow-xl border border-gray-200"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.4 }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900">Buy Digital Gold</h2>
                <button
                    onClick={() => setShowBuyModal(false)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Close modal"
                >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Buy Amount Section */}
            <div className="flex items-end gap-2 mb-2">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-0.5">Rupees</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-gray-500">₹</span>
                        <input
                            type="number"
                            value={buyAmount}
                            onChange={(e) => setBuyAmount(Number(e.target.value))}
                            className="w-full pl-7 pr-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all text-sm"
                            aria-label="Investment amount in rupees"
                            min="10"
                        />
                    </div>
                </div>
                <svg className="w-4 h-4 text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-0.5">Grams</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={`${(buyAmount / goldPricePerGram).toFixed(4)} gm`}
                            readOnly
                            className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-500 text-center cursor-not-allowed text-sm"
                            aria-label="Amount in grams"
                        />
                    </div>
                </div>
            </div>

            {/* Investment Type Selection */}
            <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-0.5">Investment Type</label>
                <div className="grid grid-cols-4 gap-1 bg-gray-100 p-0.5 rounded-lg">
                    {['Daily', 'Weekly', 'Monthly', 'One-time'].map((type) => (
                        <button
                            key={type}
                            onClick={() => {
                                if (type === 'One-time') {
                                    setInvestmentType('One-time');
                                } else {
                                    setSipFrequency(type);
                                    setInvestmentType('SIP');
                                }
                            }}
                            className={`relative py-1.5 px-2 rounded-md font-medium text-sm transition-all ${(investmentType === 'SIP' && sipFrequency === type) || (investmentType === 'One-time' && type === 'One-time')
                                ? 'bg-blue-500 text-white'
                                : 'text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {type}
                            {type === 'Monthly' && (
                                <span className="absolute -top-3 -right-1.5 px-1.5 py-0.5 bg-green-500 text-white text-[10px] font-semibold rounded-full">
                                    POPULAR
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-gray-50 rounded-lg p-2 mb-2 border border-gray-200">
                <div className="flex items-center gap-1.5">
                    <div className="flex -space-x-1">
                        <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-xs border border-blue-200">
                            🧑
                        </div>
                        <div className="w-5 h-5 bg-pink-100 rounded-full flex items-center justify-center text-xs border border-pink-200">
                            👩
                        </div>
                    </div>
                    <div className="text-gray-700 text-xs">
                        <span className="font-semibold">₹100 Daily SIP</span> = <span className="font-bold text-gray-900">₹38,000 now!</span>
                    </div>
                </div>
            </div>

            {/* Coupon Code and UPI Mandate */}
            <div className="flex justify-between items-center mb-2 text-xs text-gray-600">
                <button className="hover:text-gray-900 underline decoration-dashed underline-offset-2">
                    Have a coupon code?
                </button>
                <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>UPI mandate info</span>
                </div>
            </div>

            {/* Price and Amount Section */}
            <div className="border-t border-gray-200 pt-2 mb-2">
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded-md text-xs font-medium border border-red-200">
                            Live
                        </span>
                        <span className="text-gray-700 font-semibold">₹{goldPricePerGram.toLocaleString('en-IN')}/gm</span>
                        <span className="text-gray-500 text-xs">+ 3% GST</span>
                    </div>
                    <span className="text-gray-600 text-xs">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center justify-between mt-1 text-sm">
                    <p className="text-gray-900 font-semibold">
                        ₹{buyAmount.toLocaleString('en-IN')} {investmentType === 'SIP' ? sipFrequency.toLowerCase() : ''}
                    </p>
                    <button className="text-blue-500 hover:underline text-xs">View breakdown</button>
                </div>
            </div>

            {/* Action Button */}
            <button 
                onClick={() => handleGoldPayment(buyAmount, investmentType, sipFrequency)}
                className="w-full py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all text-sm"
            >
                {investmentType === 'SIP' ? 'Setup SIP' : 'Buy Now'}
            </button>

            {/* Secure Transaction */}
            <div className="mt-1.5 flex items-center justify-center gap-1 text-xs text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Secure transaction</span>
            </div>
        </motion.div>
    </motion.div>
)}
                </AnimatePresence>
            </>
        );
    };
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const animations = {
        fadeInUp: {
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
        },
        staggerContainer: {
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
        },
        slideIn: {
            hidden: { opacity: 0, x: -30 },
            visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeOut' } }
        },
        scaleIn: {
            hidden: { opacity: 0, scale: 0.9 },
            visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } }
        }
    };

    const validateAmount = (amount) => {
        const numAmount = Number(amount);
        if (isNaN(numAmount)) return 'Please enter a valid number';
        if (numAmount < MIN_INVESTMENT) return `Minimum investment is ₹${MIN_INVESTMENT}`;
        if (numAmount > MAX_INVESTMENT) return `Maximum investment is ₹${MAX_INVESTMENT.toLocaleString()}`;
        return null;
    };

    const LoadingSpinner = ({ size = 'md' }) => {
        const sizes = {
            sm: 'w-4 h-4',
            md: 'w-6 h-6',
            lg: 'w-8 h-8'
        };

        return (
            <div className={`${sizes[size]} relative`}>
                <div className={`${sizes[size]} rounded-full border-2 border-gray-700`}></div>
                <div className={`${sizes[size]} rounded-full border-2 border-yellow-400 border-t-transparent absolute top-0 left-0 animate-spin`}></div>
            </div>
        );
    };

    // Error Component
    const ErrorMessage = ({ message, onRetry, className = '' }) => (
        <div className={`bg-red-500/10 border border-red-500/20 rounded-2xl p-6 ${className}`}>
            <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                    <p className="text-red-400 font-medium">{message}</p>
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className="mt-2 text-sm text-red-400 hover:text-red-300 underline transition-colors"
                        >
                            Try again
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    const PromoBanner = () => (
        <motion.div
            className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 py-3 px-4 text-center relative overflow-hidden"
            variants={animations.slideIn}
            initial="hidden"
            animate="visible"
        >
            <div className="flex items-center justify-center gap-2 text-white max-w-6xl mx-auto flex-wrap">
                <motion.span
                    className="text-yellow-300 text-xl"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    aria-hidden="true"
                >
                    ✨
                </motion.span>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                    <h3 className="text-base md:text-lg font-bold">Limited Time Offer!</h3>
                    <span className="text-sm">
                        Get <span className="font-bold text-yellow-300 bg-yellow-300/20 px-2 py-1 rounded-full">₹120 FREE GOLD</span> on first purchase
                    </span>
                </div>
                <motion.button
                    className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-all duration-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-white/50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    aria-label="Claim promotional offer"
                >
                    Claim Now →
                </motion.button>
            </div>
        </motion.div>
    );

    const debounce = (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    };


    const PerformanceChart = ({ selectedPeriod, setSelectedPeriod }) => {
        const [chartError, setChartError] = useState(null);
        const [isLoading, setIsLoading] = useState(true);

        useEffect(() => {
            setTimeout(() => setIsLoading(false), 1000);
        }, []);

        const chartData = useMemo(() => {
            try {
                const periodDays = {
                    '1M': 30, '3M': 90, '6M': 180, '1Y': 365, '3Y': 1095, '5Y': 1825
                };

                const days = periodDays[selectedPeriod] || 365;
                const labels = [];
                const data = [];
                const basePrice = 5000;
                let currentValue = basePrice;

                for (let i = 0; i < days; i += Math.floor(days / 50)) {
                    const date = new Date();
                    date.setDate(date.getDate() - (days - i));
                    labels.push(date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));

                    const trend = Math.sin(i / 100) * 0.08;
                    const volatility = (Math.random() - 0.5) * 0.015;
                    currentValue *= (1 + trend + volatility);
                    currentValue = Math.max(basePrice * 0.85, Math.min(basePrice * 1.75, currentValue));
                    data.push(Math.round(currentValue));
                }

                return {
                    labels,
                    datasets: [{
                        label: 'Gold Price',
                        data,
                        borderColor: 'rgb(34, 197, 94)',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 6,
                        pointHoverBackgroundColor: 'rgb(34, 197, 94)',
                        pointHoverBorderColor: 'white',
                        pointHoverBorderWidth: 2,
                    }]
                };
            } catch (error) {
                setChartError('Failed to generate chart data');
                return { labels: [], datasets: [] };
            }
        }, [selectedPeriod]);

        const chartOptions = useMemo(() => ({
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            animations: {
                tension: {
                    duration: 1000,
                    easing: 'easeInOutQuart',
                    from: 0.5,
                    to: 0.4,
                    loop: false
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    titleColor: '#fbbf24',
                    bodyColor: '#e5e7eb',
                    borderColor: 'rgba(251, 191, 36, 0.2)',
                    borderWidth: 1,
                    cornerRadius: 12,
                    displayColors: false,
                    titleFont: {
                        size: 14,
                        weight: '600',
                        family: "'Inter', sans-serif"
                    },
                    bodyFont: {
                        size: 13,
                        family: "'Inter', sans-serif"
                    },
                    padding: 12,
                    callbacks: {
                        title: (context) => context[0].label,
                        label: (context) => `₹${context.parsed.y.toLocaleString('en-IN')}/gm`,
                        afterLabel: (context) => {
                            if (context.dataIndex > 0) {
                                const currentValue = context.parsed.y;
                                const previousValue = context.dataset.data[context.dataIndex - 1];
                                const change = ((currentValue - previousValue) / previousValue * 100).toFixed(2);
                                return `${change > 0 ? '↑' : '↓'} ${Math.abs(change)}%`;
                            }
                            return '';
                        }
                    }
                },
            },
            scales: {
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        color: '#6b7280',
                        font: {
                            size: 12,
                            family: "'Inter', sans-serif"
                        },
                        maxTicksLimit: 6,
                        padding: 8
                    },
                    border: { display: false },
                },
                y: {
                    position: 'left',
                    grid: {
                        color: 'rgba(55, 65, 81, 0.3)',
                        drawBorder: false,
                        lineWidth: 1
                    },
                    ticks: {
                        color: '#6b7280',
                        font: {
                            size: 12,
                            family: "'Inter', sans-serif"
                        },
                        callback: (value) => '₹' + value.toLocaleString('en-IN'),
                        maxTicksLimit: 6,
                        padding: 12
                    },
                    border: { display: false },
                },
            },
        }), []);

        if (chartError) {
            return (
                <ErrorMessage
                    message={chartError}
                    onRetry={() => setChartError(null)}
                    className="h-80 flex items-center justify-center"
                />
            );
        }
        return (
            <motion.div
                className="bg-gray-900/50 backdrop-blur-xl rounded-3xl p-8 border border-gray-800 shadow-2xl h-full"
            >
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <h2 className="text-2xl font-bold">Gold Performance</h2>
                            <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-xs font-medium">
                                Live
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-6">
                            <div className="relative">
                                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Current Price</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-2xl font-bold text-white">₹10,093.88</p>
                                    <span className="text-sm text-gray-400">/gm</span>
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                    <span className="text-green-400 text-sm">↑ 2.34%</span>
                                    <span className="text-gray-500 text-xs">today</span>
                                </div>
                            </div>

                            <div className="h-12 w-px bg-gray-800" />

                            <div>
                                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">5Y Returns</p>
                                <p className="text-2xl font-bold text-green-400">+90.70%</p>
                            </div>

                            <div className="h-12 w-px bg-gray-800" />

                            <div>
                                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">CAGR</p>
                                <p className="text-2xl font-bold text-green-400">+13.78%</p>
                            </div>
                        </div>
                    </div>

                    {/* Time Range Stats */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-xl">
                        <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-gray-400">Last updated: 2 mins ago</span>
                    </div>
                </div>

                {/* Period Selector */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex gap-1 p-1 bg-gray-800/50 rounded-xl">
                        {CONSTANTS.PERIODS.map((period) => (
                            <button
                                key={period}
                                onClick={() => setSelectedPeriod(period)}
                                className={`relative px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${selectedPeriod === period
                                    ? 'bg-yellow-500 text-gray-900 shadow-lg'
                                    : 'text-gray-400 hover:text-gray-300'
                                    }`}
                            >
                                {period}
                                {selectedPeriod === period && (
                                    <motion.div
                                        className="absolute inset-0 bg-yellow-500 rounded-lg -z-10"
                                        layoutId="period-selector"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Chart Type Selector */}
                    <div className="flex gap-2">
                        <button className="p-2 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                            </svg>
                        </button>
                        <button className="p-2 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Chart Container */}
                <div className="relative h-80 lg:h-96">
                    {isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-800/20 rounded-xl">
                            <div className="flex flex-col items-center gap-3">
                                <LoadingSpinner size="lg" />
                                <span className="text-gray-400 text-sm">Loading chart data...</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/20 to-transparent rounded-xl pointer-events-none" />
                            <Suspense fallback={<div className="flex items-center justify-center h-full"><LoadingSpinner size="lg" /></div>}>
                                <Line data={chartData} options={chartOptions} />
                            </Suspense>
                        </>
                    )}
                </div>

                {/* Chart Footer */}
                <div className="mt-6 pt-6 border-t border-gray-800">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-400">
                            *Historical performance is not indicative of future results
                        </p>
                        <button className="flex items-center gap-2 text-sm text-yellow-400 hover:text-yellow-300 transition-colors">
                            <span>Export data</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    };

    // FAQ data
    const faqData = [
        {
            question: "What is Digital Gold and how does it work?",
            answer: "Digital Gold allows you to buy, sell and store gold online securely. Each gram you purchase is backed by physical gold of 99.5% purity stored in insured vaults. You can buy gold starting from just ₹10 and track your investments in real-time through our platform.",
            category: "basics"
        },
        {
            question: "Is my Digital Gold investment safe and secure?",
            answer: "Absolutely. Your gold is stored in highly secure, insured vaults managed by trusted partners like MMTC-PAMP and SafeGold. All transactions are encrypted, and your gold holdings are backed by actual physical gold with proper documentation and certificates.",
            category: "security"
        },
        {
            question: "Can I convert my Digital Gold to physical gold?",
            answer: "Yes, you can convert your digital gold holdings to physical gold coins or bars anytime. We offer home delivery for physical gold conversions above certain quantities, with proper hallmarking and certificates.",
            category: "conversion"
        },
        {
            question: "What are the fees and charges involved?",
            answer: "We charge zero transaction fees for buying and selling digital gold. There's a minimal storage fee of 0.5% per annum for holdings above ₹50,000, which is significantly lower than traditional gold storage costs.",
            category: "fees"
        },
        {
            question: "How quickly can I sell my Digital Gold?",
            answer: "You can sell your digital gold instantly at live market rates 24/7. The proceeds are credited to your bank account within 2-3 business days. There are no lock-in periods or exit penalties.",
            category: "selling"
        },
        {
            question: "What makes Digital Gold better than physical gold?",
            answer: "Digital Gold offers several advantages: no storage worries, no making charges, instant liquidity, ability to buy small amounts, real-time price tracking, and easy portfolio management. You also avoid risks like theft, purity concerns, and storage costs.",
            category: "comparison"
        }
    ];

    const features = [
        {
            icon: "📊",
            title: "Real-time Portfolio Tracking",
            description: "Monitor your investments 24/7 with live price updates and detailed performance analytics.",
        },
        {
            icon: "💰",
            title: "Flexible SIP from ₹10",
            description: "Start small and build wealth systematically with automated daily, weekly, or monthly investments.",
        },
        {
            icon: "⚡",
            title: "Zero Transaction Fees",
            description: "Keep more of your money invested with no hidden charges on buying or selling.",
        },
        {
            icon: "🔒",
            title: "Bank-Grade Security",
            description: "Your gold is stored in insured vaults with 99.5% purity guarantee and full documentation.",
        }
    ];

    const steps = [
        {
            icon: "📱",
            title: "Quick Registration",
            description: "Sign up with your phone number in under 30 seconds. No lengthy paperwork required.",
            color: "from-blue-500/20 to-blue-600/10",
            borderColor: "border-blue-500/30"
        },
        {
            icon: "💰",
            title: "Choose Investment",
            description: "Start with as little as ₹10 or set up systematic investment plans for regular purchases.",
            color: "from-green-500/20 to-green-600/10",
            borderColor: "border-green-500/30"
        },
        {
            icon: "⏰",
            title: "Set Frequency",
            description: "Choose between daily, weekly, monthly SIPs or make one-time investments based on your preference.",
            color: "from-purple-500/20 to-purple-600/10",
            borderColor: "border-purple-500/30"
        },
        {
            icon: "📊",
            title: "Track & Manage",
            description: "Monitor real-time performance, view analytics, and sell instantly whenever you want.",
            color: "from-yellow-500/20 to-yellow-600/10",
            borderColor: "border-yellow-500/30"
        }
    ];

    const comparisonFeatures = [
        { feature: 'Minimum Investment', digital: 'As low as ₹10', physical: 'Minimum 1-2 grams', digitalBetter: true },
        { feature: 'Trading Hours', digital: '24/7 trading', physical: 'Business hours only', digitalBetter: true },
        { feature: 'Liquidity', digital: 'Instant selling', physical: 'Complex process', digitalBetter: true },
        { feature: 'Storage & Security', digital: 'Bank-grade security', physical: 'Storage risks & costs', digitalBetter: true },
        { feature: 'Documentation', digital: 'No demat needed', physical: 'Multiple documents', digitalBetter: true },
        { feature: 'Physical Conversion', digital: 'Available anytime', physical: 'Already physical', digitalBetter: false }
    ];

    // Error boundary wrapper
    const withErrorBoundary = (Component, props) => (
        <Suspense fallback={<LoadingSpinner size="lg" />}>
            <Component {...props} />
        </Suspense>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0f1c] via-[#1a1f2e] to-[#2d1b69] text-white relative">
            {/* Navigation would go here */}
            <Navbar />
            {/* Promo Banner */}
            <PromoBanner />

            {/* Main Content */}
            <main className="container mx-auto px-4 md:px-6 py-8 md:py-16 relative z-10">

                {/* Hero Section */}
                <section className="relative min-h-screen flex items-center py-20 mb-20 overflow-hidden">
                    {/* Background Elements */}
                    <div className="absolute inset-0 -z-10">
                        {/* Gradient Orbs */}
                        <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-500/20 rounded-full blur-[120px] animate-pulse" />
                        <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-500/20 rounded-full blur-[120px] animate-pulse" />

                        {/* Grid Pattern */}
                        <div
                            className="absolute inset-0 opacity-20 "
                            style={{
                                backgroundImage: `linear-gradient(to right, #374151 1px, transparent 1px),
                                  linear-gradient(to bottom, #374151 1px, transparent 1px)`,
                                backgroundSize: '50px 50px',
                                maskImage: 'linear-gradient(180deg, white, transparent)'
                            }}
                        />

                        {/* Alternative: Inline SVG Grid Pattern */}
                        <svg className="absolute inset-0 w-full h-full opacity-10" aria-hidden="true">
                            <defs>
                                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#grid)" />
                        </svg>
                        {/* Animated Particles */}
                        <div className="absolute inset-0">
                            {[...Array(20)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute w-1 h-1 bg-yellow-400/30 rounded-full"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `${Math.random() * 100}%`,
                                    }}
                                    animate={{
                                        y: [-20, 20, -20],
                                        opacity: [0.2, 1, 0.2],
                                    }}
                                    transition={{
                                        duration: 3 + Math.random() * 3,
                                        repeat: Infinity,
                                        delay: Math.random() * 3,
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
                            {/* Content */}
                            <motion.div
                                className="space-y-8"
                                variants={animations.staggerContainer}
                                initial="hidden"
                                animate="visible"
                            >
                                {/* Badge */}
                                <motion.div
                                    className="inline-flex items-center gap-3 px-4 py-2 bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/20 rounded-full"
                                    variants={animations.fadeInUp}
                                >
                                    <motion.span
                                        className="relative flex h-2 w-2"
                                        aria-hidden="true"
                                    >
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                                    </motion.span>
                                    <span className="text-sm font-medium text-yellow-400">Trusted by 1M+ investors</span>
                                </motion.div>

                                {/* Main Heading */}
                                <motion.div variants={animations.fadeInUp} className="space-y-6">
                                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
                                        Build Wealth with{' '}
                                        <span className="relative inline-block">
                                            <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500">
                                                Digital Gold
                                            </span>
                                            <svg
                                                className="absolute -bottom-2 left-0 w-full"
                                                viewBox="0 0 300 12"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <motion.path
                                                    d="M2 10C50 2 100 2 150 10C200 2 250 2 298 10"
                                                    stroke="url(#gradient-underline)"
                                                    strokeWidth="4"
                                                    strokeLinecap="round"
                                                    initial={{ pathLength: 0 }}
                                                    animate={{ pathLength: 1 }}
                                                    transition={{ delay: 0.8, duration: 0.8 }}
                                                />
                                                <defs>
                                                    <linearGradient id="gradient-underline" x1="0%" y1="0%" x2="100%" y2="0%">
                                                        <stop offset="0%" stopColor="#facc15" />
                                                        <stop offset="100%" stopColor="#f59e0b" />
                                                    </linearGradient>
                                                </defs>
                                            </svg>
                                        </span>
                                    </h1>

                                    <p className="text-xl md:text-2xl text-gray-400 leading-relaxed max-w-2xl">
                                        Start investing with just ₹10. Enjoy zero fees, instant liquidity, and 99.5% pure gold backed by trusted vault partners.
                                    </p>
                                </motion.div>

                                {/* Stats Row */}
                                <motion.div
                                    className="grid grid-cols-3 gap-6"
                                    variants={animations.staggerContainer}
                                >
                                    {[
                                        { value: '₹10', label: 'Min. Investment' },
                                        { value: '0%', label: 'Platform Fees' },
                                        { value: '99.5%', label: 'Gold Purity' },
                                    ].map((stat, index) => (
                                        <motion.div
                                            key={index}
                                            className="text-center"
                                            variants={animations.fadeInUp}
                                            custom={index}
                                        >
                                            <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
                                            <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
                                        </motion.div>
                                    ))}
                                </motion.div>

                                {/* CTA Section */}
                                <motion.div
                                    className="space-y-4"
                                    variants={animations.fadeInUp}
                                >
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <motion.button
                                            className="group relative px-8 py-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-gray-900 font-semibold rounded-2xl text-lg shadow-xl shadow-yellow-500/20 hover:shadow-2xl hover:shadow-yellow-500/30 transition-all duration-300"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <span className="relative z-10 flex items-center justify-center gap-2">
                                                Start Investing
                                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                </svg>
                                            </span>
                                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </motion.button>

                                        <motion.button
                                            className="group px-8 py-4 bg-white/5 backdrop-blur-sm border border-white/10 text-white font-semibold rounded-2xl hover:bg-white/10 transition-all duration-300"
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Watch Demo
                                            </span>
                                        </motion.button>
                                    </div>

                                    {/* Trust Indicators */}
                                    <div className="flex items-center gap-6 pt-4">
                                        <div className="flex -space-x-2">
                                            {[...Array(4)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 border-2 border-gray-900 flex items-center justify-center text-xs font-medium"
                                                >
                                                    {i + 1}
                                                </div>
                                            ))}
                                            <div className="w-10 h-10 rounded-full bg-gray-800 border-2 border-gray-900 flex items-center justify-center">
                                                <span className="text-xs">+1M</span>
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-400">
                                            <div className="flex items-center gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                ))}
                                                <span className="ml-1 font-medium">4.9/5</span>
                                            </div>
                                            <span>from 50k+ reviews</span>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Bonus Banner */}
                                <motion.div
                                    className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-6 border border-green-500/20"
                                    variants={animations.fadeInUp}
                                    whileHover={{ scale: 1.02 }}
                                >
                                    <div className="relative z-10 flex items-center gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center text-2xl shadow-lg shadow-green-500/25">
                                            🎁
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-green-400 mb-1">Limited Time Offer</h4>
                                            <p className="text-sm text-gray-300">Get ₹300 bonus gold on your first investment of ₹1000+</p>
                                        </div>
                                        <motion.div
                                            className="text-sm text-green-400 font-medium"
                                            animate={{ opacity: [1, 0.5, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            Claim Now →
                                        </motion.div>
                                    </div>
                                    {/* Animated background */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 animate-pulse" />
                                </motion.div>
                            </motion.div>

                            {/* Hero Visual */}
                            <motion.div
                                className="relative lg:absolute lg:right-0 lg:w-1/2 h-full flex items-center justify-center"
                                initial={{ opacity: 0, x: 100 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                            >
                                <div className="relative w-full max-w-lg">
                                    {/* Main Card */}
                                    <motion.div
                                        className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-8 border border-gray-700 shadow-2xl"
                                        animate={{ y: [0, -10, 0] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                        {/* Card Header */}
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/25">
                                                    <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-white">Digital Gold</h3>
                                                    <p className="text-xs text-gray-400">Live Price</p>
                                                </div>
                                            </div>
                                            <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs font-medium rounded-full border border-green-500/20">
                                                +2.4% today
                                            </span>
                                        </div>

                                        {/* Price Display */}
                                        <div className="mb-6">
                                            <div className="flex items-baseline gap-2 mb-2">
                                                <span className="text-4xl font-bold text-white">₹6,842</span>
                                                <span className="text-gray-400">/gram</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm">
                                                <div>
                                                    <span className="text-gray-500">24K Pure</span>
                                                    <span className="ml-2 text-yellow-400">99.5%</span>
                                                </div>
                                                <div className="w-px h-4 bg-gray-700" />
                                                <div>
                                                    <span className="text-gray-500">Stored in</span>
                                                    <span className="ml-2 text-white">Secured Vaults</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Mini Chart */}
                                        <div className="relative h-32 mb-6">
                                            <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                                                <motion.path
                                                    d="M0,80 L30,70 L60,75 L90,60 L120,65 L150,50 L180,55 L210,40 L240,45 L270,35 L300,30"
                                                    fill="none"
                                                    stroke="url(#gradient-chart)"
                                                    strokeWidth="3"
                                                    initial={{ pathLength: 0 }}
                                                    animate={{ pathLength: 1 }}
                                                    transition={{ duration: 2, ease: "easeInOut" }}
                                                />
                                                <defs>
                                                    <linearGradient id="gradient-chart" x1="0%" y1="0%" x2="100%" y2="0%">
                                                        <stop offset="0%" stopColor="#10b981" />
                                                        <stop offset="100%" stopColor="#34d399" />
                                                    </linearGradient>
                                                </defs>
                                            </svg>
                                            <div className="absolute inset-0 bg-gradient-to-t from-green-500/10 to-transparent" />
                                        </div>

                                        {/* Quick Actions */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <button className="py-3 px-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 font-medium hover:bg-yellow-500/20 transition-colors">
                                                Buy Gold
                                            </button>
                                            <button className="py-3 px-4 bg-gray-800 border border-gray-700 rounded-xl text-gray-300 font-medium hover:bg-gray-700 transition-colors">
                                                Sell Gold
                                            </button>
                                        </div>
                                    </motion.div>

                                    {/* Floating Elements */}
                                    <motion.div
                                        className="absolute -top-4 -right-4 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 backdrop-blur-sm rounded-2xl p-4 border border-yellow-500/20"
                                        animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
                                        transition={{ duration: 4, repeat: Infinity }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">🏆</span>
                                            <div className="text-sm">
                                                <div className="font-bold text-yellow-400">Best Returns</div>
                                                <div className="text-gray-400">13.8% CAGR</div>
                                            </div>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        className="absolute -bottom-4 -left-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-2xl p-4 border border-green-500/20"
                                        animate={{ y: [0, -5, 0] }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">✓</span>
                                            <div className="text-sm">
                                                <div className="font-bold text-green-400">Instant Buy</div>
                                                <div className="text-gray-400">24/7 Trading</div>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Background Decoration */}
                                    <div className="absolute -inset-8 -z-10">
                                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-amber-500/10 rounded-3xl blur-3xl" />
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Scroll Indicator */}
                    <motion.div
                        className="absolute bottom-8 left-1/2 -translate-x-1/2"
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                            <span className="text-xs uppercase tracking-wider">Scroll to explore</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                        </div>
                    </motion.div>
                </section>

                {/* Performance & Calculator Section */}
                <section className="mb-24 relative">
                    {/* Section Background */}
                    <div className="absolute inset-0 -z-10">
                        <div className="absolute top-1/2 left-0 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
                    </div>

                    {/* Section Header */}
                    <motion.div
                        className="text-center mb-12"
                        variants={animations.fadeInUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full mb-6">
                            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                            <span className="text-yellow-400 text-sm font-medium">Interactive Tools</span>
                        </div>

                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                            Track Performance & <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">Calculate Returns</span>
                        </h2>
                        <p className="text-lg text-gray-400 max-w-3xl mx-auto">
                            Visualize gold's historical performance and calculate your potential returns with our advanced tools
                        </p>
                    </motion.div>

                    <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                        <div className="lg:col-span-2">
                            {withErrorBoundary(PerformanceChart, { selectedPeriod, setSelectedPeriod })}
                        </div>
                        <div>
                            {withErrorBoundary(InvestmentCalculator, {
                                selectedAmount,
                                setSelectedAmount,
                                investmentFrequency,
                                setInvestmentFrequency,
                                investmentPeriod,
                                setInvestmentPeriod
                            })}
                        </div>
                    </div>
                </section>


                {/* Digital vs Physical Comparison */}
                <section className="mb-20">
                    <motion.div
                        className="text-center mb-12"
                        variants={animations.fadeInUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Digital Gold?</h2>
                        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                            Compare the advantages of digital gold over traditional physical gold investment
                        </p>
                    </motion.div>

                    <motion.div
                        className="max-w-6xl mx-auto bg-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/30"
                        variants={animations.scaleIn}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-700/30">
                                        <th className="text-left p-4 font-medium text-gray-300">Features</th>
                                        <th className="text-center p-4 font-bold text-yellow-400">Digital Gold</th>
                                        <th className="text-center p-4 font-medium text-gray-400">Physical Gold</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {comparisonFeatures.map((item, index) => (
                                        <motion.tr
                                            key={index}
                                            className="border-b border-gray-700/20 hover:bg-gray-700/10"
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            viewport={{ once: true }}
                                        >
                                            <td className="p-4 font-medium">{item.feature}</td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className="text-green-400 text-lg">✓</span>
                                                    <span className="text-sm">{item.digital}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className={`text-lg ${item.digitalBetter ? 'text-red-400' : 'text-green-400'}`}>
                                                        {item.digitalBetter ? '✗' : '✓'}
                                                    </span>
                                                    <span className="text-sm text-gray-400">{item.physical}</span>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <motion.div
                            className="mt-8 text-center"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <motion.button
                                className="px-10 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-gray-900 font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Choose Digital Gold Today
                            </motion.button>
                        </motion.div>
                    </motion.div>
                </section>

                {/* How it Works Section */}
                <section className="mb-24 relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute inset-0 -z-10">
                        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl" />
                    </div>

                    <motion.div
                        className="text-center mb-16"
                        variants={animations.fadeInUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-6">
                            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                            <span className="text-cyan-400 text-sm font-medium">Quick Start Guide</span>
                        </div>

                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                            Get Started in{' '}
                            <span className="relative">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                                    4 Simple Steps
                                </span>
                                <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 100 8" preserveAspectRatio="none">
                                    <path d="M0 8C20 2, 40 2, 60 8C80 2, 100 2, 100 8" stroke="url(#gradient)" strokeWidth="2" fill="none" />
                                    <defs>
                                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#06b6d4" />
                                            <stop offset="100%" stopColor="#3b82f6" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </span>
                        </h2>

                        <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                            Investing in digital gold has never been easier. Follow these steps to start building your portfolio today.
                        </p>
                    </motion.div>

                    {/* Desktop view - Horizontal flow */}
                    <div className="hidden lg:block max-w-7xl mx-auto px-4">
                        <div className="relative">
                            {/* Connection line */}
                            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gray-700 to-transparent -translate-y-1/2 -z-10" />

                            <div className="grid grid-cols-4 gap-8 relative">
                                {steps.map((step, index) => (
                                    <motion.div
                                        key={index}
                                        className="relative"
                                        variants={animations.fadeInUp}
                                        initial="hidden"
                                        whileInView="visible"
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        {/* Step card */}
                                        <div
                                            className={`relative group bg-gray-900/50 backdrop-blur-sm p-8 rounded-2xl border ${step.borderColor} hover:border-opacity-100 transition-all duration-300 h-full`}
                                            style={{
                                                background: `linear-gradient(135deg, ${step.color.replace('from-', '').replace('/20', '')}08 0%, transparent 100%)`,
                                            }}
                                        >
                                            {/* Step number badge */}
                                            <div className="absolute -top-4 -right-4 w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-gray-900 font-bold shadow-lg shadow-yellow-500/25 group-hover:scale-110 transition-transform">
                                                {index + 1}
                                            </div>

                                            {/* Icon container */}
                                            <div className="w-16 h-16 mx-auto mb-6 relative">
                                                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                                                <div className="relative w-full h-full bg-gray-900/80 rounded-2xl flex items-center justify-center text-3xl border border-gray-700 group-hover:border-cyan-500/50 transition-colors">
                                                    {step.icon}
                                                </div>
                                            </div>

                                            <h3 className="text-xl font-bold mb-3 text-center group-hover:text-cyan-400 transition-colors">
                                                {step.title}
                                            </h3>

                                            <p className="text-gray-400 text-center leading-relaxed group-hover:text-gray-300 transition-colors">
                                                {step.description}
                                            </p>

                                            {/* Hover effect */}
                                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/5 group-hover:to-blue-500/5 transition-all pointer-events-none" />
                                        </div>

                                        {/* Connection dot */}
                                        {index < steps.length - 1 && (
                                            <div className="hidden lg:block absolute top-1/2 -right-4 w-2 h-2 bg-gray-600 rounded-full -translate-y-1/2 z-10" />
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Mobile/Tablet view - Vertical flow */}
                    <div className="lg:hidden max-w-2xl mx-auto px-4">
                        <div className="relative">
                            {/* Vertical connection line */}
                            <div className="absolute top-0 bottom-0 left-8 w-0.5 bg-gradient-to-b from-transparent via-gray-700 to-transparent -z-10" />

                            <div className="space-y-8">
                                {steps.map((step, index) => (
                                    <motion.div
                                        key={index}
                                        className="relative flex gap-6"
                                        variants={animations.fadeInUp}
                                        initial="hidden"
                                        whileInView="visible"
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        {/* Step number */}
                                        <div className="flex-shrink-0 relative">
                                            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-gray-900 font-bold text-lg shadow-lg shadow-yellow-500/25">
                                                {index + 1}
                                            </div>
                                            {/* Connection dot */}
                                            {index < steps.length - 1 && (
                                                <div className="absolute top-20 left-1/2 w-2 h-2 bg-gray-600 rounded-full -translate-x-1/2" />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div
                                            className={`flex-1 relative group bg-gray-900/50 backdrop-blur-sm p-6 rounded-2xl border ${step.borderColor} hover:border-opacity-100 transition-all duration-300`}
                                            style={{
                                                background: `linear-gradient(135deg, ${step.color.replace('from-', '').replace('/20', '')}08 0%, transparent 100%)`,
                                            }}
                                        >
                                            <div className="text-2xl mb-3">{step.icon}</div>
                                            <h3 className="text-lg font-bold mb-2 group-hover:text-cyan-400 transition-colors">
                                                {step.title}
                                            </h3>
                                            <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors">
                                                {step.description}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* CTA Button */}
                    <motion.div
                        className="text-center mt-16"
                        variants={animations.fadeInUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                    >
                        <button className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full font-semibold text-white shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-105">
                            <span className="relative z-10">Start Your Journey</span>
                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </button>

                        <p className="mt-4 text-sm text-gray-500">
                            No credit card required • Free to start
                        </p>
                    </motion.div>
                </section>

                {/* FAQ Section */}
                <section className="mb-20" id="faq">
                    <motion.div
                        className="text-center mb-12"
                        variants={animations.fadeInUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
                        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                            Get answers to common questions about digital gold investment
                        </p>
                    </motion.div>

                    <div className="max-w-4xl mx-auto space-y-3">
                        {faqData.map((faq, index) => (
                            <motion.div
                                key={index}
                                className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700/30 overflow-hidden"
                                variants={animations.fadeInUp}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <button
                                    className="w-full p-5 text-left flex items-center justify-between hover:bg-gray-700/10 transition-colors focus:outline-none focus:bg-gray-700/10"
                                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                                    aria-expanded={expandedFaq === index}
                                >
                                    <h3 className="text-lg font-semibold pr-4">{faq.question}</h3>
                                    <motion.span
                                        className="text-xl text-gray-400 flex-shrink-0"
                                        animate={{ rotate: expandedFaq === index ? 45 : 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        +
                                    </motion.span>
                                </button>

                                <AnimatePresence>
                                    {expandedFaq === index && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-5 pb-5 text-gray-300 leading-relaxed border-t border-gray-700/20 pt-4">
                                                {faq.answer}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Trust Badges */}
                <section className="mb-20">
                    <motion.div
                        className="text-center"
                        variants={animations.fadeInUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                    >
                        <p className="text-gray-400 mb-8">Trusted by leading financial institutions</p>
                        <div className="flex flex-wrap justify-center items-center gap-8">
                            {['MMTC-PAMP', 'SafeGold', 'Augmont', 'BRINKS'].map((partner, index) => (
                                <motion.div
                                    key={index}
                                    className="bg-gray-800/20 px-6 py-3 rounded-xl border border-gray-700/20"
                                    whileHover={{ scale: 1.05 }}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                >
                                    <span className="text-lg font-bold text-gray-300">{partner}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </section>

                {/* Final CTA */}
                <section className="text-center">
                    <motion.div
                        className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-2xl p-8 md:p-12 border border-gray-700/30 shadow-2xl"
                        variants={animations.scaleIn}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Ready to Start Your Gold Journey?
                        </h2>
                        <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
                            Join thousands of smart investors building wealth with digital gold.
                            Start with just ₹10 and watch your portfolio grow.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                            <motion.button
                                className="px-10 py-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-gray-900 font-bold rounded-xl text-lg shadow-xl hover:shadow-yellow-500/25 transition-all focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setIsLoading(true)}
                            >
                                Start Investing Now
                            </motion.button>

                            <motion.button
                                className="px-8 py-4 border-2 border-gray-600 text-gray-300 font-semibold rounded-xl hover:border-gray-400 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-gray-500"
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Download App
                            </motion.button>
                        </div>

                        {/* Trust Indicators */}
                        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
                            <div className="flex items-center gap-2">
                                <span className="text-green-400" aria-hidden="true">🔒</span>
                                <span>Bank-grade Security</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-green-400" aria-hidden="true">⚡</span>
                                <span>Instant Transactions</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-green-400" aria-hidden="true">📱</span>
                                <span>Mobile-first Experience</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-green-400" aria-hidden="true">🏆</span>
                                <span>99.5% Purity Guaranteed</span>
                            </div>
                        </div>
                    </motion.div>
                </section>
            </main>

            {/* Loading Overlay */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-gray-900/90 backdrop-blur-sm rounded-2xl p-8 text-center border border-gray-700/50 shadow-2xl max-w-sm mx-4"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                        >
                            <LoadingSpinner size="xl" className="text-yellow-500 mx-auto mb-6" />
                            <h3 className="text-xl font-bold mb-3">Setting up your account</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Please wait while we prepare your digital gold investment platform...
                            </p>
                            <div className="flex items-center justify-center gap-2 mt-4 text-green-400 text-sm">
                                <span className="text-lg" aria-hidden="true">🔒</span>
                                <span>Secured & Encrypted</span>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Scroll to Top Button */}
            <AnimatePresence>
                {isScrolled && (
                    <motion.button
                        className="fixed bottom-6 right-6 w-12 h-12 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full shadow-lg flex items-center justify-center text-gray-900 font-bold z-40 hover:shadow-xl transition-shadow focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1, y: -2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        aria-label="Scroll to top"
                    >
                        ↑
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
                {/* Animated background gradients */}
                <motion.div
                    className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-radial from-yellow-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                        x: [0, 30, 0],
                        y: [0, -20, 0],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-radial from-purple-500/10 via-pink-500/5 to-transparent rounded-full blur-3xl"
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.2, 0.4, 0.2],
                        x: [0, -25, 0],
                        y: [0, 25, 0],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-cyan-500/5 via-blue-500/3 to-transparent rounded-full blur-3xl"
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.1, 0.2, 0.1],
                        rotate: [0, 90, 180, 270, 360],
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                />
            </div>

            {/* Accessibility Skip Link */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg font-medium z-50"
            >
                Skip to main content
            </a>
        </div>
    );
};

export default function Gold({ auth_token }) {
    const [showGoldPage, setShowGoldPage] = useState(false);

    return (
        <div className="min-h-screen w-screen bg-gray-100 font-sans">
            {showGoldPage ? (
                <GoldPage setShowGoldPage={setShowGoldPage} />
            ) : (
                <FrontPage setShowGoldPage={setShowGoldPage} auth_token={auth_token} />
            )}
        </div>
    );
};

const styles = `
    .bg-gradient-radial {
        background: radial-gradient(circle, var(--tw-gradient-from), var(--tw-gradient-to));
    }
    
    /* Custom scrollbar */
    ::-webkit-scrollbar {
        width: 10px;
    }

    ::-webkit-scrollbar-track {
        background: #1a1f2e;
    }

    ::-webkit-scrollbar-thumb {
        background: linear-gradient(to bottom, #f59e0b, #d97706);
        border-radius: 5px;
    }

    ::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(to bottom, #d97706, #b45309);
    }
`;

// Export with performance optimizations
export const GoldPageOptimized = React.memo(GoldPage);

// Helper hook for price formatting
export const useFormattedPrice = (price) => {
    return React.useMemo(() => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(price);
    }, [price]);
};

// Helper component for animated numbers
export const AnimatedNumber = ({ value, duration = 1000 }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const startTime = Date.now();
        const startValue = displayValue;
        const endValue = value;

        const updateValue = () => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / duration, 1);
            const currentValue = startValue + (endValue - startValue) * progress;

            setDisplayValue(Math.round(currentValue));

            if (progress < 1) {
                requestAnimationFrame(updateValue);
            }
        };

        requestAnimationFrame(updateValue);
    }, [value, duration]);

    return <span>{displayValue.toLocaleString()}</span>;
};