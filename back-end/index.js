require("dotenv").config(); // Load environment variables
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const userRoutes = require("./routes/user");
const razorpayRoutes = require("./routes/razorpay");
const zerodhaRoutes = require("./routes/zerodhaRoutes");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const http = require("http");
const { Server } = require("socket.io");
const tickerStocksRoutes = require("./routes/tickerStocks");
const smallcaseRoutes = require("./routes/smallcase");
const quoteRoutes = require("./routes/quote");
const redis = require("redis");
const cron = require("node-cron");
const compression = require("compression");

const app = express();

// Initialize Redis client
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});
redisClient.on("error", (err) => console.error("Redis Client Error:", err));
redisClient.connect().then(() => console.log("Connected to Redis"));

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000'; // Fallback for local dev

// Middleware
app.use(compression()); // Enable Gzip compression
app.use(cors({
  origin: `${API_URL}`, // Allow requests from React app
  methods: ["GET", "POST", "OPTIONS", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Kite-Version"],
  credentials: true,
}));
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(express.json());

// Create HTTP server for Express and Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: `${API_URL}`, // Allow requests from React app
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});

// MongoDB Connection
const connectToMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb+srv://EagleView1:Kyasi%402004@cluster0.52p6p.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    // Create indexes for frequently queried fields
    await mongoose.model("Financials").createIndexes([
      { key: { marketCap: 1 } },
      { key: { peRatio: 1 } },
      { key: { symbol: 1 } },
      { key: { roe: 1 } },
      { key: { dividendYield: 1 } },
      { key: { roce: 1 } },
      { key: { company_name: 1 } }, // Added for search
    ]);
    await mongoose.model("Ratios").createIndexes([
      { key: { market_cap: 1 } },
      { key: { stock_pe: 1 } },
      { key: { roe: 1 } },
      { key: { roce: 1 } },
      { key: { dividend_yield: 1 } },
    ]);
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  }
};

// Mongoose Schemas
const financialsSchema = new mongoose.Schema({
  _id: String,
  balance_sheet: Object,
  cash_flow: Object,
  profit_loss: Object,
  quarterly_results: Object,
  shareholding_pattern: Object,
  face_value: Number,
  last_updated: Date,
  company_name: String,
  sector: String,
});

const quotesSchema = new mongoose.Schema({
  instrument_key: String,
  timestamp: Date,
  quote: {
    last_price: Number,
    high: Number,
    low: Number,
    change: Number,
    symbol: String,
  },
}, { collection: "quotes" });

const ratiosSchema = new mongoose.Schema({
  _id: String,
  face_value: Number,
  last_updated: Date,
  market_cap: Number,
  stock_pe: Number,
  dividend_yield: Number,
  roe: Number,
  roce: Number,
  revenue_growth: Number,
  eagle_view_score: Number,
  promoter_holding: Number,
});

const Financials = mongoose.model("Financials", financialsSchema);
const Quotes = mongoose.model("Quotes", quotesSchema);
const Ratios = mongoose.model("Ratios", ratiosSchema);

// Helper function to calculate market cap
const calculateMarketCap = (faceValue, equityCapital, lastPrice) => {
  if (!faceValue || !equityCapital || !lastPrice) return 0;
  const equityCapitalNum = parseFloat(equityCapital);
  const faceValueNum = parseFloat(faceValue);
  const lastPriceNum = parseFloat(lastPrice);
  if (isNaN(equityCapitalNum) || isNaN(faceValueNum) || isNaN(lastPriceNum) || faceValueNum === 0) return 0;
  const sharesOutstanding = equityCapitalNum / faceValueNum;
  return sharesOutstanding * lastPriceNum;
};

// Helper function to calculate financial ratios
const calculateFinancialRatios = (financials, quote) => {
  if (!financials) return {
    market_cap: 0,
    stock_pe: 0,
    dividend_yield: 0,
    roe: 0,
    roce: 0,
    revenue_growth: 0,
    eagle_view_score: 0,
    promoter_holding: 0,
  };

  const latestYearPL =
    financials.profit_loss && typeof financials.profit_loss === "object"
      ? Object.keys(financials.profit_loss).sort().pop()
      : null;
  const profitLoss = latestYearPL ? financials.profit_loss[latestYearPL] : {};
  const balanceSheet = financials.balance_sheet && latestYearPL ? financials.balance_sheet[latestYearPL] : {};

  const lastPrice = quote?.quote?.last_price || 0;
  const equityCapital = balanceSheet["equity capital"] || 0;
  const marketCap = calculateMarketCap(financials.face_value, equityCapital, lastPrice);

  const eps = profitLoss["EPS"] ? parseFloat(profitLoss["EPS"]) : 0;
  const stockPe = eps !== 0 ? lastPrice / eps : 0;

  const dividendPerShare = profitLoss["Dividend"] ? parseFloat(profitLoss["Dividend"]) : 0;
  const dividendYield = lastPrice !== 0 ? (dividendPerShare / lastPrice) * 100 : 0;

  const netProfit = profitLoss["Net Profit"] ? parseFloat(profitLoss["Net Profit"]) : 0;
  const equity = balanceSheet["reserves"] && balanceSheet["equity capital"]
    ? parseFloat(balanceSheet["reserves"]) + parseFloat(balanceSheet["equity capital"])
    : 0;
  const roe = equity !== 0 ? (netProfit / equity) * 100 : 0;

  const ebit = profitLoss["PBT"] ? parseFloat(profitLoss["PBT"]) + parseFloat(profitLoss["Interest"] || 0) : 0;
  const totalCapital = balanceSheet["borrowings"] && balanceSheet["reserves"] && balanceSheet["equity capital"]
    ? parseFloat(balanceSheet["borrowings"]) + parseFloat(balanceSheet["reserves"]) + parseFloat(balanceSheet["equity capital"])
    : 0;
  const roce = totalCapital !== 0 ? (ebit / totalCapital) * 100 : 0;

  const revenueGrowth = profitLoss["Sales"]
    ? parseFloat(profitLoss["Sales"]) / 100
    : 0;

  const promoterHolding =
    financials.shareholding_pattern?.[latestYearPL]?.["promoters"]
      ? parseFloat(financials.shareholding_pattern[latestYearPL]["promoters"].replace("%", "") || 0)
      : 0;

  const debtToEquity =
    balanceSheet["borrowings"] && balanceSheet["equity capital"] && balanceSheet["reserves"]
      ? parseFloat(balanceSheet["borrowings"]) /
      (parseFloat(balanceSheet["equity capital"]) + parseFloat(balanceSheet["reserves"]))
      : 0;

  const weights = {
    salesGrowth: 0.25,
    profitGrowth: 0.25,
    marketCap: 0.15,
    roe: 0.20,
    promoterHolding: 0.10,
    debtToEquity: 0.05,
  };

  const salesGrowth = profitLoss["Sales"]
    ? Math.min((parseFloat(profitLoss["Sales"]) / 1000) * 10, 100)
    : 0;
  const profitGrowth = profitLoss["Net Profit"]
    ? Math.min((parseFloat(profitLoss["Net Profit"]) / 100) * 10, 100)
    : 0;
  const marketCapScore = marketCap
    ? Math.min((marketCap / 10000) * 10, 100)
    : 0;

  const eagleViewScore = (
    salesGrowth * weights.salesGrowth +
    profitGrowth * weights.profitGrowth +
    marketCapScore * weights.marketCap +
    roe * weights.roe +
    promoterHolding * weights.promoterHolding +
    (100 - debtToEquity * 100) * weights.debtToEquity
  ).toFixed(1);

  return {
    market_cap: marketCap,
    stock_pe: stockPe,
    dividend_yield: dividendYield,
    roe,
    roce,
    revenue_growth: revenueGrowth,
    eagle_view_score: parseFloat(eagleViewScore),
    promoter_holding: promoterHolding,
  };
};

// Cron job to precompute financial ratios
cron.schedule("0 0 * * *", async () => {
  console.log("Running nightly metrics update...");
  try {
    const stocks = await Financials.find({}, {
      _id: 1,
      balance_sheet: 1,
      profit_loss: 1,
      shareholding_pattern: 1,
      face_value: 1,
    }).lean();
    for (const stock of stocks) {
      const quote = await Quotes.findOne({ "quote.symbol": stock._id }).lean();
      const ratios = calculateFinancialRatios(stock, quote);

      await Ratios.updateOne(
        { _id: stock._id },
        {
          $set: {
            face_value: stock.face_value || 0,
            last_updated: new Date(),
            ...ratios,
          },
        },
        { upsert: true }
      );
    }
    console.log("Metrics update completed.");
  } catch (error) {
    console.error("Error updating metrics:", error);
  }
});

// Socket.IO for real-time quotes
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  socket.on("subscribe_quotes", async (instrumentKeys) => {
    console.log("Subscribing to quotes:", instrumentKeys);
    try {
      const quotes = await Promise.all(
        instrumentKeys.map(async (key) => {
          const cached = await redisClient.get(`quote:${key}`);
          if (cached) return { instrumentKey: key, quote: JSON.parse(cached) };

          const quote = await Quotes.findOne({ instrument_key: key }).lean();
          if (quote) {
            await redisClient.setEx(`quote:${key}`, 60, JSON.stringify(quote.quote));
            return { instrumentKey: key, quote: quote.quote };
          }
          return { instrumentKey: key, quote: null };
        })
      );
      socket.emit("quotes", quotes);
    } catch (error) {
      console.error("Error fetching quotes:", error);
    }
  });
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// =================================================================
// START: UPDATED SECTION FOR QUERY PARSING
// =================================================================

/**
 * Parses a financial query string into a MongoDB query object.
 * e.g., "market cap > 10000 and pe ratio < 20"
 * @param {string} queryStr The financial query string.
 * @returns {object} A MongoDB query object.
 */
const parseFinancialQuery = (queryStr) => {
    const mongoQuery = { $and: [] };

    // Maps frontend-friendly names to backend schema fields
    const fieldMap = {
        'market capitalization': 'market_cap',
        'market cap': 'market_cap',
        'pe ratio': 'stock_pe',
        'p/e ratio': 'stock_pe',
        'roe': 'roe',
        'return on equity': 'roe',
        'roce': 'roce',
        'return on capital employed': 'roce',
        'dividend yield': 'dividend_yield',
        'revenue growth': 'revenue_growth',
        'promoter holding': 'promoter_holding',
        'eagleview score': 'eagle_view_score'
    };

    // Maps operators to MongoDB query operators
    const operatorMap = {
        '>': '$gt',
        '>=': '$gte',
        '<': '$lt',
        '<=': '$lte',
        '=': '$eq',
        '!=': '$ne',
    };

    // Split query by 'and' or '&'
    const conditions = queryStr.toLowerCase().split(/\s+and\s+|\s*&\s*/);

    for (const condition of conditions) {
        // Regex to capture: field, operator, and value
        const match = condition.trim().match(/^([a-z\s/]+?)\s*([<>=!]+)\s*([\d.-]+)$/);

        if (match) {
            const [, rawField, operator, rawValue] = match;
            const field = fieldMap[rawField.trim()];
            const mongoOperator = operatorMap[operator];
            let value = parseFloat(rawValue);

            if (field && mongoOperator && !isNaN(value)) {
                // Handle special cases: Market Cap is often written in Crores
                if (field === 'market_cap') {
                    value = value * 10000000; // Convert Crores to absolute value
                }
                mongoQuery.$and.push({ [field]: { [mongoOperator]: value } });
            }
        }
    }

    return mongoQuery.$and.length > 0 ? mongoQuery : {};
};

// API Endpoint to Fetch Paginated Stock Data
app.get("/api/stocks", async (req, res) => {
    // Destructure all possible query params
    const {
        page = 1,
        limit = 20,
        filters = "{}",
        sort = "{}",
        search,
        financialQuery,
        alternateDataQuery, // Note: Not implemented due to schema limitations
        onlyDec2024,        // Note: Not implemented due to schema limitations
        hasSuperstarInvestors, // Note: Not implemented due to schema limitations
        isSME               // Note: Not implemented due to schema limitations
    } = req.query;

    const parsedFilters = JSON.parse(filters);
    const parsedSort = JSON.parse(sort);
    
    // Updated cache key to include all relevant query parameters
    const cacheKey = `stocks:v2:${page}:${limit}:${filters}:${sort}:${search || ''}:${financialQuery || ''}`;

    try {
        // Check Redis cache
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            console.log("Serving from cache:", cacheKey);
            return res.json(JSON.parse(cached));
        }

        let query = {};

        // 1. Build query from standard range filters
        const filterMappings = {
            marketCap: 'market_cap',
            peRatio: 'stock_pe',
            roe: 'roe',
            dividendYield: 'dividend_yield',
            revenueGrowth: 'revenue_growth',
            promoterHolding: 'promoter_holding',
        };

        for (const key in parsedFilters) {
            if (filterMappings[key] && parsedFilters[key].min !== undefined && parsedFilters[key].max !== undefined) {
                query[filterMappings[key]] = {
                    $gte: parsedFilters[key].min,
                    $lte: parsedFilters[key].max,
                    $ne: null
                };
            }
        }
        
        // 2. Build query from natural language financial query
        if (financialQuery) {
            const financialQueryObject = parseFinancialQuery(financialQuery);
            if (financialQueryObject.$and && financialQueryObject.$and.length > 0) {
                if (!query.$and) query.$and = [];
                query.$and.push(...financialQueryObject.$and);
            }
        }

        // 3. Add text search query
        if (search) {
            const searchQuery = {
                $or: [
                    { _id: new RegExp(search, 'i') },
                    { company_name: new RegExp(search, 'i') },
                ],
            };
            if (!query.$and) query.$and = [];
            query.$and.push(searchQuery);
        }
        
        // Note: Logic for boolean flags like isSME, hasSuperstarInvestors would go here
        // if the data was available in the schema. For example:
        // if (isSME === 'true') {
        //   if (!query.$and) query.$and = [];
        //   query.$and.push({ is_sme_flag: true });
        // }


        console.log("Executing MongoDB Query:", JSON.stringify(query));

        // Fetch paginated data
        const ratios = await Ratios.find(query, {
            _id: 1,
            market_cap: 1,
            stock_pe: 1,
            dividend_yield: 1,
            roe: 1,
            roce: 1,
            revenue_growth: 1,
            eagle_view_score: 1,
            promoter_holding: 1,
        })
        .sort(Object.keys(parsedSort).length > 0 ? parsedSort : { eagle_view_score: -1 }) // Default sort
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit))
        .lean();

        const total = await Ratios.countDocuments(query);
        console.log(`Found ${total} stocks matching query.`);

        const stockData = await Promise.all(
            ratios.map(async (ratio) => {
                const [financials, quote] = await Promise.all([
                    Financials.findOne({ _id: ratio._id }, { company_name: 1, sector: 1 }).lean(),
                    Quotes.findOne({ "quote.symbol": ratio._id }).lean(),
                ]);

                return {
                    id: ratio._id,
                    name: financials?.company_name || ratio._id,
                    tradingSymbol: ratio._id,
                    symbol: ratio._id,
                    sector: financials?.sector || "N/A",
                    marketCap: ratio.market_cap || 0,
                    peRatio: ratio.stock_pe || 0,
                    eagleViewScore: ratio.eagle_view_score || 0,
                    roe: ratio.roe || 0,
                    roce: ratio.roce || 0,
                    dividendYield: ratio.dividend_yield || 0,
                    revenueGrowth: ratio.revenue_growth || 0,
                    promoterHolding: ratio.promoter_holding || 0,
                    price: quote?.quote?.last_price || 0,
                    change: quote?.quote?.change || 0,
                    instrumentKey: quote?.instrument_key || "",
                };
            })
        );

        // Cache result for 5 minutes
        await redisClient.setEx(cacheKey, 300, JSON.stringify({ stocks: stockData, total }));
        res.json({ stocks: stockData, total });
    } catch (error) {
        console.error("Error fetching stocks:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


// =================================================================
// END: UPDATED SECTION
// =================================================================


// NEW API Endpoint to Search Stocks
app.get("/api/stock/search/:term", async (req, res) => {
  const { term } = req.params;
  const cacheKey = `search:${term.toUpperCase()}`;

  try {
    // Check Redis cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log(`Serving from cache: ${cacheKey}`);
      return res.json(JSON.parse(cached));
    }

    // Search in Financials collection for matching symbol or company name
    const query = {
      $or: [
        { _id: new RegExp(`^${term.toUpperCase()}`, "i") }, // Match symbol starting with term
        { company_name: new RegExp(term, "i") }, // Match company name containing term
      ],
    };

    const financials = await Financials.find(query, {
      _id: 1,
      company_name: 1,
      sector: 1,
    })
      .limit(10) // Limit to 10 suggestions
      .lean();

    const stocks = financials.map((stock) => ({
      trading_symbol: stock._id,
      name: stock.company_name || stock._id,
      sector: stock.sector || "N/A",
    }));

    // Cache result for 1 hour
    await redisClient.setEx(cacheKey, 3600, JSON.stringify({ stocks }));
    res.json({ stocks });
  } catch (error) {
    console.error("Error searching stocks:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API Endpoint to Fetch Stock Data (for individual stock details)
app.get("/api/stock/:symbol", async (req, res) => {
  const { symbol } = req.params;
  const cacheKey = `stock:${symbol}`;

  try {
    // Check Redis cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log(`Serving from cache: ${cacheKey}`);
      return res.json(JSON.parse(cached));
    }

    const [financials, ratios, quote] = await Promise.all([
      Financials.findOne({ _id: symbol }).lean(),
      Ratios.findOne({ _id: symbol }).lean(),
      Quotes.findOne({ "quote.symbol": symbol }).lean(),
    ]);

    if (!financials && !ratios && !quote) {
      console.warn(`No data found for symbol ${symbol}`);
      return res.status(404).json({ error: `No data found for symbol ${symbol}` });
    }

    const stockData = {
      financials,
      ratios: ratios || {
        market_cap: 0,
        stock_pe: 0,
        dividend_yield: 0,
        roe: 0,
        roce: 0,
        revenue_growth: 0,
        eagle_view_score: 0,
      },
      quote: quote ? { ...quote, instrument_id: quote.instrument_key } : null,
    };

    // Cache for 5 minutes
    await redisClient.setEx(cacheKey, 300, JSON.stringify(stockData));
    res.json(stockData);
  } catch (error) {
    console.error("Error fetching stock data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API Endpoint to Fetch Quote Data
app.get("/api/stock/quote/:instrumentKey", async (req, res) => {
  const { instrumentKey } = req.params;
  const cacheKey = `quote:${instrumentKey}`;

  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log(`Serving from cache: ${cacheKey}`);
      return res.json({ quote: JSON.parse(cached) });
    }

    const quote = await Quotes.findOne({ instrument_key: instrumentKey }).lean();
    if (!quote) {
      console.warn(`No quote data found for instrument_key ${instrumentKey}`);
      return res.status(404).json({ error: `No quote data found for instrument key ${instrumentKey}` });
    }

    await redisClient.setEx(cacheKey, 60, JSON.stringify(quote.quote));
    res.json({ quote: quote.quote });
  } catch (error) {
    console.error("Error fetching quote data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Batch Quote Fetching
app.post("/api/stock/quotes", async (req, res) => {
  const { instrumentKeys } = req.body;
  try {
    const quotes = await Promise.all(
      instrumentKeys.map(async (key) => {
        const cached = await redisClient.get(`quote:${key}`);
        if (cached) return { instrumentKey: key, quote: JSON.parse(cached) };

        const quote = await Quotes.findOne({ instrument_key: key }).lean();
        if (quote) {
          await redisClient.setEx(`quote:${key}`, 60, JSON.stringify(quote.quote));
          return { instrumentKey: key, quote: quote.quote };
        }
        return { instrumentKey: key, quote: null };
      })
    );
    res.json(quotes);
  } catch (error) {
    console.error("Error fetching batch quotes:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Routes
app.use("/api", userRoutes);
app.use("/zerodha", zerodhaRoutes);
app.use("/razorpay", razorpayRoutes);
app.use("/api/ticker-stocks", tickerStocksRoutes);
app.use("/smallcase", smallcaseRoutes);
app.use("/webhook", smallcaseRoutes);
app.use("/api/quote", quoteRoutes);

// Razorpay Instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_your_key_id",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "your_key_secret",
});

// Razorpay Routes
app.post("/order", async (req, res) => {
  try {
    const { amount, currency = "INR", receipt, notes } = req.body;
    if (!amount || !receipt) {
      return res.status(400).json({ error: "Amount and receipt are required" });
    }

    const options = {
      amount,
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

app.post("/order/validate", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const sha = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
  sha.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const digest = sha.digest("hex");

  if (digest !== razorpay_signature) {
    return res.status(400).json({ msg: "Transaction is not legit!" });
  }

  res.json({
    msg: "success",
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
  });
});

// Smallcase Webhook
app.post("/webhook/smallcase-holdings", (req, res) => {
  console.log("Webhook received:", JSON.stringify(req.body, null, 2));
  res.status(200).json({ message: "Webhook received" });
});

// Test Route
app.get("/api/test", (req, res) => {
  res.status(200).json({ message: "API prefix is working" });
});

// Health Check Route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Log Registered Routes
app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    console.log(`Route: ${middleware.route.path} - Method: ${Object.keys(middleware.route.methods).join(", ")}`);
  } else if (middleware.name === "router") {
    middleware.handle.stack.forEach((handler) => {
      const route = handler.route;
      if (route) {
        const path = middleware.regexp.source.includes("api") ? `/api${route.path}` : route.path;
        console.log(`Route: ${path} - Method: ${Object.keys(route.methods).join(", ")}`);
      }
    });
  }
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).json({ message: "An error occurred", error: err.message });
});

// Start Server
const startServer = async () => {
  await connectToMongoDB();
  server.listen(process.env.PORT || 4000, () => {
    console.log(`Server is running on http://localhost:${process.env.PORT || 4000}`);
  });
};

startServer();

console.log("Loaded Environment Variables:", {
  MONGO_URI: process.env.MONGO_URI ? "Set" : "Not set",
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID ? "Set" : "Not set",
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET ? "Set" : "Not set",
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET ? "Set" : "Not set",
  REDIS_URL: process.env.REDIS_URL ? "Set" : "Not set",
});

module.exports = app;