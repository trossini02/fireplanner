# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The public: people saving every month (a PAC, "piano di accumulo") toward early retirement
(FIRE), Italy and Europe first, any currency. They arrive with their own numbers (age,
spending, savings, country) and want to know whether and when they can stop working.
_Inferred, not yet confirmed:_ mostly self-directed savers comparing their plan against
generic online "4% rule" calculators; many will use it on a phone.

## Product Purpose

Answers two questions with conservative, rounded-up figures: the capital needed to retire
early (rounded up to 10,000 of the currency) and the fixed monthly investment needed to get
there (rounded up to 100), at an accepted chance of running out (default 5%). Success is a
visitor who understands their two numbers, why they are what they are, and what moves them.

## Positioning

Every answer is computed twice, side by side: a parametric Monte Carlo from editable
assumptions, and a block Monte Carlo that stitches together real monthly history
(July 1990 to September 2025). It models rules generic calculators skip: a flexible retirement
date (keep investing up to 3 more years if markets fall short), a cash buffer refilled only in
chosen sell months and never during a dip, starting now versus waiting for a dip, taxes on
gains by country, and inflation that varies over time.

## Operating Context

A single page that runs entirely in the visitor's browser; nothing is sent anywhere. English
UI; currency and country of residence are inputs. Used on phones as much as on desktops. A
calculation takes a few seconds.

## Capabilities and Constraints

- Inputs: country, currency, age, retirement year, plan-until age, accepted failure share;
  lifestyle presets split into essentials and extras; FIRE type (Lean, Regular, Fat, Barista);
  home (paid off, mortgage, rent); children; existing investments; a 5-asset split (US stocks,
  World stocks, corporate bonds, government bonds, precious metals = 50% gold + 50% all
  precious metals); taxes; cash buffer and sell months; dip size and wait; extra years;
  history block length.
- Outputs: capital and monthly figures per method, start-now versus wait-for-dip, chance of
  retiring on time or 1–3 years late, spending breakdown, fan chart of wealth by age.
- Added 2026-10-12: save and compare plans (in the visitor's own browser), historical stress
  test (replay retiring at a real past date), random inflation.
- Static HTML, CSS and JavaScript with no build step and no server. Public on GitHub Pages
  (decided 2026-10-12). It was first published as a private claude.ai artifact and still
  follows that host's rules: fonts from Google Fonts only, scripts only from allow-listed
  CDNs, no downloads, no print dialog.
- Results are deterministic for the same inputs (fixed random seeds).
- Decision support only: a planning simulation, never financial advice.
- Undecided: custom domain; final product name ("PAC FIRE Planner" is a working
  name).

## Evidence on Hand

Historical data from public sources: Ken French Data Library (US and developed-market
stocks), FRED (10-year Treasury and Baa yields, US CPI), World Bank Pink Sheet (gold and
precious-metals prices). No users, testimonials, endorsements or track record exist; never
invent them.

## Product Principles

1. Show the working: every figure is traceable to the inputs and the stated rules.
2. Honest uncertainty: ranges and chances of running out, never a single promise.
3. Round against the visitor's optimism: always up, always stated.
4. Two methods, one verdict: when they disagree, say which is more cautious and why.
5. A planning tool, not advice.

## Accessibility & Inclusion

WCAG AA contrast in light and dark themes, full keyboard use with visible focus, reduced
motion respected, usable at 375px width without sideways scrolling.
