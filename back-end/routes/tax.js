const express = require("express");
const router = express.Router();
const axios = require("axios");
const moment = require("moment");

const API_KEY = "arrymt32esayamez";

// Tax slabs and rules for Indian income tax
const TAX_SLABS = [
    { limit: 250000, rate: 0 },         // No tax
    { limit: 500000, rate: 0.05 },      // 5% tax
    { limit: 1000000, rate: 0.20 },     // 20% tax
    { limit: Infinity, rate: 0.30 }     // 30% tax
];

const STCG_RATE = 0.15; // Short-term capital gains tax (equity)
const LTCG_RATE = 0.10; // Long-term capital gains tax (equity) above 1L exemption
const LTCG_EXEMPTION_LIMIT = 100000; // ₹1,00,000 exemption for LTCG

// Determine holding type based on buy date
function getHoldingType(buyDate) {
    if (!buyDate) return "STCG";
    const daysHeld = moment().diff(moment(buyDate), "days");
    return daysHeld > 365 ? "LTCG" : "STCG";
}

// Calculate tax for a holding
function calculateTax(gainOrLoss, holdingType, totalLTCG = 0) {
    if (gainOrLoss <= 0) return 0;
    
    if (holdingType === "STCG") {
        return gainOrLoss * STCG_RATE;
    } else {
        // LTCG calculation with exemption
        const taxableLTCG = Math.max(0, (totalLTCG + gainOrLoss) - LTCG_EXEMPTION_LIMIT) - 
                           Math.max(0, totalLTCG - LTCG_EXEMPTION_LIMIT);
        return taxableLTCG * LTCG_RATE;
    }
}

// Calculate overall income tax including capital gains
function calculateTotalIncomeTax(totalIncome, capitalGains) {
    let taxableIncome = totalIncome + capitalGains;
    let tax = 0;
    let previousLimit = 0;

    for (const slab of TAX_SLABS) {
        if (taxableIncome > previousLimit) {
            const amountInSlab = Math.min(taxableIncome, slab.limit) - previousLimit;
            tax += amountInSlab * slab.rate;
            previousLimit = slab.limit;
        }
    }

    return tax + (capitalGains > 0 ? capitalGains * 0.04 : 0); // + cess
}

// Tax optimizer route
router.get("/optimize", async (req, res) => {
    const accessToken = req.headers.authorization?.split(" ")[1];
    const { financialYear = "2024-2025", otherIncome = 0 } = req.query;

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
            is_holding: true,
            buy_date: holding.buy_date || null
        }));

        // Compute tax info
        let totalLTCG = 0, totalSTCG = 0, totalUnrealizedGains = 0;
        let harvestSuggestions = [];
        let taxEfficientSuggestions = [];

        const processedHoldings = holdings.map(h => {
            const holdingType = getHoldingType(h.buy_date);
            const gainOrLoss = (h.last_price - h.average_price) * h.quantity;
            const tax = calculateTax(gainOrLoss, holdingType, totalLTCG);

            if (gainOrLoss > 0) {
                if (holdingType === "LTCG") totalLTCG += gainOrLoss;
                else totalSTCG += gainOrLoss;
            }

            totalUnrealizedGains += gainOrLoss;

            // Tax-loss harvesting suggestions
            if (gainOrLoss < 0) {
                const potentialSave = Math.abs(gainOrLoss) * 
                    (holdingType === "STCG" ? STCG_RATE : LTCG_RATE);
                
                harvestSuggestions.push({
                    tradingsymbol: h.tradingsymbol,
                    quantity: h.quantity,
                    avgPrice: h.average_price,
                    currentPrice: h.last_price,
                    loss: Math.abs(gainOrLoss),
                    potentialTaxSave: potentialSave,
                    action: "Sell to realize loss"
                });
            }

            // Tax-efficient selling suggestions
            if (gainOrLoss > 0 && holdingType === "STCG") {
                const daysToLTCG = 365 - moment().diff(moment(h.buy_date), "days");
                if (daysToLTCG > 0 && daysToLTCG < 90) {
                    taxEfficientSuggestions.push({
                        tradingsymbol: h.tradingsymbol,
                        quantity: h.quantity,
                        currentGain: gainOrLoss,
                        daysToLTCG: daysToLTCG,
                        potentialTaxSave: gainOrLoss * (STCG_RATE - LTCG_RATE),
                        action: `Hold for ${daysToLTCG} more days for LTCG benefits`
                    });
                }
            }

            return {
                ...h,
                gainOrLoss,
                holdingType,
                estimatedTax: tax,
                daysHeld: h.buy_date ? moment().diff(moment(h.buy_date), "days") : 0
            };
        });

        // Calculate overall tax liability
        const totalCapitalGains = Math.max(0, totalLTCG - LTCG_EXEMPTION_LIMIT) + totalSTCG;
        const estimatedTaxLiability = calculateTotalIncomeTax(parseFloat(otherIncome), totalCapitalGains);

        // Tax-saving investment recommendations
        const taxSavingInvestments = [
            { type: "Section 80C", limit: 150000, description: "ELSS, PPF, Life Insurance, etc." },
            { type: "Section 80D", limit: 25000, description: "Health Insurance Premium" },
            { type: "NPS", limit: 50000, description: "Additional deduction under Section 80CCD(1B)" }
        ];

        res.json({
            financialYear,
            summary: {
                totalLTCG,
                totalSTCG,
                totalUnrealizedGains,
                ltcgExemptionUsed: Math.min(totalLTCG, LTCG_EXEMPTION_LIMIT),
                taxableCapitalGains: totalCapitalGains,
                estimatedTaxLiability,
                effectiveTaxRate: totalCapitalGains > 0 ? (estimatedTaxLiability / totalCapitalGains) * 100 : 0
            },
            holdings: processedHoldings,
            taxOptimization: {
                harvestSuggestions: harvestSuggestions.sort((a, b) => b.potentialTaxSave - a.potentialTaxSave),
                taxEfficientSuggestions,
                recommendedActions: [
                    ...harvestSuggestions.slice(0, 3),
                    ...taxEfficientSuggestions.slice(0, 2)
                ]
            },
            taxFiling: {
                requiredDocuments: [
                    "Capital gains statement",
                    "Form 16 (if salaried)",
                    "Bank statements",
                    "Demat account statement",
                    "Proof of tax-saving investments"
                ],
                importantDates: {
                    advanceTax: "15th March",
                    returnFiling: "31st July",
                    revisedReturn: "31st December"
                },
                taxSavingOptions: taxSavingInvestments
            }
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

// Additional route for tax filing assistance
router.post("/filing-assistance", async (req, res) => {
    // This would integrate with tax filing services or generate reports
    // Implementation would depend on specific tax filing API integration
    res.json({
        message: "Tax filing assistance feature coming soon",
        features: [
            "Auto-populate ITR forms",
            "Tax computation report",
            "Document checklist",
            "E-filing integration"
        ]
    });
});

module.exports = router;