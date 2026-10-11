export type Fuel = "nuclear" | "coal" | "gas" | "hydro" | "wind" | "solar" | "storage";
export const fuelOrder: Fuel[] = ["nuclear", "coal", "gas", "hydro", "wind", "solar", "storage"];
export const fuelNames: Record<Fuel, string> = { nuclear: "Nuclear", coal: "Coal", gas: "Gas", hydro: "Hydro", wind: "Wind", solar: "Solar", storage: "Storage" };
export const NOW = 17 + 35 / 60;
const loads = [45832, 43810, 42046, 40922, 40517, 41843, 45684, 50580, 53861, 55647, 56682, 57480, 58210, 58464, 57942, 59081, 62693, 66248, 67428, 65110, 61284, 56581, 51639, 48196, 45832];
const winds = [14670, 15280, 14910, 15180, 14210, 13460, 12680, 11720, 10950, 10180, 9650, 10020, 10670, 11480, 10760, 9900, 9240, 8560, 8190, 8810, 9780, 11240, 12860, 13940, 14670];
const solars = [0, 0, 0, 0, 0, 0, 130, 1220, 4250, 8560, 12840, 16070, 17540, 18120, 16980, 14120, 9380, 5120, 820, 0, 0, 0, 0, 0, 0];
const hydros = [3280, 3260, 3250, 3210, 3230, 3410, 3770, 4030, 4210, 4150, 4060, 4160, 4290, 4370, 4510, 4780, 5110, 5480, 5660, 5590, 5180, 4720, 4080, 3560, 3280];
const imports = [2180, 2050, 1920, 1870, 1840, 1960, 2310, 2570, 2420, 2210, 1940, 1770, 1680, 1590, 1620, 1740, 2030, 2120, 1810, 1930, 2220, 2410, 2380, 2260, 2180];
const forecasts = loads.map((load, hour) => load + Math.round(520 * Math.sin(hour * 0.53) + 610));
const interpolate = (values: number[], time: number) => {
  const t = Math.max(0, Math.min(24, time));
  const low = Math.floor(t);
  return values[low] + (values[Math.min(24, low + 1)] - values[low]) * (t - low);
};

export type Offer = { id: string; fuel: Fuel; capacity: number; cost: number; start: number; end: number; dispatched: number };
export type Dispatch = ReturnType<typeof dispatch>;
export const shadowPrices = (price: number) => [price * 0.174 + 1.26, price * 0.098 + 1.17, price * 0.061 + 0.38];

// All panels share this merit-order solve. Net imports close the load/generation balance.
export function dispatch(time: number, regionScale = 1, dayScale = 1) {
  const load = Math.round(interpolate(loads, time) * regionScale * dayScale);
  const netImports = Math.round(interpolate(imports, time) * regionScale);
  const demand = load - netImports;
  const forecast = Math.round(interpolate(forecasts, time) * regionScale * dayScale);
  const renewableFactor = 1 - (1 - dayScale) / 0.024 * 0.04;
  const wind = interpolate(winds, time) * renewableFactor;
  const solar = interpolate(solars, time) * renewableFactor;
  const hydro = interpolate(hydros, time);
  const storage = Math.max(0, Math.min(2140, (time - 15) * 1070, (22 - time) * 1070));
  const raw: [string, Fuel, number, number][] = [
    ["W-01", "wind", wind * 0.44, -4.5], ["W-02", "wind", wind * 0.56, -2.1],
    ["S-01", "solar", solar * 0.48, 0.8], ["S-02", "solar", solar * 0.52, 1.6],
    ["N-01", "nuclear", 4280, 10.4], ["N-02", "nuclear", 4280, 11.1], ["N-03", "nuclear", 4280, 12.3],
    ["H-01", "hydro", hydro * 0.48, 17.6], ["H-02", "hydro", hydro * 0.52, 20.8],
    ["G-01", "gas", 3200, 23.4],
    ["C-01", "coal", 3140, 27.1], ["C-02", "coal", 3380, 29.8], ["C-03", "coal", 3270, 33.6], ["C-04", "coal", 3090, 36.9],
    ["G-02", "gas", 2300, 38.2], ["G-03", "gas", 2300, 40.6],
    ["G-04", "gas", 2100, 44.1], ["G-05", "gas", 2100, 47.3],
    ["G-06", "gas", 2200, 51.6], ["G-07", "gas", 2200, 56.2],
    ["G-08", "gas", 2050, 60.5], ["G-09", "gas", 2050, 63.8],
    ["B-01", "storage", storage, 72.4],
    ["G-10", "gas", 1950, 78.4], ["G-11", "gas", 1950, 86.7],
    ["G-12", "gas", 1400, 98.1], ["G-13", "gas", 1400, 109.3],
    ["G-14", "gas", 950, 128.6], ["G-15", "gas", 950, 139.4],
  ];
  let total = 0;
  let price = 0;
  let marginal: Fuel = "gas";
  let marginalId = "";
  const fuel: Record<Fuel, number> = { nuclear: 0, coal: 0, gas: 0, hydro: 0, wind: 0, solar: 0, storage: 0 };
  const offers: Offer[] = raw.map(([id, type, cap, cost]) => {
    const capacity = Math.round(cap * regionScale);
    const start = total;
    total += capacity;
    const used = Math.max(0, Math.min(capacity, demand - start));
    fuel[type] += used;
    if (used > 0) { price = cost; marginal = type; marginalId = id; }
    return { id, fuel: type, capacity, cost, start, end: total, dispatched: used };
  });
  const generation = Object.values(fuel).reduce((sum, value) => sum + value, 0);
  const reserve = total + netImports - load;
  const renewable = fuel.wind + fuel.solar + fuel.hydro;
  const eastTie = netImports + Math.round(540 * regionScale);
  const westTie = -Math.round(540 * regionScale);
  const shadow = shadowPrices(price);
  return { time, load, forecast, netImports, demand, generation, offers, total, price, marginal, marginalId, fuel, reserve, margin: reserve / load * 100, renewable, renewableShare: renewable / generation * 100, eastTie, westTie, shadow };
}

export function daySeries(regionScale = 1, dayScale = 1, actualUntil = NOW) {
  return Array.from({ length: 289 }, (_, i) => {
    const state = dispatch(i / 12, regionScale, dayScale);
    return { time: i / 12, load: state.load, forecast: state.forecast, price: state.price, actualLoad: state.time <= actualUntil ? state.load : null, projectedLoad: state.time >= actualUntil ? state.load : null, actualForecast: state.time <= actualUntil ? state.forecast : null, projectedForecast: state.time >= actualUntil ? state.forecast : null, ...state.fuel };
  });
}

export function clock(time: number) {
  const minutes = Math.round(time * 60);
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}
