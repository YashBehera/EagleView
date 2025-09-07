const express = require("express");
const router = express.Router();
const Quote = require("../models/Quote");

const cors = require("cors");
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000'; // Fallback for local dev
router.use(cors({
    origin: `${API_URL}`, // Allow requests from React app
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));

// GET: Fetch all quotes
router.get("/", async (req, res) => {
    try {
        const quotes = await Quote.find();
        res.status(200).json(quotes);
    } catch (error) {
        console.error("Error fetching quotes:", error);
        res.status(500).json({ message: "Server error while fetching quotes" });
    }
});

router.get('/api/quote', async (req, res) => {
  try {
    const { skip = 0, limit = 10, search } = req.query;

    const query = {};
    if (search) {
      query['quote.symbol'] = { $regex: `^${search}`, $options: 'i' };
    }

    const total = await Quote.countDocuments(query);
    const stocks = await Quote.find(query)
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    res.status(200).json({ stocks, total });
  } catch (error) {
    console.error("Error fetching quotes:", error);
    res.status(500).json({ message: 'Error fetching quotes', error });
  }
});

// POST: Update or insert quotes
router.post("/update", async (req, res) => {
    try {
        const quotes = req.body.quotes; // Expecting an array of quote objects
        if (!quotes || !Array.isArray(quotes)) {
            return res.status(400).json({ message: "Invalid request: quotes array required" });
        }

        const updatedQuotes = [];
        for (const quote of quotes) {
            const { instrument_key, timestamp, quote: quoteData } = quote;
            const updatedQuote = await Quote.findOneAndUpdate(
                { instrument_key },
                {
                    timestamp: timestamp || new Date(),
                    quote: {
                        last_price: quoteData?.last_price || null,
                        volume: quoteData?.volume || null,
                        average_price: quoteData?.average_price || null,
                        oi: quoteData?.oi || null,
                        oi_day_high: quoteData?.oi_day_high || null,
                        oi_day_low: quoteData?.oi_day_low || null,
                        last_trade_time: quoteData?.last_trade_time || null,
                        depth: {
                            buy: quoteData?.depth?.buy?.map(item => ({
                                quantity: item.quantity || 0,
                                price: item.price || 0,
                                orders: item.orders || 0
                            })) || [],
                            sell: quoteData?.depth?.sell?.map(item => ({
                                quantity: item.quantity || 0,
                                price: item.price || 0,
                                orders: item.orders || 0
                            })) || []
                        },
                        ohlc: {
                            open: quoteData?.ohlc?.open || null,
                            high: quoteData?.ohlc?.high || null,
                            low: quoteData?.ohlc?.low || null,
                            close: quoteData?.ohlc?.close || null
                        },
                        net_change: quoteData?.net_change || null,
                        total_buy_quantity: quoteData?.total_buy_quantity || null,
                        total_sell_quantity: quoteData?.total_sell_quantity || null,
                        lower_circuit_limit: quoteData?.lower_circuit_limit || null,
                        upper_circuit_limit: quoteData?.upper_circuit_limit || null,
                        symbol: quoteData?.symbol || null,
                        instrument_token: quoteData?.instrument_token || null,
                        quote_timestamp: quoteData?.quote_timestamp || null
                    }
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            updatedQuotes.push(updatedQuote);
        }

        res.status(200).json({ message: "Quotes updated successfully", updatedQuotes });
    } catch (error) {
        console.error("Error updating quotes:", error);
        res.status(500).json({ message: "Server error while updating quotes" });
    }
});

module.exports = router;