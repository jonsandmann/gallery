export const edFacilities = ["Halden General", "St. Agnes", "Riverside"];
export const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const outcomes = ["Admitted", "Discharged", "Transferred", "LWBS"] as const;
export type Outcome = typeof outcomes[number];
export type Encounter = {
  day: number; weekday: number; hour: number; facility: string; mode: string;
  outcome: Outcome; triaged: boolean; urgent: boolean;
  triageWait: number; providerWait: number; treatment: number; los: number; boarding: number;
};
export type HourSelection = { weekday: number; hour: number } | null;
const hourly = [8, 6, 4, 3, 3, 4, 7, 12, 18, 23, 27, 31, 29, 26, 25, 23, 26, 29, 24, 20, 17, 14, 11, 9];
const dailyPressure = [2, 5, 1, -2, 0, 3, 6, 1, -3, 0, 4, 2, -2, -5, 1, 4, 7, 2, 0, -1, 3, -1, 0, 2, -3, 0, -2, -4, 1, 3];
const baseDate = Date.UTC(2026, 8, 6);

export const encounters: Encounter[] = Array.from({ length: 30 }, (_, day) => {
  const weekday = (new Date(baseDate + day * 86400000).getUTCDay() + 6) % 7;
  return hourly.flatMap((base, hour) => {
    const busiest = day === 22 && hour === 11;
    const count = busiest ? 61 : Math.max(2, Math.min(48, Math.round(base * [1.2, 1.04, 1.01, .96, 1.09, .86, .81][weekday] + ((day * 11 + hour * 7 + day * hour * 3) % 9) - 4)));
    return Array.from({ length: count }, (_, index): Encounter => {
      const seed = day * 937 + hour * 137 + index * 73;
      const fi = seed % 10 < 5 ? 0 : seed % 10 < 8 ? 1 : 2;
      const left = busiest ? index % 13 === 0 : seed % 47 === 0;
      const outcome: Outcome = left ? "LWBS" : seed % 100 < (busiest ? 38 : 24) ? "Admitted" : seed % 100 > 96 ? "Transferred" : "Discharged";
      const triageWait = 3 + seed % 9 + (busiest ? 4 : 0);
      const providerWait = Math.max(triageWait + 3, Math.round(18 + base * .37 + dailyPressure[day] + (weekday === 0 ? 3 : 0) + fi * 2 + seed % 21 - 10 + (busiest ? 12 : 0)));
      const treatment = 112 + seed % 131 + (busiest ? 24 : 0);
      const boarding = outcome === "Admitted" ? 90 + seed % 391 + (busiest ? 85 : 0) : 0;
      return { day, weekday, hour, facility: edFacilities[fi], mode: Math.floor(seed / 17) % 10 < 3 ? "Ambulance" : "Walk-in", outcome, triaged: !left || seed % 2 === 0, urgent: Math.floor(seed / 13) % 10 < 4, triageWait, providerWait, treatment, los: providerWait + treatment, boarding };
    });
  });
}).flat();

export function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function edMetrics(cohort: Encounter[]) {
  const seen = cohort.filter(patient => patient.outcome !== "LWBS");
  const triaged = cohort.filter(patient => patient.triaged);
  const discharged = cohort.filter(patient => patient.outcome === "Discharged");
  const disposition = Object.fromEntries(outcomes.map(outcome => [outcome, cohort.filter(patient => patient.outcome === outcome).length])) as Record<Outcome, number>;
  return {
    arrivals: cohort.length, triaged: triaged.length, seen: seen.length, disposition,
    walkIn: cohort.filter(patient => patient.mode === "Walk-in").length,
    ambulance: cohort.filter(patient => patient.mode === "Ambulance").length,
    urgentTriaged: triaged.filter(patient => patient.urgent).length,
    urgentSeen: seen.filter(patient => patient.urgent).length,
    door: median(seen.map(patient => patient.providerWait)),
    triageWait: median(triaged.map(patient => patient.triageWait)),
    providerWait: median(seen.map(patient => patient.providerWait - patient.triageWait)),
    treatment: median(seen.map(patient => patient.treatment)),
    los: median(discharged.map(patient => patient.los)),
    lwbsRate: cohort.length ? disposition.LWBS / cohort.length * 100 : 0,
    boarding: cohort.reduce((sum, patient) => sum + patient.boarding, 0) / 60,
  };
}

export function dateLabel(day: number, options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" }) {
  return new Date(baseDate + day * 86400000).toLocaleDateString("en-GB", { ...options, timeZone: "UTC" });
}

export const hourLabel = (hour: number) => `${String(hour).padStart(2, "0")}:00`;
