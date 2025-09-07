const fs = require('fs').promises;

// Step 1: Load the JSON files
async function loadJSON(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    throw new Error(`Error reading ${filePath}: ${error.message}`);
  }
}

// Step 2: Save the updated JSON to a file
async function saveJSON(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    throw new Error(`Error writing to ${filePath}: ${error.message}`);
  }
}

// Step 3: Merge shareholding_pattern into financials.json
function mergeShareholding(fundamentalsData, financialsData) {
  // Create a Map for quick lookup of fundamentals data by _id
  const fundamentalsMap = new Map(
    fundamentalsData.map(stock => [stock._id, stock])
  );

  // Iterate through financials data and add shareholding_pattern
  const updatedFinancials = financialsData.map(financialStock => {
    const stockId = financialStock._id;
    const fundamentalsStock = fundamentalsMap.get(stockId);

    if (fundamentalsStock) {
      // Add the shareholding_pattern to the financials stock entry
      return {
        ...financialStock,
        shareholding_pattern: fundamentalsStock.shareholding_pattern
      };
    }
    return financialStock; // Return unchanged if no match found
  });

  return updatedFinancials;
}

// Main function to execute the merge
async function main() {
  try {
    // Load the JSON files
    const fundamentalsData = await loadJSON('fundamentals.json');
    const financialsData = await loadJSON('financials.json');

    // Merge the shareholding_pattern
    const updatedFinancials = mergeShareholding(fundamentalsData, financialsData);

    // Save the updated financials.json
    await saveJSON('financials_updated.json', updatedFinancials);
    console.log("Updated financials.json has been saved as financials_updated.json");
  } catch (error) {
    console.error(error.message);
  }
}

// Execute the main function
main();