import { Fragment, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, ChevronDown, ChevronRight, Download, FileText, X } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from "recharts";
import clsx from "clsx";
import { Badge, Button, Entrance, NumberValue, Select, Table, Tile, Tooltip, chartTheme, ease, focus } from "./ui/meridian";
import { MeridianHeader, MeridianRail } from "./ui/MeridianChrome";
import { entities } from "./ui/cash-data";
import { counterparties, currencies, currencyMetrics, fxPairs, fxSummary, gap, heatColor, maturityLadder, policyStatus, type FxPair } from "./ui/fx-data";

const columns = "grid grid-cols-[232px_repeat(8,minmax(0,1fr))]";
const f = (value: number) => value.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const spring = { type: "spring" as const, stiffness: 260, damping: 33, mass: 1 };

function MaturityLadder({ pair, onClose }: { pair: FxPair; onClose: () => void }) {
  const reduced = useReducedMotion();
  const data = maturityLadder(pair);
  const entity = entities.find(item => item.id === pair.entityId)!;
  return <div className="h-[216px] border-b border-[#E0E0E0] border-l-2 border-l-[#0F62FE] bg-[#F4F4F4] px-4 py-3" data-maturity-pair={pair.id}>
    <div className="mb-2 flex h-6 items-center justify-between">
      <h3 className="text-sm font-semibold">12-month hedge maturity<span className="ml-2 font-normal text-[#525252]">USD m</span></h3>
      <div className="flex items-center gap-4 text-xs text-[#525252]"><span className="flex items-center gap-1.5"><span className="h-2 w-2 bg-[#8D8D8D]" />Forwards</span><span className="flex items-center gap-1.5"><span className="h-2 w-2 bg-[#C6C6C6]" />Options</span><span className="flex items-center gap-1.5 text-[#0F62FE]"><span className="h-2 w-2 bg-[#0F62FE]" />Unhedged gap</span><button aria-label="Close maturity ladder" onClick={onClose} className={clsx("flex h-6 w-6 items-center justify-center hover:bg-[#E0E0E0]", focus)}><X size={15} /></button></div>
    </div>
    <div className="grid grid-cols-[192px_minmax(0,1fr)] gap-4">
      <div className="border-r border-[#E0E0E0] pr-4">
        <div className="flex items-center gap-2 text-xs"><span className="font-mono">{entity.id} / {pair.currency}</span><Badge status={policyStatus(pair.ratio * 100)}>{Math.round(pair.ratio * 100)}% hedged</Badge></div>
        <div className="mt-3 text-xs text-[#525252]">Unhedged gap</div>
        <div className="mt-1 text-3xl text-[#0F62FE]"><NumberValue value={gap(pair)} /></div>
        <div className="mt-3 flex justify-between text-xs text-[#525252]"><span>Exposure</span><span className="font-mono"><NumberValue value={pair.exposure} signed /></span></div>
        <div className="mt-1 flex justify-between text-xs text-[#525252]"><span>Hedge notional</span><span className="font-mono"><NumberValue value={Math.abs(pair.exposure) * pair.ratio} /></span></div>
      </div>
      <div className="h-[152px] min-w-0" aria-label={`12 monthly hedge maturities for ${entity.name}, ${pair.currency}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 6, right: 4, left: -12, bottom: 0 }} barCategoryGap="32%">
            <CartesianGrid vertical={false} stroke="#E0E0E0" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#525252", fontSize: 12, fontFamily: chartTheme.fontFamily }} height={25} interval={0} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#8D8D8D", fontSize: 12, fontFamily: chartTheme.fontFamily }} width={40} tickCount={3} />
            <Bar dataKey="forwards" name="Forwards" stackId="hedges" fill="#8D8D8D" isAnimationActive={!reduced} animationDuration={600} />
            <Bar dataKey="options" name="Options" stackId="hedges" fill="#C6C6C6" isAnimationActive={!reduced} animationDuration={600} />
            <Bar dataKey="gap" name="Unhedged gap" stackId="hedges" fill="#0F62FE" isAnimationActive={!reduced} animationDuration={600} />
            <ChartTooltip cursor={{ fill: "#E0E0E0", opacity: 0.3 }} content={({ active, payload, label }) => active && payload?.length ? <div className="border border-[#E0E0E0] bg-white p-3 text-xs"><div className="mb-2 font-semibold">{label} · USD m</div>{payload.map(item => <div key={item.name} className="flex justify-between gap-6"><span>{item.name}</span><span className="font-mono">{f(Number(item.value))}</span></div>)}</div> : null} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>;
}

export default function FXExposure() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scope, setScope] = useState("All entities");
  const [date, setDate] = useState("02 Oct 2026");
  const [collapsed, setCollapsed] = useState(false);
  const [dialog, setDialog] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [exported, setExported] = useState(false);
  const matrixScroll = useRef<HTMLDivElement>(null);
  const lastCell = useRef<HTMLButtonElement | null>(null);
  const currentSelection = useRef<string | null>(null);
  currentSelection.current = selectedId;
  const reduced = useReducedMotion();
  const id = useId();
  const visibleEntities = entities.filter(entity => scope === "All entities" || entity.region === scope);
  const pairs = useMemo(() => fxPairs.filter(pair => {
    const entity = entities.find(item => item.id === pair.entityId)!;
    return scope === "All entities" || entity.region === scope;
  }).map(pair => ({ ...pair, exposure: pair.exposure * (date === "02 Oct 2026" ? 1 : 0.982) })), [scope, date]);
  const metrics = currencyMetrics(pairs);
  const summary = fxSummary(pairs);
  const selected = pairs.find(pair => pair.id === selectedId);
  const ranked = [...pairs].sort((a, b) => gap(b) - gap(a));
  const largest = ranked[0];
  const max = Math.max(...pairs.map(pair => Math.abs(pair.exposure)));
  const outsidePolicy = metrics.filter(item => item.ratio !== null && (item.ratio < 60 || item.ratio > 80));
  const atLimit = counterparties.filter(item => item.used >= item.limit);

  function closeSelection() {
    setSelectedId(null);
    lastCell.current?.focus({ preventScroll: true });
  }
  function choosePair(pair: FxPair, button?: HTMLButtonElement) {
    if (button) lastCell.current = button;
    if (selectedId === pair.id) closeSelection();
    else setSelectedId(pair.id);
  }
  function revealLadder() {
    const scroll = matrixScroll.current;
    const ladder = scroll?.querySelector<HTMLElement>(`[data-maturity-pair="${currentSelection.current}"]`);
    if (!scroll || !ladder) return;
    const parent = scroll.getBoundingClientRect();
    const detail = ladder.getBoundingClientRect();
    if (detail.bottom > parent.bottom) scroll.scrollTo({ top: scroll.scrollTop + detail.bottom - parent.bottom + 8, behavior: reduced ? "instant" : "smooth" });
    else if (detail.top - 32 < parent.top) scroll.scrollTo({ top: scroll.scrollTop + detail.top - parent.top - 32, behavior: reduced ? "instant" : "smooth" });
  }
  function exportPositions() {
    const csv = ["Entity,Entity ID,Currency,Net exposure USD m,Hedge notional USD m,Unhedged USD m,Hedge ratio",
      ...pairs.map(pair => [entities.find(entity => entity.id === pair.entityId)!.name, pair.entityId, pair.currency, pair.exposure.toFixed(2), (Math.abs(pair.exposure) * pair.ratio).toFixed(2), gap(pair).toFixed(2), pair.ratio.toFixed(4)].join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "meridian-fx-exposure.csv"; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setExported(true);
  }
  const dialogClose = () => { setDialog(null); setSearch(""); };

  return <div data-meridian-screen="fx-exposure" className="relative flex h-full min-h-[960px] max-h-[960px] flex-col overflow-hidden bg-[#F4F4F4] font-body text-sm font-normal text-[#161616] tabular-nums [--text-3xl:28px] [--text-5xl:42px]" onKeyDown={event => {
    if (event.key === "Escape") { event.stopPropagation(); if (dialog) dialogClose(); else closeSelection(); }
  }}>
    <MeridianHeader title="FX Exposure" area="Risk" collapsed={collapsed} onAction={setDialog} />
    <div className="flex min-h-0 flex-1">
      <MeridianRail active="FX exposure" collapsed={collapsed} onCollapse={() => setCollapsed(!collapsed)} onAction={action => action === "FX exposure" ? closeSelection() : setDialog(action)} />
      <main className="grid min-h-0 min-w-0 flex-1 grid-rows-[40px_40px_minmax(0,1fr)] gap-4 p-6">
        <Entrance className="flex items-center justify-between">
          <div className="flex items-center gap-4"><h1 className="font-display text-3xl">FX Exposure</h1><Badge status={outsidePolicy.some(item => policyStatus(item.ratio) === "breach") ? "breach" : outsidePolicy.length ? "watch" : "good"}>{outsidePolicy.length ? `${outsidePolicy.length} policy exceptions` : "Within policy"}</Badge></div>
          <div className="flex items-center gap-4"><span className="text-xs text-[#525252]">USD reporting</span><Button primary onClick={exportPositions}>{exported ? "Exported" : "Export"}{exported ? <Check size={16} /> : <Download size={16} />}</Button></div>
        </Entrance>
        <Entrance order={1} className="grid grid-cols-[272px_304px_240px_1fr] gap-4">
          <Select label="As of" value={date} options={["02 Oct 2026", "01 Oct 2026"].map(value => ({ value, label: value }))} onChange={value => { setDate(value); setSelectedId(null); }} />
          <Select label="Entity" value={scope} options={[{ value: "All entities", label: "All entities (14)" }, { value: "Europe", label: "Europe (7)" }, { value: "Americas", label: "Americas (5)" }, { value: "Asia Pacific", label: "Asia Pacific (2)" }]} onChange={value => { setScope(value); setSelectedId(null); matrixScroll.current?.scrollTo({ top: 0 }); }} />
          <button onClick={() => setDialog("Reporting currency")} className={clsx("flex h-10 items-center justify-between border-b border-[#8D8D8D] bg-white px-4 hover:bg-[#E8E8E8]", focus)}><span className="text-[#525252]">Currency</span><span className="font-semibold">USD</span><ChevronDown size={14} /></button>
          <div className="flex items-center justify-end gap-2 text-xs text-[#525252]"><Check size={14} className="text-[#24A148]" />14 / 14 entities submitted</div>
        </Entrance>
        <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_320px] gap-4">
          <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_112px] gap-4">
            <Entrance order={2} className="min-h-0"><Tile className="flex h-full flex-col">
              <div className="flex h-[46px] shrink-0 items-center justify-between px-4"><h2 className="text-base font-semibold">Net exposure<span className="font-normal text-[#525252]">, USD m</span></h2><span className="text-xs text-[#525252]">Oct 2026 – Sep 2027</span></div>
              <div className="flex h-8 shrink-0 items-center justify-between border-b border-[#E0E0E0] px-4 text-xs text-[#525252]">
                <div className="flex items-center gap-4"><span>Pre-hedge · net receivable (+) / payable (−)</span><Tooltip text="Contracted and forecast foreign-currency receipts less payments, before financial hedges. Blank cells have no exposure. USD functional/reporting exposure is excluded." /></div>
                <div className="flex items-center gap-2"><span>0</span><svg width="72" height="8" aria-hidden="true"><defs><linearGradient id={`${id}-heat`}><stop stopColor="#FFFFFF" /><stop offset="1" stopColor="#0F62FE" /></linearGradient></defs><rect width="72" height="8" fill={`url(#${id}-heat)`} stroke="#E0E0E0" /></svg><span>{f(max)}</span></div>
              </div>
              <div role="table" aria-label="Net exposure by entity and currency" aria-rowcount={visibleEntities.length + 2} className="flex min-h-0 flex-1 flex-col">
                <div role="row" className={clsx(columns, "h-8 shrink-0 border-b border-[#E0E0E0] bg-[#F4F4F4] text-xs font-semibold text-[#525252]")}><div role="columnheader" className="flex items-center px-4">Entity</div>{currencies.map(currency => <div role="columnheader" key={currency} className={clsx("flex items-center justify-center", selected?.currency === currency && "text-[#0F62FE]")}>{currency}</div>)}</div>
                <div ref={matrixScroll} role="rowgroup" className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  {visibleEntities.map(entity => <Fragment key={entity.id}>
                    <div role="row" data-entity-row={entity.id} className={clsx(columns, "h-8 border-b border-[#E0E0E0]", selected?.entityId === entity.id && "bg-[#EDF3FE]")}>
                      <div role="rowheader" className="flex min-w-0 items-center justify-between gap-2 px-4 text-xs"><span className={clsx("truncate", selected?.entityId === entity.id && "font-semibold text-[#0F62FE]")}>{entity.name}</span><span className="shrink-0 text-[#8D8D8D]">{entity.country}</span></div>
                      {currencies.map(currency => {
                        const pair = pairs.find(item => item.entityId === entity.id && item.currency === currency);
                        if (!pair) return <div role="cell" key={currency} aria-label={`${entity.name}, ${currency}: no exposure`} className="border-l border-[#F4F4F4]" />;
                        const active = selectedId === pair.id;
                        const suggested = !selected && pair.id === largest.id;
                        return <div role="cell" key={currency} className="relative min-w-0 border-l border-white">
                          <button data-fx-cell={pair.id} data-largest-unhedged={suggested || undefined} aria-expanded={active} aria-controls={active ? `${id}-maturity` : undefined} aria-label={`${entity.name}, ${currency}, ${pair.exposure > 0 ? "+" : ""}${f(pair.exposure)} million USD${suggested ? ", largest unhedged exposure" : ""}`} title={`${entity.id} / ${currency} · ${f(pair.ratio * 100)}% hedged · ${f(gap(pair))}m unhedged`} onClick={event => choosePair(pair, event.currentTarget)} className={clsx("relative flex h-full w-full items-center justify-center gap-1 font-mono text-xs outline-offset-[-2px] hover:outline hover:outline-1 hover:outline-[#161616] focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#161616]", active ? "z-10 outline outline-2 outline-[#161616]" : suggested ? "z-10 outline outline-1 outline-[#161616]" : "", Math.abs(pair.exposure) / max > 0.62 ? "text-white" : "text-[#161616]")}>
                            <svg className="absolute inset-0 h-full w-full" aria-hidden="true" preserveAspectRatio="none"><rect width="100%" height="100%" fill={heatColor(pair.exposure, max)} /></svg>
                            <span className="relative opacity-75">{pair.exposure > 0 ? "+" : "−"}</span><span className="relative">{f(Math.abs(pair.exposure))}</span>
                            {suggested && <ChevronRight size={10} className="absolute right-1" />}
                          </button>
                        </div>;
                      })}
                    </div>
                    <AnimatePresence initial={false}>
                      {selected?.entityId === entity.id && <motion.div id={`${id}-maturity`} key={entity.id} initial={{ height: 0, opacity: 0 }} animate={{ height: 216, opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={reduced ? { duration: 0 } : spring} onAnimationComplete={revealLadder} className="overflow-hidden" role="row"><div role="cell" aria-colspan={9}><MaturityLadder pair={selected} onClose={closeSelection} /></div></motion.div>}
                    </AnimatePresence>
                  </Fragment>)}
                </div>
                <div role="row" className={clsx(columns, "h-8 shrink-0 border-t border-[#E0E0E0] bg-[#F4F4F4] text-xs")}><div role="rowheader" className="flex items-center px-4 font-semibold">Net exposure</div>{metrics.map(item => <div role="cell" key={item.currency} className="flex items-center justify-center font-mono"><NumberValue value={item.net} signed /></div>)}</div>
              </div>
              <div className="flex h-8 shrink-0 items-center justify-between border-t border-[#E0E0E0] px-4 text-xs text-[#525252]"><span>{visibleEntities.length} entities · 8 currencies</span>{selected ? <button onClick={closeSelection} className={clsx("flex h-7 items-center gap-2 hover:text-[#0F62FE]", focus)}>Clear selection<span className="border border-[#E0E0E0] px-1 font-mono">Esc</span></button> : <span className="flex items-center gap-2"><span className="h-3 w-4 border border-[#161616]" />Largest unhedged cell</span>}</div>
            </Tile></Entrance>
            <Entrance order={4}><Tile className="h-full">
              <div className="flex h-8 items-center justify-between px-4"><h2 className="text-xs font-semibold">Largest unhedged<span className="font-normal text-[#525252]">, USD m</span><span className="ml-3 text-xs font-normal text-[#8D8D8D]">Entity / currency</span></h2><Tooltip text="Absolute residual exposure after forwards and options, before cross-entity netting. Select a pair to open its maturity ladder." /></div>
              <div className="grid h-[78px] grid-cols-3 divide-x divide-[#E0E0E0]">{ranked.slice(0, 3).map((pair, i) => <button key={pair.id} onClick={() => choosePair(pair)} className={clsx("flex items-center justify-between px-4 text-left hover:bg-[#F4F4F4]", focus)}><div><div className="text-xs text-[#525252]">{pair.entityId} / {pair.currency}</div><div className={clsx("mt-1 text-3xl", i === 0 && "text-[#0F62FE]")}><NumberValue value={gap(pair)} /></div></div><div className="flex items-center gap-3 text-xs text-[#525252]"><span>{f(gap(pair) / summary.open * 100)}% of open</span><ChevronRight size={14} /></div></button>)}</div>
            </Tile></Entrance>
          </div>
          <div className="grid min-h-0 grid-rows-[312px_minmax(0,1fr)] gap-4">
            <Entrance order={2}><Tile className="flex h-full flex-col">
              <div className="flex h-12 shrink-0 items-center justify-between px-4"><h2 className="text-base font-semibold">Exposure summary</h2><span className="text-xs text-[#525252]">{scope === "All entities" ? "Group" : scope}</span></div>
              <div className="px-4 pb-3"><div className="flex items-center justify-between text-xs text-[#525252]"><span>Total gross exposure</span><Tooltip text="Sum of absolute entity-currency positions before financial hedges. Includes both receivables and payables; not a cash balance." /></div><div className="mt-1 flex items-baseline gap-2"><span className="text-5xl font-light"><NumberValue value={summary.gross} /></span><span className="text-xs text-[#525252]">USD m</span></div></div>
              <div className="grid grid-cols-2 divide-x divide-[#E0E0E0] border-y border-[#E0E0E0] bg-[#F4F4F4]">
                <div className="px-4 py-3"><div className="flex items-center justify-between text-xs text-[#525252]"><span>Net after hedges</span><Tooltip text="Sum of absolute currency-level residuals after financial hedges and cross-entity netting. No netting between different currencies." /></div><div className="mt-1 text-3xl"><NumberValue value={summary.net} /></div><div className="text-xs text-[#525252]">USD m</div></div>
                <div className="px-4 py-3"><div className="flex items-center justify-between text-xs text-[#525252]"><span>VaR (95%)</span><Tooltip text="95% confidence, 1-month horizon. Parametric VaR using currency-level residuals, monthly FX volatility and zero cross-currency correlation. Illustrative risk model." /></div><div className="mt-1 text-3xl"><NumberValue value={summary.var95} /></div><div className="text-xs text-[#525252]">1-month · USD m</div></div>
              </div>
              <button onClick={() => setDialog("Counterparty limits")} className={clsx("flex min-h-0 flex-1 items-center justify-between px-4 text-left hover:bg-[#F4F4F4]", focus)}><div><div className="text-xs text-[#525252]">Counterparties at limit</div><div className="mt-1 flex items-center gap-2"><span className="text-xl">{atLimit.length}<span className="text-sm text-[#8D8D8D]"> / {counterparties.length}</span></span><Badge status="breach">Review</Badge></div></div><ChevronRight size={16} /></button>
            </Tile></Entrance>
            <Entrance order={3} className="min-h-0"><Tile className="flex h-full flex-col">
              <div className="flex h-12 shrink-0 items-center justify-between px-4"><h2 className="text-base font-semibold">Hedge ratio by currency</h2><Tooltip text="Gross hedge notional divided by absolute pre-hedge exposure, aggregated by currency. Policy is 60–80%. Watch: 55–60% or 80–85%; breach: outside 55–85%." /></div>
              <div className="flex h-8 shrink-0 items-center justify-between px-4 text-xs text-[#525252]"><span className="flex items-center gap-2"><span className="h-3 w-5 border-x border-[#8D8D8D] bg-[#E0E0E0]" />Policy 60–80%</span><span>{selected ? `${selected.currency} selected` : "12-month cover"}</span></div>
              <div className="h-[280px] shrink-0 px-4">
                <div className="ml-10 mr-11 flex h-6 items-start justify-between text-xs text-[#8D8D8D]"><span>0</span><span>50</span><span>100%</span></div>
                {metrics.map(item => {
                  const status = policyStatus(item.ratio);
                  const color = status === "breach" ? "#DA1E28" : status === "watch" ? "#F1C21B" : (selected?.currency === item.currency || (!selected && item.currency === "EUR")) ? "#0F62FE" : "#A8A8A8";
                  const opacity = selected && selected.currency !== item.currency ? 0.3 : 1;
                  return <motion.div key={item.currency} data-hedge-currency={item.currency} animate={{ opacity }} transition={{ duration: reduced ? 0 : 0.3, ease }}>
                    <button onClick={() => { const pair = [...pairs].filter(pair => pair.currency === item.currency).sort((a, b) => gap(b) - gap(a))[0]; if (pair) choosePair(pair); }} disabled={item.ratio === null} title={`${item.currency}: ${item.ratio === null ? "no exposure" : `${f(item.ratio)}% hedged; gross ${f(item.gross)}m, hedge notional ${f(item.hedged)}m`}`} className={clsx("flex h-8 w-full items-center gap-2 text-xs hover:bg-[#F4F4F4] disabled:cursor-default", focus)} aria-label={`${item.currency} hedge ratio ${item.ratio === null ? "not applicable" : `${f(item.ratio)} percent`}`}>
                      <span className={clsx("w-8 shrink-0 text-left", selected?.currency === item.currency && "font-semibold text-[#0F62FE]")}>{item.currency}</span>
                      <svg className="h-8 min-w-0 flex-1" viewBox="0 0 200 32" preserveAspectRatio="none" aria-hidden="true">
                        <rect x="120" y="0" width="40" height="32" fill="#E0E0E0" fillOpacity="0.65" />
                        <line x1="120" y1="0" x2="120" y2="32" stroke="#A8A8A8" strokeDasharray="2 2" />
                        <line x1="160" y1="0" x2="160" y2="32" stroke="#A8A8A8" strokeDasharray="2 2" />
                        <line x1="0" y1="16" x2="200" y2="16" stroke="#F4F4F4" />
                        {item.ratio !== null && <motion.rect x="0" y="11" height="10" animate={{ width: item.ratio * 2, fill: color }} transition={{ duration: reduced ? 0 : 0.4, ease }} />}
                      </svg>
                      <span className="w-9 shrink-0 text-right font-mono">{item.ratio === null ? "—" : `${Math.round(item.ratio)}%`}</span>
                    </button>
                  </motion.div>;
                })}
              </div>
              <div className="mt-auto flex min-h-12 items-center justify-between border-t border-[#E0E0E0] bg-[#F4F4F4] px-4 text-xs"><span className="text-[#525252]">Weighted hedge ratio</span><span className="font-mono"><NumberValue value={summary.hedged / summary.gross * 100} />%</span></div>
            </Tile></Entrance>
          </div>
        </div>
      </main>
    </div>
    <AnimatePresence>{dialog && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.2 }} onClick={dialogClose} className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 p-10">
      <section role="dialog" aria-modal="true" aria-label={dialog} onClick={event => event.stopPropagation()} onKeyDown={event => {
        if (event.key === "Tab") { const controls = event.currentTarget.querySelectorAll<HTMLElement>("button, input"); const first = controls[0], last = controls[controls.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); } }
      }} className="w-[560px] border border-[#E0E0E0] bg-white">
        <div className="flex h-16 items-center justify-between border-b border-[#E0E0E0] px-6"><h2 className="text-xl">{dialog}</h2><button autoFocus aria-label="Close dialog" onClick={dialogClose} className={clsx("flex h-10 w-10 items-center justify-center hover:bg-[#F4F4F4]", focus)}><X size={20} /></button></div>
        <div className="p-6">
          {dialog === "Counterparty limits" || dialog === "Notifications" ? <><div className="mb-4 flex items-center justify-between"><span className="text-xs text-[#525252]">Group credit exposure · USD m</span><Badge status="breach">{atLimit.length} at limit</Badge></div><Table><thead className="bg-[#F4F4F4]"><tr><th>Counterparty</th><th>Usage</th><th>Limit</th><th>Status</th></tr></thead><tbody>{counterparties.map(item => <tr key={item.name}><td>{item.name}</td><td className="font-mono">{f(item.used)}</td><td className="font-mono">{f(item.limit)}</td><td><Badge status={item.used >= item.limit ? "breach" : "good"}>{item.used >= item.limit ? "At limit" : "Within"}</Badge></td></tr>)}</tbody></Table></>
            : dialog === "Search" ? <><input aria-label="Search FX positions" placeholder="Entity, ID or currency" value={search} onChange={event => setSearch(event.target.value)} className={clsx("mb-4 h-10 w-full border-b border-[#8D8D8D] bg-[#F4F4F4] px-3", focus)} /><div className="max-h-72 overflow-auto">{ranked.filter(pair => `${pair.id} ${entities.find(entity => entity.id === pair.entityId)!.name}`.toLowerCase().includes(search.toLowerCase())).map(pair => <button key={pair.id} onClick={() => { dialogClose(); choosePair(pair); }} className={clsx("flex h-10 w-full items-center justify-between border-b border-[#E0E0E0] px-3 hover:bg-[#F4F4F4]", focus)}><span>{pair.entityId} / {pair.currency}</span><span className="font-mono text-xs">{f(gap(pair))}m open</span></button>)}{!ranked.some(pair => `${pair.id} ${entities.find(entity => entity.id === pair.entityId)!.name}`.toLowerCase().includes(search.toLowerCase())) && <p className="py-4 text-[#525252]">No matching positions.</p>}</div></>
            : dialog === "Reporting currency" ? <><div className="mb-4 flex justify-between"><span>Group reporting currency</span><Badge>USD</Badge></div><Table><thead className="bg-[#F4F4F4]"><tr><th>Currency</th><th>USD per unit</th><th>Rate date</th></tr></thead><tbody>{currencies.map(currency => <tr key={currency}><td>{currency}</td><td className="font-mono">{entities.find(entity => entity.currency === currency)!.rate.toFixed(4)}</td><td>{date}</td></tr>)}</tbody></Table></>
            : dialog === "Profile" ? <><div className="text-base font-semibold">Amelia Laurent</div><div className="mt-1 text-[#525252]">Group Treasurer · Velmora Group</div><div className="mt-6 flex gap-3"><Badge>Production</Badge><Badge>USD reporting</Badge><Badge>UTC</Badge></div></>
            : dialog === "Help" || dialog === "Policies" ? <div className="space-y-4 text-[#525252]"><p className="max-w-measure">Select an entity-currency cell to open its 12-month hedge maturity ladder. Escape clears the selection.</p><p className="max-w-measure">Currency hedge policy: 60–80%. Watch bands: 55–60% and 80–85%. Exposure outside those bands is a breach.</p><p className="max-w-measure">Net exposure is measured before financial hedges. Net after hedges offsets residual positions within each currency. Blank cells have no position. Figures are illustrative.</p></div>
            : <div className="space-y-4">{(dialog === "Cash position" ? ["Group cash · USD 1,284.6m", "Available liquidity · USD 1,755.2m", "Minimum projected · USD 628.4m"] : dialog === "Audit trail" ? ["07:42 · FX positions consolidated", "07:38 · FX rates fixed", "07:31 · Hedge notionals reconciled"] : dialog === "Reports" ? ["FX exposure · October 2026", "Hedge effectiveness · September", "Counterparty credit usage · 02 Oct"] : dialog === "Cash forecast" ? ["13-week rolling forecast · v26.40", "Minimum liquidity · USD 400.0m"] : dialog === "Bank accounts" ? ["86 bank accounts · reconciled", "12 cash pool participants"] : dialog === "Payments" ? ["07 Oct · Payroll DE · USD 28.6m", "12 Oct · Capex milestone · USD 86.4m"] : ["Revolving credit facility · USD 600.0m undrawn", "2029 senior notes · 4.75%"]).map(text => <div key={text} className="flex min-h-10 items-center gap-3 border-b border-[#E0E0E0] pb-3"><FileText size={16} className="shrink-0 text-[#525252]" />{text}</div>)}</div>}
        </div>
        <div className="flex justify-end border-t border-[#E0E0E0] bg-[#F4F4F4] p-4"><Button onClick={dialogClose}>Close<ArrowRight size={16} /></Button></div>
      </section>
    </motion.div>}</AnimatePresence>
  </div>;
}
