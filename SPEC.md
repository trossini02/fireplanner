# PAC FIRE planner — spec (approved 2026-10-12)

A single web page that answers two questions for someone who wants to retire early:
how much capital do I need, and how much must I invest every month (PAC) to get
there? It analyses the plan with two methods side by side: a parametric Monte Carlo
and a block-bootstrap ("block Monte Carlo") that resamples real monthly history.

Source brief: the owner's "Pac html" note (Italian), clarified on 2026-10-12:
English UI, currency is an input, "Stile" was a duplicate of lifestyle (dropped),
withdrawals use cash + 4 sell windows that skip dips, "start now or at a discount"
is answered by comparing both.

## Definitions

- **Capital needed (C\*)**: the smallest starting amount, as a multiple of the
  capital unit (10,000; JPY 1,000,000), whose withdrawals run out before the
  "plan until" age (default 95) in at most the accepted failure share (default 5%)
  of scenarios, retiring in January of the target year. Shown in today's money
  and in money of the retirement year.
- **Monthly PAC needed (M\*)**: the smallest fixed nominal monthly amount, as a
  multiple of the monthly unit (100; JPY 10,000), for which the whole plan
  (existing investments + PAC + flexible date + retirement) fails in at most the
  accepted share of scenarios.
- **Flexible date**: each January from the target year, if the money is below C\*
  (in that year's money) the PAC continues one more year, up to 3 extra years;
  after that you retire regardless.
- **Failure**: the cash needed for a month's spending cannot be raised, because the
  portfolio is exhausted, before the plan-until age.

## Methods (2,000 scenarios each, fixed seeds → same inputs, same answer)

- **Monte Carlo**: monthly log-normal real returns for 5 assets with editable
  long-run real growth, volatility and a correlation matrix.
- **Block Monte Carlo**: circular block bootstrap of real monthly returns of the 5
  asset classes over the common historical window (blocks of 5 years by default).
  Data are USD-based (US stocks, global stocks, US 10y Treasury, US Baa corporate,
  precious metals = 50% World Bank gold price + 50% World Bank precious-metals index,
  rebalanced monthly) deflated by US CPI; currency moves not modelled.
- Both: portfolio rebalanced monthly to the chosen allocation; nominal return =
  (1 + real) × (1 + that month's inflation) − 1. The higher of the two answers is
  flagged as the safer number to plan with.
- **Random inflation** (added 2026-10-12): every scenario has its own price level.
  Monte Carlo: the annual rate pulls back toward its centre by 3% of the gap each
  month, with noise sized to the chosen spread (default 1.5 points) and a +5 point
  spike on average every N years (default 15) that fades the same way; the centre is
  set so the long-run average equals the user's inflation. It uses its own random
  stream, so the drawn returns do not change. Block Monte Carlo replays US CPI in the
  same blocks as the returns, moved so its average equals the user's inflation.

## Rules

- **Start now vs at a discount**: the second run keeps new contributions in cash
  (at the cash rate, after tax) until stocks are 10% below their running peak
  (today counts as a peak), giving up after 24 months; existing investments stay
  invested. Both M\* are shown and the cheaper one is named.
- **Retirement cash bucket**: 6 months of spending in cash at 2.5% (after tax).
  Topped up to 6 months only in the 4 chosen sell months (default Apr, Jul, Nov,
  Dec) and skipped while stocks are ≥10% below peak. If cash would not cover next
  month, sell just enough for one month (forced).
- **Taxes**: on the gain share of each sale (average cost basis tracked); blended
  rate by allocation from three rates (stocks / government bonds / other). Annual
  wealth or stamp tax in January on the portfolio. Cash interest taxed at the
  "other" rate. Existing investments start with cost basis = value.
- **Inflation**: spending grows monthly with the scenario's inflation; mortgage
  payments are fixed in nominal terms; the PAC is a fixed nominal amount. The capital
  check for the flexible date compares wealth with C\* in that scenario's money.
- **Minimal mode** (added 2026-10-12): asks only country, age, retirement year,
  monthly spending (lifestyle chips or one number), home and existing investments.
  Fixed, slightly cautious: split 30/40/10/15/5 (US/World/Corp/Gov/Metals), Monte
  Carlo growth 0.5 points below Complete's defaults and history 0.5 points a year
  lower, inflation 0.5 points above the country's (random as above), cash 6 months
  at 2%, until 95, 5% failure, sell months Apr/Jul/Nov/Dec, dip 10% / 24 months, up
  to 3 extra years, Regular FIRE, no children, taxes from the country.
- **Historical stress test** (added 2026-10-12): retire at a real month since July
  1990 with a method's C\* and live the plan's retirement spending on the real
  returns and inflation that followed (no history haircut), until the data or the
  plan end. Sell months follow the real calendar. Shows money in today's money month
  by month, the low point, and when it runs out if it does.
- **Saved plans** (added 2026-10-12): inputs and results saved in the visitor's
  browser storage only; any two can be compared side by side, with the inputs that
  differ.

## Inputs

Currency, country (pre-fills inflation, taxes, cost-of-living for presets; all
editable), age, retirement year, plan-until age, accepted failure %, lifestyle
preset (Frugal/Moderate/Comfortable/Lavish × cost index × FX, 1–2 adults) filling
an editable table split into essentials vs extras, FIRE type (Lean = essentials;
Regular = all; Fat = all +25%; Barista = all minus part-time income until an age),
home (paid / mortgage payment + paid-off year / rent), children (birth year +
monthly cost until independent, default 25), existing investments, allocation
and assumptions for the 5 assets, cash months/rate, sell months, dip threshold,
max wait, max delay years, block length.

Money fields still at their default are re-derived when currency or country
change; fields the user edited are left alone.

## Outputs

Per method: C\* (today's money and retirement-year money), first-year withdrawal
rate, M\* starting now and waiting for a dip, share retiring on time / +1 / +2 / +3
years, chance the dip came within the max wait; spending breakdown at retirement;
fan chart (10th–90th percentile, median) of wealth in today's money by age for the
selected method.

Out of scope unless asked: state pension, rental income, spending cuts in bad years.

## Files

- `index.html` — page (UI, styles, chart). Loads `engine.js` and `history.js`.
- `engine.js` — all maths, pure, runs in the browser and in Node.
- `history.js` — historical monthly real returns (generated, do not hand-edit).
- `data/build_history.py` — reproducible download + build of `history.js`.
- `tests/engine.test.mjs` — `node --test tests/*.test.mjs` (zero-volatility closed forms,
  rounding, monotonicity, timeline, determinism, random inflation, stress test).

## Build plan

1. Tests for the engine (closed-form zero-volatility cases first), then `engine.js`
   until `node --test tests/*.test.mjs` passes.
2. `history.js` from the data build; sanity-check annual stats against known facts.
3. `index.html` (lead design skill: impeccable since 2026-10-12, see DESIGN.md); compute on
   load with example inputs, recompute on "Calculate".
4. Check in a browser at phone and desktop widths, light and dark; publish as a
   private artifact for phone viewing.
