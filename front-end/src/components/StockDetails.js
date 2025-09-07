import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveRadar } from "@nivo/radar";
import { ResponsiveTreeMap } from "@nivo/treemap";
import { motion, AnimatePresence } from "framer-motion";
import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import Navbar from "./Navbar";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

// Function to safely convert percentage values to numbers
const parsePercentage = (value) => {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    return parseFloat(value.replace("%", "") || "0");
  }
  return 0;
};

const fetchMarketQuote = async (instrumentKey) => {
  try {
    const response = await axios.get(`${API_URL}/api/stock/quote/${instrumentKey}`);
    return response.data.quote;
  } catch (error) {
    console.error(`Error fetching market quote for ${instrumentKey}:`, error);
    return null;
  }
};

// Function to calculate market cap
const calculateMarketCap = (faceValue, equityCapital, ltp) => {
  if (!faceValue || !equityCapital || !ltp || ltp === "N/A") return "N/A";
  const equityCapitalNum = parseFloat(String(equityCapital).replace(/,/g, ""));
  const faceValueNum = parseFloat(String(faceValue).replace(/,/g, ""));
  const ltpNum = parseFloat(String(ltp).replace(/,/g, ""));
  if (isNaN(equityCapitalNum) || isNaN(faceValueNum) || isNaN(ltpNum) || faceValueNum === 0) return "N/A";
  const sharesOutstanding = equityCapitalNum / faceValueNum;
  const marketCapInCrores = sharesOutstanding * ltpNum;
  return marketCapInCrores.toFixed(2);
};


// Function to calculate ROCE
const calculateROCE = (financialData) => {
  if (!financialData || !financialData.profit_loss || !financialData.balance_sheet) return "N/A";
  const latestYear = Object.keys(financialData.profit_loss).sort().pop();
  if (!latestYear) return "N/A";
  const profitLoss = financialData.profit_loss[latestYear];
  const balanceSheet = financialData.balance_sheet[latestYear];

  if (!profitLoss || !balanceSheet) return "N/A";

  const operatingProfit = parseFloat(String(profitLoss["Operating Profit"])?.replace(/,/g, "") || "0");
  const otherIncome = parseFloat(String(profitLoss["Other Income"])?.replace(/,/g, "") || "0");
  const interest = parseFloat(String(profitLoss["Interest"])?.replace(/,/g, "") || "0");
  const depreciation = parseFloat(String(profitLoss["Depreciation"])?.replace(/,/g, "") || "0");
  const equityCapital = parseFloat(String(balanceSheet["equity capital"])?.replace(/,/g, "") || "0");
  const reserves = parseFloat(String(balanceSheet["reserves"])?.replace(/,/g, "") || "0");
  const borrowings = parseFloat(String(balanceSheet["borrowings"])?.replace(/,/g, "") || "0");

  const ebit = operatingProfit + otherIncome - interest - depreciation;
  const totalCapitalEmployed = equityCapital + reserves + borrowings;

  if (totalCapitalEmployed === 0) return "N/A";
  return ((ebit / totalCapitalEmployed) * 100).toFixed(2);
};

// Function to calculate ROE
const calculateROE = (financialData) => {
  if (!financialData || !financialData.profit_loss || !financialData.balance_sheet) return "N/A";
  const latestYear = Object.keys(financialData.profit_loss).sort().pop();
  if (!latestYear) return "N/A";
  const profitLoss = financialData.profit_loss[latestYear];
  const balanceSheet = financialData.balance_sheet[latestYear];

  if (!profitLoss || !balanceSheet) return "N/A";

  const netProfit = parseFloat(String(profitLoss["Net Profit"])?.replace(/,/g, "") || "0");
  const equityCapital = parseFloat(String(balanceSheet["equity capital"])?.replace(/,/g, "") || "0");
  const reserves = parseFloat(String(balanceSheet["reserves"])?.replace(/,/g, "") || "0");

  const totalEquity = equityCapital + reserves;
  if (totalEquity === 0) return "N/A";
  return ((netProfit / totalEquity) * 100).toFixed(2);
};

// Function to calculate Book Value
const calculateBookValue = (financialData) => {
  if (!financialData || !financialData.balance_sheet) return "N/A";
  const latestYear = Object.keys(financialData.balance_sheet).sort().pop();
  if (!latestYear) return "N/A";
  const balanceSheet = financialData.balance_sheet[latestYear];
  if (!balanceSheet) return "N/A";

  const equityCapital = parseFloat(String(balanceSheet["equity capital"])?.replace(/,/g, "") || "0");
  const reserves = parseFloat(String(balanceSheet["reserves"])?.replace(/,/g, "") || "0");
  return (equityCapital + reserves).toFixed(2);
};

// Function to calculate Dividend Yield
const calculateDividendYield = (financialData) => {
  if (!financialData || !financialData.profit_loss) return "N/A";
  const latestYear = Object.keys(financialData.profit_loss).sort().pop();
  if (!latestYear) return "N/A";
  const profitLoss = financialData.profit_loss[latestYear];
  if (!profitLoss) return "N/A";
  const dividendPayout = parseFloat(String(profitLoss["Dividend Payout %"])?.replace(/,|%/g, "") || "0");
  return `${dividendPayout.toFixed(2)}%`;
};

// Enhanced Calculate Internal Ratings
const calculateRatings = (financialData, shareholdingData, marketCap) => {
  if (!financialData || !shareholdingData || !marketCap || marketCap === "N/A") return null;

  const latestYearPL = Object.keys(financialData.profit_loss || {}).sort().pop();
  const balanceSheetYears = Object.keys(financialData.balance_sheet || {}).sort();
  const latestYearBS = balanceSheetYears[balanceSheetYears.length - 1];

  if (!latestYearPL || !latestYearBS) return null;

  const profitLoss = financialData.profit_loss[latestYearPL];
  const balanceSheet = financialData.balance_sheet[latestYearBS];

  const latestYearSH = Object.keys(shareholdingData.shareholding_pattern || {}).sort().pop();
  if (!latestYearSH) return null;
  const latestQuarterSH = Object.keys(shareholdingData.shareholding_pattern[latestYearSH] || {}).sort().pop();
  if (!latestQuarterSH) return null;
  const shareholding = shareholdingData.shareholding_pattern[latestYearSH][latestQuarterSH];

  if (!profitLoss || !balanceSheet || !shareholding) return null;

  const weights = {
    salesGrowth: 0.25,
    profitGrowth: 0.25,
    marketCap: 0.15,
    roe: 0.20,
    promoterHolding: 0.10,
    debtToEquity: 0.05,
  };

  const salesGrowth = profitLoss["Sales"]
    ? Math.min((parseFloat(String(profitLoss["Sales"]).replace(/,/g, "")) / 1000) * 10, 100)
    : 0;
  const profitGrowth = profitLoss["Net Profit"]
    ? Math.min((parseFloat(String(profitLoss["Net Profit"]).replace(/,/g, "")) / 100) * 10, 100)
    : 0;
  const marketCapScore = parseFloat(marketCap)
    ? Math.min((parseFloat(marketCap) / 10000) * 10, 100)
    : 0;
  const roe = balanceSheet["reserves"] && balanceSheet["equity capital"] && profitLoss["Net Profit"]
    ? Math.min(
      (parseFloat(String(profitLoss["Net Profit"]).replace(/,/g, "")) /
        (parseFloat(String(balanceSheet["reserves"]).replace(/,/g, "")) +
          parseFloat(String(balanceSheet["equity capital"]).replace(/,/g, ""))) *
        100) * 2,
      100
    )
    : 0;
  const promoterHolding = shareholding["promoters"]
    ? Math.min(parsePercentage(shareholding["promoters"]), 100)
    : 0;

  const totalEquityForDebt = (parseFloat(String(balanceSheet["equity capital"]).replace(/,/g, "")) || 0) + (parseFloat(String(balanceSheet["reserves"]).replace(/,/g, "")) || 0);
  const debtToEquity = balanceSheet["borrowings"] && totalEquityForDebt > 0
    ? Math.max(
      0,
      100 - (parseFloat(String(balanceSheet["borrowings"]).replace(/,/g, "")) / totalEquityForDebt * 100)
    )
    : 50;

  const overallScore = (
    salesGrowth * weights.salesGrowth +
    profitGrowth * weights.profitGrowth +
    marketCapScore * weights.marketCap +
    roe * weights.roe +
    promoterHolding * weights.promoterHolding +
    debtToEquity * weights.debtToEquity
  ).toFixed(1);

  return {
    ratings: [
      { index: "Sales Growth", stock: salesGrowth, description: "Measures revenue growth over time." },
      { index: "Profit Growth", stock: profitGrowth, description: "Indicates profitability improvement." },
      { index: "Market Cap", stock: marketCapScore, description: "Reflects company size and stability." },
      { index: "ROE", stock: roe, description: "Return on Equity shows profit efficiency." },
      { index: "Promoter Holding", stock: promoterHolding, description: "Promoter stake indicates confidence." },
      { index: "Debt to Equity", stock: debtToEquity, description: "Lower ratio means less financial risk." },
    ],
    overallScore,
  };
};

// Apple-inspired Financial Table Component (Now Responsive and supports Quarterly data)

const FinancialTable = ({ data, type }) => {
  const [expandedSections, setExpandedSections] = useState({
    'borrowings': false,
    'other liabilities': false,
    'fixed assets': false,
    'other assets': false,
    'cash from operating activity': false,
    'cash from investing activity': false,
    'cash from financing activity': false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-gray-400 text-sm font-medium">No data available</p>
      </div>
    );
  }

  const periods = Object.keys(data);
  if (periods.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-gray-400 text-sm font-medium">No data available for the selected periods.</p>
      </div>
    );
  }

  const headers = periods.map((period) => (
    <th
      key={period}
      className="px-3 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right border-b border-gray-100"
    >
      {period}
    </th>
  ));

  let fields = [];
  const firstPeriodData = data[periods[0]] || {};

  if (type === "balance_sheet") {
    // Balance sheet implementation remains the same
    const collapsibleSections = {
      'borrowings': [
        'long term borrowings',
        'short term borrowings',
        'lease liabilities',
        'preference capital',
        'other borrowings'
      ],
      'other liabilities': [
        'trade payables',
        'advance from customers',
        'other liability items'
      ],
      'fixed assets': [
        'land',
        'building',
        'plant machinery',
        'equipments',
        'computers',
        'furniture n fittings',
        'vehicles',
        'intangible assets',
        'other fixed assets',
        'gross block',
        'accumulated depreciation'
      ],
      'other assets': [
        'inventories',
        'trade receivables',
        'cash equivalents',
        'loans n advances',
        'other asset items'
      ]
    };

    const standardFields = [
      'total assets', 'investments', 'total liabilities',
      'equity capital', 'reserves', 'cwip'
    ].filter(field => Object.keys(firstPeriodData).includes(field));

    fields = [...standardFields];

    Object.entries(collapsibleSections).forEach(([section, subItems]) => {
      const hasSubItems = subItems.some(subItem => Object.keys(firstPeriodData).includes(subItem));

      if (hasSubItems) {
        fields.push(section);
        if (expandedSections[section]) {
          subItems.forEach(subItem => {
            if (Object.keys(firstPeriodData).includes(subItem)) {
              fields.push(subItem);
            }
          });
        }
      }
    });

    const remainingFields = Object.keys(firstPeriodData).filter(
      field => !fields.includes(field) &&
        !Object.values(collapsibleSections).flat().includes(field) &&
        !standardFields.includes(field)
    );
    fields = [...fields, ...remainingFields];
  }
  else if (type === "cash_flow") {
    // New collapsible sections for cash flow
    const collapsibleSections = {
      'cash from operating activity': [
        'profit from operations',
        'receivables',
        'inventory',
        'payables',
        'other wc items',
        'working capital changes',
        'direct taxes'
      ],
      'cash from investing activity': [
        'fixed assets purchased',
        'fixed assets sold',
        'investments purchased',
        'investments sold',
        'interest received',
        'dividends received',
        'loans to subsidiaries',
        'investment in group cos',
        'other investing items'
      ],
      'cash from financing activity': [
        'proceeds from shares',
        'proceeds from borrowings',
        'repayment of borrowings',
        'interest paid fin',
        'dividends paid',
        'other financing items'
      ]
    };

    // Standard non-collapsible fields
    const standardFields = [
      'net cash flow'
    ].filter(field => Object.keys(firstPeriodData).includes(field));

    fields = [...standardFields];

    // Add collapsible sections
    Object.entries(collapsibleSections).forEach(([section, subItems]) => {
      // Check if section exists in data or has sub-items
      if (Object.keys(firstPeriodData).includes(section) ||
        subItems.some(subItem => Object.keys(firstPeriodData).includes(subItem))) {
        fields.push(section);
        if (expandedSections[section]) {
          subItems.forEach(subItem => {
            if (Object.keys(firstPeriodData).includes(subItem)) {
              fields.push(subItem);
            }
          });
        }
      }
    });

    // Include any remaining fields not in our predefined lists
    const remainingFields = Object.keys(firstPeriodData).filter(
      field => !fields.includes(field) &&
        !Object.values(collapsibleSections).flat().includes(field) &&
        !standardFields.includes(field)
    );
    fields = [...fields, ...remainingFields];
  }
  else if (type === "profit_loss") {
    fields = [
      "Sales", "Expenses", "Operating Profit", "OPM %", "Other Income",
      "Interest", "Depreciation", "Profit before tax", "Tax %",
      "Net Profit", "EPS in Rs", "Dividend Payout %",
      "Material Cost", "Employee Cost", "Exceptional items AT",
      "Profit excl Excep", "Profit for PE", "Profit for EPS"
    ].filter(field => Object.keys(firstPeriodData).includes(field));
  }
  else if (type === "quarterly_results") {
    const collapsibleSections = {
      'Sales': ['YOY Sales Growth'],
      'Expenses': ['Material Cost', 'Employee Cost'],
      'Other Income': ['Exceptional items', 'Other income normal', 'Interest', 'Depreciation'],
      'Net Profit': ['Profit for PE', 'Profit excl Excep', 'Exceptional items AT', 'YOY Profit Growth']
    };

    const standardFields = [
      'Operating Profit', 'OPM', 'Profit before tax', 'Tax', 'EPS in Rs'
    ].filter(field => Object.keys(firstPeriodData).includes(field));

    fields = [];

    Object.entries(collapsibleSections).forEach(([section, subItems]) => {
      if (Object.keys(firstPeriodData).includes(section)) {
        fields.push(section);
        if (expandedSections[section]) {
          subItems.forEach(subItem => {
            if (Object.keys(firstPeriodData).includes(subItem)) {
              fields.push(subItem);
            }
          });
        }
      }
    });

    fields = [...fields, ...standardFields];
  }

  const latestColumnValues = {};
  const latestPeriod = periods[periods.length - 1];
  fields.forEach((field) => {
    latestColumnValues[field] = data[latestPeriod]?.[field] ?? "N/A";
  });

  const renderRow = (field, index, isSubItem = false) => {
    let isCollapsibleSection = false;
    let sectionName = '';

    if (type === "balance_sheet") {
      const balanceSheetSections = {
        'borrowings': ['long term borrowings', 'short term borrowings', 'lease liabilities', 'preference capital', 'other borrowings'],
        'other liabilities': ['trade payables', 'advance from customers', 'other liability items'],
        'fixed assets': ['land', 'building', 'plant machinery', 'equipments', 'computers', 'furniture n fittings', 'vehicles', 'intangible assets', 'other fixed assets', 'gross block', 'accumulated depreciation'],
        'other assets': ['inventories', 'trade receivables', 'cash equivalents', 'loans n advances', 'other asset items']
      };

      if (Object.keys(balanceSheetSections).includes(field)) {
        isCollapsibleSection = true;
        sectionName = field;
      }
    }
    else if (type === "cash_flow") {
      const cashFlowSections = {
        'cash from operating activity': [
          'profit from operations',
          'receivables',
          'inventory',
          'payables',
          'other wc items',
          'working capital changes',
          'direct taxes'
        ],
        'cash from investing activity': [
          'fixed assets purchased',
          'fixed assets sold',
          'investments purchased',
          'investments sold',
          'interest received',
          'dividends received',
          'loans to subsidiaries',
          'investment in group cos',
          'other investing items'
        ],
        'cash from financing activity': [
          'proceeds from shares',
          'proceeds from borrowings',
          'repayment of borrowings',
          'interest paid fin',
          'dividends paid',
          'other financing items'
        ]
      };

      if (Object.keys(cashFlowSections).includes(field)) {
        isCollapsibleSection = true;
        sectionName = field;
      }
    }
    else if (type === "quarterly_results") {
      isCollapsibleSection = ['Sales', 'Expenses', 'Other Income', 'Net Profit'].includes(field);
      sectionName = field;
    }

    // Determine if this is a sub-item of an expanded section
    const isExpandedSubItem = isSubItem && expandedSections[sectionName];
    const isSectionHeader = isCollapsibleSection;
    const bgColor = isSectionHeader || isExpandedSubItem ? 'bg-gray-50' : 'bg-white';
    const hoverBgColor = isSectionHeader || isExpandedSubItem ? 'hover:bg-gray-50' : 'hover:bg-gray-50';

    return (
      <motion.tr
        key={`${field}-${index}`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: index * 0.02 }}
        className={`
          group transition-all duration-200 ease-out
          ${bgColor} ${hoverBgColor}
          ${isSectionHeader ? 'border-t border-gray-200' : ''}
        `}
      >
        <td className={`
          px-3 sm:px-4 py-3 text-sm font-medium sticky left-0
          border-r border-gray-100 group-hover:border-gray-200/50 
          whitespace-nowrap min-w-[220px]
          text-black
          ${bgColor} ${hoverBgColor}
          ${isExpandedSubItem ? 'pl-8' : ''}
        `}>
          {isCollapsibleSection ? (
            <button
              onClick={() => toggleSection(sectionName)}
              className="flex items-center focus:outline-none w-full text-left"
            >
              <span className="mr-2 capitalize text-black">{sectionName}</span>
              <svg
                className={`w-4 h-4 transition-transform ${expandedSections[sectionName] ? 'transform rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (type === "profit_loss" || type === "quarterly_results") &&
            (field === "Sales" || field === "Expenses" || field === "Net Profit") ? (
            <span className="font-semibold text-black">{field}</span>
          ) : field.includes('%') || field === 'OPM' ? (
            <span className="text-blue-600 font-medium">{`${field}${field.includes('%') ? '' : ' %'}`}</span>
          ) : (
            <span>{field}</span>
          )}
        </td>
        {periods.map((period) => (
          <td
            key={`${field}-${period}`}
            className={`
              px-3 sm:px-4 py-3 text-sm text-right font-sans whitespace-nowrap
              ${isSectionHeader || isExpandedSubItem ? 'font-semibold text-gray-900' : 'text-gray-600'}
              ${bgColor} ${hoverBgColor}
            `}
          >
            {data[period][field] !== null && data[period][field] !== undefined
              ? data[period][field]
              : "—"}
          </td>
        ))}
      </motion.tr>
    );
  };

  const rows = fields.map((field, index) => {
    return renderRow(field, index);
  });

  const showFooterMetrics = type === "profit_loss";
  const footerMetrics = [
    { title: "Compounded Sales Growth", values: { "10Y": "45%", "5Y": "45%", "3Y": "45%", "TTM": "10%" }, color: "blue" },
    { title: "Compounded Profit Growth", values: { "10Y": "71%", "5Y": "71%", "3Y": "18%", "TTM": "18%" }, color: "green" },
    { title: "Stock Price CAGR", values: { "10Y": "29%", "5Y": "29%", "3Y": "29%", "1Y": "29%" }, color: "purple" },
    { title: "Return on Equity", values: { "10Y": "41%", "5Y": "41%", "3Y": "41%", "TTM": "41%" }, color: "orange" },
  ];

  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-emerald-500 to-emerald-600",
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600"
  };

  const getTableTitle = () => {
    switch (type) {
      case "balance_sheet": return "Balance Sheet";
      case "cash_flow": return "Cash Flow";
      case "quarterly_results": return "Quarterly Results";
      default: return "Profit & Loss";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-gray-50/30 pointer-events-none" />
      <div className="relative p-4 sm:p-6">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">{getTableTitle()}</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">Consolidated Figures in ₹ Crores</p>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-gray-200/50 bg-white/60 backdrop-blur-sm shadow-md shadow-gray-900/5">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/80 backdrop-blur-sm">
              <tr>
                <th className="px-3 sm:px-4 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider sticky left-0 bg-gray-50/80 text-left border-b border-r border-gray-100 min-w-[220px]">
                  {getTableTitle()}
                </th>
                {headers}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows}
            </tbody>
          </table>
        </div>
        {showFooterMetrics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-8">
            {footerMetrics.map((metric, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
                className="group relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-sm border border-gray-100 p-5 hover:bg-white/90 hover:shadow-lg hover:shadow-gray-900/5 transition-all duration-300 ease-out"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[metric.color]} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                <h4 className="text-sm font-semibold text-gray-900 mb-3 relative">{metric.title}</h4>
                <div className="space-y-2 relative">
                  {Object.entries(metric.values).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 font-medium">{key}</span>
                      <span className="text-sm text-gray-900 font-semibold font-sans">{value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Apple-inspired Custom Table Component (Now Responsive)
const CustomTable = ({ name, data }) => {
  if (!data || Object.keys(data).length === 0) return null;

  const periods = Object.keys(data); // No sort
  const headers = periods.map((period) => (
    <th
      key={period}
      className="px-3 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right border-b border-gray-100"
    >
      {period}
    </th>
  ));

  const fields = Object.keys(data[periods[0]] || {});

  const rows = fields.map((field, index) => (
    <motion.tr
      key={field}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.02 }}
      className="group hover:bg-gray-50/70 transition-all duration-200 ease-out"
    >
      <td className="px-3 sm:px-4 py-3 text-sm text-gray-900 font-medium sticky left-0 bg-black group-hover:bg-gray-50/70 transition-colors duration-200 border-r border-gray-100 group-hover:border-gray-200/50">
        {field}
      </td>
      {periods.map((period) => (
        <td
          key={`${field}-${period}`}
          className="px-3 sm:px-4 py-3 text-sm text-gray-600 text-right font-sans whitespace-nowrap"
        >
          {data[period]?.[field] ?? '—'}
        </td>
      ))}
    </motion.tr>
  ));

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-4">
        {name || "Custom Table"}
      </h2>
      <div className="overflow-x-auto rounded-2xl border border-gray-200/50 bg-white/60 backdrop-blur-sm shadow-md shadow-gray-900/5">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50/80 backdrop-blur-sm">
              <th className="px-3 sm:px-4 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider sticky left-0 bg-gray-50/80 text-left border-b border-r border-gray-100">
                Metrics
              </th>
              {headers}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

// Apple-inspired Sales and Profit Growth Bar Graph
const SalesProfitBarGraph = ({ data }) => {
  if (!data || !data.profit_loss) return null;

  const formattedData = Object.keys(data.profit_loss).map((year) => ({
    year,
    sales: parseFloat(data.profit_loss[year]["Sales"].replace(/,/g, "")) || 0,
    profit: parseFloat(data.profit_loss[year]["Net Profit"].replace(/,/g, "")) || 0,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="mt-8"
    >
      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-6">
        Sales & Profit Growth
      </h3>
      <div className="w-full h-80 rounded-2xl bg-white/60 backdrop-blur-sm border border-gray-100 p-2 sm:p-4">
        <ResponsiveBar
          data={formattedData}
          keys={["sales", "profit"]}
          indexBy="year"
          margin={{ top: 20, right: 80, bottom: 60, left: 50 }}
          padding={0.3}
          valueScale={{ type: "linear" }}
          indexScale={{ type: "band", round: true }}
          colors={["#60A5FA", "#F472B6"]}
          borderColor={{ from: "color", modifiers: [["darker", 1.6]] }}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 45,
            legend: "Year",
            legendPosition: "middle",
            legendOffset: 50,
            tickValues: formattedData.map((d) => d.year).filter((_, i) => i % 2 === 0),
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: "Amount (₹ Cr)",
            legendPosition: "middle",
            legendOffset: -40,
          }}
          labelSkipWidth={12}
          labelSkipHeight={12}
          labelTextColor={{ from: "color", modifiers: [["darker", 1.6]] }}
          legends={[
            {
              dataFrom: "keys",
              anchor: "bottom-right",
              direction: "column",
              justify: false,
              translateX: 90,
              translateY: 0,
              itemsSpacing: 2,
              itemWidth: 80,
              itemHeight: 20,
              itemTextColor: "#4B5563",
              symbolSize: 12,
              effects: [{ on: "hover", style: { itemOpacity: 1 } }],
            },
          ]}
          theme={{
            tooltip: { container: { background: "#FFFFFF", color: "#4B5563" } },
          }}
          animate={true}
        />
      </div>
    </motion.div>
  );
};

// Apple-inspired Balance Sheet Treemap
const BalanceSheetTreeMap = ({ data }) => {
  if (!data || !data.balance_sheet) return null;

  const latestYear = Object.keys(data.balance_sheet).sort().pop();
  const balanceSheetData = {
    name: "Balance Sheet",
    children: Object.entries(data.balance_sheet[latestYear])
      .filter(([_, value]) => value !== null && value !== "0" && parseFloat(String(value).replace(/,/g, "")) > 0)
      .map(([key, value]) => ({
        name: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        value: parseFloat(String(value).replace(/,/g, "")) || 0,
      })),
  };

  if (balanceSheetData.children.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="mt-8"
    >
      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-6">
        Balance Sheet Breakdown
        <span className="text-base sm:text-lg font-normal text-gray-500 ml-2">({latestYear})</span>
      </h3>
      <div className="w-full h-80 rounded-2xl bg-white/60 backdrop-blur-sm border border-gray-100 p-2 sm:p-4">
        <ResponsiveTreeMap
          data={balanceSheetData}
          identity="name"
          value="value"
          valueFormat=".2s"
          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
          labelSkipSize={12}
          labelTextColor={{ from: "color", modifiers: [["darker", 2]] }}
          colors={{ scheme: 'nivo' }}
          theme={{
            tooltip: { container: { background: "#FFFFFF", color: "#4B5563" } },
          }}
          animate={true}
        />
      </div>
    </motion.div>
  );
};

// Apple-inspired Shareholding Pattern Bar Graph
const ShareholdingPatternBarGraph = ({ data }) => {
  if (!data || !data.shareholding_pattern) return null;

  const formattedData = [];
  const years = Object.keys(data.shareholding_pattern).sort();
  years.forEach((year) => {
    const quarters = Object.keys(data.shareholding_pattern[year]).sort();
    quarters.forEach((quarter) => {
      const entry = data.shareholding_pattern[year][quarter];
      formattedData.push({
        quarter: `${quarter.substring(0, 3)} '${year.slice(2, 4)}`, // Format to "Mar '24"
        promoters: parsePercentage(entry.promoters),
        fiis: parsePercentage(entry.fiis),
        diis: parsePercentage(entry.diis),
        public: parsePercentage(entry.public),
      });
    });
  });

  const latestQuarter = formattedData[formattedData.length - 1];
  const shareholderTypes = [
    { key: "promoters", label: "Promoters", color: "blue" },
    { key: "fiis", label: "FIIs", color: "emerald" },
    { key: "diis", label: "DIIs", color: "purple" },
    { key: "public", label: "Public", color: "orange" },
  ];

  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    emerald: "from-emerald-500 to-emerald-600",
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <div className="w-full h-80 rounded-2xl bg-white/60 backdrop-blur-sm border border-gray-100 p-2 sm:p-6 mb-4">
        <ResponsiveBar
          data={formattedData}
          keys={["promoters", "fiis", "diis", "public"]}
          indexBy="quarter"
          margin={{ top: 20, right: 80, bottom: 60, left: 50 }}
          padding={0.4}
          valueScale={{ type: "linear", min: 0, max: 100 }}
          indexScale={{ type: "band", round: true }}
          colors={{ scheme: 'nivo' }}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            legend: "%",
            legendPosition: "middle",
            legendOffset: -40,
          }}
          enableLabel={false}
          legends={[
            {
              dataFrom: "keys",
              anchor: "bottom-right",
              direction: "column",
              justify: false,
              translateX: 90,
              translateY: 0,
              itemsSpacing: 2,
              itemWidth: 80,
              itemHeight: 20,
              itemTextColor: "#4B5563",
              symbolSize: 12,
              effects: [{ on: "hover", style: { itemOpacity: 1 } }],
            },
          ]}
          theme={{
            tooltip: { container: { background: "#FFFFFF", color: "#4B5563" } },
          }}
          animate={true}
        />
      </div>
      <div className="space-y-4 mt-8">
        <h4 className="text-lg font-semibold text-gray-900">
          Latest Quarter
          <span className="text-base font-normal text-gray-500 ml-2">({latestQuarter.quarter})</span>
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {shareholderTypes.map(({ key, label, color }) => (
            <motion.div
              key={key}
              className="group relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-sm border border-gray-100 p-4 hover:bg-white/90 hover:shadow-lg"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              <div className="relative">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{label}</div>
                <div className="text-xl font-bold text-gray-900 font-sans">{latestQuarter[key].toFixed(1)}%</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// Apple-inspired Stock Rating Radar
const StockRatingRadar = ({ ratingsData, stockName }) => {
  if (!ratingsData || !ratingsData.ratings) return null;

  const { ratings, overallScore } = ratingsData;
  const scoreColor = overallScore >= 70 ? "text-emerald-600" : overallScore >= 50 ? "text-amber-500" : "text-red-500";
  const scoreBg = overallScore >= 70 ? "from-emerald-100 to-emerald-200" : overallScore >= 50 ? "from-amber-100 to-amber-200" : "from-red-100 to-red-200";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-1/2">
          <div className="h-80 sm:h-96 rounded-2xl w-full bg-white/60 backdrop-blur-sm border border-gray-100 p-2">
            <ResponsiveRadar
              data={ratings}
              keys={["stock"]}
              indexBy="index"
              maxValue={100}
              margin={{ top: 40, right: 60, bottom: 40, left: 60 }}
              curve="linearClosed"
              borderWidth={2}
              borderColor={{ from: "color" }}
              gridLevels={5}
              gridShape="circular"
              gridLabelOffset={20}
              dotSize={8}
              dotColor={{ theme: "background" }}
              dotBorderWidth={2}
              colors={["#3B82F6"]}
              fillOpacity={0.25}
              blendMode="multiply"
              animate={true}
              theme={{
                textColor: "#374151",
                fontSize: 12,
                grid: { line: { stroke: "#E5E7EB" } },
                tooltip: { container: { background: "#FFFFFF", color: "#4B5563" } },
              }}
            />
          </div>
        </div>
        <div className="w-full lg:w-1/2 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Rating Breakdown</h3>
            <div className="relative">
              <div className={`absolute inset-0 bg-gradient-to-r ${scoreBg} rounded-2xl opacity-50`} />
              <div className={`relative px-4 py-2 text-xl sm:text-2xl font-semibold ${scoreColor} rounded-2xl`}>
                {overallScore}/100
              </div>
            </div>
          </div>
          <div className="space-y-3 sm:space-y-4 flex-grow">
            {ratings.map((rating, index) => (
              <motion.div
                key={index}
                className="p-3 border border-gray-100 bg-white/30 rounded-2xl"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">{rating.index}</span>
                  <span className="text-base sm:text-lg font-semibold text-gray-800">{rating.stock.toFixed(1)}</span>
                </div>
                <div className="w-full bg-gray-200/60 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${rating.stock}%` }}
                    transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                  ></motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};


// StockDetails Component - Main component with responsive layout
function StockDetails({ auth_token }) {
  const { symbol } = useParams();
  const [stockData, setStockData] = useState({
    ltp: null, marketCap: null, roce: null, roe: null, highLow: null, peRatio: null,
    bookValue: null, dividendYield: null, faceValue: null, stockName: symbol,
    equityCapital: null, financialData: null, shareholdingData: null, ratingsData: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showCustomTableModal, setShowCustomTableModal] = useState(false);
  const [customTables, setCustomTables] = useState([]);
  const [selectedRows, setSelectedRows] = useState({});
  const [customTableName, setCustomTableName] = useState("");
  const [expandedRows, setExpandedRows] = useState({});

  const navTabs = useMemo(() => [
    { id: "rating", title: "Rating" },
    { id: "quarterly-results", title: "Quarterly" },
    { id: "income-sheet", title: "Income Sheet" },
    { id: "balance-sheet", title: "Balance Sheet" },
    { id: "cash-flow", title: "Cash Flow" },
    { id: "shareholding-pattern", title: "Shareholding" },
  ], []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_URL}/api/stock/${symbol}`);
        const { financials, ratios, quote } = response.data;

        let fetchedLtp = "N/A", fetchedHighLow = "N/A";
        if (quote && quote.instrument_key) {
          const quoteData = await fetchMarketQuote(quote.instrument_key);
          if (quoteData) {
            fetchedLtp = quoteData.last_price;
            fetchedHighLow = `${quoteData.ohlc.high ?? "N/A"} - ${quoteData.ohlc.low ?? "N/A"}`;
          }
        }

        const faceVal = ratios?.face_value;
        const equityCap = financials?.balance_sheet?.["2024"]?.["equity capital"];
        const marketCapVal = calculateMarketCap(faceVal, equityCap, fetchedLtp);

        const finData = financials ? {
          balance_sheet: financials.balance_sheet,
          cash_flow: financials.cash_flow,
          profit_loss: financials.profit_loss,
          quarterly_results: financials.quarterly_results,
          company_name: financials.company_name
        } : null;

        const shareData = financials ? {
          shareholding_pattern: financials.shareholding_pattern
        } : null;

        const ratings = calculateRatings(finData, shareData, marketCapVal);

        setStockData({
          ltp: fetchedLtp,
          highLow: fetchedHighLow,
          faceValue: faceVal,
          equityCapital: equityCap,
          peRatio: ratios?.stock_pe ? Number(ratios.stock_pe) : null,
          stockName: financials?.company_name || symbol,
          financialData: finData,
          shareholdingData: shareData,
          marketCap: marketCapVal,
          roce: calculateROCE(finData),
          roe: calculateROE(finData),
          bookValue: calculateBookValue(finData),
          dividendYield: calculateDividendYield(finData),
          ratingsData: ratings
        });

      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.response?.status === 404 ? `No data found for stock symbol ${symbol}` : "Failed to load stock data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [symbol]);

  const processedQuarterlyData = useMemo(() => {
    const data = stockData.financialData?.quarterly_results;
    if (!data) return null;

    const flattened = {};
    const sortedYears = Object.keys(data).sort((a, b) => parseInt(a) - parseInt(b)); // Sort years in ascending order

    for (const year of sortedYears) {
      const quarters = data[year];
      if (!quarters) continue;

      const quarterKeys = Object.keys(quarters).sort((a, b) => {
        // Sort quarters in chronological order: Mar, Jun, Sep, Dec
        const order = { Mar: 0, Jun: 1, Sep: 2, Dec: 3 };
        return order[a.trim()] - order[b.trim()];
      });

      for (const quarter of quarterKeys) {
        const periodKey = `${quarter.trim()} ${year}`;
        const metrics = quarters[quarter];
        if (!metrics) continue;

        // Clean up the metrics by trimming keys and handling values
        const cleanedMetrics = {};
        for (const [key, value] of Object.entries(metrics)) {
          const cleanedKey = key.trim();
          // Convert numeric values from strings to numbers when appropriate
          if (typeof value === 'string' && !isNaN(value) && value.trim() !== '') {
            cleanedMetrics[cleanedKey] = parseFloat(value);
          } else {
            cleanedMetrics[cleanedKey] = value;
          }
        }

        flattened[periodKey] = cleanedMetrics;
      }
    }

    return flattened;
  }, [stockData.financialData?.quarterly_results]);

  // Process balance sheet data to ensure consistent formatting
  const processedBalanceSheetData = useMemo(() => {
    const data = stockData.financialData?.balance_sheet;
    if (!data) return null;

    const result = {};
    const years = Object.keys(data).sort((a, b) => parseInt(b) - parseInt(a)); // Newest first

    for (const year of years) {
      const yearData = data[year];
      if (!yearData) continue;

      const cleanedData = {};
      for (const [key, value] of Object.entries(yearData)) {
        // Convert numeric values from strings to numbers when appropriate
        if (typeof value === 'string' && value.includes(',')) {
          cleanedData[key] = parseFloat(value.replace(/,/g, ''));
        } else if (typeof value === 'string' && !isNaN(value)) {
          cleanedData[key] = parseFloat(value);
        } else {
          cleanedData[key] = value;
        }
      }
      result[year] = cleanedData;
    }

    return result;
  }, [stockData.financialData?.balance_sheet]);

  // Process profit & loss data
  const processedProfitLossData = useMemo(() => {
    const data = stockData.financialData?.profit_loss;
    if (!data) return null;

    const result = {};
    const years = Object.keys(data).sort((a, b) => parseInt(b) - parseInt(a)); // Newest first

    for (const year of years) {
      const yearData = data[year];
      if (!yearData) continue;

      const cleanedData = {};
      for (const [key, value] of Object.entries(yearData)) {
        // Handle percentage values
        if (key.includes('%') && typeof value === 'string') {
          cleanedData[key] = value.replace('%', '') + '%';
        }
        // Convert numeric values
        else if (typeof value === 'string' && value.includes(',')) {
          cleanedData[key] = parseFloat(value.replace(/,/g, ''));
        } else if (typeof value === 'string' && !isNaN(value)) {
          cleanedData[key] = parseFloat(value);
        } else {
          cleanedData[key] = value;
        }
      }
      result[year] = cleanedData;
    }

    return result;
  }, [stockData.financialData?.profit_loss]);

  // Process cash flow data
  const processedCashFlowData = useMemo(() => {
    const data = stockData.financialData?.cash_flow;
    if (!data) return null;

    const result = {};
    const years = Object.keys(data).sort((a, b) => parseInt(b) - parseInt(a)); // Newest first

    for (const year of years) {
      const yearData = data[year];
      if (!yearData) continue;

      const cleanedData = {};
      for (const [key, value] of Object.entries(yearData)) {
        // Convert numeric values from strings to numbers when appropriate
        if (typeof value === 'string' && value.includes(',')) {
          cleanedData[key] = parseFloat(value.replace(/,/g, ''));
        } else if (typeof value === 'string' && !isNaN(value)) {
          cleanedData[key] = parseFloat(value);
        } else {
          cleanedData[key] = value;
        }
      }
      result[year] = cleanedData;
    }

    return result;
  }, [stockData.financialData?.cash_flow]);


  if (loading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center w-screen relative overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-blue-50/30"></div>

        {/* Floating geometric elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="absolute opacity-5"
              style={{
                left: `${10 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
                animation: `float ${8 + i * 2}s ease-in-out infinite`,
                animationDelay: `${i * 1.2}s`
              }}
            >
              <div className="w-32 h-32 border border-gray-200 rounded-2xl transform rotate-45"></div>
            </div>
          ))}
        </div>

        {/* Morphing liquid background */}
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="liquidGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#1E40AF" />
              </linearGradient>
            </defs>
            <path
              fill="url(#liquidGradient)"
              d="M0,300 C300,200 600,400 900,300 C1050,250 1150,350 1200,300 L1200,800 L0,800 Z"
              style={{
                animation: 'liquidMorph 8s ease-in-out infinite'
              }}
            />
          </svg>
        </div>

        <div className="text-center z-10 relative max-w-md mx-auto px-8">
          {/* Main loading indicator */}
          <div className="relative mb-12">
            {/* Ripple effect background */}
            <div className="absolute inset-0 flex items-center justify-center">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-20 h-20 border border-blue-200 rounded-full"
                  style={{
                    animation: `ripple 3s ease-out infinite`,
                    animationDelay: `${i * 1}s`
                  }}
                ></div>
              ))}
            </div>

            <div className="w-20 h-20 mx-auto relative">
              {/* Outer progress ring */}
              <div className="absolute inset-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    className="text-gray-100"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="226"
                    strokeDashoffset="226"
                    className="text-blue-500"
                    style={{
                      animation: 'progressRing 2s ease-in-out infinite'
                    }}
                  />
                </svg>
              </div>

              {/* Center eagle symbol with breathing effect */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative" style={{ animation: 'breathe 4s ease-in-out infinite' }}>
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <div className="w-4 h-4 bg-white rounded-sm opacity-90 transform rotate-45"></div>
                  </div>
                  {/* Enhanced glow with color shift */}
                  <div className="absolute inset-0 w-8 h-8 bg-blue-400 rounded-xl blur-md opacity-20" style={{ animation: 'glowShift 3s ease-in-out infinite' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Brand identity with typewriter effect */}
          <div className="space-y-3 mb-10">
            <h1 className="text-4xl font-thin tracking-tight text-gray-900 overflow-hidden">
              <span style={{ animation: 'typewriter 2s steps(9) 1s forwards', width: '0', whiteSpace: 'nowrap', borderRight: '2px solid transparent' }}>
                EagleView
              </span>
            </h1>
            <p className="text-lg font-light text-gray-500 tracking-wide opacity-0" style={{ animation: 'fadeInUp 1s ease-out 3s forwards' }}>
              Financial Intelligence
            </p>
          </div>

          {/* Loading status with subtle animation */}
          <div className="space-y-6">
            <div className="relative">
              <p className="text-gray-600 font-light tracking-wide">
                Preparing your dashboard
              </p>
              <div className="mt-3 flex justify-center">
                <div className="flex space-x-1">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-gray-300 rounded-full"
                      style={{
                        animation: `dotPulse 1.4s ease-in-out infinite`,
                        animationDelay: `${i * 0.2}s`
                      }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>

            {/* System status indicators */}
            <div className="grid grid-cols-3 gap-6 pt-4">
              {[
                { label: 'Market Data', status: 'active' },
                { label: 'Analytics', status: 'loading' },
                { label: 'Portfolio', status: 'pending' }
              ].map((item, index) => (
                <div key={item.label} className="text-center">
                  <div className="flex justify-center mb-2">
                    <div
                      className={`w-3 h-3 rounded-full transition-all duration-500 ${item.status === 'active' ? 'bg-green-400 shadow-lg shadow-green-400/30' :
                        item.status === 'loading' ? 'bg-blue-400 animate-pulse shadow-lg shadow-blue-400/30' :
                          'bg-gray-200'
                        }`}
                      style={{
                        animationDelay: `${index * 0.3}s`
                      }}
                    ></div>
                  </div>
                  <p className="text-xs font-medium text-gray-400 tracking-wider uppercase">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Minimal data preview */}
          <div className="mt-12 pt-8 border-t border-gray-100">
            <div className="flex justify-center items-center space-x-8 text-xs font-medium text-gray-400">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="tracking-wide">Real-time</span>
              </div>
              <div className="w-px h-4 bg-gray-200"></div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <span className="tracking-wide">Institutional Grade</span>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes progressRing {
            0% { stroke-dashoffset: 226; }
            50% { stroke-dashoffset: 113; }
            100% { stroke-dashoffset: 226; }
          }
          
          @keyframes dotPulse {
            0%, 80%, 100% { 
              transform: scale(1); 
              opacity: 0.3; 
            }
            40% { 
              transform: scale(1.2); 
              opacity: 1; 
            }
          }
          
          @keyframes float {
            0%, 100% { 
              transform: translateY(0px) rotate(45deg); 
              opacity: 0.03;
            }
            50% { 
              transform: translateY(-20px) rotate(45deg); 
              opacity: 0.08;
            }
          }
          
          @keyframes liquidMorph {
            0%, 100% {
              d: path("M0,300 C300,200 600,400 900,300 C1050,250 1150,350 1200,300 L1200,800 L0,800 Z");
            }
            25% {
              d: path("M0,350 C300,250 600,350 900,250 C1050,200 1150,300 1200,250 L1200,800 L0,800 Z");
            }
            50% {
              d: path("M0,250 C300,300 600,200 900,350 C1050,300 1150,250 1200,350 L1200,800 L0,800 Z");
            }
            75% {
              d: path("M0,320 C300,180 600,380 900,280 C1050,320 1150,220 1200,320 L1200,800 L0,800 Z");
            }
          }
          
          @keyframes ripple {
            0% {
              transform: scale(1);
              opacity: 0.8;
            }
            100% {
              transform: scale(2.5);
              opacity: 0;
            }
          }
          
          @keyframes breathe {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.05);
            }
          }
          
          @keyframes glowShift {
            0%, 100% {
              background-color: rgb(96 165 250);
              opacity: 0.2;
            }
            50% {
              background-color: rgb(59 130 246);
              opacity: 0.3;
            }
          }
          
          @keyframes typewriter {
            0% {
              width: 0;
              border-right-color: rgb(59 130 246);
            }
            99% {
              border-right-color: rgb(59 130 246);
            }
            100% {
              width: 100%;
              border-right-color: transparent;
            }
          }
          
          @keyframes fadeInUp {
            0% {
              opacity: 0;
              transform: translateY(20px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    );
  }


  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Navbar token={auth_token} />
        <div className="container mx-auto flex items-center justify-center p-4 sm:p-12 text-center">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-red-600 mb-2">An Error Occurred</h2>
            <p className="text-gray-600 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const handleRowSelection = (tableType, rowName, checked) => {
    setSelectedRows((prevRows) => ({
      ...prevRows,
      [tableType]: {
        ...(prevRows[tableType] || {}),
        [rowName]: checked,
      },
    }));
  };

  const createCustomTable = () => {
    if (!stockData.financialData || !customTableName) return;

    const customData = {};
    const allPeriods = new Set();
    const financialTypes = ["balance_sheet", "cash_flow", "profit_loss", "quarterly_results"];

    financialTypes.forEach((type) => {
      if (selectedRows[type]) {
        let dataToProcess = stockData.financialData[type];
        // Use the processed quarterly data for the custom table as well
        if (type === 'quarterly_results') {
          dataToProcess = processedQuarterlyData;
        }

        if (dataToProcess) {
          Object.keys(dataToProcess).forEach((period) => allPeriods.add(period));
        }
      }
    });

    const periodsArray = Array.from(allPeriods).sort();

    periodsArray.forEach((period) => {
      customData[period] = {};
    });

    financialTypes.forEach((type) => {
      if (selectedRows[type]) {
        let dataToProcess = stockData.financialData[type];
        if (type === 'quarterly_results') {
          dataToProcess = processedQuarterlyData;
        }

        if (dataToProcess) {
          Object.entries(selectedRows[type]).forEach(([row, isSelected]) => {
            if (isSelected) {
              periodsArray.forEach((period) => {
                // Ensure we only populate data for periods that actually exist in the source
                if (dataToProcess[period]) {
                  customData[period][row] = dataToProcess[period]?.[row] || "N/A";
                }
              });
            }
          });
        }
      }
    });

    setCustomTables((prevTables) => [...prevTables, { name: customTableName, data: customData }]);
    setSelectedRows({});
    setCustomTableName("");
    setExpandedRows({});
    setShowCustomTableModal(false);
  };

  const toggleSection = (type) => {
    setExpandedRows((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const availableFields = {
    balance_sheet: stockData.financialData?.balance_sheet ? Object.keys(stockData.financialData.balance_sheet[Object.keys(stockData.financialData.balance_sheet)[0]] || {}) : [],
    cash_flow: stockData.financialData?.cash_flow ? Object.keys(stockData.financialData.cash_flow[Object.keys(stockData.financialData.cash_flow)[0]] || {}) : [],
    profit_loss: stockData.financialData?.profit_loss ? Object.keys(stockData.financialData.profit_loss[Object.keys(stockData.financialData.profit_loss)[0]] || {}) : [],
    quarterly_results: processedQuarterlyData ? Object.keys(processedQuarterlyData[Object.keys(processedQuarterlyData)[0]] || {}) : [],
  };

  const { marketCap, ltp, highLow, peRatio, bookValue, dividendYield, roce, roe, faceValue, stockName, ratingsData, financialData, shareholdingData } = stockData;

  return (
    <div className="w-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 min-h-screen flex flex-col font-sans antialiased">
      <Navbar token={auth_token} className="w-full backdrop-blur-xl bg-white/80 border-b border-gray-200/50" />
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-white/70 backdrop-blur-xl rounded-3xl p-4 sm:p-8 mb-8 sm:mb-12 shadow-lg border border-white/50 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 to-purple-50/30 rounded-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 tracking-tight">
                {stockName}
              </h1>
              <div className="text-lg sm:text-xl text-blue-600 font-medium tracking-wide">{symbol}</div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 mb-8">
              {[
                { label: "Market Cap", value: marketCap !== "N/A" ? `₹${marketCap} Cr` : "N/A", highlight: true },
                { label: "Current Price", value: ltp !== "N/A" ? `₹${ltp}` : "N/A", highlight: true },
                { label: "High / Low", value: highLow }, { label: "Stock P/E", value: peRatio?.toFixed(2) ?? "N/A" },
                { label: "Book Value", value: bookValue !== "N/A" ? `₹${bookValue}` : "N/A" }, { label: "Div. Yield", value: dividendYield },
                { label: "ROCE", value: roce !== "N/A" ? `${roce}%` : "N/A" }, { label: "ROE", value: roe !== "N/A" ? `${roe}%` : "N/A" },
                { label: "Face Value", value: faceValue ? `₹${faceValue}` : "N/A" },
              ].map((metric, index) => (
                <div key={index} className={`backdrop-blur-sm rounded-2xl p-3 sm:p-4 border transition-all duration-300 ${metric.highlight ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200/50' : 'bg-white/50 border-gray-200/50'}`}>
                  <div className="text-xs sm:text-sm text-gray-500 font-medium mb-1 tracking-wide">{metric.label}</div>
                  <div className={`text-base sm:text-lg font-semibold ${metric.highlight ? 'text-blue-600' : 'text-gray-900'}`}>{metric.value}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center mb-6">
              {navTabs.map((tab) => (
                <motion.a key={tab.id} href={`#${tab.id}`} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium text-gray-700 bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all duration-300 shadow-sm">
                  {tab.title}
                </motion.a>
              ))}
            </div>
            <div className="text-center">
              <motion.button
                onClick={() => setShowCustomTableModal(true)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                Create Custom Table
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Custom Table Modal */}
        <AnimatePresence>
          {showCustomTableModal && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-white/50 max-h-[90vh] overflow-hidden flex flex-col"
              >
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                  <h2 className="text-xl font-semibold text-gray-900">Create New Table</h2>
                  <motion.button
                    onClick={() => setShowCustomTableModal(false)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </motion.button>
                </div>
                <div className="mb-6 flex-shrink-0">
                  <input type="text" value={customTableName} onChange={(e) => setCustomTableName(e.target.value)} placeholder="Enter table name..."
                    className="w-full p-3 bg-gray-50/80 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 transition-all"
                  />
                </div>
                <div className="flex-1 overflow-y-auto -mr-2 pr-2 space-y-3 text-black">
                  {["quarterly_results", "profit_loss", "balance_sheet", "cash_flow"].map((type) => (
                    <div key={type} className="bg-gray-50/50 rounded-xl overflow-hidden border border-gray-200/50">
                      <button onClick={() => toggleSection(type)} className="w-full flex justify-between items-center p-3 transition-colors duration-200 hover:bg-gray-100/50">
                        <span className="font-medium text-gray-800 text-left">{type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                        <motion.div animate={{ rotate: expandedRows[type] ? 180 : 0 }} transition={{ duration: 0.3 }}
                          className="w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center">
                          <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </motion.div>
                      </button>
                      <AnimatePresence>
                        {expandedRows[type] && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="border-t border-gray-200/50">
                            <div className="p-3 space-y-1">
                              {availableFields[type].map((field) => (
                                <label key={field} className="flex items-center p-2 rounded-lg hover:bg-white/70 transition-colors cursor-pointer">
                                  <input type="checkbox" checked={selectedRows[type]?.[field] || false} onChange={(e) => handleRowSelection(type, field, e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-3 text-sm text-gray-700">{field.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                                </label>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-gray-200/50 mt-4 space-y-3 flex-shrink-0">
                  <motion.button onClick={createCustomTable} disabled={!customTableName || Object.keys(selectedRows).length === 0}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:bg-gray-300 transition-all">
                    Create Table
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* Content Sections */}
        <div className="space-y-12 sm:space-y-16">
          {customTables.map((table, index) => (
            <motion.section
              key={index}
              className="bg-white/60 backdrop-blur-xl rounded-3xl p-4 sm:p-6 shadow-lg border border-white/50"
            >
              <CustomTable name={table.name} data={table.data} />
            </motion.section>
          ))}

          <motion.section id="rating" className="bg-white/60 backdrop-blur-xl rounded-3xl p-4 sm:p-8 shadow-lg border border-white/50">
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6 tracking-tight">EagleView Rating</h2>
            <StockRatingRadar ratingsData={ratingsData} stockName={stockName} />
          </motion.section>

          <motion.section id="quarterly-results" className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 overflow-hidden">
            {processedQuarterlyData && (
              <FinancialTable
                data={processedQuarterlyData}
                type="quarterly_results"
              />
            )}
          </motion.section>

          <motion.section id="income-sheet" className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 overflow-hidden">
            {processedProfitLossData && (
              <>
                <FinancialTable
                  data={processedProfitLossData}
                  type="profit_loss"
                />
                <div className="p-4 sm:p-6 border-t border-gray-200/50">
                  <SalesProfitBarGraph data={financialData} />
                </div>
              </>
            )}
          </motion.section>

          <motion.section id="balance-sheet" className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 overflow-hidden">
            {processedBalanceSheetData && (
              <>
                <FinancialTable
                  data={processedBalanceSheetData}
                  type="balance_sheet"
                />
                <div className="p-4 sm:p-6 border-t border-gray-200/50">
                  <BalanceSheetTreeMap data={financialData} />
                </div>
              </>
            )}
          </motion.section>

          <motion.section id="cash-flow" className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 overflow-hidden">
            {processedCashFlowData && (
              <FinancialTable
                data={processedCashFlowData}
                type="cash_flow"
              />
            )}
          </motion.section>

          <motion.section id="shareholding-pattern" className="bg-white/60 backdrop-blur-xl rounded-3xl p-4 sm:p-8 shadow-lg border border-white/50">
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6 tracking-tight">Shareholding Pattern</h2>
            <ShareholdingPatternBarGraph data={shareholdingData} />
          </motion.section>
        </div>
      </main>
    </div>
  );
}

// We export the individual chart components as they might be useful elsewhere
export { StockRatingRadar, FinancialTable, BalanceSheetTreeMap, SalesProfitBarGraph, ShareholdingPatternBarGraph, CustomTable };
export default StockDetails;