import React, { useEffect, useState } from "react";
import "./StockTicker.css";
import axios from "axios";
import { motion } from "framer-motion";

// Cache key for localStorage
const CACHE_KEY = "stockTickerData";
const CACHE_DURATION = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const StockTicker = () => {

  const equityStocks = [
    { trading_symbol: "RELIANCE", instrument_key: "NSE_EQ:RELIANCE" },
    { trading_symbol: "TCS", instrument_key: "NSE_EQ:TCS" },
    { trading_symbol: "HDFCBANK", instrument_key: "NSE_EQ:HDFCBANK" },
    { trading_symbol: "INFY", instrument_key: "NSE_EQ:INFY" },
    { trading_symbol: "BAJFINANCE", instrument_key: "NSE_EQ:BAJFINANCE" },
    { trading_symbol: "BHARTIARTL", instrument_key: "NSE_EQ:BHARTIARTL" },
    { trading_symbol: "INDIGO", instrument_key: "NSE_EQ:INDIGO" },
    { trading_symbol: "ITC", instrument_key: "NSE_EQ:ITC" },
    { trading_symbol: "MARUTI", instrument_key: "NSE_EQ:MARUTI" },
  ];

  const selectedStocks = [...equityStocks];

  const initialStocks = selectedStocks.map((stock) => ({
    name: stock.trading_symbol,
    price: null,
    change: 0,
    changePercent: 0,
    instrument_key: stock.instrument_key,
    isIndex: stock.instrument_key.includes("INDEX"),
    lastUpdated: null,
  }));

  // Initialize state from localStorage if available and not expired
  const getInitialStocks = () => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { stocks, timestamp } = JSON.parse(cached);
      const now = Date.now();
      if (now - timestamp < CACHE_DURATION) {
        return stocks;
      }
    }
    return initialStocks;
  };

  const [stocks, setStocks] = useState(getInitialStocks);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStockPrices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedStocks = await Promise.all(
        selectedStocks.map(async (stock) => {
          try {
            const response = await axios.get(`${API_URL}/api/stock/quote/${stock.instrument_key}`);
            const quote = response.data.quote;
            
            return {
              name: stock.trading_symbol,
              price: quote.last_price,
              change: quote.last_price - quote.ohlc.open,
              changePercent: ((quote.last_price - quote.ohlc.open) / quote.ohlc.open * 100).toFixed(2),
              instrument_key: stock.instrument_key,
              isIndex: stock.instrument_key.includes("INDEX"),
              lastUpdated: new Date().toISOString(),
            };
          } catch (err) {
            console.error(`Error fetching ${stock.trading_symbol}:`, err);
            return {
              ...stock,
              price: null,
              change: 0,
              changePercent: 0,
              lastUpdated: new Date().toISOString(),
              error: true
            };
          }
        })
      );

      setStocks(updatedStocks);
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        stocks: updatedStocks,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.error("Error fetching stock prices:", err);
      setError("Failed to load stock prices. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockPrices();
    
    // Set up interval to refresh prices every 30 seconds
    const intervalId = setInterval(fetchStockPrices, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  const renderStockItems = () => {
    return stocks.map((stock, index) => (
      <motion.div 
        key={index}
        className="stock-item"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <span className="stock-name">{stock.name}</span>
        {stock.price ? (
          <span className={`stock-price ${stock.changePercent >= 0 ? "positive" : "negative"}`}>
            {stock.isIndex ? stock.price.toFixed(2) : stock.price.toLocaleString('en-IN')}
            {stock.changePercent >= 0 ? " ▲" : " ▼"}
            {Math.abs(stock.changePercent)}%
          </span>
        ) : (
          <span className="stock-price loading">Loading...</span>
        )}
      </motion.div>
    ));
  };

  if (loading && stocks.every(stock => stock.price === null)) {
    return (
      <div className="stock-ticker">
        <div className="stock-ticker-wrapper">
          <div className="stock-ticker-content">
            {initialStocks.map((stock, index) => (
              <div key={index} className="stock-item">
                <span className="stock-name">{stock.name}</span>
                <span className="stock-price loading">Loading...</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stock-ticker">
        <div className="stock-ticker-wrapper error">
          <div className="stock-ticker-content">
            <div className="error-message">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="stock-ticker">
      <div className="stock-ticker-wrapper">
        <div className="stock-ticker-content">
          {renderStockItems()}
          {renderStockItems()} {/* Duplicate for seamless loop */}
        </div>
      </div>
    </div>
  );
};

export default StockTicker;