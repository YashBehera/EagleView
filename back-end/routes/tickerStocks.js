const express = require("express");
const router = express.Router();
const TickerStock = require("../models/TickerStock");

 const cors = require("cors");
 router.use(cors({
   origin: "https://eagle-view-six.vercel.app", // Allow requests from React app
   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
   allowedHeaders: ["Content-Type", "Authorization"],
   credentials: true,
 }));

// GET: Fetch all ticker stocks
router.get("/", async (req, res) => {
  try {
    const tickerStocks = await TickerStock.find();
    res.status(200).json(tickerStocks);
  } catch (error) {
    console.error("Error fetching ticker stocks:", error);
    res.status(500).json({ message: "Server error while fetching ticker stocks" });
  }
});

// POST: Update or insert ticker stocks
router.post("/update", async (req, res) => {
  try {
    const stocks = req.body.stocks; // Expecting an array of stock objects
    if (!stocks || !Array.isArray(stocks)) {
      return res.status(400).json({ message: "Invalid request: stocks array required" });
    }

    const updatedStocks = [];
    for (const stock of stocks) {
      const { instrument_key, trading_symbol, price, change, isIndex } = stock;
      const updatedStock = await TickerStock.findOneAndUpdate(
        { instrument_key },
        { 
          trading_symbol, 
          price, 
          change, 
          isIndex, 
          updatedAt: new Date() 
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      updatedStocks.push(updatedStock);
    }

    res.status(200).json({ message: "Ticker stocks updated successfully", updatedStocks });
  } catch (error) {
    console.error("Error updating ticker stocks:", error);
    res.status(500).json({ message: "Server error while updating ticker stocks" });
  }
});

module.exports = router;