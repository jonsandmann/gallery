# Northwind Grid

Control-room analytics for Northwind, a fictional regional grid operator with an evening peak of about 68 GW. It's dark, dense and calm, in the spirit of a trading terminal rather than a sci-fi HUD: two panel shades, hairlines for depth, a muted colour for each fuel and a single amber accent.

![Northwind Grid](hero.jpg)

## What to try

**System Load & Generation.** Drag the amber cursor across the generation chart and everything re-solves for that moment. The supply stack's demand line slides, the clearing price moves, the dispatched plants light up and the figures count to their new values. At midday, solar visibly pushes gas off the margin; the evening ramp brings it back.

**Storage Fleet.** Twelve battery sites. Hover a row to preview its dispatch schedule and state of charge, and click to pin it.

## How it works

Every number comes from a small model in the code: a day of hourly demand, wind and solar, and a merit-order dispatch that stacks the cheapest generation first until demand is met. The price and the marginal fuel are worked out rather than typed in.

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
