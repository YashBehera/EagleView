import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Since we're using ESM, we need to get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read JSON files using fs
const filteredUniqueDatas = JSON.parse(
  readFileSync(path.join(__dirname, "filtered_unique_datas.json"), "utf8")
);
const financials = JSON.parse(
  readFileSync(path.join(__dirname, "financials.json"), "utf8")
);
const fundamentals = JSON.parse(
  readFileSync(path.join(__dirname, "fundamentals.json"), "utf8")
);

// Helper function to ensure the data is an array
function ensureArray(data) {
  if (Array.isArray(data)) {
    return data;
  }
  return [data];
}

// Function to merge the three JSON datasets
function mergeStockData(filteredUniqueDatas, financials, fundamentals) {
  try {
    // Ensure all inputs are arrays
    const filteredUniqueDatasArray = ensureArray(filteredUniqueDatas);
    const financialsArray = ensureArray(financials);
    const fundamentalsArray = ensureArray(fundamentals);

    // Validate that the data contains the expected fields
    if (!filteredUniqueDatasArray.every(stock => stock.trading_symbol)) {
      throw new Error("filteredUniqueDatas is missing trading_symbol in some entries");
    }
    if (!financialsArray.every(stock => stock._id)) {
      throw new Error("financials is missing _id in some entries");
    }
    if (!fundamentalsArray.every(stock => stock._id)) {
      throw new Error("fundamentals is missing _id in some entries");
    }

    // Create a map to store merged stock data, using _id as the key
    const mergedDataMap = new Map();

    // Step 1: Process filteredUniqueDatas and use trading_symbol as the key
    filteredUniqueDatasArray.forEach(stock => {
      const stockId = stock.trading_symbol;
      mergedDataMap.set(stockId, { ...stock });
    });

    // Step 2: Merge financials data
    financialsArray.forEach(stock => {
      const stockId = stock._id;
      if (mergedDataMap.has(stockId)) {
        mergedDataMap.set(stockId, {
          ...mergedDataMap.get(stockId),
          financials: { ...stock }
        });
      } else {
        mergedDataMap.set(stockId, {
          financials: { ...stock }
        });
      }
    });

    // Step 3: Merge fundamentals data
    fundamentalsArray.forEach(stock => {
      const stockId = stock._id;
      if (mergedDataMap.has(stockId)) {
        mergedDataMap.set(stockId, {
          ...mergedDataMap.get(stockId),
          fundamentals: { ...stock }
        });
      } else {
        mergedDataMap.set(stockId, {
          fundamentals: { ...stock }
        });
      }
    });

    // Convert the map back to an array
    const mergedData = Array.from(mergedDataMap.entries()).map(([stockId, stockData]) => ({
      _id: stockId,
      ...stockData
    }));

    return mergedData;
  } catch (error) {
    console.error("Error merging stock data:", error.message);
    return [];
  }
}

// Execute the merge
const mergedStocks = mergeStockData(filteredUniqueDatas, financials, fundamentals);

// Write the merged data to a new JSON file
writeFileSync(
  path.join(__dirname, "merged_stocks.json"),
  JSON.stringify(mergedStocks, null, 2),
  "utf8"
);

// Log the result (optional)
console.log("Merged data has been exported to merged_stocks.json");

// Export the function for use in other modules
export { mergeStockData };