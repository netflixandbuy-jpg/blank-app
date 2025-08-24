# Arbitrage Calculator

A sleek, offline macOS-style web app to compute optimal stakes for arbitrage across mutually exclusive outcomes in sports and prediction markets.

## Features
- Input outcome prices as cents/percent (0-100) or decimal (0-1)
- Enter total stake and instantly compute optimal stakes
- Shows per-outcome stake and profit (equalized) and overall arbitrage margin
- Color-coded profit/loss and arbitrage indicator
- Add/remove outcomes dynamically
- CSV export
- Works fully offline (no network required)

## How it works
If each outcome contract costs price \(p_i\) (in decimal), the optimal stake to equalize returns is:

- Equalized gross return \(G = T / \sum p_i\), where \(T\) is total stake
- Stake per outcome \(s_i = T \cdot p_i / \sum p_i\)
- Profit per outcome \(= G - T = T (1/\sum p_i - 1)\)
- Arbitrage exists iff \(\sum p_i < 1\); margin is \(1 - \sum p_i\)

## Run locally
Just open `index.html` in any modern browser. No build step.

## Notes
- Cents/percent inputs like `60` or `60%` are treated as `0.60`.
- Decimal mode expects values like `0.60`.
- Negative profits indicate no arbitrage exists with the given prices.

## License
MIT
