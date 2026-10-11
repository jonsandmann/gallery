import { entities } from "./cash-data";

export const currencies = ["EUR", "GBP", "BRL", "CNY", "MXN", "PLN", "INR", "CAD"] as const;
export type Currency = typeof currencies[number];
export type FxPair = { id: string; entityId: string; currency: Currency; exposure: number; ratio: number };
const exposures: (number | null)[][] = [
  [184.6, -46.2, -28.4, -62.8, -37.5, null, -12.6, 24.8],
  [null, 32.7, -8.4, 21.6, -14.2, 48.3, -6.8, 11.4],
  [-126.8, 48.6, 18.2, 34.7, 12.8, -16.4, 9.6, -8.2],
  [62.4, null, null, -12.8, 8.6, 5.2, -4.3, 16.7],
  [-18.6, 6.2, null, 12.4, -8.7, null, null, null],
  [-32.8, -8.6, 6.4, null, 14.8, 3.7, 18.2, null],
  [24.7, -4.8, 9.6, -18.4, null, null, 3.2, 8.9],
  [null, 14.6, -3.8, 9.2, 4.6, 12.8, -2.4, 5.1],
  [-28.3, 3.9, null, 6.7, 2.8, null, null, null],
  [12.6, -6.2, 4.8, 14.3, null, 2.6, null, null],
  [18.4, 12.8, null, -5.6, 3.4, null, null, null],
  [null, 8.7, 2.4, 6.8, -3.2, 4.6, 1.8, null],
  [38.2, -12.4, -6.8, 8.6, -14.2, 4.3, null, 7.6],
  [9.8, null, null, 2.4, null, null, 1.6, 3.8],
];
const ratios: Record<Currency, number> = { EUR: 0.82, GBP: 0.72, BRL: 0.46, CNY: 0.84, MXN: 0.58, PLN: 0.68, INR: 0.62, CAD: 0.76 };
const volatility: Record<Currency, number> = { EUR: 0.031, GBP: 0.038, BRL: 0.067, CNY: 0.019, MXN: 0.058, PLN: 0.047, INR: 0.024, CAD: 0.033 };
export const fxPairs: FxPair[] = entities.flatMap((entity, row) => currencies.flatMap((currency, column) => {
  const exposure = exposures[row][column];
  return exposure === null ? [] : [{ id: `${entity.id}-${currency}`, entityId: entity.id, currency, exposure, ratio: row === 0 && currency === "EUR" ? 0.42 : ratios[currency] }];
}));

export const gap = (pair: FxPair) => Math.abs(pair.exposure) * (1 - pair.ratio);
export function currencyMetrics(pairs: FxPair[]) {
  return currencies.map(currency => {
    const matches = pairs.filter(pair => pair.currency === currency);
    const gross = matches.reduce((sum, pair) => sum + Math.abs(pair.exposure), 0);
    const hedged = matches.reduce((sum, pair) => sum + Math.abs(pair.exposure) * pair.ratio, 0);
    const net = matches.reduce((sum, pair) => sum + pair.exposure, 0);
    const residual = matches.reduce((sum, pair) => sum + pair.exposure * (1 - pair.ratio), 0);
    return { currency, gross, hedged, net, residual, gap: gross - hedged, ratio: gross ? hedged / gross * 100 : null };
  });
}
export function fxSummary(pairs: FxPair[]) {
  const byCurrency = currencyMetrics(pairs);
  return {
    gross: byCurrency.reduce((sum, item) => sum + item.gross, 0),
    hedged: byCurrency.reduce((sum, item) => sum + item.hedged, 0),
    open: byCurrency.reduce((sum, item) => sum + item.gap, 0),
    net: byCurrency.reduce((sum, item) => sum + Math.abs(item.residual), 0),
    var95: 1.645 * Math.sqrt(byCurrency.reduce((sum, item) => sum + (item.residual * volatility[item.currency]) ** 2, 0)),
  };
}
export function policyStatus(ratio: number | null): "neutral" | "good" | "watch" | "breach" {
  if (ratio === null) return "neutral";
  if (ratio >= 60 && ratio <= 80) return "good";
  return ratio >= 55 && ratio <= 85 ? "watch" : "breach";
}
export function heatColor(value: number, max: number) {
  const t = Math.min(1, Math.abs(value) / max);
  return `rgb(${Math.round(255 - 240 * t)}, ${Math.round(255 - 157 * t)}, ${Math.round(255 - t)})`;
}
export const months = ["Oct 26", "Nov", "Dec", "Jan 27", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
const weights = [0.08, 0.085, 0.115, 0.09, 0.075, 0.095, 0.1, 0.07, 0.08, 0.06, 0.065, 0.085];
export function maturityLadder(pair: FxPair) {
  return months.map((month, i) => {
    const amount = Math.abs(pair.exposure) * weights[i];
    return { month, forwards: amount * pair.ratio * 0.76, options: amount * pair.ratio * 0.24, gap: amount * (1 - pair.ratio) };
  });
}
export const counterparties = [
  { name: "Asterwick Bank", used: 17.8, limit: 17.5 },
  { name: "Ordel Capital", used: 12, limit: 12 },
  { name: "Brenwick Commercial", used: 9.6, limit: 15 },
  { name: "Tavren International", used: 7.4, limit: 12.5 },
  { name: "Caldris Bank", used: 5.8, limit: 10 },
  { name: "Norelden Markets", used: 4.2, limit: 10 },
];
