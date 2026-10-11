export type RetentionMetric = "Revenue retention" | "Logo retention";
export type Cohort = {
  id: string;
  startArr: number;
  currentArr: number;
  startLogos: number;
  currentLogos: number;
  revenue: number[];
  logo: number[];
};

const histories = [
  [100, 104.8, 107.6, 110.9, 114.2, 116.8, 119.5, 122.4, 121.7, 125.3, 128.1, 130.6, 129.9, 132.7, 134.8, 136.2],
  [100, 102.9, 106.8, 109.4, 112.1, 116.3, 115.8, 119.1, 122.6, 124.8, 128.4, 130.1, 128.9, 131.4, 133.7],
  [100, 103.6, 108.1, 112.7, 116.4, 119.2, 118.6, 122.3, 124.9, 126.2, 130.1, 132.4, 133.8, 135.6],
  [100, 101.7, 105.2, 109.6, 112.8, 115.3, 117.9, 120.4, 119.6, 123.2, 125.8, 127.1, 129.4],
  [100, 104.1, 109.3, 114.6, 117.8, 122.4, 124.1, 127.3, 130.6, 132.8, 133.5, 136.8],
  [100, 103.8, 108.7, 112.9, 116.3, 119.8, 122.1, 124.7, 127.4, 129.2, 131.1],
  [100, 107.2, 114.8, 123.6, 130.5, 135.1, 137.4, 141.2, 140.6, 144.8],
  [100, 103.1, 108.4, 113.7, 117.9, 121.4, 125.6, 126.9, 129.3],
  [100, 104.4, 109.6, 115.2, 119.7, 123.8, 125.1, 128.6],
  [100, 102.8, 106.7, 109.2, 113.8, 116.4, 119.7],
  [100, 103.7, 108.2, 112.4, 116.9, 120.8],
  [100, 99.4, 102.6, 106.8, 111.3],
  [100, 98.8, 101.4, 105.7],
  [100, 104.6, 108.9],
  [100, 105.2],
  [100],
];
const closingArr = [32.1368, 31.4, 29.8, 28.6, 27.3, 26.9, 35.6208, 28.2, 26.1, 24.8, 23.4, 22.7, 21.1, 19.8, 17.0424, 17.8];
const openingLogos = [442, 423, 385, 364, 347, 329, 284, 283, 270, 249, 241, 231, 219, 207, 187, 179];
const closingLogos = [365, 350, 312, 296, 278, 262, 244, 235, 223, 211, 203, 195, 187, 173, 181, 179];

export const cohorts: Cohort[] = histories.map((revenue, i) => {
  const quarterIndex = i + 3;
  const id = `FY${22 + Math.floor(quarterIndex / 4)} Q${quarterIndex % 4 + 1}`;
  const lost = openingLogos[i] - closingLogos[i];
  const lossWeights = revenue.slice(1).map((_, q) => 0.7 + ((i * 3 + q * 7) % 9) / 10);
  const totalWeight = lossWeights.reduce((sum, value) => sum + value, 0);
  let accrued = 0;
  const logo = revenue.map((_, q) => {
    if (q === 0) return 100;
    accrued += lossWeights[q - 1];
    return (openingLogos[i] - Math.round(lost * accrued / totalWeight)) / openingLogos[i] * 100;
  });
  const currentArr = Math.round(closingArr[i] * 1_000_000);
  return { id, startArr: Math.round(currentArr / (revenue[revenue.length - 1] / 100)), currentArr, startLogos: openingLogos[i], currentLogos: closingLogos[i], revenue, logo };
});

export function metricValues(cohort: Cohort, metric: RetentionMetric) {
  return metric === "Revenue retention" ? cohort.revenue : cohort.logo;
}

export function scopeCohorts(factor: number, fx: number, currentLogos: number): Cohort[] {
  let cumulative = 0;
  let allocated = 0;
  return cohorts.map(c => {
    cumulative += c.currentLogos;
    const next = Math.round(cumulative / 3894 * currentLogos);
    const scopedLogos = next - allocated;
    allocated = next;
    const startLogos = Math.round(c.startLogos * factor);
    const logo = c.logo.map((value, quarter) => quarter === c.logo.length - 1 ? scopedLogos / startLogos * 100 : Math.round(value / 100 * startLogos) / startLogos * 100);
    return { ...c, startArr: Math.round(c.startArr * factor * fx), currentArr: Math.round(c.currentArr * factor * fx), startLogos, currentLogos: scopedLogos, logo: c.logo.length === 1 ? [100] : logo };
  });
}

export function retentionChartData(metric: RetentionMetric, source = cohorts) {
  return Array.from({ length: 16 }, (_, quarter) => {
    const observed = source.filter(c => metricValues(c, metric)[quarter] !== undefined);
    const weight = (c: Cohort) => metric === "Revenue retention" ? c.startArr : c.startLogos;
    const totalWeight = observed.reduce((sum, c) => sum + weight(c), 0);
    const average = observed.reduce((sum, c) => sum + metricValues(c, metric)[quarter] * weight(c), 0) / totalWeight;
    const row: Record<string, number | null> = { quarter, average };
    for (const c of source) row[c.id] = metricValues(c, metric)[quarter] ?? null;
    return row;
  });
}

const ramp = [
  [244, 248, 255], [222, 237, 255], [181, 215, 253], [122, 181, 251],
  [61, 144, 247], [0, 112, 243], [0, 80, 176],
];
function cellRgb(value: number, metric: RetentionMetric) {
  const position = Math.min(6, Math.max(0, (value - (metric === "Revenue retention" ? 80 : 60)) / (metric === "Revenue retention" ? 70 : 40) * 6));
  const index = Math.min(5, Math.floor(position));
  const ratio = position - index;
  return ramp[index].map((channel, c) => Math.round(channel + (ramp[index + 1][c] - channel) * ratio));
}

export function cellColor(value: number, metric: RetentionMetric) {
  return `rgb(${cellRgb(value, metric).join(", ")})`;
}

export function cellInk(value: number, metric: RetentionMetric) {
  const linear = cellRgb(value, metric).map(channel => {
    const s = channel / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const luminance = linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  return luminance > 0.179 ? "#000000" : "#FFFFFF";
}
