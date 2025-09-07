// back-end/models/User.js
const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema({
  stockName: { type: String, required: true },
  stockKey: { type: String, required: true },
  stockSymbol: { type: String, required: true },
  lastPrice: { type: String },
  openPrice: { type: String },
  low: { type: String },
  high: { type: String },
  one_day_change: { type: String },
  price_change: { type: String },
});

const watchlistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  stocks: [stockSchema],
});

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  firstName: { type: String },
  photo: { type: String },
  watchlists: [watchlistSchema], // Array of watchlists
});

module.exports = mongoose.model("User", userSchema);