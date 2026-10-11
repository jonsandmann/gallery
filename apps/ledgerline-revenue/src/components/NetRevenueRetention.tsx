import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { ArrowDownToLine, ArrowRight, CalendarDays, Check, Globe2, MousePointer2, Search } from "lucide-react";
import { Customized, Line, LineChart, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { clsx } from "clsx";
import { AnimatedNumber, Badge, Button, Card, Segmented, Select, Table, Tooltip, chartTheme, useQuietMotion } from "./ui/ledgerline";
import { Dialog, LedgerChrome, ownsShortcut } from "./ui/LedgerChrome";
import { getLedger, stages } from "./ledgerData";
import { cellColor, cellInk, metricValues, retentionChartData, scopeCohorts, type Cohort, type RetentionMetric } from "./retentionData";

const defaultCohort = "FY24 Q2";
const quarters = Array.from({ length: 16 }, (_, index) => index);
const metrics: RetentionMetric[] = ["Revenue retention", "Logo retention"];
const integer = (value: number) => value.toLocaleString("en-US");

function CohortLines({ source, data, selected, metric }: { source: Cohort[]; data: ReturnType<typeof retentionChartData>; selected: string; metric: RetentionMetric }) {
  const revenue = metric === "Revenue retention";
  const lower = revenue ? 65 : 60;
  const upper = revenue ? 155 : 105;
  const x = (quarter: number) => 33 + quarter / 15 * 336;
  const y = (value: number) => 14 + (upper - value) / (upper - lower) * 237;
  const pathFor = (values: number[]) => {
    const points = values.map((value, quarter) => ({ x: x(quarter), y: y(value) }));
    const slopes = points.slice(1).map((point, i) => (point.y - points[i].y) / (point.x - points[i].x));
    const tangents = points.map((_, i) => {
      if (i === 0) return slopes[0] ?? 0;
      if (i === points.length - 1) return slopes[i - 1];
      const a = slopes[i - 1], b = slopes[i];
      return a * b <= 0 ? 0 : 2 * a * b / (a + b);
    });
    return points.reduce((path, point, i) => {
      if (i === 0) return `M${point.x},${point.y}`;
      const previous = points[i - 1];
      const third = (point.x - previous.x) / 3;
      return `${path} C${previous.x + third},${previous.y + tangents[i - 1] * third} ${point.x - third},${point.y - tangents[i] * third} ${point.x},${point.y}`;
    }, "");
  };
  const highlighted = source.find(c => c.id === selected)!;
  const highlightedValues = metricValues(highlighted, metric);
  const age = highlightedValues.length - 1;
  const endpointY = y(highlightedValues[age]);
  const company = data.map(row => Number(row.average));
  return <g data-cohort-lines>
    {source.map(c => <motion.path key={c.id} data-cohort-path={c.id} initial={false}
      animate={{ d: pathFor(metricValues(c, metric)), stroke: c.id === selected ? chartTheme.blue : "#BDBDBD", strokeWidth: c.id === selected ? 2.6 : 1, opacity: c.id === selected ? 1 : 0.42 }}
      fill="none" strokeLinecap="round" strokeLinejoin="round" />)}
    <motion.path data-company-path initial={false} animate={{ d: pathFor(company) }} stroke={chartTheme.ink} strokeWidth={1.6} fill="none" strokeLinecap="round" />
    <motion.circle initial={false} animate={{ cx: x(0), cy: y(100) }} r={2} fill="#BDBDBD" />
    <motion.text initial={false} animate={{ x: x(15), y: y(company[15]) + 17 }} textAnchor="end" fill={chartTheme.ink} fontFamily={chartTheme.font} fontSize={12}>Company</motion.text>
    <motion.circle data-cohort-endpoint initial={false} animate={{ cx: x(age), cy: endpointY }} r={3.3} fill={chartTheme.blue} stroke="white" strokeWidth={1.5} />
    <motion.text data-cohort-line-label initial={false} animate={{ x: x(age) + (age === 0 ? 6 : 0), y: Math.max(14, endpointY - 12) }} textAnchor={age === 15 ? "end" : age === 0 ? "start" : "middle"} fill={chartTheme.blue} fontFamily={chartTheme.font} fontSize={12}>{selected}</motion.text>
  </g>;
}

export default function NetRevenueRetention() {
  const root = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [metric, setMetric] = useState<RetentionMetric>("Revenue retention");
  const [selected, setSelected] = useState(defaultCohort);
  const [region, setRegion] = useState("All regions");
  const [currency, setCurrency] = useState("USD");
  const [dialog, setDialog] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [exported, setExported] = useState(false);
  const reduced = useQuietMotion();
  const transition = { duration: reduced ? 0 : 0.4, ease: chartTheme.ease };
  const isRevenue = metric === "Revenue retention";
  const symbol = currency === "EUR" ? "\u20ac" : "$";
  const ledger = useMemo(() => getLedger("Q3 FY26", "All", region, currency), [region, currency]);
  const scoped = useMemo(() => scopeCohorts(region === "Americas" ? 0.57 : region === "EMEA" ? 0.3 : region === "APAC" ? 0.13 : 1, currency === "EUR" ? 0.92 : 1, ledger.counts[5]), [region, currency, ledger]);
  const current = scoped.find(c => c.id === selected)!;
  const values = metricValues(current, metric);
  const age = values.length - 1;
  const currentRetention = values[age];
  const data = useMemo(() => retentionChartData(metric, scoped), [metric, scoped]);
  const legendValues = isRevenue ? [80, 100, 120, 140, 150] : [60, 70, 80, 90, 100];
  const rateLabel = isRevenue ? "NRR" : "Logo retention";
  const searchResults = scoped.filter(c => c.id.toLowerCase().replaceAll(" ", "").includes(search.toLowerCase().replaceAll(" ", "")));

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!ownsShortcut(root.current)) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault(); setSearch(""); setDialog(d => d === "Search" ? null : "Search");
      }
      if (event.key === "Escape") {
        if (dialog) setDialog(null);
        else setSelected(defaultCohort);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [dialog]);
  useEffect(() => {
    if (!exported) return;
    const timer = setTimeout(() => setExported(false), 2000);
    return () => clearTimeout(timer);
  }, [exported]);

  function exportCsv() {
    const rows = ["Cohort,Quarter since start,Retention percent,Metric,Start ARR,Current ARR,Currency,Region"];
    for (const c of scoped) metricValues(c, metric).forEach((value, quarter) => rows.push(`${c.id},${quarter},${value.toFixed(4)},${metric},${c.startArr},${c.currentArr},${currency},${region}`));
    const url = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `ledgerline-${isRevenue ? "revenue" : "logo"}-retention-q3-fy26.csv`; link.click(); URL.revokeObjectURL(url); setExported(true);
  }

  function chooseMetric(value: string) {
    if (value === "Revenue retention" || value === "Logo retention") setMetric(value);
  }

  return <MotionConfig reducedMotion="user" transition={transition}>
    <div ref={root} data-ledger-screen="net-revenue-retention" className="relative flex h-full min-h-[960px] flex-col bg-white font-body text-sm text-black tabular-nums [--text-xs:13px] [--text-3xl:32px] [--text-2xl--letter-spacing:-0.02em] [--text-3xl--letter-spacing:-0.02em]">
      <LedgerChrome title="Net Revenue Retention" active="Retention" onNavigate={tab => tab === "Retention" ? setDialog(null) : setDialog(tab)} onSearch={() => { setSearch(""); setDialog("Search"); }} onProfile={() => setDialog("Profile")} onWorkspace={() => setDialog("Workspace")} />
      <main className="flex min-h-0 flex-1 flex-col px-10 pb-5 pt-7">
        <div className="flex h-10 shrink-0 items-center justify-between">
          <div className="flex items-center gap-4"><h1 className="font-display text-2xl font-semibold">Net Revenue Retention</h1><Badge>Q3 FY26</Badge></div>
          <Segmented label="Retention metric" options={metrics} value={metric} onChange={chooseMetric} />
        </div>
        <div className="mb-5 mt-4 flex h-8 shrink-0 items-center justify-between">
          <div className="flex items-center gap-2">
            <Select label="Region" value={region} options={["All regions", "Americas", "EMEA", "APAC"]} onChange={setRegion} icon={<Globe2 size={14} />} />
            <Select label="Currency" value={currency} options={["USD", "EUR"]} onChange={setCurrency} />
            <span className="mx-2 h-4 w-px bg-[#EAEAEA]" />
            <CalendarDays size={13} className="text-[#8F8F8F]" /><span className="font-mono text-xs text-[#8F8F8F]">Oct 2022 - Sep 2026</span>
            {currency === "EUR" && <Badge>FX 0.9200</Badge>}
          </div>
          <Button onClick={exportCsv}>{exported ? <Check size={14} /> : <ArrowDownToLine size={14} />}{exported ? "Exported" : "Export"}</Button>
        </div>

        <div className="grid h-[662px] shrink-0 grid-cols-[minmax(0,1fr)_440px] gap-5">
          <motion.div initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="min-w-0">
            <Card className="flex h-full flex-col px-5 pb-4 pt-5">
              <div className="flex h-[42px] shrink-0 items-start justify-between">
                <div><div className="flex items-center gap-2"><h2 className="text-sm font-medium">Cohort retention</h2><Tooltip text="Cohorts are grouped by first paid quarter. Q0 is the acquisition quarter, indexed to 100%. Blank cells are quarters not yet observed." /></div><span className="mt-1 block text-xs text-[#8F8F8F]"><span className="font-mono">16</span> quarterly cohorts</span></div>
                <span className="text-xs text-[#8F8F8F]">{rateLabel}, %</span>
              </div>
              <div className="mt-3 flex h-5 shrink-0 items-center pl-24 text-xs text-[#8F8F8F]">Quarters since start</div>
              <div role="grid" aria-label={`${metric} cohort triangle`} aria-rowcount={17} aria-colcount={17} className="min-w-0">
                <div role="row" className="grid h-[30px] grid-cols-[96px_repeat(16,minmax(0,1fr))] items-center">
                  <span role="columnheader" className="pl-2 text-xs text-[#8F8F8F]">Cohort</span>
                  {quarters.map(q => <span role="columnheader" key={q} className="text-center font-mono text-xs text-[#8F8F8F] [--text-xs:12px]">Q{q}</span>)}
                </div>
                {scoped.map((cohort, index) => {
                  const row = metricValues(cohort, metric);
                  const active = selected === cohort.id;
                  return <div key={cohort.id} ref={node => { rowRefs.current[index] = node; }} role="row" aria-selected={active} aria-label={`${cohort.id}, ${row[row.length - 1].toFixed(1)}% ${rateLabel}`} tabIndex={active ? 0 : -1}
                    onMouseEnter={() => setSelected(cohort.id)} onFocus={() => setSelected(cohort.id)} onClick={() => setSelected(cohort.id)}
                    onKeyDown={event => {
                      const next = event.key === "ArrowDown" ? Math.min(15, index + 1) : event.key === "ArrowUp" ? Math.max(0, index - 1) : event.key === "Home" ? 0 : event.key === "End" ? 15 : null;
                      if (next !== null) { event.preventDefault(); rowRefs.current[next]?.focus(); }
                    }}
                    className="group grid h-[30px] cursor-default grid-cols-[96px_repeat(16,minmax(0,1fr))] outline-none">
                    <span role="rowheader" className={clsx("flex items-center border-y border-l pl-2 font-mono text-xs", active ? "border-black font-medium text-black" : "border-transparent text-[#666]")}>{cohort.id}</span>
                    {row.map((value, q) => <span role="gridcell" key={q} data-retention-cell={`${cohort.id}-${q}`} className={clsx("min-w-0 border-y", active ? "border-black" : "border-transparent", q === row.length - 1 && "border-r")}>
                      <motion.span initial={false} animate={{ backgroundColor: cellColor(value, metric), color: cellInk(value, metric) }} className="flex h-full items-center justify-center border-r border-white/60 font-mono text-xs [--text-xs:12px]"><AnimatedNumber value={value} decimals={0} suffix="%" /></motion.span>
                    </span>)}
                  </div>;
                })}
              </div>
              <div className="mt-auto flex h-10 shrink-0 items-end justify-between gap-2 border-t border-[#EAEAEA] pt-3">
                <span className="flex items-center gap-1.5 whitespace-nowrap text-xs text-[#8F8F8F]"><MousePointer2 size={12} />Hover a cohort to compare</span>
                <div className="flex items-center gap-2.5" aria-label={`${rateLabel} color scale`}>
                  {legendValues.map((v, i) => <div key={i} className="flex items-center gap-1.5"><motion.span initial={false} animate={{ backgroundColor: cellColor(v, metric) }} className="h-2.5 w-4 rounded-sm" /><span className="font-mono text-xs text-[#8F8F8F] [--text-xs:12px]">{v}{i === legendValues.length - 1 ? "%+" : ""}</span></div>)}
                </div>
              </div>
            </Card>
          </motion.div>

          <div className="grid min-w-0 grid-rows-[410px_232px] gap-5">
            <motion.div initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...transition, delay: reduced ? 0 : 0.06 }} className="min-w-0">
              <Card className="flex h-full flex-col p-5">
                <div className="flex items-start justify-between"><div><h2 className="text-sm font-medium">{isRevenue ? "NRR by cohort" : "Logo retention by cohort"}</h2><span className="mt-1 block text-xs text-[#8F8F8F]">Retention, %</span></div><Tooltip text="Each line follows one acquisition cohort. The company line is the starting-ARR-weighted average at each age; logo retention is weighted by starting accounts. Younger cohorts stop at their last observed quarter." /></div>
                <div className="mt-3 h-[280px] shrink-0" aria-label={`${rateLabel} by cohort line chart`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 14, right: 29, bottom: 4, left: 0 }} accessibilityLayer>
                      <XAxis dataKey="quarter" type="number" domain={[0, 15]} ticks={[0, 3, 6, 9, 12, 15]} tickFormatter={q => `Q${q}`} tickLine={false} axisLine={{ stroke: chartTheme.grid }} tick={{ fill: chartTheme.muted, fontFamily: chartTheme.font, fontSize: 12 }} height={25} dy={5} />
                      <YAxis domain={isRevenue ? [65, 155] : [60, 105]} ticks={isRevenue ? [80, 100, 120, 140] : [60, 70, 80, 90, 100]} tickFormatter={v => `${v}`} tickLine={false} axisLine={false} width={33} tick={{ fill: chartTheme.muted, fontFamily: chartTheme.font, fontSize: 12 }} />
                      <ReferenceLine y={100} stroke="#BDBDBD" strokeDasharray="3 4" />
                      <Line dataKey="average" stroke="none" dot={false} activeDot={false} isAnimationActive={false} />
                      <Customized component={<CohortLines source={scoped} data={data} selected={selected} metric={metric} />} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-auto flex items-center justify-between text-xs text-[#8F8F8F]"><span>Quarters since start</span><span className="flex items-center gap-2"><span className="w-4 border-t border-dashed border-[#BDBDBD]" /><span className="font-mono">100%</span> baseline</span></div>
              </Card>
            </motion.div>
            <motion.div initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...transition, delay: reduced ? 0 : 0.12 }} className="min-w-0">
              <Card className="flex h-full flex-col px-5 pb-4 pt-5">
                <div className="flex items-center justify-between"><div className="flex items-center gap-2.5"><span className="h-2 w-2 rounded-sm bg-[#0070F3]" /><h2 className="font-mono text-sm font-medium" data-cohort-readout>{selected}</h2></div><Badge>Q0 - Q{age}</Badge></div>
                <div className="mt-5 grid grid-cols-3 gap-3" aria-live="polite" aria-atomic="true">
                  <div><span className="text-xs text-[#8F8F8F]">{isRevenue ? "Start ARR" : "Start accounts"}</span><div className="mt-2 whitespace-nowrap text-2xl font-medium"><AnimatedNumber value={isRevenue ? current.startArr / 1_000_000 : current.startLogos} prefix={isRevenue ? symbol : ""} suffix={isRevenue ? "m" : ""} decimals={isRevenue ? 1 : 0} /></div></div>
                  <div><span className="text-xs text-[#8F8F8F]">{isRevenue ? "Current ARR" : "Current accounts"}</span><div className="mt-2 whitespace-nowrap text-2xl font-medium"><AnimatedNumber value={isRevenue ? current.currentArr / 1_000_000 : current.currentLogos} prefix={isRevenue ? symbol : ""} suffix={isRevenue ? "m" : ""} decimals={isRevenue ? 1 : 0} /></div></div>
                  <div><span className="text-xs text-[#8F8F8F]">{isRevenue ? "NRR" : "Retained"}</span><div className="mt-2 whitespace-nowrap text-2xl font-medium text-[#0070F3]"><AnimatedNumber value={currentRetention} suffix="%" /></div></div>
                </div>
                <div className="mt-auto space-y-2 border-t border-[#EAEAEA] pt-3">
                  <div className="flex items-center justify-between text-xs"><span className="text-[#8F8F8F]">{isRevenue ? "Net ARR change" : "Churned accounts"}</span><span className={clsx("font-mono", isRevenue ? current.currentArr >= current.startArr ? "text-[#45A557]" : "text-[#E5484D]" : "text-[#666]")}>{isRevenue ? <AnimatedNumber value={Math.abs(current.currentArr - current.startArr) / 1_000_000} prefix={`${current.currentArr >= current.startArr ? "+" : "-"}${symbol}`} suffix="m" /> : <AnimatedNumber value={current.startLogos - current.currentLogos} decimals={0} />}</span></div>
                  <div className="flex items-center justify-between text-xs"><span className="text-[#8F8F8F]">{isRevenue ? "Retained accounts" : "Current ARR"}</span><span className="font-mono text-[#666]">{isRevenue ? `${integer(current.currentLogos)} / ${integer(current.startLogos)}` : `${symbol}${(current.currentArr / 1_000_000).toFixed(1)}m`}</span></div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
        <footer className="mt-4 flex h-[18px] shrink-0 items-center justify-between text-xs text-[#8F8F8F]"><span className="flex items-center gap-1.5"><Check size={12} />Reconciled<span className="mx-2 text-[#D0D0D0]">/</span><AnimatedNumber value={ledger.values[5]} prefix={symbol} suffix="m" />ARR<span className="mx-2 text-[#D0D0D0]">/</span><AnimatedNumber value={ledger.counts[5]} decimals={0} />active accounts</span><span>As of <span className="font-mono">Sep 30, 2026</span><span className="mx-3 text-[#D0D0D0]">/</span>Constant currency</span></footer>
      </main>

      <AnimatePresence>
        {dialog && <Dialog title={dialog === "Search" ? "Search Ledgerline" : dialog === "Profile" ? "Your account" : dialog === "ARR" ? "ARR Bridge" : dialog} onClose={() => setDialog(null)}>
          {dialog === "Search" ? <div className="p-5"><div className="flex items-center gap-3 rounded-md border border-[#EAEAEA] px-3"><Search size={16} className="text-[#8F8F8F]" /><input autoFocus aria-label="Search cohorts" placeholder="Find a cohort, e.g. FY24 Q2..." value={search} onChange={e => setSearch(e.target.value)} className="h-11 flex-1 bg-transparent text-sm outline-none" /><kbd className="font-mono text-xs text-[#8F8F8F]">esc</kbd></div><div className="mt-4 max-h-[390px] overflow-auto">{searchResults.length ? searchResults.map(c => <button key={c.id} onClick={() => { setSelected(c.id); setDialog(null); }} className="flex w-full items-center justify-between rounded-md px-3 py-2.5 hover:bg-[#FAFAFA] focus-visible:outline-[#0070F3]"><span className="font-mono">{c.id}</span><span className="ml-auto mr-4 font-mono text-xs text-[#666]">{metricValues(c, metric).at(-1)?.toFixed(1)}%</span><ArrowRight size={14} /></button>) : <p className="py-8 text-center text-[#8F8F8F]">No matching cohorts.</p>}</div></div>
          : dialog === "Profile" ? <div className="space-y-4 p-6"><p className="font-medium">Alex Morgan</p><p className="text-xs text-[#8F8F8F]">alex.morgan@ledgerline.example</p><div className="flex justify-between border-t border-[#EAEAEA] pt-4 text-xs"><span className="text-[#666]">Workspace role</span><Badge>Finance admin</Badge></div></div>
          : dialog === "Workspace" ? <div className="space-y-4 p-6"><p className="font-medium">Ledgerline, Inc.</p><div className="flex justify-between text-xs text-[#666]"><span>Consolidation</span><span>All legal entities</span></div><div className="flex justify-between text-xs text-[#666]"><span>Reporting currency</span><span className="font-mono">{currency}</span></div><div className="flex justify-between text-xs text-[#666]"><span>Billing and CRM sync</span><span className="font-mono">Oct 01, 2026 07:42 UTC</span></div></div>
          : dialog === "ARR" ? <div className="p-6"><Table headers={["Movement", "Accounts", `ARR, ${currency} m`]}>{stages.map((stage, i) => <tr key={stage} className="h-10 border-b border-[#EAEAEA] last:border-0"><td>{stage}</td><td className="font-mono">{integer(ledger.counts[i])}</td><td className="text-right font-mono">{ledger.values[i].toFixed(1)}</td></tr>)}</Table></div>
          : dialog === "Cohorts" || dialog === "Accounts" ? <div className="p-6"><Table headers={["Cohort", "Active accounts", rateLabel]}>{scoped.map(c => <tr key={c.id} className="h-8 border-b border-[#EAEAEA] last:border-0"><td><button onClick={() => { setSelected(c.id); setDialog(null); }} className="rounded font-mono hover:text-[#0070F3] focus-visible:outline-[#0070F3]">{c.id}</button></td><td className="font-mono">{integer(c.currentLogos)}</td><td className="text-right font-mono">{metricValues(c, metric).at(-1)?.toFixed(1)}%</td></tr>)}</Table></div>
          : <div className="p-6"><Table headers={["Revenue", "Q3 FY26"]}>{[["Closing ARR", `${symbol}${ledger.values[5].toFixed(1)}m`], ["Active accounts", integer(ledger.counts[5])], ["12-month NRR", `${ledger.nrr.toFixed(1)}%`], ["Quarterly GRR", `${ledger.grr.toFixed(1)}%`]].map(([label, value]) => <tr key={label} className="h-12 border-b border-[#EAEAEA] last:border-0"><td>{label}</td><td className="text-right font-mono">{value}</td></tr>)}</Table></div>}
        </Dialog>}
      </AnimatePresence>
    </div>
  </MotionConfig>;
}
