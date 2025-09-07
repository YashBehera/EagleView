const axios = require('axios');
const { MongoClient } = require('mongodb');
const fs = require('fs').promises;

// MongoDB connection details
const mongoUrl = 'mongodb+srv://EagleView1:Kyasi%402004@cluster0.52p6p.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const dbName = 'test';
const collectionName = 'quotes';

// Upstox API details
const baseUrl = 'https://api.upstox.com/v2/market-quote/quotes';
const accessToken = 'eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI4TEFQNkgiLCJqdGkiOiI2ODQ1NmZlNDI1NDU5YTJlZGZlMWEwMzciLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6ZmFsc2UsImlhdCI6MTc0OTM4MTA5MiwiaXNzIjoidWRhcGktZ2F0ZXdheS1zZXJ2aWNlIiwiZXhwIjoxNzQ5NDIwMDAwfQ.tsIEnUx9w3rBoWAB9w4rfodnY1yIn6KkzxD8eSzEyMs';

// Headers for API request
const headers = {
  'Accept': 'application/json',
  'Authorization': `Bearer ${accessToken}`
};

// Rate limit configuration
const requestsPerSecond = 50;
const requestsPerMinute = 500;
const batchSize = 100; // Number of instrument keys per request
const delayMs = 1000; // 1-second delay between requests
const minuteDelayMs = 60000 / (requestsPerMinute / batchSize); // Spread requests over a minute
const maxRetries = 3; // Maximum retries for failed API calls

// Function to read JSON file
async function readStockData() {
  try {
    const data = await fs.readFile('merged_file.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading JSON file:', error);
    throw error;
  }
}

// Function to connect to MongoDB
async function connectToMongo() {
  const client = new MongoClient(mongoUrl);
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    return { client, collection: client.db(dbName).collection(collectionName) };
  } catch (error) {
    console.error('MongoDB connection error:', error);
    await client.close();
    throw error;
  }
}

// Function to fetch quotes for a batch of instrument keys with retry logic
async function fetchQuotes(instrumentKeys, retryCount = 0) {
  const url = `${baseUrl}?instrument_key=${instrumentKeys.join(',')}`;
  try {
    const response = await axios.get(url, { headers });
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching quotes (Attempt ${retryCount + 1}):`, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    if (retryCount < maxRetries && error.response?.status === 429) {
      const backoffMs = delayMs * Math.pow(2, retryCount);
      console.log(`Rate limit hit, retrying after ${backoffMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
      return fetchQuotes(instrumentKeys, retryCount + 1);
    }
    console.warn(`Failed to fetch quotes for keys: ${instrumentKeys.slice(0, 5).join(',')}... after ${retryCount + 1} attempts`);
    return null;
  }
}

// Function to process and store quotes
async function processAndStoreQuotes(collection, stockData) {
  let totalStored = 0;
  const failedInstrumentKeys = [];

  for (let i = 0; i < stockData.length; i += batchSize) {
    const batch = stockData.slice(i, i + batchSize);
    const instrumentKeys = batch.map(stock => stock.instrument_key.replace('|', '%7C'));
    const expectedKeys = batch.map(stock => stock.instrument_key);
    
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(stockData.length / batchSize)}`);
    
    const quotes = await fetchQuotes(instrumentKeys);
    if (quotes) {
      const receivedKeys = Object.keys(quotes).map(key => key.replace('%7C', '|'));
      const missingKeys = expectedKeys.filter(key => !receivedKeys.includes(key));
      
      if (missingKeys.length > 0) {
        console.warn(`Missing quotes for ${missingKeys.length} keys in batch ${Math.floor(i / batchSize) + 1}: ${missingKeys.slice(0, 5).join(',')}${missingKeys.length > 5 ? '...' : ''}`);
        failedInstrumentKeys.push(...missingKeys);
      }

      const documents = Object.entries(quotes).map(([key, quote]) => ({
        instrument_key: key.replace('%7C', '|'),
        timestamp: new Date(),
        quote: {
          last_price: quote.last_price,
          volume: quote.volume,
          average_price: quote.average_price,
          oi: quote.oi,
          oi_day_high: quote.oi_day_high,
          oi_day_low: quote.oi_day_low,
          last_trade_time: quote.last_trade_time,
          depth: quote.depth,
          ohlc: quote.ohlc,
          net_change: quote.net_change,
          total_buy_quantity: quote.total_buy_quantity,
          total_sell_quantity: quote.total_sell_quantity,
          lower_circuit_limit: quote.lower_circuit_limit,
          upper_circuit_limit: quote.upper_circuit_limit,
          symbol: quote.symbol,
          instrument_token: quote.instrument_token,
          quote_timestamp: quote.timestamp
        }
      }));

      try {
        const result = await collection.insertMany(documents, { ordered: false });
        const storedCount = result.insertedCount;
        totalStored += storedCount;
        console.log(`Stored ${storedCount} quotes for batch ${Math.floor(i / batchSize) + 1}`);
      } catch (error) {
        console.error(`Error storing quotes for batch ${Math.floor(i / batchSize) + 1}:`, error);
        failedInstrumentKeys.push(...receivedKeys);
      }
    } else {
      console.warn(`No quotes retrieved for batch ${Math.floor(i / batchSize) + 1}: ${instrumentKeys.slice(0, 5).join(',')}${instrumentKeys.length > 5 ? '...' : ''}`);
      failedInstrumentKeys.push(...expectedKeys);
    }

    // Respect rate limits: 50 req/s and 500 req/min
    await new Promise(resolve => setTimeout(resolve, delayMs));

    // Additional delay every 50 requests to spread over a minute
    if ((Math.floor(i / batchSize) + 1) % requestsPerSecond === 0) {
      console.log('Pausing to respect minute rate limit...');
      await new Promise(resolve => setTimeout(resolve, minuteDelayMs));
    }
  }

  // Summary
  console.log(`Summary: Stored ${totalStored} quotes out of ${stockData.length} stocks`);
  if (failedInstrumentKeys.length > 0) {
    console.log(`Failed to retrieve quotes for ${failedInstrumentKeys.length} instrument keys`);
    await fs.writeFile('failed_instrument_keys.json', JSON.stringify(failedInstrumentKeys, null, 2));
    console.log(`Saved failed instrument keys to failed_instrument_keys.json`);
  }
}

// Main function
async function main() {
  let client = null;
  let collection = null;
  try {
    // Read stock data
    const stockData = await readStockData();
    console.log(`Loaded ${stockData.length} stocks from final_datas.json`);
    
    // Connect to MongoDB
    const mongo = await connectToMongo();
    client = mongo.client;
    collection = mongo.collection;
    
    // Process and store quotes
    await processAndStoreQuotes(collection, stockData);
    
    console.log('Completed fetching and storing quotes');
  } catch (error) {
    console.error('Main process error:', error);
  } finally {
    // Close MongoDB connection if client exists
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Run the script
main();