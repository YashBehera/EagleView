const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const router = express.Router();

const cors = require("cors");
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000'; // Fallback for local dev

router.use(cors({
  origin: `${API_URL}`, // Allow requests from React app
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_your_key_id",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "your_key_secret",
});

router.use((req, res, next) => {
  console.log("Razorpay Route:", req.method, req.url, req.body);
  next();
});

router.post("/order", async (req, res) => {
  try {
    const { amount, currency = "INR", receipt, notes } = req.body;

    // Validate required fields
    if (!amount || !receipt) {
      return res.status(400).json({ error: "Amount and receipt are required" });
    }

    // Ensure amount is in paise (Razorpay expects amount in smallest currency unit)
    const options = {
      amount: amount, // Amount in paise (e.g., 99900 for ₹999)
      currency,
      receipt,
      notes: notes || { description: "Stock EagleView Subscription" },
    };

    console.log("Creating order with options:", options);
    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).json({ error: "Failed to create order" });
    }

    res.status(200).json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Create order error:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to create order",
      details: error.response?.data || error.message,
    });
  }
});

module.exports = router;