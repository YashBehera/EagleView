import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, 
  X, 
  Star, 
  Shield, 
  Zap, 
  TrendingUp, 
  BarChart3, 
  Bell, 
  Users, 
  Award, 
  ArrowRight, 
  ChevronDown,
  CreditCard,
  Lock,
  Sparkles,
  Target,
  Globe,
  Clock,
  CheckCircle2,
  AlertCircle,
  Gift
} from "lucide-react";
import Navbar from "./Navbar";

const Subscription = ({ auth_token }) => {
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState({
    duration: "12 months",
    amount: 2399,
    description: "Charged yearly ₹200 per month",
    originalAmount: 2399,
  });
  const [coupon, setCoupon] = useState("");
  const [discountApplied, setDiscountApplied] = useState(null);
  const [showFeatures, setShowFeatures] = useState(false);
  const plansSectionRef = useRef(null);

  // Professional Status Badge Component
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

  // Professional Feature Card Component
  const FeatureCard = ({ icon, title, description, highlight = false }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg ${
        highlight 
          ? "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:border-blue-300" 
          : "bg-white border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className={`inline-flex p-3 rounded-xl mb-4 ${
        highlight ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
      }`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </motion.div>
  );

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

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const allFeatures = [
          { 
            name: "Multi-Asset Portfolio Tracking", 
            key: "multiAsset", 
            category: "Portfolio Management", 
            description: "Track stocks, bonds, mutual funds, ETFs, and crypto in one unified dashboard",
            icon: <BarChart3 className="w-5 h-5" />
          },
          { 
            name: "Multiple Demat Account Integration", 
            key: "linkAccounts", 
            category: "Portfolio Management", 
            description: "Connect unlimited trading accounts for comprehensive portfolio view",
            icon: <Globe className="w-5 h-5" />
          },
          { 
            name: "Advanced Market Analytics", 
            key: "compareMetrics", 
            category: "Analytics & Insights", 
            description: "Compare performance against benchmarks with institutional-grade metrics",
            icon: <TrendingUp className="w-5 h-5" />
          },
          { 
            name: "AI-Powered Risk Assessment", 
            key: "diversification", 
            category: "Analytics & Insights", 
            description: "Real-time diversification scoring with concentration risk alerts",
            icon: <Shield className="w-5 h-5" />
          },
          { 
            name: "Predictive Performance Modeling", 
            key: "forecast", 
            category: "Analytics & Insights", 
            description: "ML-driven forecasting for portfolio performance and market trends",
            icon: <Target className="w-5 h-5" />
          },
          { 
            name: "Smart Price Alerts", 
            key: "basicAlerts", 
            category: "Notifications & Alerts", 
            description: "Customizable price alerts with technical indicator triggers",
            icon: <Bell className="w-5 h-5" />
          },
          { 
            name: "AI Market Intelligence", 
            key: "proAlerts", 
            category: "Notifications & Alerts", 
            description: "Advanced AI alerts for market opportunities, risks, and news impact",
            icon: <Sparkles className="w-5 h-5" />
          },
        ];

        const mockPlans = [
          {
            id: "plan_free",
            name: "STARTER",
            amount: 0,
            period: "lifetime",
            interval: 1,
            description: "Perfect for beginners",
            featureAvailability: {
              multiAsset: true,
              linkAccounts: false,
              compareMetrics: true,
              diversification: false,
              forecast: false,
              basicAlerts: true,
              proAlerts: false,
            },
          },
          {
            id: "plan_pro",
            name: "PROFESSIONAL",
            amount: 2399,
            period: "yearly",
            interval: 1,
            description: "For serious investors",
            featureAvailability: {
              multiAsset: true,
              linkAccounts: true,
              compareMetrics: true,
              diversification: true,
              forecast: true,
              basicAlerts: true,
              proAlerts: true,
            },
          },
        ];

        const plansWithFeatures = mockPlans.map((plan) => ({
          ...plan,
          features: allFeatures.map((feature) => ({
            name: feature.name,
            available: plan.featureAvailability[feature.key],
            category: feature.category,
            description: feature.description,
            icon: feature.icon,
          })),
        }));

        setPlans(plansWithFeatures);
      } catch (error) {
        console.error("Failed to load plans:", error);
        setError("Failed to load subscription plans. Please try again.");
        setPlans([]);
      }
    };
    fetchPlans();
  }, []);

  const paymentHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setError("Failed to load payment checkout. Please try again.");
      setLoading(false);
      return;
    }

    try {
      const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";
      const response = await fetch(`${BASE_URL}/razorpay/order`, {
        method: "POST",
        body: JSON.stringify({
          amount: selectedPlan.amount * 100,
          currency: "INR",
          receipt: `receipt_${plans[1]?.id}_${Date.now()}`,
          notes: { plan: plans[1]?.name, user_id: "user_123" },
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
        amount: order.amount,
        currency: order.currency,
        name: "EagleView Professional",
        description: plans[1]?.name,
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
              alert("Payment successful! Welcome to EagleView Professional.");
            } else {
              setError("Payment validation failed. Please contact support.");
            }
          } catch (validateError) {
            setError("Payment validation failed. Please contact support.");
            console.error("Validate error:", validateError.message);
          }
        },
        prefill: {
          name: "John Doe",
          email: "john@example.com",
          contact: "9000000000",
        },
        notes: {
          address: "EagleView Corporate Office",
        },
        theme: {
          color: "#3B82F6",
        },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on("payment.failed", function (response) {
        setError(`Payment failed: ${response.error.description}. Please try again.`);
        console.error("Payment failed:", response.error);
      });
      rzp1.open();
    } catch (error) {
      console.error("Payment error:", error.message);
      setError(`Failed to initiate payment: ${error.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const groupedFeatures = plans.length > 0 ?
    plans[0].features.reduce((acc, feature) => {
      const { category } = feature;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(feature);
      return acc;
    }, {}) : {};

  const handlePlanSelection = (duration, amount, description) => {
    setSelectedPlan({
      duration,
      amount,
      description,
      originalAmount: amount,
    });
    setCoupon("");
    setDiscountApplied(null);
  };

  const applyCoupon = () => {
    if (!coupon) return;

    let newAmount = selectedPlan.originalAmount;
    let discountMessage = "";

    if (coupon.toUpperCase() === "SAVE40") {
      newAmount = Math.round(selectedPlan.originalAmount * 0.6);
      discountMessage = `40% discount applied! You saved ₹${selectedPlan.originalAmount - newAmount}`;
    } else if (coupon.toUpperCase() === "WELCOME20") {
      newAmount = Math.round(selectedPlan.originalAmount * 0.8);
      discountMessage = `20% welcome discount applied! You saved ₹${selectedPlan.originalAmount - newAmount}`;
    } else {
      setDiscountApplied({ error: "Invalid coupon code" });
      return;
    }

    setSelectedPlan({ ...selectedPlan, amount: newAmount });
    setDiscountApplied({ message: discountMessage });
  };

  const scrollToPlans = () => {
    plansSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const pricingOptions = [
    {
      duration: "1 month",
      amount: 299,
      description: "Billed monthly",
      period: "month",
      popular: false,
      originalPrice: 299,
      savings: null
    },
    {
      duration: "3 months",
      amount: 799,
      description: "₹266 per month",
      period: "quarter",
      popular: false,
      originalPrice: 897,
      savings: "Save 11%"
    },
    {
      duration: "12 months",
      amount: 2399,
      description: "₹200 per month",
      period: "year",
      popular: true,
      originalPrice: 3588,
      savings: "Save 33%"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar token={auth_token} />
      
      {/* Professional Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMxLjIgMCAyIC44IDIgMnYyMGMwIDEuMi0uOCAyLTIgMkgxOGMtMS4yIDAtMi0uOC0yLTJWMjBjMC0xLjIuOC0yIDItMmgxOHoiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9nPjwvc3ZnPg==')] opacity-20" />
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-20">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium mb-8"
            >
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              Trusted by 25,000+ Professional Investors
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
            >
              Elevate Your
              <span className="block bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                Investment Intelligence
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl text-blue-100 max-w-4xl mx-auto mb-12 leading-relaxed"
            >
              Transform your investment strategy with institutional-grade analytics, AI-powered insights, 
              and real-time market intelligence designed for sophisticated investors.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <motion.button
                onClick={scrollToPlans}
                className="group px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-semibold rounded-xl hover:shadow-2xl hover:shadow-yellow-500/25 transition-all duration-300 flex items-center gap-2"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Start Professional Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <motion.button
                onClick={() => setShowFeatures(!showFeatures)}
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 flex items-center gap-2"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                View Features
                <ChevronDown className={`w-5 h-5 transition-transform ${showFeatures ? 'rotate-180' : ''}`} />
              </motion.button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="flex flex-wrap justify-center items-center gap-8 mt-16 text-blue-200"
            >
              {[
                { icon: <Shield className="w-5 h-5" />, text: "Bank-Grade Security" },
                { icon: <Award className="w-5 h-5" />, text: "Industry Recognition" },
                { icon: <Clock className="w-5 h-5" />, text: "24/7 Support" },
                { icon: <Users className="w-5 h-5" />, text: "Expert Community" }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + index * 0.1 }}
                >
                  {item.icon}
                  <span className="text-sm font-medium">{item.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Professional Features Preview */}
      <AnimatePresence>
        {showFeatures && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white border-b border-gray-200 overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-6 py-16">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <FeatureCard
                  icon={<BarChart3 className="w-6 h-6" />}
                  title="Advanced Portfolio Analytics"
                  description="Institutional-grade performance analysis with risk-adjusted returns, Sharpe ratios, and benchmark comparisons."
                  highlight={true}
                />
                <FeatureCard
                  icon={<Sparkles className="w-6 h-6" />}
                  title="AI-Powered Insights"
                  description="Machine learning algorithms analyze market patterns and provide personalized investment recommendations."
                />
                <FeatureCard
                  icon={<Shield className="w-6 h-6" />}
                  title="Risk Management Suite"
                  description="Comprehensive risk assessment tools including VaR calculations, stress testing, and correlation analysis."
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Professional Pricing Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          
          {/* Pricing Plans */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="order-2 lg:order-1"
          >
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Choose Your Plan</h3>
                    <p className="text-gray-600 mt-1">Select the perfect plan for your investment goals</p>
                  </div>
                  <StatusBadge type="premium">
                    <Star className="w-3 h-3" />
                    Professional
                  </StatusBadge>
                </div>
              </div>

              {/* Pricing Options */}
              <div className="p-8 space-y-4">
                {pricingOptions.map((option, index) => (
                  <motion.div
                    key={index}
                    className="relative"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {option.popular && (
                      <div className="absolute -top-3 left-6 z-10">
                        <StatusBadge type="premium">
                          <Sparkles className="w-3 h-3" />
                          Most Popular
                        </StatusBadge>
                      </div>
                    )}

                    <label className={`block p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                      selectedPlan?.duration === option.duration
                        ? 'border-blue-500 bg-blue-50 shadow-lg ring-4 ring-blue-500/10'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <input
                            type="radio"
                            name="plan"
                            className="h-5 w-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                            checked={selectedPlan?.duration === option.duration}
                            onChange={() => handlePlanSelection(option.duration, option.amount, option.description)}
                          />
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-semibold text-gray-900">{option.duration}</span>
                              {option.savings && (
                                <StatusBadge type="success">
                                  {option.savings}
                                </StatusBadge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                            {option.originalPrice > option.amount && (
                              <p className="text-xs text-gray-500 mt-1">
                                <span className="line-through">₹{option.originalPrice.toLocaleString()}</span>
                                {' '}→ Save ₹{(option.originalPrice - option.amount).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">₹{option.amount.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">per {option.period}</p>
                        </div>
                      </div>
                    </label>
                  </motion.div>
                ))}
              </div>

              {/* Professional Coupon Section */}
              <div className="px-8 pb-6">
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Gift className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">Apply Coupon Code</h4>
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Enter coupon code (try SAVE40)"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                    <motion.button
                      onClick={applyCoupon}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Apply
                    </motion.button>
                  </div>
                  
                  <AnimatePresence>
                    {discountApplied && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`mt-4 p-4 rounded-xl flex items-center gap-2 ${
                          discountApplied.error 
                            ? 'bg-red-50 text-red-700 border border-red-200' 
                            : 'bg-green-50 text-green-700 border border-green-200'
                        }`}
                      >
                        {discountApplied.error ? (
                          <AlertCircle className="w-4 h-4" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        <p className="text-sm font-medium">
                          {discountApplied.error || discountApplied.message}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Professional Payment Section */}
              <div className="px-8 pb-8">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 mb-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                      {discountApplied && !discountApplied.error && (
                        <p className="text-sm text-green-600 font-medium">Discount applied!</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-bold text-blue-600">
                        ₹{selectedPlan?.amount?.toLocaleString() || '2,399'}
                      </span>
                      {selectedPlan?.originalAmount > selectedPlan?.amount && (
                        <p className="text-sm text-gray-500 line-through">
                          ₹{selectedPlan.originalAmount.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <motion.button
                  onClick={paymentHandler}
                  disabled={loading}
                  className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-[1.02]'
                  }`}
                  whileHover={!loading ? { y: -2 } : {}}
                  whileTap={!loading ? { scale: 0.98 } : {}}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Upgrade to Professional
                    </>
                  )}
                </motion.button>

                <div className="flex items-center justify-center gap-4 mt-6 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Lock className="w-4 h-4" />
                    Secure Payment
                  </div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <span>30-day Money Back</span>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <span>Cancel Anytime</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Professional Benefits */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="order-1 lg:order-2"
          >
            <div className="sticky top-8">
              <h3 className="text-3xl font-bold text-gray-900 mb-8">
                Why Choose EagleView Professional?
              </h3>

              <div className="space-y-6">
                {[
                  {
                    icon: <BarChart3 className="w-6 h-6" />,
                    title: "Institutional-Grade Analytics",
                    description: "Access the same advanced portfolio analysis tools used by hedge funds and institutional investors.",
                    color: "blue"
                  },
                  {
                    icon: <Sparkles className="w-6 h-6" />,
                    title: "AI-Powered Market Intelligence",
                    description: "Get personalized insights powered by machine learning algorithms that analyze millions of data points.",
                    color: "purple"
                  },
                  {
                    icon: <Shield className="w-6 h-6" />,
                    title: "Advanced Risk Management",
                    description: "Comprehensive risk assessment with real-time alerts to protect and optimize your portfolio.",
                    color: "green"
                  },
                  {
                    icon: <Globe className="w-6 h-6" />,
                    title: "Multi-Platform Integration",
                    description: "Connect all your investment accounts for a unified view of your entire financial portfolio.",
                    color: "orange"
                  }
                ].map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="flex gap-4 p-6 bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
                  >
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                      benefit.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                      benefit.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                      benefit.color === 'green' ? 'bg-green-100 text-green-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                      {benefit.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">{benefit.title}</h4>
                      <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Social Proof */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-gray-900">4.9/5 Rating</span>
                </div>
                <p className="text-gray-700 text-sm italic">
                  "EagleView Professional has transformed how I manage my investments. 
                  The AI insights are incredibly accurate and have helped me optimize my portfolio performance."
                </p>
                <p className="text-xs text-gray-600 mt-2">— Sarah Chen, Portfolio Manager</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Professional Features Comparison */}
      <div ref={plansSectionRef} className="bg-white py-20 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl font-bold text-gray-900 mb-4"
            >
              Compare Plans & Features
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-600 max-w-3xl mx-auto"
            >
              See exactly what you get with each plan and choose the one that matches your investment sophistication.
            </motion.p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-center"
            >
              <AlertCircle className="w-6 h-6 mx-auto mb-2" />
              <p className="font-medium">{error}</p>
            </motion.div>
          )}

          {/* Features Comparison Table */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden"
          >
            {/* Table Header */}
            <div className="grid grid-cols-3 gap-4 p-8 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
              <div className="text-gray-600 font-medium">Features</div>
              {plans.map((plan) => (
                <div key={plan.id} className="text-center">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-gray-600 mt-1">{plan.description}</p>
                  <p className="text-2xl font-semibold text-blue-600 mt-2">
                    {plan.amount === 0 ? 'Free' : `₹${plan.amount.toLocaleString()} / ${plan.period}`}
                  </p>
                </div>
              ))}
            </div>

            {/* Features by Category */}
            {Object.entries(groupedFeatures).map(([category, features], categoryIndex) => (
              <div key={category} className="border-b border-gray-200 last:border-b-0">
                <h4 className="px-8 py-4 text-lg font-semibold text-gray-900 bg-gray-50">
                  {category}
                </h4>
                {features.map((feature, featureIndex) => (
                  <motion.div
                    key={feature.name}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: (categoryIndex * features.length + featureIndex) * 0.05 }}
                    className="grid grid-cols-3 gap-4 px-8 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {feature.icon}
                      <div>
                        <span className="font-medium text-gray-900">{feature.name}</span>
                        <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                      </div>
                    </div>
                    {plans.map((plan) => (
                      <div key={plan.id} className="flex justify-center items-center">
                        {plan.features.find((f) => f.name === feature.name)?.available ? (
                          <Check className="w-6 h-6 text-green-500" />
                        ) : (
                          <X className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                    ))}
                  </motion.div>
                ))}
              </div>
            ))}
          </motion.div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mt-16"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Upgrade Your Investment Game?
            </h3>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of professional investors who trust EagleView to optimize their portfolios with cutting-edge analytics and AI-powered insights.
            </p>
            <motion.button
              onClick={scrollToPlans}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 mx-auto"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Subscription;