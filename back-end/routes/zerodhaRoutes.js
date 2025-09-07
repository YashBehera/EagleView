const express = require("express");
const { KiteConnect } = require("kiteconnect");
const router = express.Router();
const axios = require("axios");
const crypto = require("crypto");

const cors = require("cors");
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000'; // Fallback for local dev
router.use(express.urlencoded({ extended: true }));
router.use(cors({
    origin: `${API_URL}`, // Allow requests from React app
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Kite-Version"], // Add X-Kite-Version
    credentials: true,
}));

const kite = new KiteConnect({ api_key: "arrymt32esayamez" });

const API_KEY = "arrymt32esayamez";
const API_SECRET = "3rwbiru2xlxjh41nlm30xtg1c0zfzk5r";

// Valid constants from glossary
const VALID_VARIETIES = ["regular", "amo", "co", "iceberg", "auction"];
const VALID_ORDER_TYPES = ["MARKET", "LIMIT", "SL", "SL-M"];
const VALID_PRODUCTS = ["CNC", "NRML", "MIS", "MTF"];
const VALID_VALIDITIES = ["DAY", "IOC", "TTL"];

// Middleware to validate order parameters
const validateOrderParams = (req, res, next) => {
    const { tradingsymbol, exchange, transaction_type, order_type, quantity, product, validity, price, trigger_price, validity_ttl } = req.body;
    const variety = req.params.variety;

    console.log("Received request body:", req.body); // Debug log

    if (!VALID_VARIETIES.includes(variety)) {
        return res.status(400).json({ error: `Invalid variety. Must be one of: ${VALID_VARIETIES.join(", ")}` });
    }
    if (!tradingsymbol) {
        return res.status(400).json({ error: "Missing tradingsymbol" });
    }
    if (!exchange) {
        return res.status(400).json({ error: "Missing exchange" });
    }
    if (!transaction_type || !["BUY", "SELL"].includes(transaction_type)) {
        return res.status(400).json({ error: "Invalid transaction_type. Must be BUY or SELL" });
    }
    if (!order_type || !VALID_ORDER_TYPES.includes(order_type)) {
        return res.status(400).json({ error: `Invalid order_type. Must be one of: ${VALID_ORDER_TYPES.join(", ")}` });
    }
    if (!quantity || !Number.isInteger(Number(quantity)) || Number(quantity) <= 0) {
        return res.status(400).json({ error: "Invalid quantity. Must be a positive integer" });
    }
    if (!product || !VALID_PRODUCTS.includes(product)) {
        return res.status(400).json({ error: `Invalid product. Must be one of: ${VALID_PRODUCTS.join(", ")}` });
    }
    if (validity && !VALID_VALIDITIES.includes(validity)) {
        return res.status(400).json({ error: `Invalid validity. Must be one of: ${VALID_VALIDITIES.join(", ")}` });
    }
    if ((order_type === "LIMIT" || order_type === "SL") && (!price || Number(price) <= 0)) {
        return res.status(400).json({ error: "Invalid price. Must be a positive number for LIMIT or SL orders" });
    }
    if ((order_type === "SL" || order_type === "SL-M") && (!trigger_price || Number(trigger_price) <= 0)) {
        return res.status(400).json({ error: "Invalid trigger_price. Must be a positive number for SL or SL-M orders" });
    }
    if (validity === "TTL" && (!validity_ttl || !Number.isInteger(Number(validity_ttl)) || Number(validity_ttl) <= 0)) {
        return res.status(400).json({ error: "Invalid validity_ttl. Must be a positive integer for TTL validity" });
    }

    next();
};

router.options("*", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", `${API_URL}`);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Kite-Version");
    res.setHeader("Access-Control-Max-Age", "86400");
    res.sendStatus(204);
});

// Authentication route
router.get("/auth/zerodha", async (req, res) => {
    const { request_token } = req.query;

    if (!request_token) {
        return res.status(400).json({ error: "Missing request_token" });
    }

    console.log("API_KEY being used:", API_KEY);
    console.log("Request token received:", request_token);
    console.log("API_SECRET being used:", API_SECRET);

    try {
        const checksum = crypto
            .createHash("sha256")
            .update(`${API_KEY}${request_token}${API_SECRET}`)
            .digest("hex");

        console.log("Generated checksum:", checksum);

        const response = await axios.post("https://api.kite.trade/session/token", {
            api_key: API_KEY,
            request_token,
            checksum,
        }, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const accessToken = response.data.data.access_token;
        res.json({ accessToken });
    } catch (error) {
        console.error("Full authentication error:", {
            message: error.message,
            response: error.response ? error.response.data : null,
            request: error.request ? error.request : null,
            config: error.config ? error.config : null
        });
        res.status(500).json({
            error: "Authentication failed",
            details: error.response?.data || error.message
        });
    }
});

// Holdings route
router.get("/holdings", async (req, res) => {
    const accessToken = req.headers.authorization?.split(" ")[1];

    if (!accessToken) {
        return res.status(401).json({ error: "No access token provided" });
    }

    try {
        const response = await axios.get("https://api.kite.trade/portfolio/holdings", {
            headers: {
                "X-Kite-Version": "3",
                "Authorization": `token ${API_KEY}:${accessToken}`,
                "Content-Type": "application/json"
            }
        });

        // Normalize the holdings data to match portfolio structure
        const holdings = response.data.data.map(holding => ({
            tradingsymbol: holding.tradingsymbol,
            exchange: holding.exchange,
            instrument_token: holding.instrument_token,
            isin: holding.isin,
            product: holding.product,
            quantity: holding.quantity,
            t1_quantity: holding.t1_quantity || 0,
            average_price: holding.average_price,
            last_price: holding.last_price,
            close_price: holding.close_price,
            pnl: holding.pnl,
            day_change_percentage: holding.day_change_percentage,
            is_holding: true // Flag to identify holdings
        }));

        res.json(holdings);
    } catch (error) {
        console.error("Error fetching holdings:", {
            message: error.message,
            response: error.response ? error.response.data : null
        });
        res.status(500).json({
            message: "Failed to fetch holdings",
            details: error.response?.data?.message || error.message
        });
    }
});

// Portfolio route
router.get("/portfolio", async (req, res) => {
    const accessToken = req.headers.authorization?.split(" ")[1];

    if (!accessToken) {
        return res.status(401).json({ error: "No access token provided" });
    }

    try {
        // Fetch both holdings and positions
        const [holdingsResponse, positionsResponse] = await Promise.all([
            axios.get("https://api.kite.trade/portfolio/holdings", {
                headers: {
                    "X-Kite-Version": "3",
                    "Authorization": `token ${API_KEY}:${accessToken}`,
                    "Content-Type": "application/json"
                }
            }),
            axios.get("https://api.kite.trade/portfolio/positions", {
                headers: {
                    "X-Kite-Version": "3",
                    "Authorization": `token ${API_KEY}:${accessToken}`,
                    "Content-Type": "application/json"
                }
            })
        ]);

        // Create a map to store unique instruments
        const portfolioMap = new Map();

        // Process holdings
        holdingsResponse.data.data.forEach(holding => {
            const key = `${holding.tradingsymbol}_${holding.exchange}`;
            portfolioMap.set(key, {
                tradingsymbol: holding.tradingsymbol,
                exchange: holding.exchange,
                instrument_token: holding.instrument_token,
                isin: holding.isin,
                product: holding.product,
                quantity: holding.quantity,
                t1_quantity: holding.t1_quantity || 0,
                average_price: holding.average_price,
                last_price: holding.last_price,
                close_price: holding.close_price,
                pnl: holding.pnl,
                day_change_percentage: holding.day_change_percentage,
                is_holding: true
            });
        });

        // Process positions (only add if not already in holdings)
        positionsResponse.data.data.net.forEach(position => {
            const key = `${position.tradingsymbol}_${position.exchange}`;
            if (!portfolioMap.has(key)) {
                portfolioMap.set(key, {
                    tradingsymbol: position.tradingsymbol,
                    exchange: position.exchange,
                    instrument_token: position.instrument_token,
                    product: position.product,
                    quantity: position.quantity,
                    average_price: position.average_price,
                    last_price: position.last_price,
                    close_price: position.close_price,
                    pnl: position.pnl,
                    day_change_percentage: position.day_change_percentage,
                    is_holding: false
                });
            }
        });

        // Convert map values to array
        const portfolio = Array.from(portfolioMap.values());

        res.json(portfolio);
    } catch (error) {
        console.error("Error fetching portfolio:", error);
        res.status(500).json({
            message: "Failed to fetch portfolio",
            details: error.message
        });
    }
});

// Profile route
router.get("/profile", async (req, res) => {
    const accessToken = req.headers.authorization?.split(" ")[1];

    if (!accessToken) {
        return res.status(401).json({ error: "No access token provided" });
    }

    try {
        kite.setAccessToken(accessToken);
        const profile = await kite.getProfile();
        res.json(profile);
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({
            message: "Failed to fetch user profile",
            details: error.message,
        });
    }
});

// Funds route
router.get("/funds", async (req, res) => {
    const accessToken = req.headers.authorization?.split(" ")[1];

    if (!accessToken) {
        return res.status(401).json({ error: "No access token provided" });
    }

    try {
        const response = await axios.get("https://api.kite.trade/user/margins", {
            headers: {
                "X-Kite-Version": "3",
                "Authorization": `token ${API_KEY}:${accessToken}`,
                "Content-Type": "application/json"
            }
        });

        const equity = response.data.data.equity || {};
        res.json({
            total: equity.net || 0,
            available: equity.available?.cash || 0,
            used: equity.utilised?.debits || 0,
        });
    } catch (error) {
        console.error("Error fetching funds:", {
            message: error.message,
            response: error.response ? error.response.data : null
        });
        res.status(500).json({
            message: "Failed to fetch funds",
            details: error.response?.data?.message || error.message
        });
    }
});

// Zerodha Positions
router.get("/positions", async (req, res) => {
    const accessToken = req.headers.authorization?.split(" ")[1];

    if (!accessToken) {
        return res.status(401).json({ error: "No access token provided" });
    }

    try {
        kite.setAccessToken(accessToken);
        const positions = await kite.getPositions();
        const normalizedPositions = positions.net.map((position) => ({
            tradingsymbol: position.tradingsymbol,
            instrument_token: position.instrument_token,
            quantity: position.quantity,
            average_price: position.average_price,
            last_price: position.last_price,
            product: position.product,
        }));
        res.json(normalizedPositions);
    } catch (error) {
        console.error("Error fetching positions:", error);
        res.status(500).json({
            message: "Failed to fetch positions",
            details: error.message,
        });
    }
});

// Place Order
router.post("/orders/:variety", validateOrderParams, async (req, res) => {
    const accessToken = req.headers.authorization?.split(" ")[1];
    const { variety } = req.params;
    const { tradingsymbol, exchange, transaction_type, order_type, quantity, product, validity, price, trigger_price, validity_ttl } = req.body;
    console.log("Placing order with params:", { tradingsymbol, exchange, transaction_type, order_type, quantity, product, validity }); // Debug log

    if (!accessToken) {
        return res.status(401).json({ error: "No access token provided" });
    }

    try {
        kite.setAccessToken(accessToken);
        const orderParams = {
            tradingsymbol,
            exchange,
            transaction_type,
            order_type,
            quantity: Number(quantity), // Ensure quantity is a number
            product,
            validity: validity || "DAY",
            ...(price && { price: Number(price) }),
            ...(trigger_price && { trigger_price: Number(trigger_price) }),
            ...(validity_ttl && { validity_ttl: Number(validity_ttl) }),
        };
        const order = await kite.placeOrder(variety, orderParams);
        res.json({ order_id: order.order_id });
    } catch (error) {
        console.error("Error placing order:", error);
        res.status(500).json({
            message: "Failed to place order",
            details: error.message,
        });
    }
});

// Modify Order
router.put("/orders/:variety/:order_id", validateOrderParams, async (req, res) => {
    const accessToken = req.headers.authorization?.split(" ")[1];
    const { variety, order_id } = req.params;
    const { tradingsymbol, exchange, transaction_type, order_type, quantity, product, validity, price, trigger_price, validity_ttl } = req.body;

    if (!accessToken) {
        return res.status(401).json({ error: "No access token provided" });
    }

    try {
        kite.setAccessToken(accessToken);
        const orderParams = {
            order_id,
            tradingsymbol,
            exchange,
            transaction_type,
            order_type,
            quantity,
            product,
            validity: validity || "DAY",
            ...(price && { price }),
            ...(trigger_price && { trigger_price }),
            ...(validity_ttl && { validity_ttl }),
        };
        const order = await kite.modifyOrder(variety, order_id, orderParams);
        res.json({ order_id: order.order_id });
    } catch (error) {
        console.error("Error modifying order:", error);
        res.status(500).json({
            message: "Failed to modify order",
            details: error.message,
        });
    }
});

// Cancel Order
router.delete("/orders/:variety/:order_id", async (req, res) => {
    const accessToken = req.headers.authorization?.split(" ")[1];
    const { variety, order_id } = req.params;

    if (!accessToken) {
        return res.status(401).json({ error: "No access token provided" });
    }

    if (!VALID_VARIETIES.includes(variety)) {
        return res.status(400).json({ error: `Invalid variety. Must be one of: ${VALID_VARIETIES.join(", ")}` });
    }

    try {
        kite.setAccessToken(accessToken);
        const order = await kite.cancelOrder(variety, order_id);
        res.json({ order_id: order.order_id });
    } catch (error) {
        console.error("Error cancelling order:", error);
        res.status(500).json({
            message: "Failed to cancel order",
            details: error.message,
        });
    }
});

// Get All Orders
router.get("/orders", async (req, res) => {
    const accessToken = req.headers.authorization?.split(" ")[1];

    if (!accessToken) {
        return res.status(401).json({ error: "No access token provided" });
    }

    try {
        kite.setAccessToken(accessToken);
        const orders = await kite.getOrders();
        res.json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({
            message: "Failed to fetch orders",
            details: error.message,
        });
    }
});

// Get Order History
router.get("/orders/:order_id", async (req, res) => {
    const accessToken = req.headers.authorization?.split(" ")[1];
    const { order_id } = req.params;

    if (!accessToken) {
        return res.status(401).json({ error: "No access token provided" });
    }

    try {
        kite.setAccessToken(accessToken);
        const orderHistory = await kite.getOrderHistory(order_id);
        res.json(orderHistory);
    } catch (error) {
        console.error("Error fetching order history:", error);
        res.status(500).json({
            message: "Failed to fetch order history",
            details: error.message,
        });
    }
});

// Get All Trades
router.get("/trades", async (req, res) => {
    const accessToken = req.headers.authorization?.split(" ")[1];

    if (!accessToken) {
        return res.status(401).json({ error: "No access token provided" });
    }

    try {
        kite.setAccessToken(accessToken);
        const trades = await kite.getTrades();
        res.json(trades);
    } catch (error) {
        console.error("Error fetching trades:", error);
        res.status(500).json({
            message: "Failed to fetch trades",
            details: error.message,
        });
    }
});

// Get Trades for an Order
router.get("/orders/:order_id/trades", async (req, res) => {
    const accessToken = req.headers.authorization?.split(" ")[1];
    const { order_id } = req.params;

    if (!accessToken) {
        return res.status(401).json({ error: "No access token provided" });
    }

    try {
        kite.setAccessToken(accessToken);
        const trades = await kite.getOrderTrades(order_id);
        res.json(trades);
    } catch (error) {
        console.error("Error fetching order trades:", error);
        res.status(500).json({
            message: "Failed to fetch order trades",
            details: error.message,
        });
    }
});

// Logout route
router.post("/logout", async (req, res) => {
    const accessToken = req.headers.authorization?.split(" ")[1];

    if (!accessToken) {
        return res.status(401).json({ error: "No access token provided" });
    }

    try {
        kite.setAccessToken(accessToken);
        await kite.invalidateAccessToken(accessToken);
        res.json({ message: "Successfully logged out from Zerodha" });
    } catch (error) {
        console.error("Error during logout:", error);
        res.status(500).json({
            message: "Failed to log out",
            details: error.message,
        });
    }
});

module.exports = router;