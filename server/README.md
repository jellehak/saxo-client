# Saxo Trading API Server

A minimal Express server wrapper around the Saxo Bank trading API.

## Setup

```bash
npm install
export SAXO_TOKEN="your_saxo_token"
npm start
```

Server runs on `http://localhost:3000`

## API Endpoints

### Get Help

```bash
curl http://localhost:3000/
```

### Health Check

```bash
curl http://localhost:3000/health
```

### Get Consolidated Account Info

Returns portfolio, orders, balance, and account information in one request:

```bash
curl http://localhost:3000/me
```

### Get Portfolio (Open Positions)

```bash
curl http://localhost:3000/portfolio
```

### Get Orders

```bash
curl http://localhost:3000/orders
```

### Get Account Balance

```bash
curl http://localhost:3000/balance
```

### Get Account Info

```bash
curl http://localhost:3000/account
```

### Buy an Instrument

```bash
curl -X POST http://localhost:3000/buy \
  -H "Content-Type: application/json" \
  -d '{
    "Uic": 211,
    "AssetType": "FxSpot",
    "Amount": 1000
  }'

# ASML
curl -X POST http://localhost:3000/buy \
  -H "Content-Type: application/json" \
  -d '{
    "Uic": 1636,
    "AssetType": "CfdOnStock",
    "Amount": 1
  }'
```

### Sell an Instrument

```bash
curl -X POST http://localhost:3000/sell \
  -H "Content-Type: application/json" \
  -d '{
    "Uic": 211,
    "AssetType": "FxSpot",
    "Amount": 1000
  }'
```

### Search Instruments

```bash
curl "http://localhost:3000/search?keywords=EUR"
```

### Get Instrument Details

```bash
curl http://localhost:3000/instrument/211
```
