#!/usr/bin/env node

import 'dotenv/config.js';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '../index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const TOKEN = process.env.SAXO_TOKEN;

// Load lookup.json
let lookupTable = {};
try {
  const lookupPath = path.join(__dirname, 'lookup.json');
  const lookupData = fs.readFileSync(lookupPath, 'utf-8');
  lookupTable = JSON.parse(lookupData);
} catch (error) {
  console.warn('Warning: Could not load lookup.json:', error.message);
}

// Middleware
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Initialize Saxo client
let client;
try {
  if (!TOKEN) {
    throw new Error('SAXO_TOKEN environment variable is required');
  }
  client = createClient(TOKEN);
} catch (error) {
  console.error('Failed to initialize Saxo client:', error.message);
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Saxo Trading API Server',
    description: 'A minimal Express server for the Saxo Bank trading API',
    version: '1.0.0',
    endpoints: {
      'GET /': 'This help page',
      'GET /health': 'Health check',
      'GET /lookup': 'List all instruments in lookup.json',
      'GET /lookup/:symbol': 'Get instrument by symbol from lookup.json',
      'GET /me': 'Get consolidated account info (portfolio, orders, balance, account)',
      'GET /portfolio': 'List all open positions',
      'GET /orders': 'List all open orders',
      'GET /balance': 'Get account balance',
      'GET /account': 'Get account information',
      'POST /buy': 'Place a buy order (body: { symbol, Amount } or { Uic, AssetType, Amount })',
      'POST /sell': 'Place a sell order (body: { symbol, Amount } or { Uic, AssetType, Amount })',
    },
  });
});

// Lookup endpoints
app.get('/lookup', (req, res) => {
  res.json(lookupTable);
});

app.get('/lookup/:symbol', (req, res) => {
  const { symbol } = req.params;
  const instrument = lookupTable[symbol];
  
  if (!instrument) {
    return res.status(404).json({ 
      error: `Symbol "${symbol}" not found in lookup.json`,
      available: Object.keys(lookupTable),
    });
  }
  
  res.json({ symbol, ...instrument });
});

// Consolidated account info
app.get('/me', async (req, res) => {
  try {
    if (!client) throw new Error('Saxo client not initialized');
    const [portfolio, orders, balance, account] = await Promise.all([
      client.listPortfolio(),
      client.listOrders(),
      client.getBalance(),
      client.getMe(),
    ]);
    res.json({
      portfolio,
      orders,
      balance,
      account,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Helper function to resolve symbol to Uic and AssetType
const resolveOrderData = (orderData) => {
  const data = { ...orderData };
  
  if (data.symbol) {
    const instrument = lookupTable[data.symbol];
    if (!instrument) {
      return {
        error: `Symbol "${data.symbol}" not found in lookup.json`,
      };
    }
    delete data.symbol;
    data.Uic = instrument.Uic;
    data.AssetType = instrument.AssetType;
  }
  
  return data;
};

// Buy endpoint
app.post('/buy', async (req, res) => {
  try {
    if (!client) throw new Error('Saxo client not initialized');
    
    const orderData = resolveOrderData(req.body);
    if (orderData.error) {
      return res.status(404).json({ error: orderData.error });
    }
    
    const result = await client.buy(orderData);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Sell endpoint
app.post('/sell', async (req, res) => {
  try {
    if (!client) throw new Error('Saxo client not initialized');
    
    const orderData = resolveOrderData(req.body);
    if (orderData.error) {
      return res.status(404).json({ error: orderData.error });
    }
    
    const result = await client.sell(orderData);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// List orders
app.get('/orders', async (req, res) => {
  try {
    if (!client) throw new Error('Saxo client not initialized');
    const orders = await client.listOrders();
    res.json(orders);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// List portfolio
app.get('/portfolio', async (req, res) => {
  try {
    if (!client) throw new Error('Saxo client not initialized');
    const portfolio = await client.listPortfolio();
    res.json(portfolio);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get balance
app.get('/balance', async (req, res) => {
  try {
    if (!client) throw new Error('Saxo client not initialized');
    const balance = await client.getBalance();
    res.json(balance);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get account info
app.get('/account', async (req, res) => {
  try {
    if (!client) throw new Error('Saxo client not initialized');
    const account = await client.getMe();
    res.json(account);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Search instruments
app.get('/search', async (req, res) => {
  try {
    if (!client) throw new Error('Saxo client not initialized');
    const { keywords } = req.query;
    if (!keywords) {
      return res.status(400).json({ error: 'keywords query parameter is required' });
    }
    const results = await client.searchInstruments(keywords);
    res.json(results);
  } catch (error) {
    res.status(400).json({ error: error.message, errorStack: error.stack });
  }
});

// Get instrument details
app.get('/instrument/:uic', async (req, res) => {
  try {
    if (!client) throw new Error('Saxo client not initialized');
    const { uic } = req.params;
    const instrument = await client.fetchInstrument(uic);
    res.json(instrument);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Saxo server running on http://localhost:${PORT}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  } else {
    console.error(`Server error: ${error.message}`);
  }
  process.exit(1);
});
