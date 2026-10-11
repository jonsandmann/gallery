import { NOW, dispatch } from "./dispatch";

export type StorageMode = "Discharging" | "Charging" | "Idle";
export type StorageSite = {
  id: string; name: string; area: "east" | "west"; mw: number; mwh: number;
  initial: number; chargeTarget: number; chargeBelow: number; dischargeAbove: number; nodalAdder: number;
  currentDispatch: number; serviceRate: number; policy: string;
};
export const storageSites: StorageSite[] = [
  { id: "BESS-01", name: "Bluestem", area: "west", mw: 400, mwh: 1600, initial: 38, chargeTarget: 92, chargeBelow: 35, dischargeAbove: 58, nodalAdder: 0, currentDispatch: 400, serviceRate: 3.84, policy: "Economic dispatch" },
  { id: "BESS-02", name: "Alder Creek", area: "east", mw: 320, mwh: 1280, initial: 44, chargeTarget: 86, chargeBelow: 34, dischargeAbove: 62, nodalAdder: 3.7, currentDispatch: 320, serviceRate: 4.16, policy: "Economic dispatch" },
  { id: "BESS-03", name: "Mesa Bend", area: "west", mw: 300, mwh: 1200, initial: 31, chargeTarget: 82, chargeBelow: 32, dischargeAbove: 60, nodalAdder: -2.4, currentDispatch: 288, serviceRate: 3.62, policy: "Economic dispatch" },
  { id: "BESS-04", name: "Juniper Ridge", area: "east", mw: 280, mwh: 1120, initial: 52, chargeTarget: 88, chargeBelow: 38, dischargeAbove: 65, nodalAdder: 5.2, currentDispatch: 266, serviceRate: 4.43, policy: "Economic dispatch" },
  { id: "BESS-05", name: "Cottonwood", area: "west", mw: 240, mwh: 960, initial: 35, chargeTarget: 79, chargeBelow: 36, dischargeAbove: 57, nodalAdder: -0.8, currentDispatch: 228, serviceRate: 3.92, policy: "Economic dispatch" },
  { id: "BESS-06", name: "Redwillow", area: "east", mw: 220, mwh: 880, initial: 29, chargeTarget: 91, chargeBelow: 33, dischargeAbove: 61, nodalAdder: 2.1, currentDispatch: 209, serviceRate: 4.07, policy: "Economic dispatch" },
  { id: "BESS-07", name: "Flint Crossing", area: "east", mw: 200, mwh: 800, initial: 46, chargeTarget: 84, chargeBelow: 37, dischargeAbove: 64, nodalAdder: 4.4, currentDispatch: 190, serviceRate: 4.62, policy: "Economic dispatch" },
  { id: "BESS-08", name: "Sage Hollow", area: "west", mw: 180, mwh: 360, initial: 61, chargeTarget: 90, chargeBelow: 31, dischargeAbove: 67, nodalAdder: -3.1, currentDispatch: 144, serviceRate: 5.14, policy: "Two-hour dispatch" },
  { id: "BESS-09", name: "Cinder Run", area: "west", mw: 160, mwh: 640, initial: 32, chargeTarget: 78, chargeBelow: 34, dischargeAbove: 63, nodalAdder: 1.4, currentDispatch: 95, serviceRate: 3.78, policy: "Export limit · 95 MW" },
  { id: "BESS-10", name: "Ashford", area: "east", mw: 140, mwh: 560, initial: 55, chargeTarget: 85, chargeBelow: 32, dischargeAbove: 91, nodalAdder: 1.8, currentDispatch: 0, serviceRate: 6.12, policy: "Contingency reserve" },
  { id: "BESS-11", name: "Larkspur", area: "west", mw: 120, mwh: 240, initial: 72, chargeTarget: 80, chargeBelow: 30, dischargeAbove: 96, nodalAdder: -1.6, currentDispatch: 0, serviceRate: 5.76, policy: "Reserve hold" },
  { id: "BESS-12", name: "Millstone", area: "east", mw: 100, mwh: 200, initial: 41, chargeTarget: 89, chargeBelow: 34, dischargeAbove: 61, nodalAdder: 2.8, currentDispatch: -64, serviceRate: 4.88, policy: "Reserve recovery" },
];

export type StorageHour = { hour: number; power: number; price: number; startEnergy: number; endEnergy: number };
export type StorageState = ReturnType<typeof storageState>;
export type StoragePoint = { hour: number; power: number; price: number; soc: number; planned: number; fleet: number };
export const SOC_MIN = 12;
export const SOC_MAX = 92;
const EFFICIENCY = 0.95;
const systemPrices = Array.from({ length: 24 }, (_, hour) => Array.from({ length: 12 }, (_, i) => dispatch(hour + i / 12).price).reduce((a, b) => a + b, 0) / 12);

function simulate(site: StorageSite, previousDay: boolean, planned: boolean) {
  let energy = site.mwh * (site.initial + (planned ? 4 : 0)) / 100;
  return systemPrices.map((systemPrice, hour): StorageHour => {
    const morning = 27 * Math.exp(-(((hour - 7.5) / 1.45) ** 2));
    const midday = -12 * Math.exp(-(((hour - 12.8) / 2.1) ** 2));
    const evening = 8.3 * Math.exp(-(((hour - 18.1) / 1.7) ** 2));
    const price = Math.round((systemPrice + morning + midday + evening + site.nodalAdder + (previousDay ? -3.27 : 0)) * 100) / 100;
    let request = 0;
    if (price <= site.chargeBelow + (planned ? 1.5 : 0)) request = -site.mw * (hour < 6 ? 0.64 : 0.9);
    if (price >= site.dischargeAbove + (planned ? 2 : 0)) request = site.mw * (hour < 12 ? 0.56 : hour === 16 ? 0.42 : 0.88);
    if (site.id === "BESS-12" && hour === 16) request = 80;
    if (hour === 17) request = site.currentDispatch * (planned ? 0.9 : 1) * (previousDay ? 0.94 : 1);
    if (site.id === "BESS-09" && request > 95) request = 95;
    const startEnergy = energy;
    const floor = site.mwh * (hour === 16 && site.id !== "BESS-12" ? 0.62 : SOC_MIN / 100);
      const ceiling = site.mwh * Math.min(SOC_MAX, site.chargeTarget + (planned ? 3 : 0)) / 100;
    const maxDischarge = Math.max(0, energy - floor) * EFFICIENCY;
    const maxCharge = Math.max(0, ceiling - energy) / EFFICIENCY;
    const power = Math.trunc(Math.max(-Math.min(site.mw, maxCharge), Math.min(site.mw, request, maxDischarge)) * 100) / 100;
    energy += power >= 0 ? -power / EFFICIENCY : -power * EFFICIENCY;
    return { hour, power, price, startEnergy, endEnergy: energy };
  });
}

export function energyAt(hours: StorageHour[], time: number) {
  if (time >= 24) return hours[23].endEnergy;
  const hour = hours[Math.floor(time)];
  return hour.startEnergy + (hour.endEnergy - hour.startEnergy) * (time - Math.floor(time));
}

export function storageState(site: StorageSite, previousDay = false) {
  const schedule = simulate(site, previousDay, false);
  const plan = simulate(site, previousDay, true);
  const energy = energyAt(schedule, NOW);
  const current = schedule[17];
  const energyRevenue = schedule.reduce((sum, hour) => sum + hour.power * hour.price * Math.max(0, Math.min(1, NOW - hour.hour)), 0);
  const serviceRevenue = site.mw * site.serviceRate * NOW;
  const revenue = Math.round(energyRevenue + serviceRevenue);
  const mode: StorageMode = current.power > 0.1 ? "Discharging" : current.power < -0.1 ? "Charging" : "Idle";
  return { ...site, schedule, plan, energy, soc: energy / site.mwh * 100, power: current.power, price: current.price, revenue, energyRevenue, serviceRevenue, mode };
}

export function fleetTotals(sites: StorageState[]) {
  const mw = sites.reduce((sum, site) => sum + site.mw, 0);
  const mwh = sites.reduce((sum, site) => sum + site.mwh, 0);
  const stored = sites.reduce((sum, site) => sum + site.energy, 0);
  const power = sites.reduce((sum, site) => sum + site.power, 0);
  const revenue = sites.reduce((sum, site) => sum + site.revenue, 0);
  const discharge = sites.filter(site => site.mode === "Discharging");
  return { mw, mwh, stored, power, revenue, soc: mwh ? stored / mwh * 100 : 0, discharge: discharge.length, charge: sites.filter(site => site.mode === "Charging").length, idle: sites.filter(site => site.mode === "Idle").length, grossDischarge: discharge.reduce((sum, site) => sum + site.power, 0) };
}

export function storageCurve(site: StorageState, fleet: StorageState[]): StoragePoint[] {
  const capacity = fleet.reduce((sum, item) => sum + item.mwh, 0);
  const times = [...Array.from({ length: 25 }, (_, hour) => hour), NOW].sort((a, b) => a - b);
  return times.map(hour => ({
    hour,
    power: site.schedule[Math.min(23, Math.floor(hour))].power,
    price: site.schedule[Math.min(23, Math.floor(hour))].price,
    soc: energyAt(site.schedule, hour) / site.mwh * 100,
    planned: energyAt(site.plan, hour) / site.mwh * 100,
    fleet: capacity ? fleet.reduce((sum, item) => sum + energyAt(item.schedule, hour), 0) / capacity * 100 : 0,
  }));
}
