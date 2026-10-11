import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CalendarDays, ChevronRight, Clock3, Hospital, RotateCcw, ShieldCheck, X } from "lucide-react";
import { Area, CartesianGrid, ComposedChart, Line, ReferenceDot, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "recharts";
import clsx from "clsx";
import { AnimatedNumber, Badge, Button, Card, chartTheme, Dialog, focus, Information, Kpi, Segmented, Select, Table, Tabs, Tooltip } from "./ui/HaldenKit";
import { aggregate, dischargeDay, facilities, timeLabel, units, unitState, type Unit } from "./ui/capacityData";

import { HaldenShell } from "./ui/HaldenShell";
const bedClasses = {
  occupied: "bg-[#5B817A]",
  ready: "bg-[#9CF1F0] ring-1 ring-inset ring-[#62BDB9]",
  dirty: "bg-[#BEC9C5]",
  blocked: "bg-[#F8FAF9] ring-1 ring-inset ring-[#7D8A85]",
};

function BedKey() {
  return <div className="flex items-center gap-4 text-xs text-[#53615A]">{(["occupied", "ready", "dirty", "blocked"] as const).map(state => <span key={state} className="flex items-center gap-1.5"><span className={clsx("relative h-2 w-2 rounded-[2px]", bedClasses[state])}>{state === "blocked" && <span className="absolute left-0 top-1/2 h-px w-full -rotate-45 bg-[#7D8A85]" />}</span>{state === "ready" ? "Clean & ready" : state[0].toUpperCase() + state.slice(1)}</span>)}</div>;
}

function UnitCard({ unit, hour, onClick }: { unit: Unit; hour: number; onClick: () => void }) {
  const state = unitState(unit, hour);
  const surge = state.occupancy >= 95;
  const reduced = useReducedMotion();
  return <motion.button onClick={onClick} aria-label={`${unit.facility}, ${unit.name}: ${state.census} of ${state.staffed} staffed beds occupied. ${state.ready} ready, ${state.dirty} dirty, ${state.blocked} blocked. View unit.`}
    animate={{ backgroundColor: surge ? "#FFDAD6" : "#EEF3F1" }} transition={{ duration: reduced ? 0 : .22 }}
    className={clsx("group flex h-full min-h-0 min-w-0 flex-col rounded-xl px-3 py-2 text-left hover:brightness-[0.975]", focus)}>
    <div className="flex items-center justify-between gap-1"><h3 className="truncate text-sm font-medium">{unit.name}</h3><ChevronRight size={13} className="shrink-0 text-[#53615A] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" /></div>
    <div className="mt-1 flex items-baseline justify-between">
      <span className="text-xl font-medium"><AnimatedNumber value={state.census} /><span className="ml-1 text-xs font-normal text-[#53615A]">/ {state.staffed}</span></span>
      <span className={clsx("text-xs font-medium", surge ? "text-[#93000A]" : "text-[#3F4946]")}><AnimatedNumber value={state.occupancy} decimals={1} />%</span>
    </div>
    <div aria-hidden="true" className="mt-1 grid grid-cols-[repeat(24,minmax(0,1fr))] gap-[2px]">
      {Array.from({ length: unit.beds }, (_, index) => {
        const stateName = index < state.census ? "occupied" : index < state.census + state.ready ? "ready" : index < unit.beds - unit.blocked ? "dirty" : "blocked";
        return <span key={index} className={clsx("relative h-[4px] rounded-[1px] transition-colors duration-200 motion-reduce:transition-none", stateName === "occupied" && surge ? "bg-[#B76159]" : bedClasses[stateName])}>{stateName === "blocked" && <span className="absolute left-0 top-1/2 h-px w-full -rotate-45 bg-[#7D8A85]" />}</span>;
      })}
    </div>
    <div className="mt-auto pt-1.5"><div className={clsx("h-[3px] overflow-hidden rounded-full", surge ? "bg-[#EDBBB5]" : "bg-[#D8E2DD]")}><motion.div animate={{ width: `${state.occupancy}%`, backgroundColor: surge ? "#BA1A1A" : "#5B817A" }} transition={{ duration: reduced ? 0 : .25, ease: [0.2, 0, 0, 1] }} className="h-full rounded-full" /></div></div>
  </motion.button>;
}

export default function InpatientCapacity() {
  const [facility, setFacility] = useState("All");
  const [service, setService] = useState("All service lines");
  const [hour, setHour] = useState(0);
  const [dialog, setDialog] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [unitTab, setUnitTab] = useState("Bed status");
  const [showInterval, setShowInterval] = useState(true);
  const [showSurge, setShowSurge] = useState(true);
  const reduced = useReducedMotion();
  const selected = useMemo(() => units.filter(unit => (facility === "All" || unit.facility === facility) && (service === "All service lines" || unit.service === service)), [facility, service]);
  const totals = aggregate(selected, hour);
  const visibleFacilities = facility === "All" ? facilities : [facility];
  const forecast = useMemo(() => Array.from({ length: 73 }, (_, h) => {
    const point = aggregate(selected, h);
    const uncertainty = Math.round(point.staffed * (.006 + h / 72 * .016));
    return { hour: h, census: point.census, interval: [point.census - uncertainty, point.census + uncertainty] };
  }), [selected]);
  const peak = forecast.reduce((max, point) => point.census > max.census ? point : max, forecast[0]);
  const tickStep = totals.staffed > 500 ? 50 : totals.staffed > 100 ? 20 : 5;
  const minimum = Math.floor(Math.min(...forecast.map(point => point.interval[0])) / tickStep) * tickStep;
  const maximum = Math.ceil(totals.staffed * 1.025 / tickStep) * tickStep;
  const ticks = Array.from({ length: Math.floor((maximum - minimum) / tickStep) + 1 }, (_, index) => minimum + index * tickStep);
  const detail = selectedUnit ? unitState(selectedUnit, hour) : null;
  const close = () => { setDialog(null); setSelectedUnit(null); };

  return <HaldenShell active="Capacity" onAction={setDialog}>
      <main className="flex min-h-0 flex-1 flex-col gap-3 px-6 pb-3 pt-[18px]">
        <div className="flex h-9 shrink-0 items-center justify-between">
          <h1 className="font-display text-3xl font-normal">Inpatient Capacity</h1>
          <div className="flex items-center gap-3 text-xs text-[#53615A]"><span>Regional command centre</span><span className="h-3 w-px bg-[#BEC9C5]" /><span>3 hospitals</span></div>
        </div>
        <div className="flex h-8 shrink-0 items-center justify-between">
          <div className="flex items-center gap-3"><Hospital size={16} className="text-[#53615A]" /><Segmented label="Facility" value={facility} options={["All", ...facilities]} onChange={setFacility} /><span className="mx-1 h-4 w-px bg-[#BEC9C5]/60" /><Select label="Service" value={service} options={["All service lines", "Medicine", "Critical care", "Cardiac", "Surgery", "Women & children"]} onChange={setService} />
            {(facility !== "All" || service !== "All service lines") && <button onClick={() => { setFacility("All"); setService("All service lines"); }} className={clsx("rounded p-1 text-[#53615A] hover:bg-[#E6ECEA]", focus)} aria-label="Clear filters"><X size={14} /></button>}
          </div>
          <div className="flex items-center gap-2 text-xs text-[#3F4946]"><CalendarDays size={14} /><span>Tue, 06 Oct 2026</span><span className="mx-1 text-[#BEC9C5]">|</span><span>07:00–07:00 +3d</span></div>
        </div>

        <div className="grid h-[108px] shrink-0 grid-cols-5 gap-3">
          <Kpi label="Occupancy" value={totals.occupancy} suffix="%" primary error={totals.occupancy >= 95} detail={<><AnimatedNumber value={totals.census} /> / {totals.staffed.toLocaleString()} staffed beds</>} />
          <Kpi label="Available staffed beds" value={totals.available} index={1} detail={<><AnimatedNumber value={totals.ready} /> ready <span className="mx-1">·</span> <AnimatedNumber value={totals.dirty} /> in turnover</>} />
          <Kpi label="Pending admits" value={totals.admits} index={2} detail="Accepted · awaiting placement" />
          <Kpi label="Expected discharges by 14:00" value={totals.discharges} index={3} detail={`${dischargeDay(hour)} · discharge orders + planned`} />
          <Kpi label="ED boarders" value={totals.boarders} index={4} detail="Admit decision · awaiting bed" />
        </div>

        <section className="flex min-h-[386px] flex-1 flex-col">
          <div className="mb-2 flex h-6 shrink-0 items-center justify-between">
            <div className="flex items-center gap-2.5"><h2 className="text-base font-medium">Units</h2><span className="text-xs text-[#64716C]">{selected.length}</span><span className="ml-2 rounded-md bg-[#FFDAD6] px-2 py-0.5 text-xs text-[#93000A]">{totals.surge} at or above 95%</span></div>
            <BedKey />
          </div>
          <div className={clsx("grid min-h-0 flex-1 gap-4", visibleFacilities.length === 3 ? "grid-cols-3" : "grid-cols-1")}>
            {visibleFacilities.map(name => {
              const facilityUnits = selected.filter(unit => unit.facility === name);
              const facilityTotals = aggregate(facilityUnits, hour);
              return <div key={name} className="flex min-h-0 min-w-0 flex-col">
                <div className="mb-2 flex h-5 shrink-0 items-center justify-between px-0.5 text-xs"><span className="font-medium text-[#3F4946]">{name}</span><span className="text-[#64716C]"><AnimatedNumber value={facilityTotals.census} /> / {facilityTotals.staffed} beds</span></div>
                <div className={clsx("grid min-h-0 flex-1 gap-2", visibleFacilities.length === 1 ? "grid-cols-3 grid-rows-2" : "grid-cols-2 grid-rows-3")}>
                  {facilityUnits.map(unit => <UnitCard key={unit.id} unit={unit} hour={hour} onClick={() => { setSelectedUnit(unit); setUnitTab("Bed status"); }} />)}
                  {!facilityUnits.length && <div className="col-span-2 row-span-3 flex items-center justify-center rounded-xl bg-[#EEF3F1] text-xs text-[#64716C]">No units in this service line</div>}
                </div>
              </div>;
            })}
          </div>
        </section>

        <Card className="flex h-[218px] shrink-0 flex-col px-4 pb-3 pt-3">
          <div className="flex h-6 shrink-0 items-center justify-between">
            <div className="flex items-center gap-2"><h2 className="text-base font-medium">Census forecast, next 72 h</h2><Information label="Hourly census estimate with an 80% prediction interval. Staffing held at current levels." /></div>
            <div className="flex items-center gap-4"><span className="text-xs text-[#64716C]">Peak <span className="font-medium text-[#3F4946]">{peak.census.toLocaleString()}</span> · {timeLabel(peak.hour)}</span><Badge>{hour === 0 ? "Now" : `+${hour} h`}<span className="h-3 w-px bg-[#BEC9C5]" />{timeLabel(hour)}</Badge></div>
          </div>
          <div className="mt-1 h-[125px] w-full shrink-0" aria-label={`Census forecast. Selected ${timeLabel(hour)}, ${totals.census} beds occupied. Peak ${peak.census} at ${timeLabel(peak.hour)}.`}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={forecast} margin={{ top: 12, right: 143, bottom: 1, left: 4 }}>
                <CartesianGrid vertical={false} stroke={chartTheme.grid} strokeWidth={.6} />
                <XAxis dataKey="hour" type="number" domain={[0, 72]} ticks={[0, 12, 24, 36, 48, 60, 72]} tickFormatter={h => h === 0 ? "Tue 07:00" : timeLabel(h)} tick={chartTheme.tick} tickLine={false} axisLine={false} height={21} />
                <YAxis domain={[minimum, maximum]} ticks={ticks} tickFormatter={v => Math.round(v).toLocaleString()} tick={chartTheme.tick} tickLine={false} axisLine={false} width={42} />
                {showInterval && <Area type="monotone" dataKey="interval" stroke="none" fill={chartTheme.interval} fillOpacity={.55} isAnimationActive={!reduced} animationDuration={360} />}
                <ReferenceLine y={totals.staffed} stroke={chartTheme.muted} strokeWidth={1} label={{ value: `Staffed beds  ${totals.staffed.toLocaleString()}`, position: "right", fill: "#53615A", fontSize: 11 }} />
                {showSurge && <ReferenceLine y={totals.staffed * .95} stroke={chartTheme.error} strokeOpacity={.55} strokeDasharray="4 4" label={{ value: "Surge threshold  95%", position: "right", fill: "#A6423A", fontSize: 11 }} />}
                <Line type="monotone" dataKey="census" stroke={chartTheme.primary} strokeWidth={2.3} dot={false} activeDot={false} isAnimationActive={!reduced} animationDuration={360} />
                <ReferenceLine x={hour} stroke={chartTheme.primary} strokeWidth={1} />
                <ReferenceDot x={hour} y={totals.census} r={4} fill={chartTheme.primary} stroke="#F8FAF9" strokeWidth={2} />
                <ReferenceDot x={72} y={forecast[72].census} r={0} label={{ value: `Predicted  ${forecast[72].census.toLocaleString()}`, position: "right", fill: chartTheme.primary, fontSize: 11, offset: 8, dy: 14 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-auto flex h-9 shrink-0 items-center gap-4 rounded-lg bg-[#E3ECE7] px-3">
            <Clock3 size={15} className="shrink-0 text-[#006A6A]" />
            <label htmlFor="forecast-hour" className="shrink-0 text-xs font-medium text-[#3F4946]">Forecast time</label>
            <button className={clsx("shrink-0 rounded px-1 text-xs font-medium text-[#006A6A]", focus)} onClick={() => setHour(0)}>Now</button>
            <input id="forecast-hour" aria-label="Forecast time, hours from Tuesday 07:00" aria-valuetext={`${hour === 0 ? "Now, " : `Plus ${hour} hours, `}${timeLabel(hour, true)}. ${totals.census} occupied beds.`} type="range" min={0} max={72} step={1} value={hour} onChange={event => setHour(Number(event.target.value))} className={clsx("h-4 min-w-0 flex-1 cursor-ew-resize accent-[#006A6A]", focus)} />
            <span className="text-xs text-[#53615A]">+72 h</span><span className="mx-1 h-4 w-px bg-[#BEC9C5]" />
            <span className="w-[106px] text-xs font-medium text-[#006A6A]">{hour === 0 ? "Tuesday 07:00" : timeLabel(hour, true)}</span>
            <Tooltip label="Reset to now"><button onClick={() => setHour(0)} aria-label="Reset forecast to now" className={clsx("rounded-full p-1 text-[#53615A] hover:bg-[#D0DED6]", focus)}><RotateCcw size={14} /></button></Tooltip>
          </div>
        </Card>
        <footer className="flex h-3.5 shrink-0 items-center justify-between text-xs text-[#6D7975]"><span className="flex items-center gap-1.5"><ShieldCheck size={12} />Operational use · de-identified census</span><span>{hour === 0 ? "Current census" : "Projected census"} · {totals.blocked} blocked beds excluded from staffed capacity <span className="mx-2">·</span> All times local</span></footer>
      </main>

    {detail && <Dialog title={detail.name} onClose={close}>
      <div className="mb-2 flex items-center justify-between text-sm text-[#53615A]"><span>{detail.facility} · {detail.service}</span><Badge error={detail.occupancy >= 95}>{detail.occupancy.toFixed(1)}% occupied</Badge></div>
      <Tabs value={unitTab} options={["Bed status", "Patient flow"]} onChange={setUnitTab} />
      <div className="my-4 text-xs text-[#53615A]">{timeLabel(hour, true)} · {hour === 0 ? "Current" : "Predicted"}</div>
      <Table headers={unitTab === "Bed status" ? ["Bed state", "Beds"] : ["Flow", "Patients"]} rows={unitTab === "Bed status" ? [["Occupied", detail.census], ["Clean & ready", detail.ready], ["Dirty / in turnover", detail.dirty], ["Blocked (not staffed)", detail.blocked], ["Total physical beds", detail.beds]] : [["Pending admits", detail.admits], [`Expected discharges, ${dischargeDay(hour)} 14:00`, detail.discharges], ["ED boarders", detail.boarders]]} />
    </Dialog>}

    {dialog && <Dialog title={dialog} onClose={close}>
      {dialog === "Display settings" ? <div className="space-y-4 py-3">{[{ label: "80% prediction interval", value: showInterval, setter: setShowInterval }, { label: "95% surge threshold", value: showSurge, setter: setShowSurge }].map(({ label, value, setter }) => <label key={label} className="flex cursor-pointer items-center justify-between rounded-xl bg-[#EEF3F1] p-4"><span>{label}</span><input type="checkbox" checked={value} onChange={event => setter(event.target.checked)} className="h-4 w-4 accent-[#006A6A]" /></label>)}</div>
      : dialog === "Notifications" ? <div className="space-y-3"><Card className="p-4"><div className="mb-1 flex justify-between font-medium"><span>MICU above surge threshold</span><span className="text-xs text-[#64716C]">07:38</span></div><p className="text-sm text-[#53615A]">Halden General · 34 of 35 staffed beds occupied.</p></Card><Card className="p-4"><div className="mb-1 flex justify-between font-medium"><span>Staffing allocation updated</span><span className="text-xs text-[#64716C]">07:25</span></div><p className="text-sm text-[#53615A]">Regional staffed capacity confirmed at 1,128 beds.</p></Card></div>
      : dialog === "Account" ? <div className="rounded-xl bg-[#EEF3F1] p-5"><p className="text-lg font-medium">Anna Mercer</p><p className="mt-1 text-sm text-[#53615A]">Regional capacity manager</p><div className="mt-5 flex items-center gap-2 text-xs text-[#006A6A]"><ShieldCheck size={15} />Halden Health · Operations access</div></div>
      : dialog === "Capacity definitions" ? <Table headers={["Metric", "Definition"]} rows={[["Occupancy", "Occupied beds / staffed beds. Blocked beds excluded."], ["Available staffed beds", "Clean & ready beds plus beds in turnover."], ["Pending admits", "Accepted patients awaiting inpatient placement."], ["ED boarders", "ED patients with an admit decision awaiting a bed. Included in pending admits."], ["Forecast", "Hourly estimates; 80% interval. Staffing held constant."], ["Bed squares", "One square per physical bed. Red units are at or above 95% occupancy."]]} />
      : <><div className="mb-4 flex items-center justify-between"><Badge>{timeLabel(hour)}{hour > 0 ? " · Predicted" : ""}</Badge><span className="text-xs text-[#53615A]">{service}</span></div><Table headers={["Facility", dialog === "Staffing" ? "Staffed beds" : dialog === "Discharges" ? "Expected by 14:00" : dialog === "Patient flow" ? "Pending admits" : "Census", dialog === "Patient flow" ? "ED boarders" : dialog === "Staffing" ? "Blocked" : "Occupancy"]} rows={visibleFacilities.map(name => { const t = aggregate(selected.filter(unit => unit.facility === name), hour); return [name, dialog === "Staffing" ? t.staffed : dialog === "Discharges" ? t.discharges : dialog === "Patient flow" ? t.admits : t.census, dialog === "Patient flow" ? t.boarders : dialog === "Staffing" ? t.blocked : `${t.occupancy.toFixed(1)}%`]; })} /><div className="mt-5 flex justify-end"><Button tone="filled" onClick={close}>Return to capacity</Button></div></>}
    </Dialog>}
  </HaldenShell>;
}
