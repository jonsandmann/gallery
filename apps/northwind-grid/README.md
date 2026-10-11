# Northwind Grid

A control-room dashboard for Northwind, a fictional regional power grid operator with an evening peak of about 68 GW.

![Northwind Grid on a laptop](hero.jpg)

Drag the amber cursor across the generation chart and the whole screen re-solves for that moment. System load, generation by fuel, reserves, the real-time price, the supply stack, interchange and binding constraints all update together. The default is 17:35, the evening peak, when the grid is tightest.

Every number comes from a small model in `src/components/data/`. It holds a day of hourly demand and a merit-order dispatch, which stacks the cheapest generation first until demand is met, so the price and the marginal fuel are worked out rather than typed in. All of the data is made up.

## Run it

```sh
npm install
npm run dev
```

Then open the address Vite prints. `npm run build` writes a static site to `dist/` that you can host anywhere.

## How it's built

- **React and MUI**, using MUI's dark theme tuned to a near-black ground and a single amber accent.
- **Recharts** for the generation area chart, the price sparkline and the supply stack.
- **Tailwind CSS** for layout.
- The screen is designed at 1440 x 960 and scales down to fit smaller windows.

| File | What it does |
|---|---|
| `src/components/SystemLoad.tsx` | The whole screen |
| `src/components/data/dispatch.ts` | Demand, fuel capacities and the merit-order solve |
| `src/components/data/storage.ts` | Battery storage sites and their state of charge |

## Licence

MIT. Roboto is used under the SIL Open Font License.
