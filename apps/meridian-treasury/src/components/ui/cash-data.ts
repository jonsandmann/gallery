export const scenarios = ["Base", "EUR -5%", "DSO +7 days", "Capex pull-forward"] as const;
export type Scenario = typeof scenarios[number];
export type Entity = { id: string; name: string; country: string; currency: string; usd: number; rate: number; trapped: boolean; region: string };
export const entities: Entity[] = [
  { id: "US01", name: "Velmora Holdings Inc.", country: "US", currency: "USD", usd: 312.4, rate: 1, trapped: false, region: "Americas" },
  { id: "DE01", name: "Velmora Antrieb GmbH", country: "DE", currency: "EUR", usd: 186.8, rate: 1.092, trapped: false, region: "Europe" },
  { id: "NL01", name: "Velmora Treasury B.V.", country: "NL", currency: "EUR", usd: 142.6, rate: 1.092, trapped: false, region: "Europe" },
  { id: "GB01", name: "Velmora Industries Ltd.", country: "GB", currency: "GBP", usd: 138.3, rate: 1.308, trapped: false, region: "Europe" },
  { id: "BR01", name: "Velmora Brasil Ltda.", country: "BR", currency: "BRL", usd: 102.7, rate: 0.182, trapped: false, region: "Americas" },
  { id: "CN01", name: "Velmora Precision Co.", country: "CN", currency: "CNY", usd: 91.5, rate: 0.141, trapped: true, region: "Asia Pacific" },
  { id: "MX01", name: "Velmora Sistemas S.A.", country: "MX", currency: "MXN", usd: 74.2, rate: 0.052, trapped: false, region: "Americas" },
  { id: "FR01", name: "Velmora Composants SAS", country: "FR", currency: "EUR", usd: 63.8, rate: 1.092, trapped: false, region: "Europe" },
  { id: "PL01", name: "Velmora Polska Sp. z o.o.", country: "PL", currency: "PLN", usd: 48.6, rate: 0.254, trapped: false, region: "Europe" },
  { id: "IN01", name: "Velmora Motion Pvt. Ltd.", country: "IN", currency: "INR", usd: 37.9, rate: 0.0119, trapped: true, region: "Asia Pacific" },
  { id: "CA01", name: "Velmora Canada Inc.", country: "CA", currency: "CAD", usd: 29.4, rate: 0.734, trapped: false, region: "Americas" },
  { id: "IT01", name: "Velmora Meccanica S.r.l.", country: "IT", currency: "EUR", usd: 24.8, rate: 1.092, trapped: false, region: "Europe" },
  { id: "US02", name: "Velmora Components LLC", country: "US", currency: "USD", usd: 18.6, rate: 1, trapped: false, region: "Americas" },
  { id: "GB02", name: "Velmora Services Ltd.", country: "GB", currency: "GBP", usd: 13, rate: 1.308, trapped: false, region: "Europe" },
];
export const paths: Record<Scenario, number[]> = {
  Base: [1258.2, 1186.7, 1234.5, 1082.3, 1026.8, 883.6, 749.2, 628.4, 714.8, 768.3, 732.6, 816.2, 846.9],
  "EUR -5%": [1232.8, 1154.6, 1195.2, 1024.7, 963.2, 821.4, 684.6, 571.8, 662.5, 714.9, 681.2, 758.8, 789.4],
  "DSO +7 days": [1093.1, 1004.8, 1036.7, 844.9, 771.6, 685.1, 608.8, 536.2, 497.4, 462.1, 511.8, 593.4, 648.2],
  "Capex pull-forward": [1045.4, 1026.7, 1091.8, 939.6, 884.1, 740.9, 606.5, 485.7, 318.4, 416.7, 558.9, 701.2, 846.9],
};
export function adjustedEntities(scenario: Scenario): Entity[] {
  const dso: Record<string, number> = { US01: 36.2, DE01: 61.8, NL01: 8.4, GB01: 16.7, BR01: 12.6, FR01: 12.9 };
  const capex: Record<string, number> = { US01: 144.6, DE01: 48.2, MX01: 20 };
  return entities.map(entity => ({
    ...entity,
    usd: entity.usd - (scenario === "EUR -5%" && entity.currency === "EUR" ? entity.usd * 0.05 : scenario === "DSO +7 days" ? dso[entity.id] || 0 : scenario === "Capex pull-forward" ? capex[entity.id] || 0 : 0),
    rate: entity.rate * (scenario === "EUR -5%" && entity.currency === "EUR" ? 0.95 : 1),
  }));
}
export const weeks = ["11 Sep", "18 Sep", "25 Sep", "02 Oct", "09 Oct", "16 Oct", "23 Oct", "30 Oct", "06 Nov", "13 Nov", "20 Nov", "27 Nov", "04 Dec", "11 Dec", "18 Dec", "25 Dec", "01 Jan"];
export const flows = [
  { date: "06 Oct", name: "Customer receipts", entity: "Velmora Holdings · US01", amount: 64.2, category: "Operating" },
  { date: "07 Oct", name: "Payroll DE", entity: "Velmora Antrieb · DE01", amount: -28.6, category: "Operating" },
  { date: "09 Oct", name: "Dividend upstream", entity: "Velmora Brasil → Holdings", amount: 42.8, category: "Intercompany" },
  { date: "12 Oct", name: "Capex milestone", entity: "Monterrey · machining line 04", amount: -86.4, category: "Investing" },
  { date: "15 Oct", name: "Bond coupon", entity: "2029 notes · 4.75%", amount: -17.8, category: "Financing" },
];
