const mongoose = require("mongoose");

const tickerStockSchema = new mongoose.Schema({
  instrument_key: { type: String, required: true, unique: true },
  trading_symbol: { type: String, required: true },
  price: { type: Number },
  change: { type: Number, default: 0 },
  isIndex: { type: Boolean, required: true },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("TickerStock", tickerStockSchema);