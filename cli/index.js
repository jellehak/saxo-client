#!/usr/bin/env node

import { ArgumentParser } from 'argparse';
import { createClient } from '../index.js';

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
  default: 'FxSpot',
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
  default: 'FxSpot',
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
  default: 'FxSpot',
  help: 'Asset type (default: FxSpot)',
});

// Portfolio command
const portfolioParser = subparsers.add_parser('portfolio', {
  help: 'List portfolio positions',
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
        const data = await client.fetchChart(args.uic, args.asset_type, {
          Horizon: args.horizon,
        });
        console.log(JSON.stringify(data, null, 2));
        break;
      }

      case 'buy': {
        const result = await client.buy({
          Uic: args.uic,
          AssetType: args.asset_type,
          Amount: args.amount,
        });
        console.log('Buy order placed:');
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case 'sell': {
        const result = await client.sell({
          Uic: args.uic,
          AssetType: args.asset_type,
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
          
          const symbol = displayFormat.Symbol;
          const description = displayFormat.Description;
          const amount = base.Amount;
          const assetType = base.AssetType;
          const currentPrice = view.CurrentPrice || '—';
          const marketValue = view.MarketValue ?? view.MarketValueOpen ?? 0;
          const pnl = view.ProfitLossOnTrade ?? 0;
          const pnlPercent = view.InstrumentPriceDayPercentChange ?? 0;
          
          return {
            symbol,
            description,
            amount,
            assetType,
            currentPrice: typeof currentPrice === 'number' ? currentPrice.toFixed(5) : currentPrice,
            marketValue: marketValue.toFixed(2),
            pnl: pnl.toFixed(2),
            pnlPercent: pnlPercent.toFixed(2),
          };
        });

        // Print header
        console.log(
          'Symbol'.padEnd(12) +
          'Description'.padEnd(25) +
          'Amount'.padEnd(10) +
          'Type'.padEnd(8) +
          'Price'.padEnd(12) +
          'Value'.padEnd(12) +
          'P&L'.padEnd(10) +
          'P&L %'
        );
        console.log('─'.repeat(100));

        // Print rows
        rows.forEach(row => {
          const pnlColor = parseFloat(row.pnl) >= 0 ? '✓' : '✗';
          console.log(
            row.symbol.padEnd(12) +
            row.description.substring(0, 24).padEnd(25) +
            row.amount.toString().padEnd(10) +
            row.assetType.padEnd(8) +
            row.currentPrice.toString().padEnd(12) +
            row.marketValue.padEnd(12) +
            (pnlColor + ' ' + row.pnl).padEnd(10) +
            row.pnlPercent
          );
        });
        console.log('');
        break;
      }

      default:
        parser.print_help();
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
