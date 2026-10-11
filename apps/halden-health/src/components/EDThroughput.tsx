import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, CalendarDays, Hospital, MousePointer2, RotateCcw, ShieldCheck, X } from "lucide-react";
import { CartesianGrid, Line, LineChart, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from "recharts";
import clsx from "clsx";
import { AnimatedNumber, Badge, Button, Card, chartTheme, Dialog, focus, Information, Kpi, Segmented, Select, Table, Tooltip } from "./ui/HaldenKit";
import { HaldenShell } from "./ui/HaldenShell";
import { dateLabel, days, edFacilities, edMetrics, encounters, hourLabel, outcomes, type HourSelection } from "./ui/emergencyData";

const ramp = ["bg-[#E3ECE7] text-[#53615A]", "bg-[#D1E6DF] text-[#3F4946]", "bg-[#B9DCD3] text-[#31574E]", "bg-[#93C9BE] text-[#234E46]", "bg-[#68B1A4] text-[#163F37]", "bg-[#3C9488] text-white", "bg-[#187F76] text-white", "bg-[#006A6A] text-white"];
const outcomeColors = { Admitted: "#4B607C", Discharged: "#6B9C91", Transferred: "#AEBBB5", LWBS: "#BA1A1A" };
const outcomeClasses = { Admitted: "bg-[#4B607C]", Discharged: "bg-[#6B9C91]", Transferred: "bg-[#AEBBB5]", LWBS: "bg-[#BA1A1A]" };

function FlowBar({ name, count, segments, maximum, caption }: { name: string; count: number; segments: { value: number; color: string; label: string }[]; maximum: number; caption?: string }) {
  const reduced = useReducedMotion();
  return <div>
    <div className="mb-1.5 flex items-baseline justify-between"><h3 className="text-sm font-medium">{name}</h3><span className="text-base font-medium"><AnimatedNumber value={count} /></span></div>
    <div className="flex h-[18px] overflow-hidden rounded-md bg-[#DFE7E2]" role="img" aria-label={`${name}: ${count}. ${segments.map(segment => `${segment.label}: ${segment.value}`).join(", ")}`}>
      {segments.map(segment => <motion.div key={segment.label} initial={false} animate={{ width: `${segment.value / maximum * 100}%`, backgroundColor: segment.color }} transition={{ duration: reduced ? 0 : .38, ease: [0.2, 0, 0, 1] }} className="h-full shrink-0 border-r border-[#EEF3F1]/50 last:border-0" />)}
    </div>
    {caption && <div className="mt-1 text-xs text-[#64716C]">{caption}</div>}
  </div>;
}

function WaitConnector({ value, label }: { value: number; label: string }) {
  return <div className="flex h-[30px] items-center gap-2 pl-2 text-xs text-[#64716C]"><ArrowDown size={13} strokeWidth={1.3} /><span className="font-medium text-[#3F4946]"><AnimatedNumber value={value} decimals={value % 1 ? 1 : 0} /> min</span><span>{label}</span></div>;
}

export default function EDThroughput() {
  const [facility, setFacility] = useState("All");
  const [mode, setMode] = useState("All arrivals");
  const [week, setWeek] = useState("Last complete week");
  const [selection, setSelection] = useState<HourSelection>(null);
  const [dialog, setDialog] = useState<string | null>(null);
  const [showNumbers, setShowNumbers] = useState(true);
  const reduced = useReducedMotion();
  const weekStart = week === "Last complete week" ? 22 : 15;
  const filtered = useMemo(() => encounters.filter(patient => (facility === "All" || patient.facility === facility) && (mode === "All arrivals" || patient.mode === mode)), [facility, mode]);
  const weekCohort = useMemo(() => filtered.filter(patient => patient.day >= weekStart && patient.day < weekStart + 7), [filtered, weekStart]);
  const cohort = useMemo(() => selection ? weekCohort.filter(patient => patient.weekday === selection.weekday && patient.hour === selection.hour) : weekCohort, [weekCohort, selection]);
  const metrics = useMemo(() => edMetrics(cohort), [cohort]);
  const cells = useMemo(() => days.map((_, weekday) => Array.from({ length: 24 }, (_, hour) => weekCohort.filter(patient => patient.weekday === weekday && patient.hour === hour).length)), [weekCohort]);
  const maxArrivals = Math.max(1, ...cells.flat());
  const trend = useMemo(() => Array.from({ length: 30 }, (_, day) => {
    const patients = filtered.filter(patient => patient.day === day && (!selection || patient.hour === selection.hour));
    const stats = edMetrics(patients);
    return { day, median: stats.seen ? stats.door : null, count: patients.length };
  }), [filtered, selection?.hour]);
  const selectedDay = selection ? weekStart + selection.weekday : null;
  const scope = selection ? `${days[selection.weekday]} ${hourLabel(selection.hour)}–${hourLabel((selection.hour + 1) % 24)}` : "All hours";
  const maxFlow = metrics.arrivals > 100 ? Math.ceil(metrics.arrivals / 500) * 500 : Math.max(20, Math.ceil(metrics.arrivals / 20) * 20);
  const belowTarget = trend.filter(point => point.median !== null && point.median <= 30).length;
  const validDays = trend.filter(point => point.median !== null).length;
  const close = () => setDialog(null);
  const reset = () => setSelection(null);
  const chooseCell = (weekday: number, hour: number) => setSelection(current => current?.weekday === weekday && current.hour === hour ? null : { weekday, hour });

  return <HaldenShell active="Emergency" onAction={setDialog}>
    <main className="flex min-h-0 flex-1 flex-col gap-3 px-6 pb-3 pt-[18px]">
      <div className="flex h-9 shrink-0 items-center justify-between">
        <h1 className="font-display text-3xl font-normal">ED Throughput</h1>
        <div className="flex items-center gap-3 text-xs text-[#53615A]"><span>Regional command centre</span><span className="h-3 w-px bg-[#BEC9C5]" /><span>3 emergency departments</span></div>
      </div>
      <div className="flex h-8 shrink-0 items-center justify-between gap-3">
        <div className="flex items-center gap-3"><Hospital size={16} className="text-[#53615A]" /><Segmented label="Facility" value={facility} options={["All", ...edFacilities]} onChange={value => { setFacility(value); reset(); }} /><span className="mx-1 h-4 w-px bg-[#BEC9C5]/60" /><Select label="Mode" value={mode} options={["All arrivals", "Walk-in", "Ambulance"]} onChange={value => { setMode(value); reset(); }} /></div>
        <div className="flex items-center gap-3 text-xs text-[#3F4946]"><Select label="Week" value={week} options={["Last complete week", "Previous week"]} onChange={value => { setWeek(value); reset(); }} /><CalendarDays size={14} /><span>{dateLabel(weekStart)}–{dateLabel(weekStart + 6)} 2026</span></div>
      </div>
      <div className="grid h-[108px] shrink-0 grid-cols-4 gap-3" aria-label={`Key performance indicators: ${scope}`}>
        <Kpi label="Door-to-provider" value={metrics.seen ? metrics.door : null} decimals={metrics.door % 1 ? 1 : 0} suffix=" min" primary detail={<>Median · target ≤ 30 min{selection && <span className="ml-2 font-medium text-[#006A6A]">· {days[selection.weekday]} {hourLabel(selection.hour)}</span>}</>} />
        <Kpi label="Length of stay · discharged" value={metrics.disposition.Discharged ? metrics.los : null} decimals={metrics.los % 1 ? 1 : 0} suffix=" min" index={1} detail={<><AnimatedNumber value={metrics.disposition.Discharged} /> discharged encounters · median</>} />
        <Kpi label="Left without being seen" value={metrics.arrivals ? metrics.lwbsRate : null} suffix="%" index={2} detail={<><AnimatedNumber value={metrics.disposition.LWBS} /> / <AnimatedNumber value={metrics.arrivals} /> arrivals · target &lt; 2.0%</>} />
        <Kpi label="Boarding hours" value={metrics.boarding} suffix=" h" index={3} detail={<><AnimatedNumber value={metrics.disposition.Admitted} /> admissions · cumulative hours</>} />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.58fr)_minmax(0,1fr)] gap-3">
        <Card className="flex min-h-0 flex-col p-4">
          <div className="flex h-7 shrink-0 items-center justify-between"><div className="flex items-center gap-2"><h2 className="text-base font-medium">Arrivals by hour</h2><Information label="Each cell is one arrival-hour cohort. Select a cell to scope KPIs and patient flow; select it again to clear." /></div><span className="text-xs text-[#53615A]">{weekCohort.length.toLocaleString()} arrivals</span></div>
          <div className="mb-3 mt-1 flex items-center justify-between text-xs"><span className="text-[#64716C]">Arrival hour, local</span><span className="flex h-6 items-center gap-2 font-medium text-[#006A6A]">{scope}{selection && <button aria-label="Clear selected hour" onClick={reset} className={clsx("rounded p-0.5 hover:bg-[#D1E6DF]", focus)}><X size={13} /></button>}</span></div>
          <div className="grid h-5 shrink-0 grid-cols-[32px_repeat(24,minmax(0,1fr))_36px] gap-[3px] text-center text-xs text-[#64716C]">
            <span />{Array.from({ length: 24 }, (_, hour) => <span key={hour} className={clsx("rounded", selection?.hour === hour && "bg-[#9CF1F0] font-semibold text-[#004F50]")}>{String(hour).padStart(2, "0")}</span>)}<span className="text-right">Total</span>
          </div>
          <div role="group" aria-label="Weekly arrivals by day and hour" className="mt-1 grid min-h-0 flex-1 grid-rows-7 gap-[6px]">
            {days.map((day, weekday) => <div key={day} className="grid min-h-0 grid-cols-[32px_repeat(24,minmax(0,1fr))_36px] items-stretch gap-[3px]">
              <span className={clsx("flex items-center rounded pl-0.5 text-xs font-medium", selection?.weekday === weekday ? "bg-[#9CF1F0] text-[#004F50]" : "text-[#53615A]")}>{day}</span>
              {cells[weekday].map((count, hour) => {
                const selected = selection?.weekday === weekday && selection.hour === hour;
                const cross = selection && !selected && (selection.weekday === weekday || selection.hour === hour);
                const level = count === maxArrivals ? 7 : Math.min(6, Math.floor(count / maxArrivals * 7));
                return <button key={hour} onClick={() => chooseCell(weekday, hour)} aria-pressed={selected} aria-label={`${day} ${hourLabel(hour)}, ${count} arrivals`} title={`${day} ${dateLabel(weekStart + weekday)}, ${hourLabel(hour)}–${hourLabel((hour + 1) % 24)} · ${count} arrivals`} className={clsx("relative min-w-0 rounded-[4px] text-xs transition-colors duration-200 hover:z-10 hover:ring-2 hover:ring-[#006A6A] hover:ring-offset-1 motion-reduce:transition-none", focus, ramp[level], selected && "z-10 outline outline-2 outline-offset-2 outline-[#006A6A]", cross && "ring-2 ring-inset ring-[#9CF1F0]/80")}>
                  {cross && <span aria-hidden="true" className="absolute inset-0 rounded-[4px] bg-[#9CF1F0]/20" />}
                  <span className="relative">{showNumbers ? count : ""}</span>
                </button>;
              })}
              <span className="flex items-center justify-end text-xs font-medium text-[#53615A]">{cells[weekday].reduce((a, b) => a + b, 0)}</span>
            </div>)}
          </div>
          <div className="mt-4 flex h-6 shrink-0 items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs text-[#64716C]"><MousePointer2 size={12} />{selection ? "Select again to clear" : "Select a day and hour"}</span>
            <div className="flex items-center gap-2 text-xs text-[#64716C]"><span>0</span><div className="flex gap-0.5">{ramp.map((color, i) => <span key={i} className={clsx("h-2.5 w-4 rounded-[2px]", color)} />)}</div><span>{maxArrivals} arrivals</span></div>
          </div>
        </Card>

        <Card className="flex min-h-0 flex-col px-5 pb-3 pt-4">
          <div className="flex h-7 shrink-0 items-center justify-between"><div className="flex items-center gap-2"><h2 className="text-base font-medium">Patient flow</h2><Information label="Completed arrival cohort. Stage counts exclude patients who left before that stage. Disposition includes all arrivals, including LWBS." /></div><Badge>{scope}</Badge></div>
          <div className="mb-2 mt-1 flex items-center justify-between text-xs text-[#64716C]"><span>Completed encounters</span><span>Scale 0–{maxFlow.toLocaleString()} patients</span></div>
          {metrics.arrivals === 0 ? <div className="flex flex-1 items-center justify-center text-sm text-[#53615A]">No arrivals in this cohort</div> : <div className="flex min-h-0 flex-1 flex-col justify-between">
            <div>
              <FlowBar name="Arrived" count={metrics.arrivals} maximum={maxFlow} segments={[{ label: "Walk-in", value: metrics.walkIn, color: "#6D8E83" }, { label: "Ambulance", value: metrics.ambulance, color: "#B5C7BE" }]} />
              <WaitConnector value={metrics.triageWait} label="arrival to triage · median" />
              <FlowBar name="Triaged" count={metrics.triaged} maximum={maxFlow} segments={[{ label: "ESI 1–2", value: metrics.urgentTriaged, color: "#5A8275" }, { label: "ESI 3–5", value: metrics.triaged - metrics.urgentTriaged, color: "#AAC4B7" }]} />
              <WaitConnector value={metrics.providerWait} label="triage to provider · median" />
              <FlowBar name="Seen by provider" count={metrics.seen} maximum={maxFlow} segments={[{ label: "ESI 1–2", value: metrics.urgentSeen, color: "#006A6A" }, { label: "ESI 3–5", value: metrics.seen - metrics.urgentSeen, color: "#77B8AA" }]} />
              <WaitConnector value={metrics.treatment} label="provider to disposition · median" />
              <FlowBar name="Disposition" count={metrics.arrivals} maximum={maxFlow} segments={outcomes.map(outcome => ({ label: outcome, value: metrics.disposition[outcome], color: outcomeColors[outcome] }))} />
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2">{outcomes.map(outcome => <div key={outcome}><div className="flex items-center gap-1 text-xs text-[#53615A]"><span className={clsx("h-1.5 w-1.5 rounded-sm", outcomeClasses[outcome])} />{outcome}</div><div className="mt-0.5 text-base font-medium"><AnimatedNumber value={metrics.disposition[outcome]} /></div></div>)}</div>
          </div>}
        </Card>
      </div>

      <Card className="flex h-[198px] shrink-0 flex-col px-4 pb-3 pt-3">
        <div className="flex h-7 shrink-0 items-center justify-between">
          <div className="flex items-center gap-2"><h2 className="text-base font-medium">Door-to-provider, last 30 days</h2><Information label="Daily median for patients seen by a provider, 06 Sep–05 Oct. A selected heat-strip hour applies that arrival hour to all 30 days; the selected day is marked." /></div>
          <div className="flex items-center gap-4 text-xs"><span className="text-[#64716C]">{validDays ? `${belowTarget} / ${validDays} days at target` : "No provider encounters"}</span><Badge>{selection ? `${hourLabel(selection.hour)} arrival cohort` : "All arrival hours"}</Badge><Tooltip label="Reset hour selection"><button onClick={reset} aria-label="Reset hour selection" className={clsx("rounded-full p-1 text-[#53615A] hover:bg-[#E1E9E5]", focus)}><RotateCcw size={14} /></button></Tooltip></div>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-[#64716C]"><span>Median, min</span><span>06 Sep–05 Oct 2026</span></div>
        <div className="mt-1 h-[118px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 9, right: 130, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke={chartTheme.grid} strokeWidth={.6} />
              <XAxis dataKey="day" type="number" domain={[0, 29]} ticks={[0, 5, 10, 15, 20, 25, 29]} tickFormatter={day => dateLabel(day)} tick={chartTheme.tick} axisLine={false} tickLine={false} height={24} />
              <YAxis domain={[0, 60]} ticks={[0, 15, 30, 45, 60]} tick={chartTheme.tick} axisLine={false} tickLine={false} width={37} />
              <ReferenceLine y={30} stroke={chartTheme.secondary} strokeDasharray="4 4" strokeOpacity={.7} label={{ value: "Target  30 min", position: "right", fontSize: 11, fill: chartTheme.secondary }} />
              <Line type="monotone" dataKey="median" stroke={chartTheme.primary} strokeWidth={2.3} dot={false} activeDot={{ r: 4, stroke: "#F8FAF9", strokeWidth: 2 }} isAnimationActive={!reduced} animationDuration={380} />
              {selectedDay !== null && <ReferenceLine x={selectedDay} stroke="#8FAAA0" strokeDasharray="2 3" />}
              {selectedDay !== null && trend[selectedDay].median !== null && <ReferenceDot x={selectedDay} y={trend[selectedDay].median ?? undefined} r={4} fill={chartTheme.primary} stroke="#F8FAF9" strokeWidth={2} />}
              {trend[29].median !== null && <ReferenceDot x={29} y={trend[29].median} r={3} fill={chartTheme.primary} stroke="#EEF3F1" label={{ value: `Median  ${trend[29].median} min`, position: "right", fontSize: 11, fill: chartTheme.primary, dy: trend[29].median >= 30 ? -14 : 14, offset: 8 }} />}
              <ChartTooltip cursor={{ stroke: "#BEC9C5", strokeDasharray: "2 3" }} content={({ active, payload }) => active && payload?.length ? <div className="rounded-lg bg-[#29332F] px-3 py-2 text-xs text-white shadow-md"><div>{dateLabel(Number(payload[0].payload.day))}</div><div className="mt-1 font-medium">{payload[0].value} min · {payload[0].payload.count} arrivals</div></div> : null} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <footer className="flex h-3.5 shrink-0 items-center justify-between text-xs text-[#6D7975]"><span className="flex items-center gap-1.5"><ShieldCheck size={12} />Operational use · de-identified encounters</span><span>{selection ? `${days[selection.weekday]} ${dateLabel(weekStart + selection.weekday)} · ${hourLabel(selection.hour)} arrivals` : "Completed week · all arrival hours"}<span className="mx-2">·</span>All times local</span></footer>
    </main>
    {dialog && <Dialog title={dialog} onClose={close}>
      {dialog === "Display settings" ? <label className="flex cursor-pointer items-center justify-between rounded-xl bg-[#EEF3F1] p-4"><span>Show heat-strip counts</span><input aria-label="Show heat-strip counts" type="checkbox" checked={showNumbers} onChange={event => setShowNumbers(event.target.checked)} className="h-4 w-4 accent-[#006A6A]" /></label>
      : dialog === "Emergency definitions" ? <Table headers={["Metric", "Definition"]} rows={[["Door-to-provider", "Median arrival-to-provider minutes; excludes LWBS."], ["Length of stay", "Median arrival-to-departure minutes for discharged encounters."], ["LWBS", "Departed without provider assessment / total arrivals."], ["Boarding hours", "Total admit-decision-to-ED-departure hours for admitted patients."], ["Stage medians", "Calculated separately. Medians are not additive."], ["Heat strip", "Completed weekly arrival cohorts. Click again to clear."], ["Stacked bars", "Arrived: walk-in / ambulance. Triaged and Seen: ESI 1–2 / ESI 3–5. Disposition: final outcome."]]} />
      : dialog === "Account" ? <Card className="p-5"><p className="text-lg font-medium">Anna Mercer</p><p className="mt-1 text-[#53615A]">Regional capacity manager</p><div className="mt-5 flex items-center gap-2 text-xs text-[#006A6A]"><ShieldCheck size={15} />Halden Health · Operations access</div></Card>
      : dialog === "Notifications" ? <div className="space-y-3"><Card className="p-4"><p className="font-medium">Weekly ED cohort closed</p><p className="mt-1 text-sm text-[#53615A]">28 Sep–04 Oct · all three facilities reconciled.</p><p className="mt-2 text-xs text-[#64716C]">07:35</p></Card><Card className="p-4"><p className="font-medium">Throughput refresh complete</p><p className="mt-1 text-sm text-[#53615A]">Daily medians available through 05 Oct.</p><p className="mt-2 text-xs text-[#64716C]">07:42</p></Card></div>
      : <><div className="mb-4"><Badge>{scope}</Badge></div><Table headers={["Emergency department", "Arrivals", "Median, min", "Admitted"]} rows={edFacilities.map(name => { const m = edMetrics(cohort.filter(patient => patient.facility === name)); return [name, m.arrivals, m.door, m.disposition.Admitted]; })} /><div className="mt-5 flex justify-end"><Button tone="filled" onClick={close}>Return to throughput</Button></div></>}
    </Dialog>}
  </HaldenShell>;
}
