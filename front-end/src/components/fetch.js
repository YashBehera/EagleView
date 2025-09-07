const fs = require('fs').promises;

// Function to check if a string contains a number
function containsNumber(str) {
  return /\d/.test(str);
}

// Function to check if a string ends with a specific suffix
function endsWithAny(str, suffixes) {
  return suffixes.some(suffix => str.toUpperCase().endsWith(suffix.toUpperCase()));
}

// Function to check if a string contains any of the keywords
function containsKeywords(str, keywords) {
  if (!str) return false;
  return keywords.some(keyword => str.toUpperCase().includes(keyword.toUpperCase()));
}

// Function to filter stocks
async function filterStocks() {
  try {
    // Read the input JSON file
    const data = await fs.readFile('filtered_unique_datas.json', 'utf8');
    const stocks = JSON.parse(data);

    // Define filter criteria
    const suffixes = ['ETF', 'BEES'];
    const keywords = ['ETF', 'BEES'];

    // Filter stocks based on conditions
    const filteredStocks = stocks.filter(stock => {
      // Check trading_symbol for numbers or specific endings
      const hasNumber = containsNumber(stock.trading_symbol);
      const hasSuffix = endsWithAny(stock.trading_symbol, suffixes);

      // Check name and short_name for keywords
      const hasKeywords = containsKeywords(stock.name, keywords) || 
                         containsKeywords(stock.short_name, keywords);

      // Keep stocks that do NOT match any of the conditions
      return !(hasNumber || hasSuffix || hasKeywords);
    });

    // Write filtered stocks to final_datas.json
    await fs.writeFile('final_datas.json', JSON.stringify(filteredStocks, null, 2));
    console.log(`Filtered ${stocks.length - filteredStocks.length} stocks. Saved ${filteredStocks.length} stocks to final_datas.json`);
  } catch (error) {
    console.error('Error processing stocks:', error);
  }
}

// Run the script
filterStocks();