const { MongoClient } = require('mongodb');
const axios = require('axios');

// Configuration
const MONGODB_URI = 'mongodb+srv://EagleView1:Kyasi%402004@cluster0.52p6p.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; // Update with your MongoDB URI (e.g., Atlas)
const DB_NAME = 'test'; // Update with your database name
const QUOTES_COLLECTION = 'quotes'; // Source collection for instrument tokens

const ACCESS_TOKEN = 'eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI4TEFQNkgiLCJqdGkiOiI2OGQ3Nzk0NjcyOGJjMjdkMmFjY2I0ZTYiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6ZmFsc2UsImlhdCI6MTc1ODk1MTc1MCwiaXNzIjoidWRhcGktZ2F0ZXdheS1zZXJ2aWNlIiwiZXhwIjoxNzU5MDEwNDAwfQ.vlszyHpMGo5t42hzAI35FGJnnEfIaI1zlKY3H2rbzhI'; // Your access token
const BASE_URL = 'https://api.upstox.com/v3/historical-candle';
const HEADERS = {
  'Accept': 'application/json',
  'Authorization': `Bearer ${ACCESS_TOKEN}`
};

// Helper function to add months to a date
function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

// Helper function to add quarters to a date
function addQuarters(date, quarters) {
  return addMonths(date, quarters * 3);
}

// Helper function to add years to a date
function addYears(date, years) {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().split('T')[0];
}

const TODAY = '2025-09-27';
const INTERVALS = [
  // Minutes: Batch by 1 month for 1-15, 1 quarter for 15-300, from Jan 2022
  { unit: 'minutes', value: 1, start_date: '2022-01-01', batch_size: 1, batch_func: addMonths },
  { unit: 'minutes', value: 3, start_date: '2022-01-01', batch_size: 1, batch_func: addMonths },
  { unit: 'minutes', value: 15, start_date: '2022-01-01', batch_size: 3, batch_func: addQuarters },
  { unit: 'minutes', value: 300, start_date: '2022-01-01', batch_size: 3, batch_func: addQuarters },
  // Hours: Batch by 1 quarter, from Jan 2022
  { unit: 'hours', value: 1, start_date: '2022-01-01', batch_size: 3, batch_func: addQuarters },
  { unit: 'hours', value: 4, start_date: '2022-01-01', batch_size: 3, batch_func: addQuarters },
  { unit: 'hours', value: 5, start_date: '2022-01-01', batch_size: 3, batch_func: addQuarters },
  // Days: Batch by 1 year, from Jan 2000, within 1 decade limit
  { unit: 'days', value: 1, start_date: '2000-01-01', batch_size: 1, batch_func: addYears }
];

async function connectToMongoDB() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    return client.db(DB_NAME);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

async function getInstrumentTokens(db) {
  try {
    const collection = db.collection(QUOTES_COLLECTION);
    // Fetch up to 10 unique instrument tokens
    const instruments = await collection.distinct('quote.instrument_token', {}, { limit: 10 });
    console.log(`Fetched ${instruments.length} instrument tokens:`, instruments);
    return instruments;
  } catch (error) {
    console.error('Error fetching instrument tokens:', error);
    return [];
  }
}

async function fetchHistoricalData(instrumentToken, interval, from_date, to_date) {
  try {
    const encodedInstrumentToken = instrumentToken.replace(/\|/g, '%7C');
    console.log(`Encoded instrument token: ${encodedInstrumentToken}`);
    const url = `${BASE_URL}/${encodedInstrumentToken}/${interval.unit}/${interval.value}/${to_date}/${from_date}`;
    const config = {
      method: 'get',
      url: url,
      headers: HEADERS,
      maxBodyLength: Infinity
    };

    const response = await axios(config);
    console.log(`Fetched data for ${instrumentToken} at ${interval.unit}/${interval.value} from ${from_date} to ${to_date}:`, JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error(`Error fetching data for ${instrumentToken} at ${interval.unit}/${interval.value} from ${from_date} to ${to_date}:`, error.response ? `${error.response.status} - ${error.response.data}` : error.message);
    return null;
  }
}

async function storeHistoricalData(db, instrumentToken, interval, from_date, to_date, data) {
  try {
    const collectionName = `historical_candles_${interval.unit}_${interval.value}`;
    const collection = db.collection(collectionName);
    const document = {
      instrument_token: instrumentToken,
      interval_unit: interval.unit,
      interval_value: interval.value,
      from_date: from_date,
      to_date: to_date,
      candles: data.data?.candles || [], // Upstox v2 API returns candles in data.candles
      fetched_at: new Date()
    };
    await collection.insertOne(document);
    console.log(`Stored data for ${instrumentToken} at ${interval.unit}/${interval.value} from ${from_date} to ${to_date} in ${collectionName}`);
  } catch (error) {
    console.error(`Error storing data for ${instrumentToken} at ${interval.unit}/${interval.value} from ${from_date} to ${to_date}:`, error);
  }
}

async function main() {
  const db = await connectToMongoDB();
  const instrumentTokens = await getInstrumentTokens(db);

  if (instrumentTokens.length === 0) {
    console.log('No instrument tokens found in quotes collection');
    return;
  }

  for (const instrumentToken of instrumentTokens) {
    for (const interval of INTERVALS) {
      let current_date = new Date(interval.start_date);
      while (current_date < new Date(TODAY)) {
        const from_date = current_date.toISOString().split('T')[0];
        const next_date = new Date(current_date);
        next_date.setMonth(current_date.getMonth() + interval.batch_size);
        const to_date = next_date <= new Date(TODAY) ? next_date.toISOString().split('T')[0] : TODAY;

        const data = await fetchHistoricalData(instrumentToken, interval, from_date, to_date);
        if (data && data.status === 'success') {
          await storeHistoricalData(db, instrumentToken, interval, from_date, to_date, data);
        }

        current_date = new Date(to_date);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Delay to respect rate limits
      }
    }
  }

  console.log('Process completed');
  await db.client.close();
}

main().catch(console.error);