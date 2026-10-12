# PAC FIRE Planner

A one-page planner for people who invest every month (a PAC, *piano di accumulo*) toward
early retirement (FIRE). It answers two questions:

- **How much capital do you need to retire early?** Rounded up to 10,000 (1,000,000 in yen).
- **How much do you need to invest every month to get there?** Rounded up to 100 (10,000 in yen).

Each answer is computed twice, side by side, on 2,000 futures each:

- **Monte Carlo** draws random monthly returns from growth, volatility and correlation
  assumptions you can edit.
- **Block Monte Carlo** stitches together blocks of real monthly market history
  (July 1990 to September 2025).

The higher figure of each pair is flagged as the one to plan with. Random seeds are fixed,
so the same inputs always give the same answer.

Everything runs in your browser. Nothing is sent anywhere, and saved plans stay in your
browser's own storage.

## What it models

- A flexible retirement date: if markets fall short, you keep investing for up to 3 more years.
- A cash buffer in retirement, topped up only in chosen sell months and never during a dip.
- Starting now versus waiting for a dip before investing new money.
- Taxes on gains by country, plus yearly wealth or stamp taxes.
- Inflation that varies over time, with occasional spikes.
- Lean, Regular, Fat and Barista FIRE, a mortgage or rent, and children.
- **Retire into real history:** replay retiring on a real date (for example January 2000 or
  October 2007) and watch the money month by month.
- **Saved plans:** save plans in your browser and compare any two side by side.

**Minimal** mode asks for six inputs and fixes the rest at slightly cautious defaults.
**Complete** mode lets you change everything.

## Run it locally

There is no build step. Serve the folder and open it:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Tests

The calculation engine (`engine.js`) is pure JavaScript and runs in Node as well as the browser.

```sh
node --test tests/*.test.mjs
```

## Data

`history.js` is generated, not hand-edited. `data/build_history.py` downloads every source,
builds real (after-inflation) monthly returns and prints sanity checks:

| Asset | Source |
|---|---|
| US stocks | Ken French Data Library, US market (Fama/French 3 factors) |
| World stocks | Ken French Data Library, developed markets |
| US 10-year Treasuries | Returns rebuilt from FRED yields (GS10) |
| US Baa corporate bonds | Returns rebuilt from FRED yields (BAA) |
| Precious metals | World Bank Pink Sheet: half gold, half the precious-metals index |
| Inflation | FRED US CPI (CPIAUCSL) |

To rebuild it (needs `openpyxl` for the World Bank spreadsheet):

```sh
python3 -I data/build_history.py --raw data/raw --out history.js
```

## Files

| File | What it is |
|---|---|
| `index.html` | The page: interface, styles and charts |
| `engine.js` | All the maths, with no DOM code |
| `history.js` | Monthly historical returns (generated) |
| `data/build_history.py` | Reproducible download and build of `history.js` |
| `tests/engine.test.mjs` | Engine tests |
| `SPEC.md`, `PRODUCT.md`, `DESIGN.md` | Specification, product brief and design system |

## Limits

The history starts in 1990, so it misses the 1970s inflation and the early-1980s bond crash.
Bond returns come from monthly average yields, corporate bonds ignore defaults, and the data
are in US dollars, so currency moves are not included. Country tax rates are rough starting
points checked in October 2026. State pensions, other retirement income and spending cuts in
bad years are not modelled.

This is a planning simulation, not financial advice.

## License

MIT, see [LICENSE](LICENSE).
