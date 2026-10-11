# Ledgerline Revenue

Revenue analytics for Ledgerline, a fictional B2B software company with about $412m in annual recurring revenue (ARR) and 3,900 customers. It's monochrome and exact: ink and greys carry the screen, one blue marks what matters, and green and red appear only for gains and losses.

![Ledgerline Revenue](hero.jpg)

## What to try

**ARR Bridge.** A waterfall from opening to closing ARR for the quarter. Click a bar and it unfolds into its top accounts, ranked, while the other bars recede. Click again or press Escape to fold it back.

**Net Revenue Retention.** Sixteen quarterly cohorts as a triangle beside a line per cohort. Hover a cohort to lift it in both, and switch between revenue and logo retention to re-shade every cell and morph every line in place.

## How it works

The accounts, cohorts and movements are invented, written to be specific rather than filler, and both screens share one set of numbers.

## Run it

```sh
npm install
npm run dev
```

Then open the address Vite prints. `npm run build` writes a static site to `dist/` that you can host anywhere.

## Built with

React, Framer Motion, Lucide icons, Recharts, Tailwind CSS, Vite. Each screen is designed at 1440 x 960 and scales down to fit smaller windows.

## Licence

MIT. All data is made up.
