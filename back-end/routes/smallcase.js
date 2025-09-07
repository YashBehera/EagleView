const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const router = express.Router();

// Smallcase Gateway configuration
const SMALLCASE_GATEWAY_NAME = process.env.SMALLCASE_GATEWAY_NAME || 'gatewaydemo';
const SMALLCASE_API_KEY = process.env.SMALLCASE_API_KEY || 'gatewayDemo_secret';
const SMALLCASE_AUTH_TOKEN = process.env.SMALLCASE_AUTH_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJndWVzdCI6dHJ1ZSwiaWF0IjoxNjU0MzIxMDAwfQ.qiZ_w1yFYXhkdLMlqI28XJOXitfZwr64e2oL-lMEHZU';
const SMALLCASE_API_URL = 'https://gatewayapi.smallcase.com/gateway';
const USE_MOCK_RESPONSE = process.env.USE_MOCK_RESPONSE === 'true' || true; // Default to true for testing

// Mongoose schema for storing holdings
const HoldingSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true },
  gateway: { type: String, required: true },
  payload: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now, expires: '7d' } // Expire after 7 days
});
const Holding = mongoose.model('Holding', HoldingSchema);

// Validate PAN (5 letters, 4 digits, 1 letter)
const validatePan = (pan) => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan);
};

// Validate mobile (10 digits starting with 6-9)
const validateMobile = (mobile) => {
  const mobileRegex = /^[6-9]\d{9}$/;
  return mobileRegex.test(mobile);
};

// Normalize holdings for front-end
const normalizeHoldings = (mutualFunds) => {
  const normalizedHoldings = mutualFunds.map((mf) => {
    const currentNav = mf.currentNav || mf.nav || 0;
    const averageNav = mf.averageNav || mf.purchasePrice || currentNav;
    const units = mf.units || 0;
    const dayChange = currentNav && averageNav
      ? (((currentNav - averageNav) / averageNav) * 100).toFixed(2)
      : 0;
    return {
      instrument_token: mf.schemeCode || mf.isin || 'UNKNOWN',
      tradingsymbol: mf.schemeName || mf.scheme || 'Unknown MF',
      quantity: units,
      average_price: averageNav,
      last_price: currentNav,
      pnl: ((currentNav - averageNav) * units).toFixed(2),
      change: dayChange,
      dayChange: parseFloat(dayChange),
      dayPnl: (currentNav * units * dayChange / 100).toFixed(2),
      currentValue: (currentNav * units).toFixed(2),
      investedValue: (averageNav * units).toFixed(2),
      sector: 'Mutual Funds',
      folioNumber: mf.folioNumber || 'N/A',
      assetType: mf.assetType || 'EQUITY'
    };
  });
  const totalValue = normalizedHoldings.reduce((sum, mf) => sum + parseFloat(mf.currentValue), 0);
  return {
    holdings: normalizedHoldings,
    funds: {
      total: totalValue.toFixed(2),
      available: (totalValue * 0.8).toFixed(2),
      used: (totalValue * 0.2).toFixed(2),
    },
  };
};

// POST /smallcase/create-transaction
router.post('/create-transaction', async (req, res) => {
  const { pan, mobile } = req.body;

  if (!pan || !mobile) {
    return res.status(400).json({ message: 'PAN and mobile number are required' });
  }

  if (!validatePan(pan)) {
    return res.status(400).json({ message: 'Invalid PAN format (e.g., ABCDE1234F)' });
  }

  if (!validateMobile(mobile)) {
    return res.status(400).json({ message: 'Invalid mobile number (must be 10 digits starting with 6-9)' });
  }

  if (USE_MOCK_RESPONSE) {
    console.log('Mock transaction creation for PAN:', pan);
    return res.json({ transactionId: 'mock_transaction_123' });
  }

  try {
    console.log('Creating transaction for PAN:', pan, 'Mobile:', mobile);
    const response = await axios.post(
      `${SMALLCASE_API_URL}/${SMALLCASE_GATEWAY_NAME}/transaction`,
      {
        intent: 'MF_HOLDINGS_IMPORT',
        assetConfig: { pan, phone: mobile },
        responseConfig: { casDetail: true, casSummary: true }
      },
      {
        headers: {
          'accept': 'application/json',
          'x-gateway-secret': SMALLCASE_API_KEY,
          'x-gateway-authtoken': SMALLCASE_AUTH_TOKEN,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    console.log('Transaction response:', JSON.stringify(response.data, null, 2));
    const transactionId = response.data.data?.transactionId;
    if (!transactionId) {
      throw new Error('Transaction ID not found in response');
    }

    res.json({ transactionId });
  } catch (error) {
    const errorDetails = {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
      code: error.code,
    };
    console.error('Create transaction error:', JSON.stringify(errorDetails, null, 2));
    res.status(error.response?.status || 500).json({
      message: `Failed to create transaction: ${error.response?.data?.message || error.message}`,
    });
  }
});

// POST /smallcase/trigger-otp
router.post('/trigger-otp', async (req, res) => {
  const { transactionId, pan, mobile } = req.body;

  if (!transactionId || !pan || !mobile) {
    return res.status(400).json({ message: 'Transaction ID, PAN, and mobile number are required' });
  }

  if (!validatePan(pan)) {
    return res.status(400).json({ message: 'Invalid PAN format (e.g., ABCDE1234F)' });
  }

  if (!validateMobile(mobile)) {
    return res.status(400).json({ message: 'Invalid mobile number (must be 10 digits starting with 6-9)' });
  }

  if (USE_MOCK_RESPONSE) {
    console.log('Mock OTP trigger for transactionId:', transactionId);
    return res.json({ message: 'Mock OTP sent' });
  }

  try {
    console.log('Triggering OTP for transactionId:', transactionId);
    const response = await axios.post(
      `${SMALLCASE_API_URL}/${SMALLCASE_GATEWAY_NAME}/otp`,
      { transactionId, pan, phone: mobile },
      {
        headers: {
          'accept': 'application/json',
          'x-gateway-secret': SMALLCASE_API_KEY,
          'x-gateway-authtoken': SMALLCASE_AUTH_TOKEN,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    console.log('OTP trigger response:', JSON.stringify(response.data, null, 2));
    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    const errorDetails = {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
      code: error.code,
    };
    console.error('Trigger OTP error:', JSON.stringify(errorDetails, null, 2));
    res.status(error.response?.status || 500).json({
      message: `Failed to trigger OTP: ${error.response?.data?.message || error.message}`,
    });
  }
});

// POST /smallcase/verify-otp
router.post('/verify-otp', async (req, res) => {
  const { transactionId, otp } = req.body;

  if (!transactionId || !otp) {
    return res.status(400).json({ message: 'Transaction ID and OTP are required' });
  }

  if (USE_MOCK_RESPONSE) {
    console.log('Mock OTP verification for transactionId:', transactionId);
    const mockHoldings = [
      {
        schemeCode: 'MF123',
        schemeName: 'Test Mutual Fund',
        isin: 'INF1234567890',
        folioNumber: '12345678',
        units: 100,
        averageNav: 50,
        currentNav: 55,
        currentValue: 5500,
        assetType: 'EQUITY',
      },
    ];
    return res.json(normalizeHoldings(mockHoldings));
  }

  try {
    console.log('Verifying OTP for transactionId:', transactionId);
    const response = await axios.post(
      `${SMALLCASE_API_URL}/${SMALLCASE_GATEWAY_NAME}/verifyOTP`,
      { transactionId, otp },
      {
        headers: {
          'accept': 'application/json',
          'x-gateway-secret': SMALLCASE_API_KEY,
          'x-gateway-authtoken': SMALLCASE_AUTH_TOKEN,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    console.log('Verify OTP response:', JSON.stringify(response.data, null, 2));
    res.json({ message: 'OTP verified, awaiting holdings via webhook' });
  } catch (error) {
    const errorDetails = {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
      code: error.code,
    };
    console.error('Verify OTP error:', JSON.stringify(errorDetails, null, 2));
    res.status(error.response?.status || 500).json({
      message: `Failed to verify OTP: ${error.response?.data?.message || error.message}`,
    });
  }
});

// GET /smallcase/get-holdings
router.get('/get-holdings', async (req, res) => {
  const { transactionId } = req.query;

  if (!transactionId) {
    return res.status(400).json({ message: 'Transaction ID is required' });
  }

  if (USE_MOCK_RESPONSE) {
    console.log('Mock holdings fetch for transactionId:', transactionId);
    const mockHoldings = [
      {
        schemeCode: 'MF123',
        schemeName: 'Test Mutual Fund',
        isin: 'INF1234567890',
        folioNumber: '12345678',
        units: 100,
        averageNav: 50,
        currentNav: 55,
        currentValue: 5500,
        assetType: 'EQUITY',
      },
    ];
    return res.json(normalizeHoldings(mockHoldings));
  }

  try {
    const holding = await Holding.findOne({ transactionId });
    if (!holding) {
      return res.status(404).json({ message: 'Holdings not found for this transaction' });
    }

    console.log('Fetched holdings for transactionId:', transactionId);
    res.json(normalizeHoldings(holding.payload.dtSummary || []));
  } catch (error) {
    console.error('Get holdings error:', error.message);
    res.status(500).json({ message: `Failed to fetch holdings: ${error.message}` });
  }
});

// POST /smallcase/webhook/smallcase-holdings
router.post('/webhook/smallcase-holdings', async (req, res) => {
  const { gateway, data } = req.body;

  if (!gateway || !data || !data.transactionId) {
    console.error('Invalid webhook payload:', JSON.stringify(req.body, null, 2));
    return res.status(400).json({ message: 'Invalid webhook payload' });
  }

  const transactionId = data.transactionId;
  console.log('Received webhook for transactionId:', transactionId, 'Data:', JSON.stringify(data, null, 2));

  try {
    // Store holdings in MongoDB
    await Holding.findOneAndUpdate(
      { transactionId },
      { gateway, payload: data.payload, createdAt: new Date() },
      { upsert: true, new: true }
    );
    console.log('Stored holdings for transactionId:', transactionId);
    res.status(200).json({ message: 'Webhook received successfully' });
  } catch (error) {
    console.error('Webhook storage error:', error.message);
    res.status(500).json({ message: `Failed to store webhook data: ${error.message}` });
  }
});

module.exports = router;