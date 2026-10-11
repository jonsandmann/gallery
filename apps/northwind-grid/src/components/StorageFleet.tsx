import { useEffect, useMemo, useRef, useState } from "react";
import { animate, motion, useReducedMotion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Battery, CalendarDays, Check, ChevronRight, CircleHelp, Clock3, Download, ListFilter, MousePointer2, Pin, Radio, Search, X } from "lucide-react";
import { Bar, CartesianGrid, Cell, ComposedChart, Line, ReferenceDot, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "recharts";
import clsx from "clsx";
import { Badge, Button, Card, Kpi, Modal, Select, Table, Tooltip, chartTheme as theme, focusClass, labelClass, number, useTween } from "./ui/NorthwindKit";
import { NorthwindHeader, NorthwindRail } from "./ui/NorthwindChrome";
import { NOW, dispatch } from "./ui/dispatch";
import { SOC_MAX, SOC_MIN, fleetTotals, storageCurve, storageSites, storageState, type StorageMode, type StoragePoint, type StorageState } from "./ui/storage";

function useCurveTween(target: StoragePoint[]) {
  const [curve, setCurve] = useState(target);
  const current = useRef(target);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) { current.current = target; setCurve(target); return; }
    const from = current.current;
    const animation = animate(0, 1, {
      duration: 0.36, ease: [0.2, 0.8, 0.2, 1],
      onUpdate: progress => {
        const next = target.map((point, i) => {
          const mix = (key: "power" | "price" | "soc" | "planned" | "fleet") => from[i][key] + (point[key] - from[i][key]) * progress;
          return { hour: point.hour, power: mix("power"), price: mix("price"), soc: mix("soc"), planned: mix("planned"), fleet: mix("fleet") };
        });
        current.current = next;
        setCurve(next);
      },
    });
    return () => animation.stop();
  }, [target, reduced]);
  return curve;
}

function ModeBadge({ mode }: { mode: StorageMode }) {
  return <Badge><span className={clsx("font-body", mode === "Discharging" ? "text-[#C9B1A9]" : mode === "Charging" ? "text-[#A7BACB]" : "text-[#7E8895]")}>{mode}</span></Badge>;
}

function SocGauge({ value, selected }: { value: number; selected: boolean }) {
  return <span className="flex items-center justify-end gap-2">
    <svg viewBox="0 0 64 8" width="64" height="8" className="min-w-0 flex-1" aria-hidden="true">
      <rect width="64" height="8" rx="1" fill="#262B33" />
      <rect width={64 * value / 100} height="8" rx="1" fill={selected ? theme.amber : "#707D88"} />
      {[16, 32, 48].map(x => <line key={x} x1={x} x2={x} y1="0" y2="8" stroke={theme.panel} strokeWidth="2" />)}
    </svg>
    <span className={clsx("w-11 shrink-0 font-mono text-xs", selected ? "text-[#E6E8EB]" : "text-[#A8B0BA]")}>{number(value, 1)}<span className="text-[#697380]">%</span></span>
  </span>;
}

function DispatchChart({ curve, site }: { curve: StoragePoint[]; site: StorageState }) {
  const bars = curve.filter(point => Number.isInteger(point.hour) && point.hour < 24).map(point => ({ ...point, hour: point.hour + 0.5 }));
  return <div className="h-[190px] w-full" role="img" aria-label={`${site.name} hourly dispatch in MW and nodal energy price in dollars per MWh`}>
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={bars} accessibilityLayer={false} margin={{ top: 10, right: 10, left: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={theme.border} />
        <XAxis dataKey="hour" type="number" domain={[0, 24]} ticks={[0, 4, 8, 12, 16, 20, 24]} tickFormatter={hour => `${String(hour).padStart(2, "0")}:00`} tick={theme.axis} tickLine={false} axisLine={false} height={26} />
        <YAxis yAxisId="power" domain={[-450, 450]} ticks={[-400, -200, 0, 200, 400]} width={43} tick={theme.axis} tickLine={false} axisLine={false} />
        <YAxis yAxisId="price" orientation="right" domain={[0, 120]} ticks={[0, 40, 80, 120]} width={39} tick={theme.axis} tickLine={false} axisLine={false} />
        <ReferenceLine yAxisId="power" y={0} stroke="#697380" strokeWidth={1} />
        <ReferenceLine yAxisId="price" y={site.chargeBelow} stroke="#71808D" strokeDasharray="3 5" strokeOpacity={0.6} />
        <ReferenceLine yAxisId="price" y={site.dischargeAbove} stroke="#9AA3AE" strokeDasharray="3 5" strokeOpacity={0.55} />
        <Bar yAxisId="power" dataKey="power" maxBarSize={18} isAnimationActive={false} activeBar={false}>
          {bars.map(point => <Cell key={point.hour} fill={Math.floor(point.hour) === 17 ? theme.amber : point.power >= 0 ? theme.fuels.storage : "#75889A"} fillOpacity={Math.floor(point.hour) === 17 ? 1 : point.hour > NOW ? 0.36 : 0.72} />)}
        </Bar>
        <Line yAxisId="price" type="monotone" dataKey="price" stroke="#CDD2D9" strokeWidth={1.6} dot={false} activeDot={false} isAnimationActive={false} />
        <ReferenceLine yAxisId="power" x={NOW} stroke={theme.amber} strokeDasharray="2 4" strokeOpacity={0.6} />
      </ComposedChart>
    </ResponsiveContainer>
  </div>;
}

function SocChart({ curve, site, showPlan }: { curve: StoragePoint[]; site: StorageState; showPlan: boolean }) {
  const points = curve.map(point => ({ ...point, actual: point.hour <= NOW ? point.soc : null, projected: point.hour >= NOW ? point.soc : null }));
  const current = curve.find(point => point.hour === NOW)!;
  return <div className="h-[144px] w-full" role="img" aria-label={`${site.name} state of charge, planned trajectory, and weighted fleet state of charge`}>
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={points} accessibilityLayer={false} margin={{ top: 10, right: 49, left: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={theme.border} />
        <XAxis type="number" dataKey="hour" domain={[0, 24]} ticks={[0, 4, 8, 12, 16, 20, 24]} tickFormatter={hour => `${String(hour).padStart(2, "0")}:00`} tick={theme.axis} tickLine={false} axisLine={false} height={26} />
        <YAxis domain={[0, 100]} ticks={[0, 50, 100]} width={43} tick={theme.axis} tickLine={false} axisLine={false} />
        <ReferenceLine y={SOC_MIN} stroke="#697380" strokeDasharray="2 4" strokeOpacity={0.6} />
        <ReferenceLine y={SOC_MAX} stroke="#697380" strokeDasharray="2 4" strokeOpacity={0.6} />
        <Line type="linear" dataKey="fleet" stroke="#65717C" strokeWidth={1} dot={false} activeDot={false} isAnimationActive={false} />
        {showPlan && <Line type="linear" dataKey="planned" stroke="#C0C6CE" strokeDasharray="4 4" strokeWidth={1.2} dot={false} activeDot={false} isAnimationActive={false} />}
        <Line type="linear" dataKey="actual" stroke={theme.amber} strokeWidth={2} dot={false} activeDot={false} isAnimationActive={false} />
        <Line type="linear" dataKey="projected" stroke={theme.amber} strokeOpacity={0.4} strokeWidth={1.5} dot={false} activeDot={false} isAnimationActive={false} />
        <ReferenceLine x={NOW} stroke={theme.amber} strokeDasharray="2 4" strokeOpacity={0.5} />
        <ReferenceDot x={NOW} y={current.soc} r={3.5} fill={theme.amber} stroke={theme.panel} strokeWidth={1.5} />
      </ComposedChart>
    </ResponsiveContainer>
  </div>;
}

export default function StorageFleet() {
  const reduced = useReducedMotion();
  const [region, setRegion] = useState("system");
  const [date, setDate] = useState("2026-10-14");
  const [mode, setMode] = useState("All modes");
  const [search, setSearch] = useState("");
  const [pinned, setPinned] = useState("BESS-01");
  const [preview, setPreview] = useState<string | null>(null);
  const [showPlan, setShowPlan] = useState(true);
  const [modal, setModal] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const allSites = useMemo(() => storageSites.map(site => storageState(site, date !== "2026-10-14")), [date]);
  const regionalSites = useMemo(() => allSites.filter(site => region === "system" || site.area === region), [allSites, region]);
  const sites = useMemo(() => regionalSites.filter(site => (mode === "All modes" || site.mode === mode) && `${site.name} ${site.id}`.toLowerCase().includes(search.trim().toLowerCase())), [regionalSites, mode, search]);
  const selected = sites.find(site => site.id === preview) ?? sites.find(site => site.id === pinned) ?? sites[0] ?? allSites[0];
  const isPinned = selected.id === pinned;
  const totals = useMemo(() => fleetTotals(regionalSites), [regionalSites]);
  const visibleTotals = useMemo(() => fleetTotals(sites), [sites]);
  const targetCurve = useMemo(() => storageCurve(selected, regionalSites), [selected, regionalSites]);
  const curve = useCurveTween(targetCurve);
  const current = curve.find(point => point.hour === NOW)!;
  const revenue = useTween(selected.revenue, 0.36);
  const fleetCapacity = useTween(totals.mw, 0.36);
  const stored = useTween(totals.stored, 0.36);
  const output = useTween(totals.power, 0.36);
  const fleetRevenue = useTween(totals.revenue, 0.36);
  const chargeTrigger = useTween(selected.chargeBelow, 0.36);
  const dischargeTrigger = useTween(selected.dischargeAbove, 0.36);
  const enter = (delay: number) => ({ initial: { opacity: 0, y: reduced ? 0 : 5 }, animate: { opacity: 1, y: 0 }, transition: { duration: reduced ? 0 : 0.36, delay: reduced ? 0 : delay, ease: [0.22, 0.8, 0.2, 1] as [number, number, number, number] } });
  const pinSite = (id: string) => { setPinned(id); setPreview(null); };
  const clearFilters = () => { setMode("All modes"); setSearch(""); setRegion("system"); setPreview(null); };
  const csv = `Site,MW,MWh,SOC %,Mode,Net dispatch MW,Revenue USD\n${sites.map(site => `${site.name},${site.mw},${site.mwh},${site.soc.toFixed(2)},${site.mode},${site.power},${site.revenue}`).join("\n")}`;
  const rows = sites.map(site => ({
    key: site.id, onPreview: () => setPreview(site.id), onClick: () => pinSite(site.id), onEscape: () => setPreview(null),
    ariaLabel: `${site.name}, ${site.mw} MW, ${site.mwh} MWh, ${site.mode}, ${site.id === pinned ? "pinned" : "press Enter to pin"}`,
    className: clsx("h-[38px] cursor-pointer border-l-2 transition-[opacity,background-color,border-color] duration-150 motion-reduce:transition-none", site.id === selected.id ? "border-l-[#F5A524] bg-[#1A1E24] opacity-100" : "border-l-transparent opacity-70"),
    cells: [
      <span className="flex items-center gap-1.5"><span className={clsx("font-body font-medium", site.id === selected.id ? "text-[#E6E8EB]" : "text-[#C7CDD5]")}>{site.name}</span>{site.id === pinned && <Pin size={11} className="shrink-0 text-[#F5A524]" />}</span>,
      <span className="whitespace-nowrap font-mono text-[#9AA3AE]">{site.mw}<span className="px-0.5 text-[#5C6672]">/</span>{number(site.mwh)}</span>,
      <SocGauge value={site.soc} selected={site.id === selected.id} />,
      <ModeBadge mode={site.mode} />,
      <span className="font-mono text-[#C7CDD5]">${number(site.revenue)}</span>,
    ],
  }));

  return <div className="relative flex h-full min-h-[960px] max-h-[960px] w-full flex-col overflow-hidden bg-[#0D0F12] font-body text-xs text-[#E6E8EB] antialiased tabular-nums" data-storage-fleet="true">
    <NorthwindHeader region={region} onRegion={value => { setRegion(value); setPreview(null); }} reserve={dispatch(NOW).margin} onProfile={() => setModal("Operator profile")} />
    <div className="flex min-h-0 flex-1">
      <NorthwindRail active="Storage fleet" onNavigate={name => name === "Storage fleet" ? setModal(null) : setModal(name)} />
      <main className="grid min-h-0 min-w-0 flex-1 grid-rows-[60px_38px_82px_minmax(0,1fr)] gap-2 p-4">
        <motion.div {...enter(0)} className="flex items-center justify-between">
          <div><div className="mb-1.5 flex items-center gap-2 text-[#697380]"><span>Operations</span><ChevronRight size={11} /><span className="text-[#9AA3AE]">Storage</span></div><h1 className="font-display text-2xl font-semibold">Storage Fleet</h1></div>
          <div className="flex items-center gap-3"><span className="mr-1 flex items-center gap-1.5 text-[#7E8895]"><Check size={12} />Updated <span className="font-mono">17:35:04</span></span><Button onClick={() => setModal("Fleet snapshot")}><Download size={13} />Snapshot</Button></div>
        </motion.div>
        <motion.div {...enter(0.03)} className="flex items-center justify-between border-b border-[#262B33] pb-1.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 items-center gap-2 rounded border border-[#303640] bg-[#1A1E24] pl-2.5"><CalendarDays size={13} className="text-[#7E8895]" /><select aria-label="Storage operating date" value={date} onChange={event => setDate(event.target.value)} className={clsx("h-full rounded bg-transparent pr-2 font-mono text-xs text-[#C7CDD5] [&>option]:bg-[#1A1E24]", focusClass)}><option value="2026-10-14">14 Oct 2026</option><option value="2026-10-13">13 Oct 2026</option></select></div>
            <span className="flex h-8 items-center gap-2 rounded border border-[#262B33] px-3 text-[#9AA3AE]"><Radio size={12} className="text-[#697380]" />Real-time market</span>
            <span className="mx-1 h-4 w-px bg-[#262B33]" />
            <button aria-pressed={showPlan} onClick={() => setShowPlan(!showPlan)} className={clsx("flex h-8 items-center gap-2 rounded px-2 text-[#9AA3AE] hover:bg-[#1A1E24]", focusClass)}><span className={clsx("flex size-3.5 items-center justify-center rounded-sm border", showPlan ? "border-[#87919D] bg-[#87919D] text-[#14171C]" : "border-[#5C6672]")}>{showPlan && <Check size={11} strokeWidth={3} />}</span>Planned trajectory</button>
          </div>
          <div className="flex items-center gap-3"><span className="font-mono text-[#5C6672]">Hourly schedule · CDT</span><Badge><span className="font-mono">{regionalSites.length}/{regionalSites.length}</span> sites online</Badge></div>
        </motion.div>
        <motion.div {...enter(0.06)} className="grid grid-cols-4 gap-2">
          <Kpi title="Fleet capacity" value={fleetCapacity} unit="MW" detail={<><span className="font-mono text-[#C7CDD5]">{number(totals.mwh)} MWh</span><br /><span className="mt-1 inline-block text-[#697380]"><span className="font-mono">{regionalSites.length}</span> battery sites</span></>} />
          <Kpi title="Stored energy" value={stored} unit="MWh" detail={<><span className="font-mono text-[#C7CDD5]">{number(totals.soc, 1)}%</span><br /><span className="mt-1 inline-block text-[#697380]">weighted SoC</span></>} />
          <Kpi title="Net dispatch" value={output} unit="MW" detail={<><span className="font-mono text-[#C7CDD5]">{totals.discharge} discharging</span><br /><span className="mt-1 inline-block text-[#697380]"><span className="font-mono">{totals.charge}</span> charging · <span className="font-mono">{totals.idle}</span> idle</span></>} />
          <Kpi title="Revenue today" value={fleetRevenue} unit="USD" detail={<><span className="text-[#9AA3AE]">Energy +</span><br /><span className="mt-1 inline-block text-[#697380]">ancillary services</span></>} />
        </motion.div>
        <motion.div {...enter(0.1)} className="grid min-h-0 grid-cols-[600px_minmax(0,1fr)] gap-2">
          <Card title="Fleet" action={<div className="flex items-center gap-3"><span className="font-mono text-[#697380]">{sites.length} sites</span><Tooltip content="Hover to preview. Click or press Enter to pin."><button aria-label="Fleet selection help" onClick={() => setModal("Keyboard shortcuts")} className={clsx("rounded text-[#697380] hover:text-[#C7CDD5]", focusClass)}><CircleHelp size={13} /></button></Tooltip></div>} bodyClassName="flex flex-col">
            <div className="flex h-10 shrink-0 items-center justify-between gap-3 px-3 pb-2">
              <div className="relative flex-1"><Search size={12} className="pointer-events-none absolute left-2.5 top-2 text-[#697380]" /><input aria-label="Find a battery site" placeholder="Find a site" value={search} onChange={event => { setSearch(event.target.value); setPreview(null); }} className={clsx("h-7 w-full rounded border border-[#262B33] bg-[#0D0F12] pl-8 pr-7 text-xs placeholder:text-[#5C6672] hover:border-[#46505D]", focusClass)} />{search && <button aria-label="Clear search" onClick={() => setSearch("")} className={clsx("absolute right-2 top-2 rounded text-[#9AA3AE]", focusClass)}><X size={12} /></button>}</div>
              <div className="flex items-center gap-2"><ListFilter size={12} className="text-[#697380]" /><Select aria-label="Battery operating mode" value={mode} onChange={event => { setMode(event.target.value); setPreview(null); }} className="h-7 w-[126px] bg-[#14171C]"><option>All modes</option><option>Discharging</option><option>Charging</option><option>Idle</option></Select></div>
            </div>
            <div className="min-h-0 flex-1" onMouseLeave={() => setPreview(null)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setPreview(null); }} data-fleet-rows="true">
              <Table columns={["Site", "MW / MWh", "SoC", "Mode", "Today, USD"]} rows={rows} className="table-fixed [&_th]:h-8 [&_th]:px-2 [&_th]:py-0 [&_td]:h-[38px] [&_td]:px-2 [&_td]:py-0 [&_th:nth-child(1)]:w-[24%] [&_th:nth-child(2)]:w-[16%] [&_th:nth-child(3)]:w-[22%] [&_th:nth-child(4)]:w-[20%] [&_th:nth-child(5)]:w-[18%] [&_td:first-child]:pl-3 [&_th:first-child]:pl-3 [&_td:last-child]:pr-3 [&_th:last-child]:pr-3" />
              {sites.length === 0 && <div className="flex h-48 flex-col items-center justify-center gap-3 text-[#9AA3AE]"><Search size={20} className="text-[#5C6672]" /><span>No sites match these filters.</span><Button onClick={clearFilters}>Clear filters</Button></div>}
            </div>
            <div className="mx-3 flex h-8 shrink-0 items-center justify-between border-t border-[#262B33] text-[#9AA3AE]"><span>{sites.length === regionalSites.length ? "Fleet total" : "Filtered total"} <span className="ml-2 font-mono text-[#C7CDD5]">{number(visibleTotals.mw)} MW</span></span><span className="font-mono text-[#C7CDD5]">${number(visibleTotals.revenue)}</span></div>
            <div className="flex h-8 shrink-0 items-center justify-between rounded-b border-t border-[#262B33] bg-[#111419] px-3 text-[#697380]"><span className="flex items-center gap-1.5"><MousePointer2 size={11} />Hover to preview · click to pin</span><span className="flex items-center gap-1.5"><Pin size={10} /><span className="text-[#9AA3AE]">{allSites.find(site => site.id === pinned)?.name}</span> pinned</span></div>
          </Card>

          {sites.length > 0 ? <div className="grid min-h-0 min-w-0 grid-rows-[84px_300px_minmax(0,1fr)] gap-2" data-selected-storage={selected.id}>
            <Card bodyClassName="grid grid-cols-[1.5fr_0.85fr_1fr_1.15fr] items-center gap-3 px-4">
              <div className="min-w-0"><div className="mb-1 flex items-center gap-2"><h2 className="truncate font-display text-xl font-semibold">{selected.name}</h2><Tooltip content={isPinned ? "Pinned site. Hover another row to preview." : "Previewing. Click the fleet row to pin."}><span className={clsx("flex items-center gap-1 text-xs", isPinned ? "text-[#F5A524]" : "text-[#9AA3AE]")}>{isPinned ? <Pin size={11} /> : <MousePointer2 size={11} />}{isPinned ? "Pinned" : "Preview"}</span></Tooltip></div><div className="font-mono text-xs text-[#7E8895]">{selected.mw} MW <span className="text-[#454D58]">/</span> {number(selected.mwh)} MWh</div></div>
              <div><span className={labelClass}>SoC</span><div className="mt-1 font-mono text-xl">{number(current.soc, 1)}<span className="ml-0.5 text-xs text-[#7E8895]">%</span></div></div>
              <div><span className={labelClass}>Dispatch</span><div className="mt-1 whitespace-nowrap font-mono text-xl">{current.power > 0 ? "+" : ""}{number(current.power)}<span className="ml-1 text-xs text-[#7E8895]">MW</span></div></div>
              <div className="text-right"><span className={labelClass}>Revenue today</span><div className="mt-1 font-mono text-xl">${number(revenue)}</div></div>
            </Card>
            <Card title="Dispatch schedule" action={<div className="flex items-center gap-3 text-xs"><span className="flex items-center gap-1.5 text-[#9AA3AE]"><span className="h-px w-4 bg-[#CDD2D9]" />Nodal price</span><span className="font-mono text-[#F5A524]">17:35</span></div>}>
              <div className="flex h-[18px] justify-between px-4 text-xs text-[#697380]"><span>Dispatch, MW</span><span>Price, $/MWh</span></div>
              <DispatchChart curve={curve} site={{ ...selected, chargeBelow: chargeTrigger, dischargeAbove: dischargeTrigger }} />
              <div className="mx-4 flex h-[46px] items-center justify-between border-t border-[#262B33]">
                <div className="flex items-center gap-2 text-[#9AA3AE]"><ArrowDownLeft size={13} className="text-[#91A4B5]" /><span>Charge <span className="ml-1 font-mono text-[#C7CDD5]">≤ ${number(chargeTrigger)}</span></span></div>
                <div className="flex items-center gap-2 text-[#9AA3AE]"><ArrowUpRight size={13} className="text-[#C9A18F]" /><span>Discharge <span className="ml-1 font-mono text-[#C7CDD5]">≥ ${number(dischargeTrigger)}</span></span></div>
                <Tooltip content={selected.policy === "Reserve recovery" ? "Operator override: recover reserve energy after the 16:00 test." : selected.policy}><button onClick={() => setModal("Dispatch policy")} className={clsx("flex items-center gap-1 rounded text-[#7E8895] hover:text-[#E6E8EB]", focusClass)}>{selected.policy}<ChevronRight size={11} /></button></Tooltip>
              </div>
            </Card>
            <Card title="Fleet state of charge, %" action={<span className="font-mono text-[#7E8895]">{selected.id}</span>}>
              <div className="flex h-[18px] items-center gap-4 px-4 text-xs text-[#9AA3AE]"><span className="flex items-center gap-1.5 text-[#F5A524]"><span className="h-0.5 w-3 bg-[#F5A524]" />{selected.name}</span>{showPlan && <span className="flex items-center gap-1.5"><span className="w-3 border-t border-dashed border-[#C0C6CE]" />Site plan</span>}<span className="flex items-center gap-1.5 text-[#697380]"><span className="h-px w-3 bg-[#65717C]" />Fleet weighted</span></div>
              <SocChart curve={curve} site={selected} showPlan={showPlan} />
              <div className="mx-4 flex h-9 items-center justify-between border-t border-[#262B33] text-xs text-[#697380]"><span>Operating band <span className="ml-1 font-mono text-[#9AA3AE]">{SOC_MIN}–{SOC_MAX}%</span></span><span>Plan at <span className="font-mono">17:35</span> <span className="ml-1 font-mono text-[#C7CDD5]">{number(current.planned, 1)}%</span></span><span>Fleet <span className="ml-1 font-mono text-[#C7CDD5]">{number(current.fleet, 1)}%</span></span></div>
            </Card>
          </div> : <Card bodyClassName="flex flex-col items-center justify-center gap-3 text-[#697380]"><Battery size={28} /><span>No site selected</span><Button onClick={clearFilters}>Clear filters</Button></Card>}
        </motion.div>
      </main>
    </div>
    <footer className="flex h-6 shrink-0 items-center justify-between border-t border-[#262B33] bg-[#111419] px-4 text-xs text-[#697380]">
      <div className="flex items-center gap-5"><span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-[#8B969F]" />EMS connected</span><span>Storage telemetry <span className="ml-1 font-mono text-[#9AA3AE]">12/12</span></span><span className="font-mono">BESS-20261014-1735</span></div>
      <div className="flex items-center gap-4"><span className="font-mono">{date === "2026-10-14" ? "14 Oct 2026" : "13 Oct 2026"}</span><span className="flex items-center gap-1.5 text-[#F5A524]"><Clock3 size={11} />{date === "2026-10-14" ? "Current interval" : "Historical snapshot"}<span className="font-mono">17:35</span></span></div>
    </footer>

    {modal && <Modal title={modal} onClose={() => setModal(null)}>
      {modal === "Fleet snapshot" ? <div className="p-4"><div className="mb-3 flex justify-between text-[#9AA3AE]"><span>{sites.length} sites · energy + ancillary services</span><span className="font-mono">{date} · 17:35 CDT</span></div><div className="max-h-[530px] overflow-auto"><Table columns={["Site", "MW / MWh", "SoC", "Today, USD"]} rows={sites.map(site => ({ key: site.id, cells: [site.name, `${site.mw} / ${number(site.mwh)}`, `${number(site.soc, 1)}%`, `$${number(site.revenue)}`] }))} /></div><div className="mt-4 flex justify-end"><a download={`northwind-storage-${date}.csv`} href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`} className={clsx("flex items-center gap-2 rounded border border-[#303640] bg-[#1A1E24] px-3 py-2 text-[#C7CDD5] hover:bg-[#262B33]", focusClass)}><Download size={12} />Export CSV</a></div></div>
      : modal === "Dispatch policy" ? <div className="space-y-3 p-4"><div className="flex justify-between"><span className="text-sm">{selected.name}</span><ModeBadge mode={selected.mode} /></div><Table columns={["Policy parameter", "Value"]} rows={[{ key: "strategy", cells: ["Strategy", selected.policy] }, { key: "charge", cells: ["Charge trigger, $/MWh", `≤ ${number(selected.chargeBelow, 2)}`] }, { key: "discharge", cells: ["Discharge trigger, $/MWh", `≥ ${number(selected.dischargeAbove, 2)}`] }, { key: "band", cells: ["SoC operating band", "12.0% - 92.0%"] }, { key: "eta", cells: ["Charge / discharge efficiency", "95.0% / 95.0%"] }, { key: "net", cells: ["Net energy revenue, USD", number(selected.energyRevenue, 2)] }, { key: "as", cells: ["Ancillary-service revenue, USD", number(selected.serviceRevenue, 2)] }]} /><p className="max-w-measure text-[#7E8895]">Price triggers are subject to stored energy, inverter limits and reserve instructions. Positive dispatch is export to the grid.</p></div>
      : modal === "Keyboard shortcuts" ? <div className="p-4"><Table columns={["Fleet selection", "Control"]} rows={[{ key: "hover", cells: ["Preview a site in both charts", "Hover a row"] }, { key: "pin", cells: ["Pin the selected site", "Click / Enter / Space"] }, { key: "focus", cells: ["Preview with keyboard", "Tab to a site row"] }, { key: "restore", cells: ["Restore pinned selection", "Leave rows / Escape"] }, { key: "close", cells: ["Close dialog", "Escape"] }]} /></div>
      : modal === "Display settings" ? <div className="space-y-4 p-5"><div className="flex items-center justify-between"><span>Planned state of charge</span><Button active={showPlan} onClick={() => setShowPlan(!showPlan)}>{showPlan ? "Shown" : "Hidden"}</Button></div><div className="flex justify-between border-t border-[#262B33] pt-4"><span>Time zone</span><span className="font-mono text-[#9AA3AE]">America/Chicago · CDT</span></div><div className="flex justify-between border-t border-[#262B33] pt-4"><span>Motion</span><span className="text-[#9AA3AE]">{reduced ? "Reduced" : "System preference"}</span></div></div>
      : modal === "Notifications" ? <div className="p-4"><div className="mb-3 flex justify-between"><Badge action>{acknowledged ? "Acknowledged" : "1 unread"}</Badge><Button disabled={acknowledged} onClick={() => setAcknowledged(true)}>Acknowledge</Button></div><Table columns={["Event", "Time, CDT"]} rows={[{ key: "recover", cells: ["Millstone · reserve recovery started", "17:00"] }, { key: "dispatch", cells: ["Evening battery schedule accepted", "16:55"] }, { key: "export", cells: ["Cinder Run · 95 MW export limit confirmed", "15:40"] }]} /></div>
      : modal === "Operator profile" ? <div className="p-5"><div className="mb-4 flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded bg-[#2C323A] text-base">EL</span><div><div className="text-base font-medium">Ellis Lane</div><div className="mt-1 text-[#9AA3AE]">System operations · Desk <span className="font-mono">04</span></div></div></div><Table columns={["Session", "Value"]} rows={[{ key: "role", cells: ["Role", "Shift supervisor"] }, { key: "shift", cells: ["Shift", "14:00 - 22:00 CDT"] }, { key: "access", cells: ["Access", "Operations · read-only"] }]} /></div>
      : <div className="p-5"><Table columns={["Operating snapshot", "Value"]} rows={modal === "System operations" ? [{ key: "load", cells: ["System load, MW", number(dispatch(NOW).load)] }, { key: "generation", cells: ["Generation, MW", number(dispatch(NOW).generation)] }, { key: "reserve", cells: ["Available reserve, MW", number(dispatch(NOW).reserve)] }] : modal === "Markets" ? [{ key: "price", cells: ["System clearing, $/MWh", number(dispatch(NOW).price, 2)] }, { key: "node", cells: [`${selected.name} hourly nodal price, $/MWh`, number(selected.price, 2)] }, { key: "revenue", cells: ["Fleet revenue today, USD", number(totals.revenue)] }] : modal === "Transmission" ? [{ key: "west", cells: ["Westridge - Alder · binding", "345 kV"] }, { key: "black", cells: ["Blackwater interface · binding", "North > South"] }, { key: "juniper", cells: ["Juniper - Mercer · binding", "230 kV"] }] : [{ key: "sites", cells: ["Online battery sites", `${regionalSites.length} / ${regionalSites.length}`] }, { key: "capacity", cells: ["Nameplate capacity, MW", number(totals.mw)] }, { key: "stored", cells: ["Stored energy, MWh", number(totals.stored)] }, { key: "band", cells: ["SoC operating band", "12% - 92%"] }]} /></div>}
    </Modal>}
  </div>;
}
