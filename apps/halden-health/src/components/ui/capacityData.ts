export const facilities = ["Halden General", "St. Agnes", "Riverside"];
export type Unit = {
  id: string; name: string; facility: string; service: string;
  beds: number; blocked: number; vacant: number; dirty: number;
  admits: number; discharges: number; boarders: number;
};

const definitions: [string, string, number, number, number, number, number, number, number][] = [
  ["MICU", "Critical care", 36, 1, 1, 0, 3, 2, 2],
  ["4 West Med-Surg", "Medicine", 96, 2, 8, 2, 5, 10, 3],
  ["Cardiac Stepdown", "Cardiac", 72, 2, 6, 2, 3, 6, 1],
  ["5 East Medicine", "Medicine", 84, 1, 8, 3, 4, 9, 2],
  ["Surgical Services", "Surgery", 80, 1, 7, 2, 3, 8, 1],
  ["Neurosciences", "Medicine", 72, 1, 8, 2, 2, 5, 1],
  ["ICU", "Critical care", 28, 1, 1, 0, 2, 1, 1],
  ["3 North Med-Surg", "Medicine", 88, 2, 7, 2, 3, 8, 2],
  ["Telemetry", "Cardiac", 64, 1, 6, 1, 2, 5, 1],
  ["L&D", "Women & children", 32, 0, 5, 0, 1, 4, 0],
  ["Orthopedics", "Surgery", 68, 2, 7, 2, 2, 6, 0],
  ["Mother & Baby", "Women & children", 56, 1, 5, 1, 1, 5, 0],
  ["Critical Care", "Critical care", 24, 0, 1, 0, 1, 1, 1],
  ["2 South Med-Surg", "Medicine", 86, 2, 6, 2, 2, 5, 2],
  ["Cardiac Care", "Cardiac", 64, 1, 6, 2, 1, 3, 1],
  ["Pediatrics", "Women & children", 48, 1, 6, 1, 1, 3, 0],
  ["Acute Medicine", "Medicine", 80, 2, 6, 2, 1, 3, 1],
  ["General Surgery", "Surgery", 72, 1, 3, 1, 1, 2, 0],
];

export const units: Unit[] = definitions.map(([name, service, beds, blocked, vacant, dirty, admits, discharges, boarders], index) => ({
  id: `unit-${index}`, name, service, beds, blocked, vacant, dirty, admits, discharges, boarders, facility: facilities[Math.floor(index / 6)],
}));

const demand = [0, -.029, -.041, -.014, .012, .032, .052, .034, .016, -.012, -.023, .006, .024];
export function unitState(unit: Unit, hour: number) {
  const index = units.indexOf(unit);
  const segment = Math.min(Math.floor(hour / 6), demand.length - 2);
  const fraction = (hour - segment * 6) / 6;
  const pressure = demand[segment] + (demand[segment + 1] - demand[segment]) * fraction;
  const staffed = unit.beds - unit.blocked;
  const sensitivity = .8 + (index % 5) * .11;
  const census = Math.min(staffed, Math.max(0, Math.round(staffed - unit.vacant + staffed * pressure * sensitivity)));
  const available = staffed - census;
  const dirty = Math.min(available, Math.max(0, Math.round(unit.dirty + Math.sin(hour / 8) * (unit.dirty ? 1 : 0))));
  const ready = available - dirty;
  const admits = Math.max(0, Math.round(unit.admits * (1 + pressure * 8)));
  const discharges = Math.max(0, Math.round(unit.discharges * (1 - pressure * 4)));
  const boarders = Math.max(0, Math.round(unit.boarders * (1 + pressure * 12)));
  return { ...unit, staffed, census, available, dirty, ready, admits, discharges, boarders, occupancy: census / staffed * 100 };
}

export function aggregate(selected: Unit[], hour: number) {
  const states = selected.map(unit => unitState(unit, hour));
  const sum = (key: "staffed" | "census" | "available" | "dirty" | "ready" | "blocked" | "admits" | "discharges" | "boarders") => states.reduce((total, unit) => total + unit[key], 0);
  const staffed = sum("staffed");
  const census = sum("census");
  return { staffed, census, available: sum("available"), dirty: sum("dirty"), ready: sum("ready"), blocked: sum("blocked"), admits: sum("admits"), discharges: sum("discharges"), boarders: sum("boarders"), occupancy: staffed ? census / staffed * 100 : 0, surge: states.filter(unit => unit.occupancy >= 95).length };
}

export function timeLabel(hour: number, full = false) {
  const date = new Date(Date.UTC(2026, 9, 6, 7 + hour));
  return date.toLocaleString("en-GB", { weekday: full ? "long" : "short", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" }).replace(",", "");
}

export function dischargeDay(hour: number) {
  const next = new Date(Date.UTC(2026, 9, 6, 7 + hour));
  if (next.getUTCHours() >= 14) next.setUTCDate(next.getUTCDate() + 1);
  return next.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" });
}
