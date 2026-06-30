create a minimal cli example using argparse it should be able to do get market prices (chart), buy, sell and list portfolio.

Keep it in a single file and use the saxo-client library.

# Usage
```sh
export SAXO_TOKEN="your_saxo_api_token"

saxo portfolio
saxo chart --symbol AAPL
saxo buy --symbol AAPL --quantity 10
saxo sell --symbol AAPL --quantity 5
```