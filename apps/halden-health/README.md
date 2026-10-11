# Halden Health

The capacity command centre for Halden Health, a fictional regional health system of three hospitals and about 1,150 staffed beds. It follows Material Design 3 with restraint: tonal surfaces instead of borders, a teal primary and a navigation rail.

![Halden Health](hero.jpg)

## What to try

**Inpatient Capacity.** Drag the time slider from now to 72 hours ahead. Every unit card updates to its predicted state at that hour: occupancy bars slide, and units over 95% turn to the warning colour. The headline figures follow.

**ED Throughput.** A week of emergency arrivals by day and hour. Click a cell to focus every panel on that arrival cohort.

## How it works

Census, admissions, discharges and arrivals are invented for every unit and hour, so moving through the forecast changes real numbers rather than swapping pictures.

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
