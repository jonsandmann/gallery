import { useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Activity, ArrowDownLeft, ArrowUpRight, CalendarDays, Check, ChevronDown, ChevronRight, CircleHelp, Clock3, Download, GripVertical, Maximize2, Network, Radio, RotateCcw, ShieldCheck, Sun, TrendingUp } from "lucide-react";
import { Area, CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceDot, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "recharts";
import clsx from "clsx";
import { Badge, Button, Card, Kpi, Modal, Table, Tabs, Tooltip, chartTheme as theme, focusClass, number, useTween } from "./ui/NorthwindKit";
import { NorthwindHeader, NorthwindRail } from "./ui/NorthwindChrome";
import { storageSites } from "./ui/storage";
import { NOW, clock, daySeries, dispatch, fuelNames, fuelOrder, shadowPrices, type Dispatch, type Fuel } from "./ui/dispatch";

const constraints = [
  { name: "Westridge - Alder", line: "345 kV", limit: 1840, contingency: "Alder - Bracken 345 kV", area: "Western corridor" },
  { name: "Blackwater interface", line: "North > South", limit: 3260, contingency: "Blackwater transformer T2", area: "Central interface" },
  { name: "Juniper - Mercer", line: "230 kV", limit: 1125, contingency: "Juniper - Ashford 230 kV", area: "Eastern corridor" },
];

function Swatch({ fuel }: { fuel: Fuel }) {
  return <svg width="7" height="7" className="shrink-0" aria-hidden="true"><rect width="7" height="7" rx="1" fill={theme.fuels[fuel]} /></svg>;
}

function CursorLabel({ viewBox, text }: { viewBox?: { x?: number }; text: string }) {
  const x = viewBox?.x ?? 0;
  return <g className="pointer-events-none">
    <rect x={x - 29} y={7} width={58} height={23} rx={3} fill={theme.amber} />
    <text x={x} y={22} textAnchor="middle" fill={theme.ground} className="font-mono text-xs font-medium">{text}</text>
    <path d={`M${x - 4},30 L${x},35 L${x + 4},30Z`} fill={theme.amber} />
  </g>;
}

function GenerationChart({ series, state, selectedTime, setTime, forecast, regionScale, actualUntil }: { series: ReturnType<typeof daySeries>; state: Dispatch; selectedTime: number; setTime: (value: number) => void; forecast: boolean; regionScale: number; actualUntil: number }) {
  const dragging = useRef(false);
  const plot = useRef<HTMLDivElement>(null);
  function locate(clientX: number) {
    if (!plot.current) return;
    const bounds = plot.current.getBoundingClientRect();
    const time = (clientX - bounds.left - 57) / (bounds.width - 91) * 24;
    setTime(Math.max(0, Math.min(24, Math.round(time * 12) / 12)));
  }
  return <div ref={plot} role="slider" aria-label="Dispatch time. Drag or use arrow keys to change the dispatch interval." aria-valuemin={0} aria-valuemax={1440} aria-valuenow={Math.round(state.time * 60)} aria-valuetext={`${clock(state.time)} CDT`} tabIndex={0}
    className={clsx("relative h-[237px] w-full touch-none select-none rounded cursor-ew-resize", focusClass)}
    onPointerDown={event => { dragging.current = true; event.currentTarget.setPointerCapture(event.pointerId); locate(event.clientX); }}
    onPointerMove={event => { if (dragging.current) locate(event.clientX); }}
    onPointerUp={event => { dragging.current = false; event.currentTarget.releasePointerCapture(event.pointerId); }}
    onPointerCancel={() => { dragging.current = false; }}
    onKeyDown={event => {
      if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        setTime(event.key === "Home" ? 0 : event.key === "End" ? 24 : Math.max(0, Math.min(24, Math.round(selectedTime * 12) / 12 + (event.key === "ArrowLeft" ? -1 : 1) * (event.shiftKey ? 1 : 1 / 12))));
      }
    }}>
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={series} accessibilityLayer={false} margin={{ top: 39, right: 34, left: 7, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={theme.border} />
        <XAxis type="number" dataKey="time" domain={[0, 24]} ticks={[0, 3, 6, 9, 12, 15, 18, 21, 24]} tickFormatter={value => `${String(value).padStart(2, "0")}:00`} axisLine={false} tickLine={false} tick={theme.axis} height={26} />
        <YAxis domain={[0, 80000 * regionScale]} ticks={[0, 20000, 40000, 60000, 80000].map(value => value * regionScale)} tickFormatter={value => `${number(value / 1000)}k`} axisLine={false} tickLine={false} tick={theme.axis} width={50} />
        {fuelOrder.map(fuel => <Area key={fuel} type="monotone" dataKey={fuel} stackId="generation" stroke={theme.fuels[fuel]} strokeWidth={0.65} fill={theme.fuels[fuel]} fillOpacity={0.78} activeDot={false} isAnimationActive={false} />)}
        {forecast && <Line type="monotone" dataKey="actualForecast" stroke="#A5ACB6" strokeDasharray="5 4" strokeWidth={1.3} dot={false} activeDot={false} isAnimationActive={false} />}
        {forecast && <Line type="monotone" dataKey="projectedForecast" stroke="#A5ACB6" strokeOpacity={0.6} strokeDasharray="5 4" strokeWidth={1.3} dot={false} activeDot={false} isAnimationActive={false} />}
        <Line type="monotone" dataKey="actualLoad" stroke="#E6E8EB" strokeWidth={2} dot={false} activeDot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="projectedLoad" stroke="#E6E8EB" strokeOpacity={0.45} strokeWidth={2} dot={false} activeDot={false} isAnimationActive={false} />
        <ReferenceArea x1={actualUntil} x2={24} y1={0} y2={80000 * regionScale} fill={theme.panel} fillOpacity={0.55} stroke="none" />
        {actualUntil < 24 && <ReferenceLine x={actualUntil} stroke="#707986" strokeDasharray="2 4" strokeOpacity={0.65} />}
        <ReferenceLine x={state.time} stroke={theme.amber} strokeWidth={1.5} label={<CursorLabel text={clock(state.time)} />} />
        <ReferenceDot x={state.time} y={state.load} r={4} stroke={theme.panel} strokeWidth={2} fill={theme.amber} />
      </ComposedChart>
    </ResponsiveContainer>
    <span className="pointer-events-none absolute left-14 top-2.5 text-xs text-[#5C6672]">ACTUAL</span>
    {actualUntil < 24 && <span className="pointer-events-none absolute right-7 top-2.5 text-xs text-[#5C6672]">PROJECTED</span>}
  </div>;
}

function SupplyStack({ state, scale, expanded = false }: { state: Dispatch; scale: number; expanded?: boolean }) {
  return <div className={expanded ? "h-[310px] w-full" : "h-[170px] w-full"}>
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart accessibilityLayer={false} margin={{ top: 12, right: 74, left: 9, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={theme.border} />
        <XAxis type="number" dataKey="capacity" domain={[0, 95000 * scale]} ticks={[0, 20000, 40000, 60000, 80000].map(value => value * scale)} tickFormatter={value => `${number(value / 1000)}k`} tick={theme.axis} tickLine={false} axisLine={false} height={26} allowDataOverflow />
        <YAxis type="number" domain={[-10, 160]} ticks={[0, 40, 80, 120, 160]} tickFormatter={value => `${value}`} tick={theme.axis} tickLine={false} axisLine={false} width={48} allowDataOverflow />
        {state.offers.filter(offer => offer.capacity > 0).map(offer => <ReferenceArea key={offer.id} x1={offer.start} x2={offer.end} y1={-10} y2={offer.cost} fill={theme.fuels[offer.fuel]} fillOpacity={0.13} stroke={theme.panel} strokeWidth={1} />)}
        {state.offers.map(offer => <ReferenceArea key={`dispatch-${offer.id}`} x1={offer.start} x2={offer.start + offer.dispatched} y1={-10} y2={offer.cost} fill={theme.fuels[offer.fuel]} fillOpacity={offer.dispatched > 0 ? 0.85 : 0} stroke={theme.panel} strokeWidth={1} />)}
        <ReferenceLine y={state.price} stroke={theme.amber} strokeDasharray="4 3" strokeOpacity={0.85} label={({ viewBox }) => {
          const x = (viewBox?.x ?? 0) + (viewBox?.width ?? 0) + 8;
          const y = viewBox?.y ?? 0;
          return <g><rect x={x - 3} y={y - 11} width={59} height={22} rx={3} fill="#382C19" /><text x={x + 25} y={y + 4} fill={theme.amber} textAnchor="middle" className="font-mono text-xs">{number(state.price, 2)}</text></g>;
        }} />
        <ReferenceLine x={state.demand} stroke={theme.amber} strokeWidth={1.5} label={({ viewBox }) => <text x={(viewBox?.x ?? 0) - 7} y={14} textAnchor="end" className="font-mono text-xs" fill={theme.amber}>{number(state.demand)} MW</text>} />
        <ReferenceDot x={state.demand} y={state.price} r={4} fill={theme.amber} stroke={theme.panel} strokeWidth={2} />
      </ComposedChart>
    </ResponsiveContainer>
  </div>;
}

function Sparkline({ series, state }: { series: ReturnType<typeof daySeries>; state: Dispatch }) {
  return <div className="h-[69px] w-full">
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={series} accessibilityLayer={false} margin={{ top: 8, right: 3, left: 3, bottom: 1 }}>
        <XAxis type="number" dataKey="time" domain={[0, 24]} hide />
        <YAxis domain={[0, 100]} hide />
        <ReferenceLine y={50} stroke={theme.border} strokeDasharray="3 4" />
        <Line type="monotone" dataKey="price" dot={false} activeDot={false} stroke="#89919D" strokeWidth={1.5} isAnimationActive={false} />
        <ReferenceLine x={state.time} stroke={theme.amber} strokeOpacity={0.35} />
        <ReferenceDot x={state.time} y={state.price} r={3.5} fill={theme.amber} stroke={theme.panel} strokeWidth={1.5} />
      </ComposedChart>
    </ResponsiveContainer>
  </div>;
}

export default function SystemLoad() {
  const reduced = useReducedMotion();
  const [targetTime, setTargetTime] = useState(NOW);
  const time = useTween(targetTime, 0.22);
  const [region, setRegion] = useState("system");
  const [day, setDay] = useState("2026-10-14");
  const [forecast, setForecast] = useState(true);
  const [tab, setTab] = useState("Overview");
  const [modal, setModal] = useState<string | null>(null);
  const [constraint, setConstraint] = useState<number | null>(null);
  const [notice, setNotice] = useState(false);
  const [timeMenu, setTimeMenu] = useState(false);
  const scaleTarget = region === "east" ? 0.57 : region === "west" ? 0.43 : 1;
  const scale = useTween(scaleTarget, 0.35);
  const dayTarget = day === "2026-10-14" ? 1 : 0.976;
  const dayScale = useTween(dayTarget, 0.35);
  const solved = useMemo(() => dispatch(time, scale, dayScale), [time, scale, dayScale]);
  const animatedPrice = useTween(solved.price, 0.24);
  const state = { ...solved, price: animatedPrice, shadow: shadowPrices(animatedPrice) };
  const actualUntil = day === "2026-10-14" ? NOW : 24;
  const series = useMemo(() => daySeries(scale, dayScale, actualUntil), [scale, dayScale, actualUntil]);
  const atCurrent = Math.abs(targetTime - NOW) < 0.001 && day === "2026-10-14";
  const availableByFuel = fuelOrder.map(fuel => ({ fuel, offered: state.offers.filter(offer => offer.fuel === fuel).reduce((sum, offer) => sum + offer.capacity, 0) }));
  const priceDA = state.price * 0.88 - 2.23;
  const selectedDate = day === "2026-10-14" ? "14 Oct 2026" : "13 Oct 2026";
  const enter = (delay: number) => ({ initial: { opacity: 0, y: reduced ? 0 : 5 }, animate: { opacity: 1, y: 0 }, transition: { duration: reduced ? 0 : 0.36, delay: reduced ? 0 : delay, ease: [0.22, 0.8, 0.2, 1] as [number, number, number, number] } });
  const csv = `Time,Fuel,Generation MW,Offered MW\n${availableByFuel.map(({ fuel, offered }) => `${clock(targetTime)},${fuelNames[fuel]},${state.fuel[fuel]},${offered}`).join("\n")}\n${clock(targetTime)},Net imports,${state.netImports},\n${clock(targetTime)},System load,${state.load},`;

  return <div className="relative flex h-full min-h-[960px] max-h-[960px] w-full flex-col overflow-hidden bg-[#0D0F12] font-body text-xs text-[#E6E8EB] antialiased tabular-nums">
    <NorthwindHeader region={region} onRegion={setRegion} reserve={state.margin} onProfile={() => setModal("Operator profile")} />

    <div className="flex min-h-0 flex-1">
      <NorthwindRail active="System operations" onNavigate={name => { if (name === "System operations") { setModal(null); setTab("Overview"); } else setModal(name); }} />

      <main className="grid min-h-0 min-w-0 flex-1 grid-rows-[60px_38px_82px_minmax(0,1fr)] gap-2 p-4">
        <motion.div {...enter(0)} className="flex items-center justify-between">
          <div><div className="mb-1.5 flex items-center gap-2 text-xs text-[#697380]"><span>Operations</span><ChevronRight size={11} /><span className="text-[#9AA3AE]">System overview</span></div><h1 className="font-display text-2xl font-semibold">System Load &amp; Generation</h1></div>
          <div className="flex items-center gap-3"><span className="mr-1 flex items-center gap-1.5 text-[#7E8895]"><Check size={12} />Updated <span className="font-mono">17:35:04</span></span><Button onClick={() => setModal("Dispatch snapshot")}><Download size={13} />Snapshot</Button></div>
        </motion.div>

        <motion.div {...enter(0.03)} className="flex items-center justify-between border-b border-[#262B33] pb-1.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 items-center gap-2 rounded border border-[#303640] bg-[#1A1E24] pl-2.5"><CalendarDays size={13} className="text-[#7E8895]" /><select aria-label="Operating date" value={day} onChange={event => setDay(event.target.value)} className={clsx("h-full rounded bg-transparent pr-2 font-mono text-xs text-[#C7CDD5] [&>option]:bg-[#1A1E24]", focusClass)}><option value="2026-10-14">14 Oct 2026</option><option value="2026-10-13">13 Oct 2026</option></select></div>
            <span className="flex h-8 items-center gap-2 rounded border border-[#262B33] px-3 text-[#9AA3AE]"><Radio size={12} className="text-[#697380]" />Real-time market</span>
            <span className="mx-1 h-4 w-px bg-[#262B33]" />
            <button aria-pressed={forecast} onClick={() => setForecast(!forecast)} className={clsx("flex h-8 items-center gap-2 rounded px-2 text-[#9AA3AE] hover:bg-[#1A1E24]", focusClass)}><span className={clsx("flex size-3.5 items-center justify-center rounded-sm border", forecast ? "border-[#87919D] bg-[#87919D] text-[#14171C]" : "border-[#5C6672]")}>{forecast && <Check size={11} strokeWidth={3} />}</span>Day-ahead forecast</button>
          </div>
          <div className="flex items-center gap-3"><span className="font-mono text-xs text-[#5C6672]">5-min intervals · CDT</span><Tabs options={["Overview", "Dispatch detail"]} value={tab} onChange={setTab} /></div>
        </motion.div>

        <motion.div {...enter(0.06)} className="grid grid-cols-4 gap-2">
          <Kpi title="System load" value={state.load} unit="MW" detail={<><span className="font-mono text-[#C7CDD5]">{number(67428 * scale * dayScale)}</span><br /><span className="mt-1 inline-block text-[#697380]">day peak · <span className="font-mono">18:00</span></span></>} />
          <Kpi title="Generation" value={state.generation} unit="MW" detail={<><span className="font-mono text-[#C7CDD5]">+{number(state.netImports)}</span><br /><span className="mt-1 inline-block text-[#697380]">net imports</span></>} />
          <Kpi title="Available reserve" value={state.reserve} unit="MW" detail={<><span className="font-mono text-[#C7CDD5]">{number(state.margin, 1)}%</span><br /><span className="mt-1 inline-block text-[#697380]">floor <span className="font-mono">7.0%</span></span></>} />
          <Kpi title="Load vs day-ahead" value={state.load - state.forecast} unit="MW" detail={<><span className="font-mono text-[#C7CDD5]">{number((state.load / state.forecast - 1) * 100, 2)}%</span><br /><span className="mt-1 inline-block text-[#697380]">forecast {number(state.forecast)}</span></>} />
        </motion.div>

        <motion.div {...enter(0.1)} className="grid min-h-0 grid-cols-[minmax(0,1fr)_292px] gap-2">
          <div className="grid min-h-0 min-w-0 grid-rows-[366px_minmax(0,1fr)] gap-2">
            <Card title="Generation by fuel, MW" action={<div className="flex items-center gap-4 text-xs text-[#9AA3AE]"><span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-[#E6E8EB]" />Load</span>{forecast && <span className="flex items-center gap-1.5"><span className="w-4 border-t border-dashed border-[#A5ACB6]" />Day-ahead</span>}<Tooltip content="Drag the amber cursor or use the arrow keys"><button className={clsx("rounded text-[#697380] hover:text-[#E6E8EB]", focusClass)} aria-label="Time cursor help" onClick={() => setModal("Keyboard shortcuts")}><CircleHelp size={13} /></button></Tooltip></div>}>
              <GenerationChart series={series} state={state} selectedTime={targetTime} setTime={setTargetTime} forecast={forecast} regionScale={scale} actualUntil={actualUntil} />
              <div className="mx-4 flex h-6 items-center justify-between text-xs text-[#697380]"><span className="flex items-center gap-1.5"><GripVertical size={12} /><span>Drag to inspect</span></span><div className="flex items-center gap-2"><span>Selected interval</span><span className="font-mono text-[#F5A524]">{clock(time)} CDT</span><span className="text-[#454D58]">/</span><span>{time <= actualUntil ? "Actual" : "Projected"}</span></div></div>
              <div className="mx-4 grid h-[59px] grid-cols-7 items-center border-t border-[#262B33]">
                {fuelOrder.map(fuel => <Tooltip key={fuel} content={`${fuelNames[fuel]} · ${number(state.fuel[fuel] / state.generation * 100, 1)}% of generation`}><div tabIndex={0} className={clsx("w-full rounded px-1 py-1", focusClass)}><div className="mb-1 flex items-center gap-1.5 text-[#9AA3AE]"><Swatch fuel={fuel} />{fuelNames[fuel]}</div><div className="font-mono text-sm">{number(state.fuel[fuel])}<span className="ml-1 text-xs text-[#5C6672]">MW</span></div></div></Tooltip>)}
              </div>
            </Card>

            <Card title={tab === "Overview" ? "Supply stack" : "Dispatch by fuel"} action={<div className="flex items-center gap-3"><span className="font-mono text-xs text-[#697380]">{clock(time)} CDT</span><button aria-label="Expand supply stack" onClick={() => setModal("Supply stack")} className={clsx("rounded text-[#697380] hover:text-[#E6E8EB]", focusClass)}><Maximize2 size={13} /></button></div>}>
              {tab === "Overview" ? <>
                <div className="flex items-center justify-between px-4 text-xs text-[#7E8895]"><span>Offer, $/MWh</span><span className="flex items-center gap-1.5"><span className="h-2.5 border-l border-[#F5A524]" />Demand <span className="font-mono text-[#C7CDD5]">{number(state.demand)} MW</span></span></div>
                <SupplyStack state={state} scale={scale} />
                <div className="mx-4 flex h-9 items-center justify-between border-t border-[#262B33] text-xs text-[#7E8895]"><span className="flex items-center gap-1.5"><Swatch fuel={state.marginal} />Marginal fuel <span className="text-[#C7CDD5]">{fuelNames[state.marginal]}</span><span className="ml-1 font-mono text-[#5C6672]">{state.marginalId}</span></span><span>Offered capacity <span className="ml-1 font-mono text-[#C7CDD5]">{number(state.total)} MW</span></span><span className="text-[#5C6672]">Cumulative capacity, MW</span></div>
              </> : <div className="h-[220px] overflow-auto px-1"><Table columns={["Fuel", "Dispatched, MW", "Offered, MW", "Utilization"]} rows={availableByFuel.map(({ fuel, offered }) => ({ key: fuel, cells: [<span className="flex items-center gap-2"><Swatch fuel={fuel} />{fuelNames[fuel]}</span>, number(state.fuel[fuel]), number(offered), offered ? `${number(state.fuel[fuel] / offered * 100, 1)}%` : "--"] }))} /></div>}
            </Card>
          </div>

          <aside className="grid min-h-0 grid-rows-[205px_108px_108px_minmax(0,1fr)] gap-2">
            <Card title="Real-time price" action={<span className="font-mono text-xs text-[#697380]">$/MWh</span>} bodyClassName="px-4">
              <div className="flex items-baseline gap-1"><span className="font-mono text-4xl text-[#F5A524]">{number(state.price, 2)}</span><span className="ml-auto flex items-center gap-1 text-xs text-[#9AA3AE]"><ArrowUpRight size={12} /><span className="font-mono">+{number(state.price - priceDA, 2)}</span></span></div>
              <div className="mt-1 flex items-center justify-between text-xs text-[#697380]"><span>System clearing price</span><span>vs day-ahead</span></div>
              <Sparkline series={series} state={state} />
              <div className="flex items-center justify-between font-mono text-xs text-[#5C6672]"><span>00:00</span><span className="text-[#9AA3AE]">{clock(time)}</span><span>24:00</span></div>
            </Card>
            <Card title="Net interchange" action={<ArrowDownLeft size={14} className="text-[#7E8895]" />} bodyClassName="px-4">
              <div className="-mt-1 flex items-baseline gap-2"><span className="font-mono text-2xl">+{number(state.netImports)}</span><span className="font-mono text-xs text-[#697380]">MW</span><span className="ml-auto text-xs text-[#9AA3AE]">Import</span></div>
              <div className="mt-2 flex justify-between text-xs text-[#697380]"><span>East tie <span className="ml-1 font-mono text-[#9AA3AE]">+{number(state.eastTie)}</span></span><span>West tie <span className="ml-1 font-mono text-[#9AA3AE]">{number(state.westTie)}</span></span></div>
            </Card>
            <Card title="Renewable share" action={<Sun size={14} className="text-[#7E8895]" />} bodyClassName="px-4">
              <div className="-mt-1 flex items-baseline gap-1"><span className="font-mono text-2xl">{number(state.renewableShare, 1)}</span><span className="font-mono text-sm text-[#9AA3AE]">%</span><span className="ml-auto font-mono text-xs text-[#9AA3AE]">{number(state.renewable)} MW</span></div>
              <div className="mt-2 flex items-center justify-between text-xs text-[#697380]"><span>Wind + solar + hydro</span><span>of generation</span></div>
            </Card>
            <Card title="Binding constraints" action={<Badge action><span className="font-mono">3</span></Badge>} bodyClassName="flex flex-col">
              <div className="flex justify-between px-4 pb-1 text-xs text-[#5C6672]"><span>Monitored element</span><span>Shadow, $/MWh</span></div>
              <div className="flex flex-1 flex-col justify-evenly">{constraints.map((item, i) => <button key={item.name} onClick={() => setConstraint(i)} className={clsx("group mx-2 flex items-center justify-between border-t border-[#262B33] px-2 py-1 text-left hover:bg-[#1A1E24]", focusClass)}><span><span className="block text-xs leading-4 text-[#C7CDD5] group-hover:text-[#F5A524]">{item.name}</span><span className="block font-mono text-xs leading-4 text-[#697380]">{item.line}</span></span><span className="flex items-center gap-2 font-mono text-sm text-[#C7CDD5]">{number(state.shadow[i], 2)}<ChevronRight size={11} className="text-[#5C6672]" /></span></button>)}</div>
            </Card>
          </aside>
        </motion.div>
      </main>
    </div>

    <footer className="flex h-6 shrink-0 items-center justify-between border-t border-[#262B33] bg-[#111419] px-4 text-xs text-[#697380]">
      <div className="flex items-center gap-5"><span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-[#8B969F]" />EMS connected</span><span>State estimator <span className="ml-1 text-[#9AA3AE]">Converged</span></span><span className="font-mono">SE-20261014-1735</span></div>
      <div className="relative flex items-center gap-4"><span className="font-mono">{selectedDate}</span><button onClick={() => setTimeMenu(!timeMenu)} className={clsx("flex items-center gap-1.5 rounded text-[#F5A524]", focusClass)}><Clock3 size={11} /><span>{atCurrent ? "Current interval" : targetTime > actualUntil ? "Projected interval" : "Historical interval"}</span><span className="font-mono">{clock(time)}</span><ChevronDown size={11} /></button>{!atCurrent && <button onClick={() => { setTargetTime(NOW); setDay("2026-10-14"); }} className={clsx("flex items-center gap-1 rounded text-[#9AA3AE] hover:text-[#F5A524]", focusClass)}><RotateCcw size={10} />Reset</button>}
        {timeMenu && <div className="absolute bottom-8 right-0 z-40 w-48 rounded border border-[#3A424D] bg-[#1A1E24] p-1 shadow-lg">{[{ name: "Morning ramp", time: 7.5 }, { name: "Solar peak", time: 13 }, { name: "Evening peak", time: NOW }].map(item => <button key={item.name} onClick={() => { setTargetTime(item.time); setTimeMenu(false); }} className={clsx("flex w-full justify-between rounded px-3 py-2 text-[#C7CDD5] hover:bg-[#262B33]", focusClass)}>{item.name}<span className="font-mono text-[#9AA3AE]">{clock(item.time)}</span></button>)}</div>}
      </div>
    </footer>

    {constraint !== null && <Modal title={constraints[constraint].name} onClose={() => setConstraint(null)}><div className="space-y-4 p-5"><div className="flex justify-between"><Badge action>Binding</Badge><span className="font-mono text-[#9AA3AE]">{clock(time)} CDT</span></div><Table columns={["Constraint parameter", "Value"]} rows={[
      { key: "area", cells: ["Operating corridor", constraints[constraint].area] },
      { key: "line", cells: ["Monitored voltage / direction", constraints[constraint].line] },
      { key: "contingency", cells: ["Limiting contingency", constraints[constraint].contingency] },
      { key: "flow", cells: ["Post-contingency flow", `${number(constraints[constraint].limit * scale)} MW`] },
      { key: "limit", cells: ["Emergency rating", `${number(constraints[constraint].limit * scale)} MW`] },
      { key: "shadow", cells: ["Shadow price", `$${number(state.shadow[constraint], 2)}/MWh`] },
    ]} /><p className="max-w-measure text-xs text-[#7E8895]">N-1 security-constrained dispatch. Shadow price is the marginal cost of one additional MW of transfer capability.</p></div></Modal>}

    {modal && <Modal title={modal} onClose={() => setModal(null)}>
      {modal === "Dispatch snapshot" || modal === "Generation assets" ? <div className="p-4"><div className="mb-3 flex justify-between text-[#9AA3AE]"><span>{region === "system" ? "Northwind system" : region === "east" ? "East operating area" : "West operating area"}</span><span className="font-mono">{selectedDate} · {clock(time)} CDT</span></div><Table columns={["Fuel", "Dispatched, MW", "Offered, MW"]} rows={availableByFuel.map(({ fuel, offered }) => ({ key: fuel, cells: [<span className="flex items-center gap-2"><Swatch fuel={fuel} />{fuelNames[fuel]}</span>, number(state.fuel[fuel]), number(offered)] }))} /><div className="mt-4 flex justify-between border-t border-[#262B33] pt-4"><span className="text-[#9AA3AE]">Total generation <span className="ml-2 font-mono text-[#E6E8EB]">{number(state.generation)} MW</span></span><a download={`northwind-dispatch-${day}-${clock(targetTime).replace(":", "")}.csv`} href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`} className={clsx("flex items-center gap-2 rounded border border-[#303640] bg-[#1A1E24] px-3 py-1.5 text-[#C7CDD5] hover:bg-[#262B33]", focusClass)}><Download size={12} />Export CSV</a></div></div>
      : modal === "Storage fleet" ? <div className="p-4"><Table columns={["Battery site", "Nameplate, MW", "Energy, MWh"]} rows={storageSites.map(site => ({ key: site.id, cells: [site.name, number(site.mw), number(site.mwh)] }))} /></div>
      : modal === "Supply stack" ? <div className="p-4"><div className="mb-3 flex justify-between text-[#9AA3AE]"><span>Offer, $/MWh</span><span className="font-mono">{clock(time)} CDT · {number(state.demand)} MW</span></div><SupplyStack state={state} scale={scale} expanded /><div className="mt-3 flex justify-between border-t border-[#262B33] pt-3"><span>Marginal fuel: {fuelNames[state.marginal]}</span><span className="font-mono text-[#F5A524]">${number(state.price, 2)}/MWh</span></div></div>
      : modal === "Keyboard shortcuts" ? <div className="p-5"><Table columns={["Time cursor", "Control"]} rows={[{ key: "drag", cells: ["Select interval", "Click or drag generation chart"] }, { key: "arrows", cells: ["Previous / next 5 minutes", "Left / Right arrow"] }, { key: "shift", cells: ["Previous / next hour", "Shift + Left / Right"] }, { key: "edges", cells: ["Start / end of day", "Home / End"] }, { key: "close", cells: ["Close dialog", "Escape"] }]} /></div>
      : modal === "Display settings" ? <div className="space-y-4 p-5"><div className="flex items-center justify-between"><span>Day-ahead forecast overlay</span><Button active={forecast} onClick={() => setForecast(!forecast)}>{forecast ? "Shown" : "Hidden"}</Button></div><div className="flex justify-between border-t border-[#262B33] pt-4"><span>Time zone</span><span className="font-mono text-[#9AA3AE]">America/Chicago · CDT</span></div><div className="flex justify-between border-t border-[#262B33] pt-4"><span>Reduced motion</span><span className="text-[#9AA3AE]">{reduced ? "Enabled" : "System preference"}</span></div></div>
      : modal === "Operator profile" ? <div className="space-y-4 p-5"><div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded bg-[#2C323A] text-base">EL</span><div><div className="text-base font-medium">Ellis Lane</div><div className="mt-1 text-[#9AA3AE]">System operations · Desk 04</div></div></div><Table columns={["Session", "Value"]} rows={[{ key: "role", cells: ["Role", "Shift supervisor"] }, { key: "shift", cells: ["Shift", "14:00 - 22:00 CDT"] }, { key: "access", cells: ["Access", "Operations · read-only"] }]} /></div>
      : modal === "Notifications" ? <div className="p-5"><div className="mb-4 flex items-center justify-between"><Badge action>{notice ? "0 unread" : "2 unread"}</Badge><Button onClick={() => setNotice(true)} disabled={notice}>{notice ? <Check size={12} /> : null}{notice ? "Acknowledged" : "Acknowledge all"}</Button></div><Table columns={["Event", "Time, CDT"]} rows={[{ key: "c", cells: ["Westridge - Alder constraint binding", "17:25"] }, { key: "s", cells: ["Evening dispatch schedule published", "17:00"] }, { key: "m", cells: ["State estimator converged", "16:55"] }]} /></div>
      : modal === "Transmission" ? <div className="p-5"><Table columns={["Binding element", "Flow, MW", "Shadow, $/MWh"]} rows={constraints.map((item, i) => ({ key: item.name, onClick: () => { setModal(null); setConstraint(i); }, cells: [item.name, number(item.limit * scale), number(state.shadow[i], 2)] }))} /></div>
      : modal === "Markets" ? <div className="p-5"><Table columns={["Price component", "$/MWh"]} rows={[{ key: "rt", cells: ["Real-time system clearing", number(state.price, 2)] }, { key: "da", cells: ["Day-ahead system clearing", number(priceDA, 2)] }, { key: "spread", cells: ["Real-time / day-ahead spread", number(state.price - priceDA, 2)] }]} /></div>
      : modal === "Reliability" ? <div className="p-5"><Table columns={["System check", "Current", "Threshold"]} rows={[{ key: "freq", cells: ["Frequency, Hz", "60.002", "59.950 - 60.050"] }, { key: "margin", cells: ["Reserve margin", `${number(state.margin, 1)}%`, "7.0% minimum"] }, { key: "reserve", cells: ["Available reserve, MW", number(state.reserve), number(state.load * 0.07)] }, { key: "estimator", cells: ["State estimator", "Converged", "Converged"] }]} /></div>
      : <div className="grid grid-cols-2 gap-2 p-5">{[{ name: "System operations", icon: <Activity size={18} />, detail: "Load, generation & dispatch" }, { name: "Transmission", icon: <Network size={18} />, detail: "Flows & binding constraints" }, { name: "Markets", icon: <TrendingUp size={18} />, detail: "Real-time & day-ahead prices" }, { name: "Reliability", icon: <ShieldCheck size={18} />, detail: "Reserves & system conditions" }].map(item => <button key={item.name} onClick={() => item.name === "System operations" ? setModal(null) : setModal(item.name)} className={clsx("rounded border border-[#262B33] bg-[#1A1E24] p-4 text-left hover:border-[#5C6672]", focusClass)}><span className="flex items-center gap-2 text-sm">{item.icon}{item.name}</span><span className="mt-2 block text-xs text-[#9AA3AE]">{item.detail}</span></button>)}</div>}
    </Modal>}
  </div>;
}
