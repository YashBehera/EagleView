import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './Navbar';

const Tax = () => {
  const [taxData, setTaxData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessToken, setAccessToken] = useState('q2A4RUzmk68XPf39F5rHfZ2dKvOoZfou');
  const [apiKey, setApiKey] = useState('arrymt32esayamez');
  const [financialYear, setFinancialYear] = useState('2024-2025');
  const [otherIncome, setOtherIncome] = useState(0);
  const [activeTab, setActiveTab] = useState('summary');

  // Icons as SVG components
  const RefreshIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );

  const ChartIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );

  const DocumentIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  const CalculatorIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );

  const TrendingUpIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );

  // Fetch tax optimization data
  useEffect(() => {
    const fetchTaxData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/tax/optimize?financialYear=${financialYear}&otherIncome=${otherIncome}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setTaxData(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch tax data');
        setLoading(false);
      }
    };

    if (accessToken) {
      fetchTaxData();
    }
  }, [accessToken, financialYear, otherIncome]);

  // Handle token and API key input
  const handleCredentialsSubmit = (e) => {
    e.preventDefault();
    const token = e.target.elements.token.value;
    const key = e.target.elements.apiKey.value;
    setAccessToken(token);
    setApiKey(key);
  };

  if (!accessToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full transform transition-all hover:scale-[1.02]">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4">
              <CalculatorIcon />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Tax Optimizer</h2>
            <p className="text-gray-600">Enter your credentials to access your dashboard</p>
          </div>
          
          <form onSubmit={handleCredentialsSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">API Key</label>
              <input
                type="text"
                name="apiKey"
                placeholder="Enter your API key"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Access Token</label>
              <input
                type="text"
                name="token"
                placeholder="Enter your access token"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transform transition-all duration-200 hover:scale-[1.02] shadow-lg"
            >
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
          <div className="bg-white p-8 rounded-2xl shadow-xl">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <CalculatorIcon />
                </div>
              </div>
              <p className="text-lg font-semibold text-gray-700 mt-6">Loading tax optimization data...</p>
              <p className="text-sm text-gray-500 mt-2">Please wait while we analyze your portfolio</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transform transition-all duration-200 hover:scale-[1.02] shadow-lg"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const tabs = [
    { id: 'summary', label: 'Summary', icon: ChartIcon },
    { id: 'holdings', label: 'Holdings', icon: TrendingUpIcon },
    { id: 'optimization', label: 'Optimization', icon: CalculatorIcon },
    { id: 'filing', label: 'Filing', icon: DocumentIcon }
  ];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <header className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Tax Optimization Dashboard
                </h1>
                <div className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">Financial Year: {taxData?.financialYear}</span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Other Income (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      value={otherIncome}
                      onChange={(e) => setOtherIncome(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="0"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Financial Year</label>
                  <select
                    value={financialYear}
                    onChange={(e) => setFinancialYear(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer"
                  >
                    <option value="2023-2024">2023-2024</option>
                    <option value="2024-2025">2024-2025</option>
                    <option value="2025-2026">2025-2026</option>
                  </select>
                </div>
                
                <button
                  onClick={() => window.location.reload()}
                  className="self-end bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transform transition-all duration-200 hover:scale-[1.02] shadow-lg flex items-center gap-2"
                >
                  <RefreshIcon />
                  Refresh
                </button>
              </div>
            </div>
          </header>

          {/* Navigation Tabs */}
          <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden border border-gray-100">
            <nav className="flex overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    className={`flex items-center px-6 py-4 font-semibold text-sm transition-all duration-200 whitespace-nowrap ${
                      activeTab === tab.id 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                        : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon />
                    <span className="ml-2">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Summary Section */}
          {activeTab === 'summary' && taxData && (
            <div className="space-y-8">
                            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Tax Summary Overview</h2>
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    Last updated: {new Date().toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <TrendingUpIcon />
                      <span className="text-xs font-semibold text-blue-600 bg-blue-200 px-2 py-1 rounded-full">LTCG</span>
                    </div>
                    <p className="text-sm font-medium text-blue-700 mb-1">Total Long Term Capital Gains</p>
                    <p className="text-3xl font-bold text-blue-900">
                      ₹{taxData.summary.totalLTCG.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <TrendingUpIcon />
                      <span className="text-xs font-semibold text-purple-600 bg-purple-200 px-2 py-1 rounded-full">STCG</span>
                    </div>
                    <p className="text-sm font-medium text-purple-700 mb-1">Total Short Term Capital Gains</p>
                    <p className="text-3xl font-bold text-purple-900">
                      ₹{taxData.summary.totalSTCG.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span className="text-xs font-semibold text-green-600 bg-green-200 px-2 py-1 rounded-full">EXEMPTION</span>
                    </div>
                    <p className="text-sm font-medium text-green-700 mb-1">LTCG Exemption Used</p>
                    <p className="text-3xl font-bold text-green-900">
                      ₹{taxData.summary.ltcgExemptionUsed.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <CalculatorIcon />
                      <span className="text-xs font-semibold text-red-600 bg-red-200 px-2 py-1 rounded-full">TAX DUE</span>
                    </div>
                    <p className="text-sm font-medium text-red-700 mb-1">Estimated Tax Liability</p>
                    <p className="text-3xl font-bold text-red-900">
                      ₹{taxData.summary.estimatedTaxLiability.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-xl border border-indigo-200 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                      </svg>
                      <span className="text-xs font-semibold text-indigo-600 bg-indigo-200 px-2 py-1 rounded-full">RATE</span>
                    </div>
                    <p className="text-sm font-medium text-indigo-700 mb-1">Effective Tax Rate</p>
                    <p className="text-3xl font-bold text-indigo-900">
                      {taxData.summary.effectiveTaxRate.toFixed(2)}%
                    </p>
                  </div>
                  
                  <div className={`bg-gradient-to-br ${taxData.summary.totalUnrealizedGains >= 0 ? 'from-emerald-50 to-emerald-100 border-emerald-200' : 'from-rose-50 to-rose-100 border-rose-200'} p-6 rounded-xl border hover:shadow-lg transition-all duration-200`}>
                    <div className="flex items-center justify-between mb-4">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className={`text-xs font-semibold ${taxData.summary.totalUnrealizedGains >= 0 ? 'text-emerald-600 bg-emerald-200' : 'text-rose-600 bg-rose-200'} px-2 py-1 rounded-full`}>
                        UNREALIZED
                      </span>
                    </div>
                    <p className={`text-sm font-medium ${taxData.summary.totalUnrealizedGains >= 0 ? 'text-emerald-700' : 'text-rose-700'} mb-1`}>Total Unrealized Gains</p>
                    <p className={`text-3xl font-bold ${taxData.summary.totalUnrealizedGains >= 0 ? 'text-emerald-900' : 'text-rose-900'}`}>
                      ₹{Math.abs(taxData.summary.totalUnrealizedGains).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tax Saving Recommendations */}
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Tax Saving Opportunities</h2>
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
                    View all recommendations
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {taxData.taxFiling.taxSavingOptions.map((option, index) => (
                    <div key={index} className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 hover:shadow-lg transition-all duration-200 cursor-pointer">
                      <div className="flex items-center justify-between mb-4">
                        <div className="bg-green-200 p-3 rounded-lg">
                          <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <span className="text-2xl font-bold text-green-800">
                          ₹{option.limit.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <h3 className="font-bold text-green-900 text-lg mb-2">{option.type}</h3>
                      <p className="text-sm text-gray-700 leading-relaxed">{option.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Holdings Section */}
          {activeTab === 'holdings' && taxData && (
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Portfolio Holdings Analysis</h2>
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    placeholder="Search holdings..."
                    className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                  <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200">
                    Export
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Symbol</th>
                      <th className="text-right py-4 px-6 font-semibold text-gray-700">Quantity</th>
                      <th className="text-right py-4 px-6 font-semibold text-gray-700">Avg Price</th>
                      <th className="text-right py-4 px-6 font-semibold text-gray-700">Current Price</th>
                      <th className="text-right py-4 px-6 font-semibold text-gray-700">Gain/Loss</th>
                      <th className="text-center py-4 px-6 font-semibold text-gray-700">Type</th>
                      <th className="text-right py-4 px-6 font-semibold text-gray-700">Days Held</th>
                      <th className="text-right py-4 px-6 font-semibold text-gray-700">Est. Tax</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taxData.holdings.map((holding, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-all duration-200">
                        <td className="py-4 px-6 font-semibold text-gray-900">{holding.tradingsymbol}</td>
                        <td className="text-right py-4 px-6 text-gray-700">{holding.quantity}</td>
                        <td className="text-right py-4 px-6 text-gray-700">₹{holding.average_price.toFixed(2)}</td>
                        <td className="text-right py-4 px-6 text-gray-700">₹{holding.last_price.toFixed(2)}</td>
                        <td className={`text-right py-4 px-6 font-semibold ${holding.gainOrLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          <div className="flex items-center justify-end gap-1">
                            {holding.gainOrLoss >= 0 ? '↑' : '↓'}
                            ₹{Math.abs(holding.gainOrLoss).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </div>
                        </td>
                        <td className="text-center py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            holding.holdingType === 'LTCG' 
                              ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800' 
                              : 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800'
                          }`}>
                            {holding.holdingType}
                          </span>
                        </td>
                        <td className="text-right py-4 px-6 text-gray-700">{holding.daysHeld}</td>
                        <td className="text-right py-4 px-6 font-semibold text-gray-900">₹{holding.estimatedTax.toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Optimization Section */}
          {activeTab === 'optimization' && taxData && (
            <div className="space-y-8">
              {/* Tax-Loss Harvesting */}
              {taxData.taxOptimization.harvestSuggestions.length > 0 && (
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                    <h2 className="text-2xl font-bold text-gray-900">Tax-Loss Harvesting Opportunities</h2>
                      <p className="text-gray-600 mt-1">Reduce your tax liability by realizing losses</p>
                    </div>
                    <div className="bg-red-100 px-4 py-2 rounded-xl">
                      <span className="text-sm font-semibold text-red-700">
                        Potential Savings: ₹{taxData.taxOptimization.harvestSuggestions.reduce((acc, s) => acc + s.potentialTaxSave, 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left py-4 px-6 font-semibold text-gray-700">Symbol</th>
                          <th className="text-right py-4 px-6 font-semibold text-gray-700">Quantity</th>
                          <th className="text-right py-4 px-6 font-semibold text-gray-700">Avg Price</th>
                          <th className="text-right py-4 px-6 font-semibold text-gray-700">Current Price</th>
                          <th className="text-right py-4 px-6 font-semibold text-gray-700">Loss</th>
                          <th className="text-right py-4 px-6 font-semibold text-gray-700">Tax Savings</th>
                          <th className="text-center py-4 px-6 font-semibold text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {taxData.taxOptimization.harvestSuggestions.map((suggestion, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-all duration-200">
                            <td className="py-4 px-6 font-semibold text-gray-900">{suggestion.tradingsymbol}</td>
                            <td className="text-right py-4 px-6 text-gray-700">{suggestion.quantity}</td>
                            <td className="text-right py-4 px-6 text-gray-700">₹{suggestion.avgPrice.toFixed(2)}</td>
                            <td className="text-right py-4 px-6 text-gray-700">₹{suggestion.currentPrice.toFixed(2)}</td>
                            <td className="text-right py-4 px-6">
                              <span className="text-red-600 font-semibold flex items-center justify-end gap-1">
                                ↓ ₹{Math.abs(suggestion.loss).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                              </span>
                            </td>
                            <td className="text-right py-4 px-6">
                              <span className="text-green-600 font-semibold flex items-center justify-end gap-1">
                                ↑ ₹{suggestion.potentialTaxSave.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                              </span>
                            </td>
                            <td className="text-center py-4 px-6">
                              <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transform transition-all duration-200 hover:scale-[1.02] shadow-md">
                                {suggestion.action}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tax-Efficient Strategies */}
              {taxData.taxOptimization.taxEfficientSuggestions.length > 0 && (
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Tax-Efficient Holding Strategies</h2>
                      <p className="text-gray-600 mt-1">Optimize your holding period for better tax treatment</p>
                    </div>
                    <div className="bg-green-100 px-4 py-2 rounded-xl">
                      <span className="text-sm font-semibold text-green-700">
                        Potential Savings: ₹{taxData.taxOptimization.taxEfficientSuggestions.reduce((acc, s) => acc + s.potentialTaxSave, 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {taxData.taxOptimization.taxEfficientSuggestions.map((suggestion, index) => (
                      <div key={index} className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 hover:shadow-lg transition-all duration-200">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-gray-900 text-lg">{suggestion.tradingsymbol}</h3>
                          <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                            {suggestion.daysToLTCG} days to LTCG
                          </span>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Current Gain:</span>
                            <span className="font-semibold text-green-700">
                              ₹{suggestion.currentGain.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Potential Tax Savings:</span>
                            <span className="font-semibold text-green-700">
                              ₹{suggestion.potentialTaxSave.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-green-200">
                          <div className="bg-white/60 rounded-lg p-3 text-center">
                            <p className="text-sm font-medium text-gray-700">Recommended Action:</p>
                            <p className="text-sm font-bold text-green-800 mt-1">{suggestion.action}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Filing Section */}
          {activeTab === 'filing' && taxData && (
            <div className="space-y-8">
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-8">Tax Filing Information & Resources</h2>
                
                {/* Required Documents */}
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <DocumentIcon />
                    <span className="ml-2">Required Documents</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {taxData.taxFiling.requiredDocuments.map((doc, index) => (
                      <div key={index} className="flex items-start p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-gray-700">{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Important Dates */}
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Important Dates
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Object.entries(taxData.taxFiling.importantDates).map(([key, value]) => {
                      const dateLabels = {
                        advanceTax: { label: 'Advance Tax', icon: '📅', color: 'blue' },
                        filingDeadline: { label: 'Filing Deadline', icon: '⏰', color: 'red' },
                        revisedReturn: { label: 'Revised Return', icon: '📝', color: 'purple' }
                      };
                      const config = dateLabels[key] || { label: key, icon: '📆', color: 'gray' };
                      
                      return (
                        <div key={key} className={`bg-gradient-to-br from-${config.color}-50 to-${config.color}-100 p-6 rounded-xl border border-${config.color}-200 hover:shadow-lg transition-all duration-200`}>
                          <div className="text-3xl mb-3">{config.icon}</div>
                          <h4 className="font-bold text-gray-900 mb-1">{config.label}</h4>
                          <p className="text-sm text-gray-700">{value}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Filing Assistance */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl border border-blue-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Filing Assistance
                  </h3>
                  <p className="text-gray-700 mb-6">Our intelligent tax filing assistant helps you prepare and file your returns accurately with step-by-step guidance.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white/70 p-4 rounded-lg">
                      <div className="text-blue-600 font-bold text-2xl mb-2">1</div>
                      <h4 className="font-semibold text-gray-900">Import Data</h4>
                      <p className="text-sm text-gray-600 mt-1">Automatically import your trading data</p>
                    </div>
                    <div className="bg-white/70 p-4 rounded-lg">
                      <div className="text-blue-600 font-bold text-2xl mb-2">2</div>
                      <h4 className="font-semibold text-gray-900">Review & Optimize</h4>
                      <p className="text-sm text-gray-600 mt-1">Review calculations and apply optimizations</p>
                    </div>
                    <div className="bg-white/70 p-4 rounded-lg">
                      <div className="text-blue-600 font-bold text-2xl mb-2">3</div>
                      <h4 className="font-semibold text-gray-900">File Returns</h4>
                      <p className="text-sm text-gray-600 mt-1">File directly or export for manual filing</p>
                    </div>
                  </div>
                  
                  <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transform transition-all duration-200 hover:scale-[1.02] shadow-lg flex items-center justify-center w-full md:w-auto">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Start Tax Filing Assistant
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Tax;