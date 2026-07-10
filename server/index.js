#!/usr/bin/env node

import 'dotenv/config.js';
import express from 'express';
import { createClient } from '../index.js';

const app = express();
const PORT = process.env.PORT || 3000;
const TOKEN = process.env.SAXO_TOKEN;

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
      'GET /me': 'Get consolidated account info (portfolio, orders, balance, account)',
      'GET /portfolio': 'List all open positions',
      'GET /orders': 'List all open orders',
      'GET /balance': 'Get account balance',
      'GET /account': 'Get account information',
      'POST /buy': 'Place a buy order (body: { Uic, AssetType, Amount })',
      'POST /sell': 'Place a sell order (body: { Uic, AssetType, Amount })',
    },
  });
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

// Buy endpoint
app.post('/buy', async (req, res) => {
  try {
    if (!client) throw new Error('Saxo client not initialized');
    const result = await client.buy(req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Sell endpoint
app.post('/sell', async (req, res) => {
  try {
    if (!client) throw new Error('Saxo client not initialized');
    const result = await client.sell(req.body);
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
