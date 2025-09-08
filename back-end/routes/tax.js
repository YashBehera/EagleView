const express = require("express");
const router = express.Router();
const axios = require("axios");
const moment = require("moment");

const API_KEY = "arrymt32esayamez";

// Tax slabs
const STCG_RATE = 0.15; // Short-term capital gains tax
const LTCG_RATE = 0.10; // Long-term capital gains tax

// Determine holding type based on buy date
function getHoldingType(buyDate) {
    if (!buyDate) return "STCG"; // default short-term if no date
    const daysHeld = moment().diff(moment(buyDate), "days");
    return daysHeld > 365 ? "LTCG" : "STCG";
}

// Calculate tax for a holding
function calculateTax(gainOrLoss, holdingType) {
    if (gainOrLoss <= 0) return 0;
    return holdingType === "STCG" ? gainOrLoss * STCG_RATE : gainOrLoss * LTCG_RATE;
}

// Tax optimizer route
router.get("/optimize", async (req, res) => {
    const accessToken = req.headers.authorization?.split(" ")[1];

    if (!accessToken) {
        return res.status(401).json({ error: "No access token provided" });
    }

    try {
        // Fetch holdings from Zerodha API
        const response = await axios.get("https://api.kite.trade/portfolio/holdings", {
            headers: {
                "X-Kite-Version": "3",
                "Authorization": `token ${API_KEY}:${accessToken}`,
                "Content-Type": "application/json"
            }
        });

        // Normalize holdings like your existing /holdings route
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
            is_holding: true, // Flag to identify holdings
            buy_date: holding.buy_date || null // Optional buy date if available
        }));

        // Compute tax info
        let totalLTCG = 0, totalSTCG = 0, totalTax = 0;
        let harvestSuggestions = [];

        const processedHoldings = holdings.map(h => {
            const holdingType = getHoldingType(h.buy_date);

            const gainOrLoss = (h.last_price - h.average_price) * h.quantity;
            const tax = calculateTax(gainOrLoss, holdingType);

            // Accumulate totals
            if (holdingType === "LTCG") totalLTCG += gainOrLoss;
            else totalSTCG += gainOrLoss;
            totalTax += tax;

            // Tax-loss harvesting suggestion
            if (gainOrLoss < 0) {
                harvestSuggestions.push({
                    tradingsymbol: h.tradingsymbol,
                    quantity: h.quantity,
                    avgPrice: h.average_price,
                    currentPrice: h.last_price,
                    potentialTaxSave: Math.abs(gainOrLoss) * STCG_RATE
                });
            }

            return {
                ...h,
                gainOrLoss,
                holdingType,
                estimatedTax: tax
            };
        });

        res.json({
            summary: {
                totalLTCG,
                totalSTCG,
                estimatedTaxLiability: totalTax
            },
            holdings: processedHoldings,
            taxHarvesting: harvestSuggestions
        });

    } catch (error) {
        console.error("Error in tax optimizer:", {
            message: error.message,
            response: error.response ? error.response.data : null
        });
        res.status(500).json({
            message: "Failed to optimize tax",
            details: error.response?.data?.message || error.message
        });
    }
});

module.exports = router;
