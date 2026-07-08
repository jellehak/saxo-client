#!/usr/bin/env node

import * as dotenv from 'dotenv';
import { ArgumentParser } from 'argparse';
import { createClient } from '../index.js';
import path from 'path';
import { existsSync } from 'fs';
import { homedir } from 'os';

// Load environment variables from .env files
// First, try local .env in current directory
dotenv.config();

// Then, load from ~/.saxo/.env if it exists
const saxoEnvPath = path.join(homedir(), '.saxo', '.env');
if (existsSync(saxoEnvPath)) {
  dotenv.config({ path: saxoEnvPath });
}

// Generic table formatter
const formatTable = (data, columns) => {
  if (!data || data.length === 0) {
    return 'No data.';
  }

  const rows = data.map(item =>
    columns.reduce((row, col) => {
      let value = item[col.key];
      if (col.format) {
        value = col.format(value);
      }
      return { ...row, [col.key]: value };
    }, {})
  );

  const header = columns.map(col => col.label.padEnd(col.width)).join('');
  const separator = '─'.repeat(columns.reduce((sum, col) => sum + col.width, 0));
  
  const lines = rows.map(row =>
    columns.map(col => String(row[col.key] || '—').padEnd(col.width)).join('')
  );

  return [header, separator, ...lines].join('\n');
};

const parser = new ArgumentParser({
  description: 'Minimal Saxo API CLI',
  add_help: true,
});

// Global argument for token
parser.add_argument('--token', {
  help: 'Saxo API Bearer token (or use SAXO_TOKEN env var)',
  default: process.env.SAXO_TOKEN,
});

const subparsers = parser.add_subparsers({
  title: 'commands',
  dest: 'command',
  help: 'available commands',
});

// Chart command - get market prices
const chartParser = subparsers.add_parser('chart', {
  help: 'Get market prices (chart data)',
});
chartParser.add_argument('uic', {
  help: 'Instrument UIC (e.g., 211 for EURUSD)',
});
chartParser.add_argument('--asset-type', {
  default: '', // Autodetect if not provided
  help: 'Asset type (default: FxSpot)',
});
chartParser.add_argument('--horizon', {
  type: 'int',
  default: 1,
  help: 'Time horizon in minutes (default: 1)',
});

// Buy command
const buyParser = subparsers.add_parser('buy', {
  help: 'Buy an instrument',
});
buyParser.add_argument('uic', {
  help: 'Instrument UIC',
});
buyParser.add_argument('--amount', {
  type: 'float',
  required: true,
  help: 'Amount to buy',
});
buyParser.add_argument('--asset-type', {
  default: '', // Autodetect if not provided
  help: 'Asset type (default: FxSpot)',
});

// Sell command
const sellParser = subparsers.add_parser('sell', {
  help: 'Sell an instrument',
});
sellParser.add_argument('uic', {
  help: 'Instrument UIC',
});
sellParser.add_argument('--amount', {
  type: 'float',
  required: true,
  help: 'Amount to sell',
});
sellParser.add_argument('--asset-type', {
  default: '', // Autodetect if not provided
  help: 'Asset type (default: FxSpot)',
});

// Portfolio command
const portfolioParser = subparsers.add_parser('portfolio', {
  help: 'List portfolio positions',
});

// Orders command
const ordersParser = subparsers.add_parser('orders', {
  help: 'List all orders',
});

// Me command
const meParser = subparsers.add_parser('me', {
  help: 'Show account information',
});

async function main() {
  const args = parser.parse_args();

  if (!args.token) {
    console.error('Error: Saxo token is required. Set SAXO_TOKEN env var or use --token');
    process.exit(1);
  }

  if (!args.command) {
    parser.print_help();
    process.exit(0);
  }

  try {
    const client = createClient(args.token);

    switch (args.command) {
      case 'chart': {
        let assetType = args.asset_type;
        // Try to auto-detect if using default
        assetType = await client.detectAssetType(String(args.uic));
        const data = await client.fetchChart(String(args.uic), assetType, {
            Horizon: String(args.horizon),
        });
        console.log(JSON.stringify(data, null, 2));
        break;
      }

      case 'buy': {
        let assetType = args.asset_type;
        if (!assetType) {
          // Try to auto-detect if using default
          try {
            assetType = await client.detectAssetType(String(args.uic));
          } catch (error) {
            // Fall back to default
          }
        }
        // Log
        console.log(`Placing buy order for UIC ${args.uic}, amount ${args.amount}, asset type ${assetType}`);

        const result = await client.buy({
          Uic: String(args.uic),
          AssetType: assetType,
          Amount: args.amount,
        });
        console.log('Buy order placed:');
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case 'sell': {
        let assetType = args.asset_type;
        if (!assetType) {
          // Try to auto-detect if using default
          try {
            assetType = await client.detectAssetType(String(args.uic));
          } catch (error) {
            // Fall back to default
          }
        }
        const result = await client.sell({
          Uic: String(args.uic),
          AssetType: assetType,
          Amount: args.amount,
        });
        console.log('Sell order placed:');
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case 'portfolio': {
        const data = await client.listPortfolio();
        
        if (!data.Data || data.Data.length === 0) {
          console.log('No positions found.');
          break;
        }

        console.log(`\n📊 Portfolio (${data.Data.length} position${data.Data.length !== 1 ? 's' : ''})\n`);
        
        const rows = data.Data.map(pos => {
          const displayFormat = pos.DisplayAndFormat;
          const base = pos.NetPositionBase;
          const view = pos.NetPositionView;
          
          return {
            symbol: displayFormat.Symbol,
            description: displayFormat.Description,
            amount: base.Amount,
            assetType: base.AssetType,
            currentPrice: typeof view.CurrentPrice === 'number' ? view.CurrentPrice.toFixed(5) : '—',
            marketValue: (view.MarketValue ?? view.MarketValueOpen ?? 0).toFixed(2),
            pnl: (view.ProfitLossOnTrade ?? 0).toFixed(2),
            pnlPercent: (view.InstrumentPriceDayPercentChange ?? 0).toFixed(2),
          };
        });

        const columns = [
          { key: 'symbol', label: 'Symbol', width: 12 },
          { key: 'description', label: 'Description', width: 25, format: (v) => String(v).substring(0, 24) },
          { key: 'amount', label: 'Amount', width: 10 },
          { key: 'assetType', label: 'Type', width: 8 },
          { key: 'currentPrice', label: 'Price', width: 12 },
          { key: 'marketValue', label: 'Value', width: 12 },
          { key: 'pnl', label: 'P&L', width: 10, format: (v) => `${parseFloat(v) >= 0 ? '✓' : '✗'} ${v}` },
          { key: 'pnlPercent', label: 'P&L %', width: 8 },
        ];

        console.log(formatTable(rows, columns));
        console.log('');
        break;
      }

      case 'orders': {
        const data = await client.listOrders();
        
        if (!data.Data || data.Data.length === 0) {
          console.log('No orders found.');
          break;
        }

        console.log(`\n📋 Orders (${data.Data.length} order${data.Data.length !== 1 ? 's' : ''})\n`);
        
        const rows = data.Data.map(order => {
          const displayFormat = order.DisplayAndFormat || {};
          return {
            orderId: String(order.OrderId || '').substring(0, 10),
            symbol: displayFormat.Symbol || order.Symbol || '—',
            description: displayFormat.Description || '—',
            buySell: order.BuySell || '—',
            orderType: order.OrderType || '—',
            amount: typeof order.Amount === 'number' ? order.Amount.toFixed(0) : '—',
            price: typeof order.Price === 'number' ? order.Price.toFixed(5) : '—',
            status: order.Status || '—',
          };
        });

        const columns = [
          { key: 'orderId', label: 'Order ID', width: 12 },
          { key: 'symbol', label: 'Symbol', width: 12 },
          { key: 'description', label: 'Description', width: 20, format: (v) => String(v).substring(0, 19) },
          { key: 'buySell', label: 'B/S', width: 6 },
          { key: 'orderType', label: 'Type', width: 8 },
          { key: 'amount', label: 'Amount', width: 10 },
          { key: 'price', label: 'Price', width: 12 },
          { key: 'status', label: 'Status', width: 10 },
        ];

        console.log(formatTable(rows, columns));
        console.log('');
        break;
      }

      case 'me': {
        const data = await client.getMe();
        
        if (!data.Data || data.Data.length === 0) {
          console.log('No account information found.');
          break;
        }

        const account = data.Data[0];
        console.log(`\n👤 Account Information\n`);
        console.log(`  Account ID:    ${account.AccountId || '—'}`);
        console.log(`  Account Name:  ${account.AccountName || '—'}`);
        console.log(`  Account Type:  ${account.AccountType || '—'}`);
        console.log(`  Status:        ${account.TradingStatus || '—'}`);
        console.log(`  Currency:      ${account.PreferredCurrency || '—'}`);
        console.log(`  Cash Balance:  ${account.CashBalance !== undefined ? account.CashBalance.toFixed(2) : '—'}`);
        console.log(`  Broker:        ${account.Broker || '—'}`);
        console.log('');
        break;
      }

      default:
        parser.print_help();
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (error.body) {
      console.error('Response body:', JSON.stringify(error.body, null, 2));
    }
    process.exit(1);
  }
}

main();
