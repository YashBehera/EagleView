const mongoose = require("mongoose");

const quoteSchema = new mongoose.Schema({
  instrument_key: { type: String, required: true, unique: true },
  timestamp: { type: Date, default: Date.now },
  quote: {
    last_price: { type: Number },
    volume: { type: Number },
    average_price: { type: Number },
    oi: { type: Number },
    oi_day_high: { type: Number },
    oi_day_low: { type: Number },
    last_trade_time: { type: String },
    depth: {
      buy: [{
        quantity: { type: Number },
        price: { type: Number },
        orders: { type: Number }
      }],
      sell: [{
        quantity: { type: Number },
        price: { type: Number },
        orders: { type: Number }
      }]
    },
    ohlc: {
      open: { type: Number },
      high: { type: Number },
      low: { type: Number },
      close: { type: Number }
    },
    net_change: { type: Number },
    total_buy_quantity: { type: Number },
    total_sell_quantity: { type: Number },
    lower_circuit_limit: { type: Number },
    upper_circuit_limit: { type: Number },
    symbol: { type: String },
    instrument_token: { type: String },
    quote_timestamp: { type: String }
  }
});

module.exports = mongoose.model("Quote", quoteSchema);