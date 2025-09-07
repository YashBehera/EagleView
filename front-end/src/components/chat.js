import React, { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";

const Chat = () => {
  // State management
  const [messages, setMessages] = useState([
    {
      sender: "AI Support",
      text: "Hello! I'm your EagleView AI assistant. How can I help you with stock analysis today?",
      time: getTimestamp(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [aiStatus, setAiStatus] = useState("loading"); // loading, ready, failed
  const [genAI, setGenAI] = useState(null);
  const [contextMemory, setContextMemory] = useState([]);
  const [dynamicSuggestions, setDynamicSuggestions] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const [annotationMode, setAnnotationMode] = useState(false);
  const [annotations, setAnnotations] = useState([]);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcInput, setCalcInput] = useState("");

  // Backend API base URL
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

  // Helper function for timestamps
  function getTimestamp() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  // Initialize Gemini AI
  useEffect(() => {
    const initializeGemini = async () => {
      try {
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const apiKey = process.env.REACT_APP_GEMINI_API_KEY;

        if (!apiKey) {
          throw new Error("Missing Gemini API key");
        }

        const genAIClient = new GoogleGenerativeAI(apiKey);
        setGenAI(genAIClient);
        setAiStatus("ready");
        console.log("Gemini AI initialized successfully");
      } catch (error) {
        console.error("Error initializing Gemini:", error);
        setAiStatus("failed");
        addSystemMessage("Failed to initialize AI. Please refresh the page.");
      }
    };

    initializeGemini();
  }, []);

  // Add system messages to chat
  const addSystemMessage = (text) => {
    setMessages((prev) => [
      ...prev,
      {
        sender: "System",
        text: text,
        time: getTimestamp(),
      },
    ]);
  };

  // Enhanced stock data fetcher with error handling
  const fetchStockData = async (symbol) => {
    try {
      // Convert symbol to uppercase and remove any extra spaces
      const cleanSymbol = symbol.toUpperCase().trim();
      const response = await fetch(`${API_URL}/api/stock/${cleanSymbol}`);
      
      if (!response.ok) {
        // Check if it's a 404 error (stock not found)
        if (response.status === 404) {
          throw new Error(`Stock ${cleanSymbol} not found in our database`);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching stock data:", error);
      throw error;
    }
  };

  // Enhanced quote data fetcher
  const fetchQuoteData = async (instrumentKey) => {
    try {
      const response = await fetch(`${API_URL}/api/stock/quote/${instrumentKey}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.quote;
    } catch (error) {
      console.error("Error fetching quote data:", error);
      throw error;
    }
  };

  // Enhanced stock search
  const searchStocks = async (term) => {
    try {
      const response = await fetch(`${API_URL}/api/stock/search/${term}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.stocks || [];
    } catch (error) {
      console.error("Error searching stocks:", error);
      throw error;
    }
  };

  // Format financial data into readable markdown
  const formatFinancialData = (stockData) => {
    if (!stockData) return "No data available for this stock";
    
    const { financials, ratios, quote } = stockData;
    const companyName = financials?.company_name || stockData._id || "N/A";
    const sector = financials?.sector || "N/A";
    const lastUpdated = new Date(ratios?.last_updated || quote?.timestamp || Date.now()).toLocaleString();
  
    // Safely extract latest financial year data
    const latestYear = financials?.profit_loss 
      ? Object.keys(financials.profit_loss).sort().reverse()[0]
      : null;
      
    const latestPL = latestYear ? financials.profit_loss[latestYear] : {};
    const latestBalanceSheet = latestYear ? financials.balance_sheet[latestYear] : {};
  
    // Helper function to safely format numbers
    const formatNumber = (value, divisor = 1, decimals = 2) => {
      if (value === undefined || value === null) return "N/A";
      const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
      if (isNaN(num)) return "N/A";
      return (num / divisor).toFixed(decimals);
    };
  
    // Format key metrics
    const metrics = [
      `**Company**: ${companyName}`,
      `**Sector**: ${sector}`,
      `**Last Updated**: ${lastUpdated}`,
      `\n**Key Metrics**:`,
      `- Market Cap: ₹${formatNumber(ratios?.market_cap, 10000000)} Cr`,
      `- P/E Ratio: ${formatNumber(ratios?.stock_pe)}`,
      `- ROE: ${formatNumber(ratios?.roe)}%`,
      `- ROCE: ${formatNumber(ratios?.roce)}%`,
      `- Dividend Yield: ${formatNumber(ratios?.dividend_yield)}%`,
      `- Promoter Holding: ${formatNumber(ratios?.promoter_holding)}%`,
      `- EagleView Score: ${formatNumber(ratios?.eagle_view_score, 1, 1)}/100`,
    ];
  
    // Add latest price if available
    if (quote) {
      const changePercent = quote.net_change && quote.ohlc?.close 
        ? ((quote.net_change / quote.ohlc.close) * 100).toFixed(2)
        : "0.00";
        
      metrics.push(
        `\n**Current Price**: ₹${formatNumber(quote.last_price)}`,
        `- Day High: ₹${formatNumber(quote.ohlc?.high)}`,
        `- Day Low: ₹${formatNumber(quote.ohlc?.low)}`,
        `- Change: ${quote.net_change >= 0 ? '+' : ''}${formatNumber(quote.net_change)} (${changePercent}%)`
      );
    }
  
    // Add latest financial year data if available
    if (latestPL) {
      metrics.push(
        `\n**Latest Financial Year (${latestYear})**:`,
        `- Revenue: ₹${formatNumber(latestPL.Sales, 100)} Cr`,
        `- Operating Profit: ₹${formatNumber(latestPL["Operating Profit"], 100)} Cr (OPM: ${latestPL["OPM %"] || "N/A"})`,
        `- Net Profit: ₹${formatNumber(latestPL["Net Profit"], 100)} Cr`,
        `- EPS: ₹${formatNumber(latestPL["EPS in Rs"])}`
      );
    }
  
    // Add balance sheet highlights
    if (latestBalanceSheet) {
      metrics.push(
        `\n**Balance Sheet Highlights**:`,
        `- Equity: ₹${formatNumber(latestBalanceSheet["equity capital"], 100)} Cr`,
        `- Reserves: ₹${formatNumber(latestBalanceSheet["reserves"], 100)} Cr`,
        `- Total Debt: ₹${formatNumber(latestBalanceSheet["borrowings"], 100)} Cr`
      );
    }
  
    // Add disclaimer
    metrics.push(
      `\n*Data Source: EagleView Backend API*`,
      `*Note: All financial data is subject to market risks. Past performance is not indicative of future results.*`
    );
  
    return metrics.join('\n');
  };

  // Gemini AI API call with enhanced context
  const getAIResponse = async (userMessage) => {
    if (!genAI || aiStatus !== "ready") {
      throw new Error("AI not initialized");
    }

    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: {
          role: "system",
          parts: [
            {
              text: `# EagleView AI Assistant - Financial Intelligence Platform
              
              ## Platform Overview
              EagleView is an advanced stock analysis platform offering:
              • Real-time market scanning across 50+ global exchanges
              • Institutional-grade analytics for retail investors
              • AI-powered portfolio diagnostics
              • Interactive data visualization tools
              
              ## Core Features
              
              1. Market Analysis Suite:
                 - Live stock screening with 200+ technical indicators
                 - Fundamental analysis with 10-year financial histories
                 - Comparative valuation tools (P/E, P/B, EV/EBITDA)
                 - Earnings surprise tracking and estimates
              
              2. Portfolio Management:
                 - Performance attribution analysis
                 - Risk assessment metrics (Beta, Volatility, Sharpe)
                 - Sector/asset allocation breakdowns
                 - Tax optimization suggestions
              
              3. Visualization Tools:
                 - Interactive financial charts (OHLC, Candlestick)
                 - Balance sheet treemaps
                 - Cash flow waterfall diagrams
                 - Ownership structure timelines
              
              ## Technical Specifications
              • Data Sources: Refinitiv, Bloomberg, SEC filings
              • Update Frequency: Real-time (15ms latency)
              • Historical Data: 20+ years for most instruments
              • Supported Markets: Equities, ETFs, REITs, ADRs
              
              ## Backend Integration
              • Use the /api/stock/:symbol endpoint to fetch detailed stock data (financials, ratios, quotes).
              • Use the /api/stock/quote/:instrumentKey endpoint for real-time quote data.
              • Use the /api/stock/search/:term endpoint to search for stocks by symbol or company name.
              • All responses should include real-time data when available, with timestamps and source attribution.
              
              ## Response Guidelines
              • Financial Data: Always timestamp and source from backend API.
              • Recommendations: Include risk disclosures.
              • Complex Queries: Offer step-by-step explanations.
              • Comparisons: Use standardized benchmarks.
              • If stock data is requested, fetch it from the backend and format the response clearly.
              
              [SYSTEM CONFIG]
              • Accuracy Mode: Precision-focused (temperature 0.5)
              • Compliance: FINRA/SEC guidelines enforced
              • Audit: All sessions logged with versioning
              `,
            },
          ],
        },
      });

      // Check if the message is a stock-related query
      const stockRegex = /(?:show\s+me\s+|what is\s+|tell\s+me\s+)?(?:stock\s+data\s+for|price\s+of|quote\s+for|financials\s+of|ratios\s+for)\s+([A-Z0-9]{1,10})\b/i;
      const searchRegex = /search\s+(.+)/i;
      let responseText = "";

      if (stockRegex.test(userMessage)) {
        const [, symbol] = userMessage.match(stockRegex);
        if (!symbol) {
          return "Please specify a stock symbol. Example: 'Show me stock data for PATELENG'";
        }
        try {
          const stockData = await fetchStockData(symbol);
          // If we have an instrument key but no quote, fetch quote separately
          if (stockData.quote?.instrument_key && !stockData.quote?.quote) {
            try {
              stockData.quote.quote = await fetchQuoteData(stockData.quote.instrument_key);
            } catch (quoteError) {
              console.error("Error fetching quote:", quoteError);
              // Continue with partial data if quote fetch fails
            }
          }
          responseText = formatFinancialData(stockData);
        } catch (error) {
          console.error("Error fetching stock data for symbol:", symbol, error);
          
          let responseText = `⚠️ Could not fetch data for ${symbol}. `;
          
          if (error.message.includes('not found')) {
            responseText += `The stock ${symbol} was not found in our database.`;
            
            // Only show suggestions if the symbol is at least 3 characters
            if (symbol.length >= 3) {
              try {
                const similar = await searchStocks(symbol.slice(0, 3));
                if (similar.length > 0) {
                  responseText += `\n\nDid you mean one of these?\n${
                    similar.slice(0, 3).map(s => `- ${s.name} (${s.trading_symbol})`).join('\n')
                  }`;
                }
              } catch (searchError) {
                console.error("Error searching for similar stocks:", searchError);
              }
            }
          } else {
            responseText += "Please try again later or check the symbol.";
          }
          
          return responseText;
        }
      } else if (searchRegex.test(userMessage)) {
        const [, term] = userMessage.match(searchRegex);
        try {
          const stocks = await searchStocks(term);
          if (stocks.length === 0) {
            responseText = `No stocks found matching "${term}". Please try another search term.`;
          } else {
            responseText = `**Search Results for "${term}"**:\n\n` +
              stocks.slice(0, 5).map((stock) => 
                `- **${stock.name}** (${stock.trading_symbol}) - Sector: ${stock.sector}`
              ).join("\n") +
              `\n\n*Tip: Ask for details about any stock by typing "Show me PATELENG" or similar*`;
          }
        } catch (error) {
          console.error("Search error:", error);
          responseText = "⚠️ Search service is currently unavailable. Please try again later.";
        }
      } else {
        // Include conversation context for non-stock queries
        const chatHistory = messages
          .filter((msg) => msg.sender !== "System")
          .slice(-6)
          .map((msg) => ({
            role: msg.sender === "You" ? "user" : "model",
            parts: [{ text: msg.text }],
          }));

        const result = await model.generateContent({
          contents: [
            ...chatHistory,
            {
              role: "user",
              parts: [{ text: userMessage }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          },
        });

        responseText = await result.response.text();
      }

      return responseText;
    } catch (error) {
      console.error("Gemini API or Backend Error:", error);
      throw error;
    }
  };

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Analyze conversation for dynamic suggestions
  useEffect(() => {
    if (messages.length < 2) return;

    const lastMsg = messages[messages.length - 1].text.toLowerCase();

    if (lastMsg.includes("portfolio")) {
      setDynamicSuggestions([
        "Analyze my portfolio risk",
        "Suggest rebalancing options",
        "Compare with S&P 500",
      ]);
    } else if (lastMsg.includes("stock") || lastMsg.includes("quote")) {
      setDynamicSuggestions([
        "Show me the P/E ratio for RELIANCE",
        "What's the current price of TCS?",
        "Search for stocks in IT sector",
      ]);
    } else {
      setDynamicSuggestions([]);
    }
  }, [messages]);

  // Handle sending messages
  const sendMessage = async (messageText = input) => {
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage || aiStatus !== "ready") return;

    // Add user message
    const userMessage = {
      sender: "You",
      text: trimmedMessage,
      time: getTimestamp(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);
    setInput("");

    // Add to context memory if it's a financial query
    if (
      trimmedMessage.toLowerCase().includes("stock") ||
      trimmedMessage.toLowerCase().includes("portfolio") ||
      trimmedMessage.toLowerCase().includes("quote") ||
      trimmedMessage.toLowerCase().includes("search")
    ) {
      setContextMemory((prev) => [...prev.slice(-4), trimmedMessage]);
    }

    try {
      const aiResponse = await getAIResponse(trimmedMessage);

      // Add AI response
      setMessages((prev) => [
        ...prev,
        {
          sender: "AI Support",
          text: aiResponse,
          time: getTimestamp(),
        },
      ]);
    } catch (error) {
      let errorMessage = "Sorry, I encountered an error processing your request.";

      if (error.message.includes("quota")) {
        errorMessage = "We're experiencing high demand. Please try again later.";
      } else if (error.message.includes("API key")) {
        errorMessage = "Authentication issue detected. Our team has been notified.";
      } else if (error.message.includes("No data found")) {
        errorMessage = error.message;
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: "AI Support",
          text: errorMessage,
          time: getTimestamp(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Quick reply handler
  const handleQuickReply = (reply) => {
    sendMessage(reply);
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !isTyping && aiStatus === "ready") {
      sendMessage();
    }
  };

  // Voice recognition
  const toggleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window)) {
      addSystemMessage("Voice input not supported in your browser");
      return;
    }

    if (!isListening) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        setInput((prev) => prev + transcript);
      };

      recognition.onerror = (e) => {
        addSystemMessage(`Voice input error: ${e.error}`);
      };

      recognition.start();
      setIsListening(true);
      recognitionRef.current = recognition;
    } else {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // Toggle annotation mode
  const toggleAnnotation = () => {
    setAnnotationMode(!annotationMode);
    if (!annotationMode) {
      addSystemMessage("Annotation mode enabled. Click anywhere on the page to add notes.");
    }
  };

  // Handle calculator submission
  const handleCalcSubmit = () => {
    try {
      const result = eval(calcInput);
      sendMessage(`Calculation result: ${calcInput} = ${result}`);
      setShowCalculator(false);
      setCalcInput("");
    } catch {
      addSystemMessage("Invalid calculation expression");
    }
  };

  // Quick reply suggestions
  const quickReplies = [
    "Show stock data for PATELENG",
    "What is the price of RELIANCE",
    "Financials of TCS",
    "Ratios for INFY"
  ];

  return (
    <>
      {/* Floating chat button */}
      <button
        onClick={() => setIsChatVisible(true)}
        className={`fixed bottom-4 right-4 flex items-center font-semibold text-sm py-2 px-4 rounded-full shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
          isDarkMode
            ? "bg-blue-700 hover:bg-blue-800 text-white"
            : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
        } sm:bottom-5 sm:right-5 sm:py-3 sm:px-6`}
        aria-label="Open AI Support Chat"
      >
        <span className="mr-2">💬</span> EagleView AI
        {aiStatus === "failed" && (
          <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">Offline</span>
        )}
      </button>

      {/* Chat container */}
      {isChatVisible && (
        <div
          className={`fixed bottom-4 right-4 z-40 flex flex-col transform transition-all duration-500 ease-in-out backdrop-blur-lg ${
            isDarkMode ? "bg-gray-900/90 text-gray-100" : "bg-white/95 text-gray-800"
          } rounded-2xl shadow-2xl ${
            isDarkMode ? "border border-gray-700" : "border border-gray-200"
          } sm:bottom-5 sm:right-5 md:w-96 md:h-[600px] w-64 h-[400px] sm:w-80 sm:h-[500px]`}
        >
          {/* Chat header */}
          <div
            className={`flex justify-between items-center p-3 sm:p-4 border-b rounded-t-2xl ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200"
            }`}
          >
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                  isDarkMode ? "bg-blue-600" : "bg-blue-500"
                } text-white`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold">EagleView AI Assistant</h3>
                <p className="text-xs text-gray-500">{aiStatus === "ready" ? "Online" : "Offline"}</p>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={toggleDarkMode}
                className={`p-1 rounded-full ${
                  isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-500 hover:bg-gray-200"
                } transition-colors`}
                aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDarkMode ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M12 5a7 7 0 100 14 7 7 0 000-14z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              <button
                onClick={() => setIsChatVisible(false)}
                className={`p-1 rounded-full ${
                  isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-500 hover:bg-gray-200"
                } transition-colors`}
                aria-label="Close chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div
            className={`flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 ${
              isDarkMode ? "bg-gray-800/50" : "bg-gray-50/50"
            }`}
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`relative max-w-[85%] p-3 rounded-lg transition-all duration-300 ${
                  msg.sender === "You"
                    ? "ml-auto bg-blue-500 text-white rounded-br-none"
                    : msg.sender === "System"
                    ? "mx-auto bg-yellow-100 text-yellow-800 text-center p-2 text-xs"
                    : `${isDarkMode ? "bg-gray-700" : "bg-white"} rounded-bl-none`
                } shadow-md`}
              >
                {msg.sender !== "System" && (
                  <div className="flex items-start space-x-2">
                    <div
                      className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        msg.sender === "You" ? "bg-blue-600" : "bg-gray-500"
                      } text-white`}
                    >
                      {msg.sender === "You" ? "Y" : "A"}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline">
                        <span className="font-semibold text-xs">{msg.sender}</span>
                        <span
                          className={`text-xs ${
                            msg.sender === "You" ? "text-blue-100" : isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {msg.time}
                        </span>
                      </div>
                      {msg.sender === "AI Support" ? (
                        <div className="mt-1 text-sm">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="mt-1 text-sm">{msg.text}</p>
                      )}
                    </div>
                  </div>
                )}

                {msg.sender === "System" && <p>{msg.text}</p>}

                {/* Speech bubble tail */}
                {msg.sender !== "System" && (
                  <div
                    className={`absolute w-3 h-3 transform rotate-45 ${
                      msg.sender === "You"
                        ? "bg-blue-500 right-[-6px] bottom-[6px]"
                        : `${isDarkMode ? "bg-gray-700" : "bg-white"} left-[-6px] bottom-[6px]`
                    }`}
                  />
                )}
              </div>
            ))}

            {isTyping && (
              <div
                className={`flex items-center p-3 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-white"} max-w-[85%] w-fit shadow-md`}
              >
                <div className="flex space-x-1 mr-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
                <span className="text-sm">AI is thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div
            className={`p-3 border-t ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} rounded-b-2xl`}
          >
            {messages.length <= 1 && aiStatus === "ready" && (
              <div className="flex flex-wrap gap-2 mb-3">
                {quickReplies.map((reply, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickReply(reply)}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      isDarkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                    }`}
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            {contextMemory.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                <div className="w-full text-xs text-gray-500">Recent Context:</div>
                {contextMemory.map((memory, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(memory)}
                    className={`px-2 py-1 text-xs rounded-full ${
                      isDarkMode ? "bg-gray-700 text-gray-200" : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    {memory.length > 20 ? `${memory.substring(0, 20)}...` : memory}
                  </button>
                ))}
              </div>
            )}

            {dynamicSuggestions.length > 0 && (
              <div className="mt-2 mb-3">
                <div className="text-xs text-gray-500 mb-1">You might want to:</div>
                <div className="flex flex-wrap gap-2">
                  {dynamicSuggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(suggestion)}
                      className={`px-3 py-1 text-xs rounded-full ${
                        isDarkMode ? "bg-blue-900 text-blue-100" : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex space-x-2">
              <div className="flex space-x-1">
                <button
                  onClick={toggleVoiceInput}
                  className={`p-2 rounded-lg ${isListening ? "bg-red-500" : isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}
                >
                  {isListening ? (
                    <svg className="h-5 w-5 text-white" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z"
                      />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z"
                      />
                    </svg>
                  )}
                </button>
                <button
                  onClick={toggleAnnotation}
                  className={`p-2 rounded-lg ${annotationMode ? "bg-yellow-500" : isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M12,2C6.47,2 2,6.47 2,12C2,17.53 6.47,22 12,22C17.53,22 22,17.53 22,12C22,6.47 17.53,2 12,2M12,20C7.58,20 4,16.42 4,12C4,7.58 7.58,4 12,4C16.42,4 20,7.58 20,12C20,16.42 16.42,20 12,20M8,14H16V16H8V14Z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setShowCalculator(!showCalculator)}
                  className={`p-2 rounded-lg ${showCalculator ? "bg-green-500" : isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M7,2H17A2,2 0 0,1 19,4V20A2,2 0 0,1 17,22H7A2,2 0 0,1 5,20V4A2,2 0 0,1 7,2M7,4V8H17V4H7M7,10V12H9V10H7M11,10V12H13V10H11M15,10V12H17V10H15M7,14V16H9V14H7M11,14V16H13V14H11M15,14V16H17V14H15M7,18V20H9V18H7M11,18V20H13V18H11M15,18V20H17V18H15Z"
                    />
                  </svg>
                </button>
              </div>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  aiStatus === "ready"
                    ? "Ask about stocks, quotes, or search..."
                    : "AI is currently unavailable"
                }
                className={`flex-1 p-2 sm:p-3 border rounded-lg text-sm focus:outline-none transition-all ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-800 placeholder-gray-500"
                } ${aiStatus !== "ready" ? "opacity-50 cursor-not-allowed" : "focus:ring-2 focus:ring-blue-500 focus:border-transparent"}`}
                disabled={aiStatus !== "ready" || isTyping}
              />

              <button
                onClick={() => sendMessage()}
                className={`p-2 sm:p-3 rounded-lg flex items-center justify-center transition-all ${
                  aiStatus !== "ready" || isTyping
                    ? "bg-gray-400 cursor-not-allowed"
                    : isDarkMode
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-blue-500 hover:bg-blue-600"
                } text-white`}
                disabled={aiStatus !== "ready" || isTyping}
              >
                {isTyping ? (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>

            {aiStatus === "failed" && (
              <div className="mt-2 text-center">
                <button
                  onClick={() => window.location.reload()}
                  className={`text-xs ${
                    isDarkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-800"
                  } underline`}
                >
                  Refresh to Retry
                </button>
              </div>
            )}
          </div>

          {/* Calculator popup */}
          {showCalculator && (
            <div
              className={`absolute bottom-16 right-0 p-4 rounded-lg shadow-lg z-50 ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <input
                type="text"
                value={calcInput}
                onChange={(e) => setCalcInput(e.target.value)}
                className={`w-full p-2 mb-2 border rounded ${isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                placeholder="Enter calculation (e.g., 1000*(1.05^5))"
              />
              <div className="grid grid-cols-4 gap-2">
                {["7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", ".", "=", "+"].map((btn) => (
                  <button
                    key={btn}
                    onClick={() => (btn === "=" ? handleCalcSubmit() : setCalcInput((prev) => prev + btn))}
                    className={`p-2 rounded ${isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"}`}
                  >
                    {btn}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Annotation overlay */}
      {annotationMode && (
        <div
          className="fixed inset-0 z-50 pointer-events-none"
          onClick={(e) => {
            const text = prompt("Add your note:");
            if (text) {
              setAnnotations((prev) => [
                ...prev,
                {
                  x: e.clientX,
                  y: e.clientY,
                  text: text,
                },
              ]);
            }
          }}
        >
          {annotations.map((note, i) => (
            <div
              key={i}
              className="absolute p-2 bg-yellow-100 border border-yellow-300 rounded-lg shadow-sm pointer-events-auto"
              style={{ left: `${note.x}px`, top: `${note.y}px` }}
            >
              <div className="text-xs font-semibold">Note {i + 1}</div>
              <div className="text-xs">{note.text}</div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setAnnotations((prev) => prev.filter((_, index) => index !== i));
                }}
                className="absolute top-0 right-0 p-1 text-xs"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default Chat;
