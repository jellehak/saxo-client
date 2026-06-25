# Saxo Client

A minimal, isomorphic Saxo API client for Node.js and browsers.

## Features

- ✨ Minimal and lightweight
- 🔄 Isomorphic (works in Node.js and browsers)
- 📦 ESM modules
- 🎯 Functional programming style
- 🔐 Bearer token authentication
- 🔍 Instrument search functionality

## Installation

```bash
npm install saxo-client
```

## Usage

### Node.js

```javascript
import { createClient } from './index.js';

const client = createClient('your-bearer-token');

// Search for instruments
const searchResults = await client.searchInstruments('EURUSD', 'FxSpot');

// Buy
const buyOrder = await client.buy({
  Uic: 17,
  Amount: 100000,
});

// Sell
const sellOrder = await client.sell({
  Uic: 17,
  Amount: 100000,
});

// List Portfolio
const portfolio = await client.listPortfolio();

// Fetch Instrument
const instrument = await client.fetchInstrument(17);

// Fetch Trading Conditions
const conditions = await client.fetchTradingConditions(17);

// Fetch Chart
const chart = await client.fetchChart(17, 'FxSpot', {
  HistoryLength: 20,
});
```

### Browser

Open `client/index.html` in your browser. It provides a simple Vue.js 3 interface to interact with the API with pages for:
- **Search** - Find instruments by keywords
- **Buy** - Place buy orders
- **Sell** - Place sell orders
- **Chart** - Get chart data for instruments
- **Portfolio** - View your positions

## API Methods

- `searchInstruments(keywords, assetTypes?)` - Search for instruments by keywords
- `buy(orderData)` - Place a buy order (AccountKey extracted from token)
- `sell(orderData)` - Place a sell order (AccountKey extracted from token)
- `listPortfolio(fieldGroups?)` - Get portfolio information (ClientKey extracted from token)
- `fetchInstrument(uic, assetType?)` - Get instrument details
- `fetchTradingConditions(uic, assetType?)` - Get trading conditions (minimum trade size, pip size, etc.)
- `fetchChart(uic, assetType?, params?)` - Get chart data

## License

MIT
