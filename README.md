# Saxo Client

A minimal, isomorphic Saxo API client for Node.js and browsers.

## Features

- ✨ Minimal and lightweight
- 🔄 Isomorphic (works in Node.js and browsers)
- 📦 ESM modules
- 🎯 Functional programming style
- 🔐 Bearer token authentication

## Installation

```bash
npm install saxo-client
```

## Usage

### Node.js

```javascript
import { createClient } from './index.js';

const client = createClient('your-bearer-token');

// Buy
const buyOrder = await client.buy('account-key', {
  Uic: 17, // EURUSD
  Amount: 100000,
});

// Sell
const sellOrder = await client.sell('account-key', {
  Uic: 17,
  Amount: 100000,
});

// List Portfolio
const portfolio = await client.listPortfolio();

// Fetch Instrument
const instrument = await client.fetchInstrument(17);

// Fetch Chart
const chart = await client.fetchChart(17, 'FxSpot', {
  HistoryLength: 20,
});
```

### Browser

Open `client/index.html` in your browser. It provides a simple Vue.js 3 interface to interact with the API.

## API Methods

- `buy(accountKey, orderData)` - Place a buy order
- `sell(accountKey, orderData)` - Place a sell order
- `listPortfolio(fieldGroups?)` - Get portfolio information (ClientKey extracted from token)
- `fetchInstrument(uic, assetType?)` - Get instrument details
- `fetchChart(uic, assetType?, params?)` - Get chart data

## License

MIT
