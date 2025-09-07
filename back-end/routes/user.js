const express = require("express");
const User = require("../models/User");
const router = express.Router();

const cors = require("cors");
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000'; // Fallback for local dev
router.use(cors({
  origin: `${API_URL}`, // Allow requests from React app
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));
// Route to create or update user data
router.post("/", async (req, res) => {
  const { uid, firstName, email, photo } = req.body;

  if (!uid || !email) {
    return res.status(400).json({
      message: "UID and email are required",
    });
  }

  try {
    let user = await User.findOne({ uid });

    if (user) {
      // Update existing user details
      user.firstName = firstName || user.firstName;
      user.email = email || user.email;
      user.photo = photo || user.photo;
    } else {
      // Create a new user with an empty watchlists array
      user = new User({ uid, firstName, email, photo, watchlists: [] });
    }

    await user.save();
    res.status(200).json({ message: "User data saved successfully", user });
  } catch (error) {
    console.error("Error saving user data:", error.message);
    res.status(500).json({ message: "Error saving user data", error: error.message });
  }
});

// Route to fetch all watchlists for a user
router.get("/watchlist/:uid", async (req, res) => {
  const { uid } = req.params;

  try {
    const user = await User.findOne({ uid });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ watchlists: user.watchlists });
  } catch (error) {
    console.error("Error fetching watchlists:", error.message);
    res.status(500).json({ message: "Error fetching watchlists", error: error.message });
  }
});

// Route to create a new watchlist
router.post("/watchlist/create", async (req, res) => {
  const { uid, watchlistName } = req.body;

  console.log("Create Watchlist Request:", { uid, watchlistName });

  if (!uid || !watchlistName) {
    return res.status(400).json({
      message: "UID and watchlist name are required",
    });
  }

  try {
    const user = await User.findOne({ uid });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if watchlist name already exists
    const exists = user.watchlists.some((wl) => wl.name === watchlistName);
    if (exists) {
      return res.status(400).json({ message: "Watchlist name already exists" });
    }

    // Add new watchlist
    user.watchlists.push({ name: watchlistName, stocks: [] });
    await user.save();

    res.status(200).json({ message: "Watchlist created", watchlists: user.watchlists });
  } catch (error) {
    console.error("Error creating watchlist:", error.message);
    res.status(500).json({ message: "Error creating watchlist", error: error.message });
  }
});

// Route to delete a watchlist
router.delete("/watchlist/delete", async (req, res) => {
  const { uid, watchlistName } = req.body;

  if (!uid || !watchlistName) {
    return res.status(400).json({
      message: "UID and watchlist name are required",
    });
  }

  try {
    const user = await User.findOne({ uid });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Filter out the watchlist to delete
    user.watchlists = user.watchlists.filter((wl) => wl.name !== watchlistName);
    await user.save();

    res.status(200).json({ message: "Watchlist deleted", watchlists: user.watchlists });
  } catch (error) {
    console.error("Error deleting watchlist:", error.message);
    res.status(500).json({ message: "Error deleting watchlist", error: error.message });
  }
});

// Route to add stocks to a specific watchlist
router.post("/watchlist/add", async (req, res) => {
  const { uid, watchlistName, stocks } = req.body;

  if (!uid || !watchlistName || !Array.isArray(stocks) || stocks.length === 0) {
    return res.status(400).json({
      message: "UID, watchlist name, and an array of stocks are required",
    });
  }

  try {
    const user = await User.findOne({ uid });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the watchlist
    const watchlist = user.watchlists.find((wl) => wl.name === watchlistName);
    if (!watchlist) {
      return res.status(404).json({ message: "Watchlist not found" });
    }

    // Add new stocks to the watchlist, avoiding duplicates
    stocks.forEach((stock) => {
      const exists = watchlist.stocks.some((s) => s.stockKey === stock.stockKey);
      if (!exists) watchlist.stocks.push(stock);
    });

    await user.save();
    res.status(200).json({ message: "Stocks added to watchlist", watchlists: user.watchlists });
  } catch (error) {
    console.error("Error adding stocks to watchlist:", error.message);
    res.status(500).json({ message: "Error adding stocks", error: error.message });
  }
});

// Route to remove a stock from a specific watchlist
router.delete("/watchlist/remove", async (req, res) => {
  const { uid, watchlistName, instrumentKey } = req.body;

  if (!uid || !watchlistName || !instrumentKey) {
    return res.status(400).json({
      message: "UID, watchlist name, and instrumentKey are required",
    });
  }

  try {
    const user = await User.findOne({ uid });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the watchlist
    const watchlist = user.watchlists.find((wl) => wl.name === watchlistName);
    if (!watchlist) {
      return res.status(404).json({ message: "Watchlist not found" });
    }

    // Remove the stock from the watchlist
    watchlist.stocks = watchlist.stocks.filter((stock) => stock.stockKey !== instrumentKey);

    await user.save();
    res.status(200).json({ message: "Stock removed from watchlist", watchlists: user.watchlists });
  } catch (error) {
    console.error("Error removing stock from watchlist:", error.message);
    res.status(500).json({ message: "Error removing stock", error: error.message });
  }
});

module.exports = router;