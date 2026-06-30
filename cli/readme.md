create a minimal cli example using argparse it should be able to do get market prices (chart), buy, sell and list portfolio.

Keep it in a single file and use the saxo-client library.

# Usage

```sh
export SAXO_TOKEN="your_token"

# List portfolio
saxo portfolio

# Get chart data
saxo chart 211

# Buy
saxo buy 211 --amount 1000

# Sell
saxo sell 211 --amount 1000

# List orders
saxo orders

# Help
saxo --help
```