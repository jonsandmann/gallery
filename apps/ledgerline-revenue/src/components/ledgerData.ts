export type Segment = "Enterprise" | "Mid-market" | "SMB";
export type Stage = "Opening ARR" | "New logos" | "Expansion" | "Contraction" | "Churn" | "Closing ARR";
export const stages: Stage[] = ["Opening ARR", "New logos", "Expansion", "Contraction", "Churn", "Closing ARR"];
export const segments: Segment[] = ["Enterprise", "Mid-market", "SMB"];
export const segmentOptions = ["All", ...segments];
export type Ledger = { opening: number; newArr: number; expansion: number; contraction: number; churn: number; openingLogos: number; newLogos: number; lostLogos: number; expanded: number; contracted: number; nrr: number };

const q3: Record<Segment, Ledger> = {
  Enterprise: { opening: 240.8, newArr: 10.7, expansion: 18.6, contraction: 3.7, churn: 6.2, openingLogos: 620, newLogos: 27, lostLogos: 6, expanded: 92, contracted: 21, nrr: 123.2 },
  "Mid-market": { opening: 110.6, newArr: 5.3, expansion: 6.5, contraction: 3.1, churn: 4.6, openingLogos: 1280, newLogos: 68, lostLogos: 21, expanded: 118, contracted: 43, nrr: 113.6 },
  SMB: { opening: 37.8, newArr: 1.8, expansion: 1.3, contraction: 1.3, churn: 1.8, openingLogos: 1886, newLogos: 84, lostLogos: 44, expanded: 76, contracted: 48, nrr: 101.9 },
};
const q2: Record<Segment, Ledger> = {
  Enterprise: { ...q3.Enterprise, opening: 226, newArr: 9.4, expansion: 16.9, contraction: 2.9, churn: 8.6, openingLogos: 601, newLogos: 26, lostLogos: 7, nrr: 121.6 },
  "Mid-market": { ...q3["Mid-market"], opening: 105, newArr: 5.1, expansion: 5.9, contraction: 2.6, churn: 2.8, openingLogos: 1230, newLogos: 73, lostLogos: 23, nrr: 111.8 },
  SMB: { ...q3.SMB, opening: 36.6, newArr: 1.7, expansion: 1.1, contraction: 1.1, churn: 0.5, openingLogos: 1850, newLogos: 88, lostLogos: 52, nrr: 101.2 },
};

export function getLedger(period: string, segment: string, region: string, currency: string) {
  const source = period === "Q3 FY26" ? q3 : q2;
  const regionFactor = region === "Americas" ? 0.57 : region === "EMEA" ? 0.30 : region === "APAC" ? 0.13 : 1;
  const fx = currency === "EUR" ? 0.92 : 1;
  const selected = segments.filter(s => segment === "All" || segment === s);
  const rows = selected.map(s => {
    const r = source[s];
    return { segment: s, ...r, opening: r.opening * regionFactor * fx, newArr: r.newArr * regionFactor * fx, expansion: r.expansion * regionFactor * fx, contraction: r.contraction * regionFactor * fx, churn: r.churn * regionFactor * fx, openingLogos: Math.round(r.openingLogos * regionFactor), newLogos: Math.round(r.newLogos * regionFactor), lostLogos: Math.round(r.lostLogos * regionFactor), expanded: Math.round(r.expanded * regionFactor), contracted: Math.round(r.contracted * regionFactor) };
  });
  const sum = (key: keyof Ledger) => rows.reduce((total, r) => total + r[key], 0);
  const opening = sum("opening");
  const values = [opening, sum("newArr"), sum("expansion"), -sum("contraction"), -sum("churn"), opening + sum("newArr") + sum("expansion") - sum("contraction") - sum("churn")];
  const counts = [sum("openingLogos"), sum("newLogos"), sum("expanded"), sum("contracted"), sum("lostLogos"), sum("openingLogos") + sum("newLogos") - sum("lostLogos")];
  const nrr = segment === "All" ? (period === "Q3 FY26" ? 118.4 : 116.9) : source[segment as Segment].nrr;
  return { values, counts, rows, nrr, grr: (1 - (sum("contraction") + sum("churn")) / opening) * 100, logoChurn: sum("lostLogos") / sum("openingLogos") * 100 };
}

const names = [
  "Avenor Systems", "Kestrelpath", "Meridian Loom", "Halden Works", "Vellum Ridge", "Orven Labs",
  "Sablepoint", "Fennic Cloud", "Trellis North", "Cairnwell", "Novren Systems", "Asterfold",
  "Brindle Stack", "Cobalt Finch", "Marrowgate", "Rellin Works", "Luma Harbor", "Ashmere Labs",
  "Veyra Network", "Fallow Logic", "Norden Arc", "Petalforge", "Valen Grid", "Copperhaven",
  "Dovetail Orbit", "Hearthbyte", "Elmora", "Ternwell Studio", "Brambleline", "Sora Junction",
  "Morrow Field", "Oaken Signal", "Fableward", "Larkspur Logic", "Wrenform", "Quietforge",
];
export type Account = { name: string; id: string; segment: Segment; plan: string; amount: number };

export function getAccounts(ledger: ReturnType<typeof getLedger>, stage: number): Account[] {
  return ledger.rows.flatMap(row => {
    const values = [row.opening, row.newArr, row.expansion, row.contraction, row.churn, row.opening + row.newArr + row.expansion - row.contraction - row.churn];
    const counts = [row.openingLogos, row.newLogos, row.expanded, row.contracted, row.lostLogos, row.openingLogos + row.newLogos - row.lostLogos];
    const count = Math.min(12, counts[stage]);
    const weights = Array.from({ length: count }, (_, i) => 24 - i * 1.45);
    const weightTotal = weights.reduce((a, b) => a + b, 0);
    const share = counts[stage] <= 12 ? 1 : stage === 0 || stage === 5 ? 0.23 : 0.63;
    const target = Math.round(values[stage] * 1_000_000 * share);
    let runningWeight = 0;
    let allocated = 0;
    return weights.map((weight, index) => {
      runningWeight += weight;
      const next = Math.round(target * runningWeight / weightTotal);
      const amount = next - allocated;
      allocated = next;
      return {
        name: names[(segments.indexOf(row.segment) * 12 + index + stage * 5) % names.length],
        id: `AC-${String(1048 + segments.indexOf(row.segment) * 731 + index * 37 + stage * 19).padStart(5, "0")}`,
        segment: row.segment, plan: row.segment === "Enterprise" ? "Scale" : row.segment === "Mid-market" ? "Growth" : "Core",
        amount,
      };
    });
  }).sort((a, b) => b.amount - a.amount);
}
