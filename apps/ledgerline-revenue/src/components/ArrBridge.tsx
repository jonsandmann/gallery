import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "framer-motion";
import { ArrowDownToLine, ArrowRight, CalendarDays, Check, Globe2, Search, SlidersHorizontal, X } from "lucide-react";
import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip as ChartTooltip, YAxis } from "recharts";
import { clsx } from "clsx";
import { AnimatedNumber, Badge, Button, Card, Kpi, Segmented, Select, Table, Tooltip, chartTheme, useQuietMotion } from "./ui/ledgerline";
import { Dialog, LedgerChrome, ownsShortcut } from "./ui/LedgerChrome";
import { getAccounts, getLedger, segmentOptions, segments, stages, type Account } from "./ledgerData";

const barColors = ["bg-[#0070F3]", "bg-black", "bg-black", "bg-[#E5484D]", "bg-[#E5484D]", "bg-[#0070F3]"];
const textColors = ["text-[#0070F3]", "text-black", "text-black", "text-[#E5484D]", "text-[#E5484D]", "text-[#0070F3]"];
const regionOptions = ["All regions", "Americas", "EMEA", "APAC"];
const periods = ["Q3 FY26", "Q2 FY26"];
const number = (value: number) => value.toLocaleString("en-US");
const money = (value: number, symbol: string, decimals = 1) => `${symbol}${Math.abs(value).toFixed(decimals)}m`;
const accountMoney = (value: number, symbol: string) => value >= 1_000_000 ? `${symbol}${(value / 1_000_000).toFixed(2)}m` : `${symbol}${(value / 1000).toFixed(1)}k`;
const segmentShort = { Enterprise: "Ent.", "Mid-market": "Mid.", SMB: "SMB" };

function Sparkline({ value, target, mode, period, reduced }: { value: number; target: number; mode: "nrr" | "grr" | "churn"; period: string; reduced: boolean }) {
  const adjustments = mode === "nrr" ? [-5.2, -4.7, -4.9, -3.8, -3.1, -3.4, -2.6, -1.5, -1.9, -0.8, -1.1, 0] : mode === "grr" ? [-0.9, -0.6, -0.8, -0.35, -0.1, -0.5, 0.15, 0.3, -0.25, 0.2, -0.15, 0] : [0.7, 0.55, 0.7, 0.4, 0.3, 0.45, 0.2, 0.3, 0.1, 0.25, 0.1, 0];
  const months = period === "Q3 FY26" ? ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"] : ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const data = adjustments.map((offset, i) => ({ month: months[i], value: Math.max(0, value + offset) }));
  const domain = mode === "nrr" ? [Math.min(value - 7, target - 3), Math.max(value + 2, target + 3)] : mode === "grr" ? [Math.min(value - 2, target - 1), Math.max(value + 1, target + 1)] : [0.5, Math.max(value + 1.1, target + 0.7)];
  return <div className="mt-auto">
    <div className="h-[77px]" aria-label={`${mode === "nrr" ? "Net revenue retention" : mode === "grr" ? "Gross revenue retention" : "Logo churn"} trend, twelve months, target ${target}%`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 1, right: 102, top: 10, bottom: 2 }}>
          <YAxis hide domain={domain} />
          <ReferenceLine y={target} stroke="#CCCCCC" strokeDasharray="3 4" label={{ value: `${target}% target`, position: "right", fill: chartTheme.muted, fontSize: 13, fontFamily: chartTheme.font }} />
          <ChartTooltip cursor={false} content={({ active, payload }) => active && payload?.length ? <div className="rounded-md border border-[#EAEAEA] bg-white px-3 py-2 font-mono text-xs shadow-sm">{payload[0].payload.month} <span className="ml-2 text-black">{Number(payload[0].value).toFixed(1)}%</span></div> : null} />
          <Line dataKey="value" type="monotone" stroke="#111111" strokeWidth={1.7} dot={false} activeDot={{ r: 3, stroke: "white", strokeWidth: 2 }} isAnimationActive={!reduced} animationDuration={400} animationEasing="ease-out" />
        </LineChart>
      </ResponsiveContainer>
    </div>
    <div className="flex justify-between font-mono text-xs text-[#8F8F8F]"><span>{period === "Q3 FY26" ? "Oct 2025" : "Jul 2025"}</span><span>{period === "Q3 FY26" ? "Sep 2026" : "Jun 2026"}</span></div>
  </div>;
}

function AccountRows({ accounts, stage, symbol, onAccount }: { accounts: Account[]; stage: number; symbol: string; onAccount: (a: Account) => void }) {
  const max = accounts[0]?.amount || 1;
  return <>{accounts.map((account, index) => <tr key={account.id} className="group h-6 border-b border-[#EAEAEA]/70 last:border-0">
    <td className="pr-2">
      <button onClick={() => onAccount(account)} className="flex h-[23px] w-full items-center gap-2 rounded text-left focus-visible:outline-2 focus-visible:outline-[#0070F3]">
        <span className="w-4 shrink-0 font-mono text-xs text-[#8F8F8F]">{String(index + 1).padStart(2, "0")}</span>
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-[#EAEAEA] bg-[#FAFAFA] font-mono text-xs text-[#666]">{account.name.split(" ").map(s => s[0]).slice(0, 2).join("")}</span>
        <span className="truncate font-medium text-[#333] group-hover:text-[#0070F3]">{account.name}</span>
      </button>
    </td>
    <td className="whitespace-nowrap pr-3 text-[#8F8F8F]" title={`${account.plan} / ${account.segment}`}>{account.plan}<span className="px-1 text-[#CCC]">/</span>{segmentShort[account.segment]}</td>
    <td className="w-[94px]">
      <div className={clsx("text-right font-mono text-xs", textColors[stage])}>{stage === 3 || stage === 4 ? "-" : stage !== 0 && stage !== 5 ? "+" : ""}{accountMoney(account.amount, symbol)}</div>
      <svg viewBox="0 0 100 2" className="ml-auto h-0.5 w-[76px]" aria-hidden="true"><motion.rect initial={false} animate={{ width: account.amount / max * 100 }} height="2" className={stage === 3 || stage === 4 ? "fill-[#E5484D]/60" : stage === 0 || stage === 5 ? "fill-[#0070F3]/60" : "fill-black/60"} /></svg>
    </td>
  </tr>)}</>;
}

export default function ArrBridge() {
  const root = useRef<HTMLDivElement>(null);
  const [period, setPeriod] = useState("Q3 FY26");
  const [segment, setSegment] = useState("All");
  const [region, setRegion] = useState("All regions");
  const [currency, setCurrency] = useState("USD");
  const [selected, setSelected] = useState<number | null>(null);
  const [dialog, setDialog] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [account, setAccount] = useState<Account | null>(null);
  const [accountStage, setAccountStage] = useState(5);
  const [exported, setExported] = useState(false);
  const reduced = useQuietMotion();
  const symbol = currency === "EUR" ? "\u20ac" : "$";
  const ledger = useMemo(() => getLedger(period, segment, region, currency), [period, segment, region, currency]);
  const prior = useMemo(() => getLedger("Q2 FY26", segment, region, currency), [segment, region, currency]);
  const selectedStage = selected ?? 5;
  const ranked = useMemo(() => getAccounts(ledger, selectedStage).slice(0, 12), [ledger, selectedStage]);
  const allAccounts = useMemo(() => getAccounts(ledger, 5), [ledger]);
  const net = ledger.values[5] - ledger.values[0];
  const growth = net / ledger.values[0] * 100;
  const listedTotal = ranked.reduce((total, a) => total + a.amount, 0);
  const remainingTotal = Math.max(0, Math.round(Math.abs(ledger.values[selectedStage]) * 1_000_000) - listedTotal);
  const dateRange = period === "Q3 FY26" ? "Jul 1 - Sep 30, 2026" : "Apr 1 - Jun 30, 2026";
  const transition = { duration: reduced ? 0 : 0.4, ease: chartTheme.ease };
  const closeDialog = () => { setDialog(null); setAccount(null); };
  const openAccount = (value: Account, stage = selectedStage) => { setAccount(value); setAccountStage(stage); setDialog("Account"); };

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (!ownsShortcut(root.current)) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setSearch(""); setDialog(current => current === "Search" ? null : "Search"); }
      if (event.key === "Escape") { if (dialog) { setDialog(null); setAccount(null); } else setSelected(null); }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [dialog]);
  useEffect(() => {
    if (!exported) return;
    const timer = setTimeout(() => setExported(false), 2000);
    return () => clearTimeout(timer);
  }, [exported]);

  function exportCsv() {
    const rows = ["Stage,ARR,Accounts,Period,Segment,Region,Currency", ...stages.map((stage, i) => `${stage},${Math.round(ledger.values[i] * 1_000_000)},${ledger.counts[i]},${period},${segment},${region},${currency}`)];
    const url = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = `ledgerline-arr-${period.replaceAll(" ", "-").toLowerCase()}.csv`; link.click();
    URL.revokeObjectURL(url); setExported(true);
  }

  const peak = ledger.values[0] + ledger.values[1] + ledger.values[2];
  const base = Math.floor(ledger.values[0] * 0.875 / (ledger.values[0] > 100 ? 10 : 1)) * (ledger.values[0] > 100 ? 10 : 1);
  const ceiling = Math.ceil(peak * 1.025 / (peak > 100 ? 10 : 1)) * (peak > 100 ? 10 : 1);
  const span = ceiling - base;
  const chartHeight = 222;
  const valueY = (v: number) => (v - base) / span * chartHeight;
  let cumulative = ledger.values[0];
  const barGeometry = ledger.values.map((v, i) => {
    if (i === 0 || i === 5) return { height: valueY(v), bottom: 0, end: v };
    const start = cumulative;
    cumulative += v;
    return { height: Math.abs(v) / span * chartHeight, bottom: valueY(Math.min(start, cumulative)), end: cumulative };
  });
  const tickMagnitude = 10 ** Math.floor(Math.log10(span / 3));
  const tickStep = Math.ceil(span / 3 / tickMagnitude) * tickMagnitude;
  const gridValues = [base, base + tickStep, base + tickStep * 2, ceiling].filter((v, i, values) => v <= ceiling && values.indexOf(v) === i);
  const change = (value: number, previous: number) => `${value - previous >= 0 ? "+" : ""}${(value - previous).toFixed(1)} pp`;
  const currentGrRChange = period === "Q3 FY26" ? ledger.grr - prior.grr : 0.4;
  const currentLogoChange = period === "Q3 FY26" ? ledger.logoChurn - prior.logoChurn : -0.2;

  return <MotionConfig reducedMotion="user" transition={transition}><LayoutGroup id="ledgerline-arr">
    <div ref={root} data-ledger-screen="arr-bridge" className="relative flex h-full min-h-[960px] flex-col bg-white font-body text-sm text-black tabular-nums [--text-xs:13px] [--text-3xl:32px] [--text-2xl--letter-spacing:-0.02em] [--text-3xl--letter-spacing:-0.02em] [--text-5xl--letter-spacing:-0.02em]">
      <LedgerChrome title="ARR Bridge" active="ARR" onNavigate={tab => tab === "ARR" ? closeDialog() : setDialog(tab)} onSearch={() => { setSearch(""); setDialog("Search"); }} onProfile={() => setDialog("Profile")} onWorkspace={() => setDialog("Workspace")} />

      <main className="flex min-h-0 flex-1 flex-col px-10 pb-5 pt-7">
        <div className="flex h-10 shrink-0 items-center justify-between">
          <div className="flex items-center gap-4"><h1 className="font-display text-2xl font-semibold">ARR Bridge</h1><Select value={period} options={periods} onChange={setPeriod} label="Reporting period" icon={<CalendarDays size={14} />} /></div>
          <Segmented options={segmentOptions} value={segment} onChange={setSegment} />
        </div>
        <div className="mb-5 mt-4 flex h-8 shrink-0 items-center justify-between">
          <div className="flex items-center gap-2"><Select label="Region" value={region} options={regionOptions} onChange={setRegion} icon={<Globe2 size={14} />} /><Select label="Currency" value={currency} options={["USD", "EUR"]} onChange={setCurrency} /><span className="mx-2 h-4 w-px bg-[#EAEAEA]" /><span className="font-mono text-xs text-[#8F8F8F]">{dateRange}</span>{currency === "EUR" && <Badge>FX 0.9200</Badge>}</div>
          <Button onClick={exportCsv}>{exported ? <Check size={14} /> : <ArrowDownToLine size={14} />}{exported ? "Exported" : "Export"}</Button>
        </div>

        <motion.div initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="h-[448px] shrink-0">
          <Card className="flex h-full overflow-hidden">
            <motion.div layout className="flex min-w-0 flex-1 flex-col px-6 pt-5">
              <div className="flex shrink-0 items-start justify-between">
                <div><div className="flex items-center gap-2"><h2 className="text-sm font-medium">ARR movement</h2><Tooltip text="Annualized recurring revenue at quarter end. Gains and losses reconcile to closing ARR. Constant currency; non-recurring revenue excluded." /></div><span className="mt-1 block text-xs text-[#8F8F8F]">{currency}, millions</span></div>
                <div className="text-right"><div className="flex items-center justify-end gap-2.5"><span className="text-xs text-[#666]">Net change</span><span className="font-mono text-base font-medium"><AnimatedNumber value={Math.abs(net)} prefix={`${net >= 0 ? "+" : "-"}${symbol}`} suffix="m" /></span><Badge tone={net >= 0 ? "gain" : "loss"}>{growth >= 0 ? "+" : ""}{growth.toFixed(1)}%</Badge></div><span className="mt-1 block text-xs text-[#8F8F8F]">Quarter over quarter</span></div>
              </div>
              <div className="relative mt-auto h-[296px] shrink-0" aria-label="ARR waterfall chart">
                <div className="absolute bottom-[46px] left-12 right-0 h-[222px]">
                  {gridValues.map((value, i) => <motion.div key={i} initial={false} animate={{ y: -valueY(value) }} className={clsx("absolute inset-x-0 bottom-0 border-t", i === 0 ? "border-[#DCDCDC]" : "border-[#EAEAEA]/75")}><span className="absolute -left-12 -top-2.5 w-9 text-right font-mono text-xs text-[#8F8F8F]">{Number(value.toFixed(1))}</span></motion.div>)}
                  <div className="absolute inset-0 flex">
                    {stages.map((stage, i) => <div key={stage} className="relative h-full min-w-0 flex-1">
                      {i < 5 && <motion.div initial={false} animate={{ y: -valueY(barGeometry[i].end), opacity: selected === null ? 1 : 0.2 }} className="absolute bottom-0 left-[77%] z-0 w-[46%] border-t border-[#BFBFBF]" />}
                      <motion.div initial={false} animate={{ opacity: selected === null || selected === i ? 1 : 0.2 }} className="absolute inset-0">
                        <motion.button
                          initial={false}
                          animate={{ height: barGeometry[i].height, y: -barGeometry[i].bottom }}
                          onClick={() => setSelected(current => current === i ? null : i)}
                          aria-label={`${stage}, ${i > 0 && i < 5 ? ledger.values[i] < 0 ? "minus " : "plus " : ""}${money(ledger.values[i], symbol)}, ${ledger.counts[i]} accounts. ${selected === i ? "Close" : "Open"} account breakdown.`}
                          aria-pressed={selected === i}
                          className={clsx("group absolute bottom-0 left-[23%] z-10 w-[54%] cursor-pointer rounded-t-sm outline-offset-4 transition-[filter] hover:brightness-90 focus-visible:outline-2 focus-visible:outline-[#0070F3]", barColors[i])}
                        >
                          {selected !== i && <motion.div layoutId={`bar-color-${i}`} className={clsx("pointer-events-none absolute inset-0 rounded-t-sm", barColors[i])} />}
                          <span className={clsx("pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-sm font-medium", textColors[i])}>{i > 0 && i < 5 ? ledger.values[i] < 0 ? "-" : "+" : ""}<AnimatedNumber value={Math.abs(ledger.values[i])} prefix={symbol} /></span>
                          <span className="pointer-events-none absolute inset-0 rounded-t-sm border border-black/0 group-hover:border-black/15" />
                          <span className="pointer-events-none absolute bottom-2 left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded bg-white/20 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"><ArrowRight size={12} /></span>
                          {(i === 0 || i === 5) && <svg className="pointer-events-none absolute -bottom-1 left-0 h-3 w-full" preserveAspectRatio="none" viewBox="0 0 100 12" aria-hidden="true"><path d="M0 7 L100 2 M0 12 L100 7" fill="none" stroke="white" strokeWidth="2" /></svg>}
                        </motion.button>
                      </motion.div>
                      <motion.div animate={{ opacity: selected === null || selected === i ? 1 : 0.3 }} className="absolute -bottom-[40px] inset-x-0 text-center">
                        <button onClick={() => setSelected(current => current === i ? null : i)} className={clsx("rounded px-1 py-0.5 text-xs font-medium hover:bg-[#FAFAFA] focus-visible:outline-2 focus-visible:outline-[#0070F3]", selected === i ? textColors[i] : "text-[#444]")}>{stage}</button>
                      </motion.div>
                    </div>)}
                  </div>
                </div>
              </div>
              <div className="mt-auto flex h-[54px] shrink-0 items-center justify-between gap-2 border-t border-[#EAEAEA] text-xs text-[#8F8F8F]">
                {selected === null ? <span className="flex items-center gap-2"><SlidersHorizontal size={13} />Select a movement to view accounts</span> : <button onClick={() => setSelected(null)} className="flex items-center gap-2 rounded hover:text-black focus-visible:outline-2 focus-visible:outline-[#0070F3]"><X size={13} />Clear selection<kbd className="rounded border border-[#EAEAEA] px-1 font-mono text-xs">esc</kbd></button>}
                <span className="whitespace-nowrap font-mono text-xs">Axis {symbol}{number(base)}m-{symbol}{number(ceiling)}m</span>
              </div>
            </motion.div>
            <AnimatePresence initial={false}>
              {selected !== null && <motion.aside key="accounts" initial={{ width: 0, opacity: 0 }} animate={{ width: 490, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={transition} aria-label={`${stages[selected]} accounts`} className="relative shrink-0 overflow-hidden border-l border-[#EAEAEA] bg-[#FAFAFA]/40">
                <motion.div layoutId={`bar-color-${selected}`} className={clsx("absolute inset-x-0 top-0 h-0.5", barColors[selected])} />
                <div className="flex h-full w-[489px] flex-col px-4 pt-4">
                  <div className="flex items-start justify-between">
                    <div><div className="flex items-center gap-2"><h3 className="text-sm font-medium">{stages[selected]}</h3><span className="font-mono text-xs text-[#8F8F8F]">{number(ledger.counts[selected])}</span></div><span className="mt-0.5 block text-xs text-[#8F8F8F]">Top <span className="font-mono">{ranked.length}</span> accounts by {selected === 0 || selected === 5 ? "ARR" : "contribution"}</span></div>
                    <div className="flex items-center gap-3"><span className={clsx("font-mono text-base font-medium", textColors[selected])}>{selected > 0 && selected < 5 ? ledger.values[selected] < 0 ? "-" : "+" : ""}{money(ledger.values[selected], symbol)}</span><button aria-label="Close account breakdown" onClick={() => setSelected(null)} className="rounded p-1 text-[#8F8F8F] hover:bg-[#EAEAEA] hover:text-black focus-visible:outline-2 focus-visible:outline-[#0070F3]"><X size={14} /></button></div>
                  </div>
                  <div className="mt-3 min-h-0 flex-1 overflow-auto">
                    <Table headers={["Account", "Plan / segment", selected === 0 || selected === 5 ? "ARR" : "ARR delta"]}><AccountRows accounts={ranked} stage={selected} symbol={symbol} onAccount={openAccount} /></Table>
                  </div>
                  <div className="mt-2 flex h-10 shrink-0 items-center justify-between border-t border-[#EAEAEA] text-xs text-[#8F8F8F]"><span>Other <span className="font-mono">{number(ledger.counts[selected] - ranked.length)}</span> accounts</span><span className="font-mono">{selected === 3 || selected === 4 ? "-" : selected === 0 || selected === 5 ? "" : "+"}{accountMoney(remainingTotal, symbol)}</span></div>
                </div>
              </motion.aside>}
            </AnimatePresence>
          </Card>
        </motion.div>

        <div className="mt-5 grid h-[194px] shrink-0 grid-cols-3 gap-5">
          {[
            { label: "Net revenue retention", value: ledger.nrr, target: 110, mode: "nrr" as const, change: period === "Q3 FY26" ? change(ledger.nrr, prior.nrr) : "+1.2 pp", loss: false, detail: "Trailing 12m", tooltip: "Closing ARR from the same customer cohort divided by its ARR 12 months ago. Excludes new logos. Change versus prior quarter." },
            { label: "Gross revenue retention", value: ledger.grr, target: 95, mode: "grr" as const, change: `${currentGrRChange >= 0 ? "+" : ""}${currentGrRChange.toFixed(1)} pp`, loss: currentGrRChange < 0, detail: "Quarterly", tooltip: "Opening ARR less contraction and churn, divided by opening ARR. Excludes new logos and expansion. Change versus prior quarter." },
            { label: "Logo churn", value: ledger.logoChurn, target: 2, mode: "churn" as const, change: `${currentLogoChange >= 0 ? "+" : ""}${currentLogoChange.toFixed(1)} pp`, loss: currentLogoChange > 0, detail: `${number(ledger.counts[4])} accounts`, tooltip: "Churned accounts divided by opening accounts for the selected quarter. Target: below 2%. Change versus prior quarter." },
          ].map((metric, index) => <motion.div key={metric.mode} initial={reduced ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...transition, delay: reduced ? 0 : 0.06 + index * 0.04 }}>
            <Kpi label={metric.label} value={metric.value} change={metric.change} detail={metric.detail} tooltip={metric.tooltip} changeTone={metric.loss ? "loss" : "gain"}><Sparkline value={metric.value} target={metric.target} mode={metric.mode} period={period} reduced={reduced} /></Kpi>
          </motion.div>)}
        </div>
        <footer className="mt-4 flex h-[18px] shrink-0 items-center justify-between text-xs text-[#8F8F8F]"><span className="flex items-center gap-1.5"><Check size={12} />Reconciled<span className="mx-2 text-[#D0D0D0]">/</span><span className="font-mono"><AnimatedNumber value={ledger.counts[5]} decimals={0} /></span>active accounts</span><span>Fiscal year ends <span className="font-mono">Dec 31</span><span className="mx-3 text-[#D0D0D0]">/</span>Constant currency</span></footer>
      </main>

      <AnimatePresence>
        {dialog && <Dialog key={dialog} title={dialog === "Account" && account ? account.name : dialog === "Search" ? "Search Ledgerline" : dialog === "Profile" ? "Your account" : dialog === "Workspace" ? "Workspace" : dialog} onClose={closeDialog}>
          {dialog === "Search" ? <div className="p-5">
            <div className="flex items-center gap-3 rounded-md border border-[#EAEAEA] px-3"><Search size={16} className="text-[#8F8F8F]" /><input aria-label="Search accounts and reports" autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search accounts or ARR movements..." className="h-11 flex-1 bg-transparent text-sm outline-none" /><kbd className="font-mono text-xs text-[#8F8F8F]">esc</kbd></div>
            <div className="mt-4 max-h-[410px] overflow-auto">
              {stages.filter(stage => stage.toLowerCase().includes(search.toLowerCase())).map(stage => <button key={stage} onClick={() => { setSelected(stages.indexOf(stage)); closeDialog(); }} className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm hover:bg-[#FAFAFA] focus-visible:outline-[#0070F3]"><span>ARR Bridge / {stage}</span><ArrowRight size={14} className="text-[#8F8F8F]" /></button>)}
              {allAccounts.filter(a => `${a.name} ${a.id}`.toLowerCase().includes(search.toLowerCase())).slice(0, 8).map(a => <button key={a.id} onClick={() => openAccount(a, 5)} className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm hover:bg-[#FAFAFA]"><span>{a.name}</span><span className="font-mono text-xs text-[#8F8F8F]">{a.id}</span></button>)}
              {!stages.some(s => s.toLowerCase().includes(search.toLowerCase())) && !allAccounts.some(a => `${a.name} ${a.id}`.toLowerCase().includes(search.toLowerCase())) && <p className="py-8 text-center text-sm text-[#8F8F8F]">No matching accounts or reports.</p>}
            </div>
          </div> : dialog === "Account" && account ? <div className="p-6">
            <div className="flex items-center justify-between"><span className="font-mono text-xs text-[#8F8F8F]">{account.id}</span><Badge>{account.segment}</Badge></div>
            <div className="mt-6 grid grid-cols-2 gap-6"><div><div className="text-xs text-[#8F8F8F]">{accountStage === 0 || accountStage === 5 ? "Annual recurring revenue" : `${stages[accountStage]} ARR delta`}</div><div className="mt-2 font-mono text-3xl font-medium">{accountStage === 3 || accountStage === 4 ? "-" : ""}{accountMoney(account.amount, symbol)}</div></div><div><div className="text-xs text-[#8F8F8F]">Plan</div><div className="mt-2 text-2xl font-medium">{account.plan}</div></div></div>
            <div className="mt-6 flex justify-between border-t border-[#EAEAEA] pt-4 text-xs text-[#666]"><span>Reporting period</span><span className="font-mono">{period}</span></div>
          </div> : dialog === "Profile" ? <div className="space-y-4 p-6"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FAFAFA] font-mono">AM</div><div><p className="font-medium">Alex Morgan</p><p className="text-xs text-[#8F8F8F]">alex.morgan@ledgerline.example</p></div></div><div className="flex justify-between border-t border-[#EAEAEA] pt-4 text-xs"><span className="text-[#666]">Workspace role</span><Badge>Finance admin</Badge></div></div>
          : dialog === "Workspace" ? <div className="space-y-4 p-6"><p className="font-medium">Ledgerline, Inc.</p><div className="flex justify-between text-xs text-[#666]"><span>Consolidation</span><span>All legal entities</span></div><div className="flex justify-between text-xs text-[#666]"><span>Reporting currency</span><span className="font-mono">{currency}</span></div><div className="flex justify-between text-xs text-[#666]"><span>Billing and CRM sync</span><span className="font-mono">Oct 01, 2026 07:42 UTC</span></div></div>
          : dialog === "Accounts" ? <div className="p-6"><div className="mb-5 flex justify-between text-xs text-[#666]"><span>{segment === "All" ? "All segments" : segment} / {region}</span><span className="font-mono">{number(ledger.counts[5])} active</span></div><Table headers={["Account", "Plan / segment", "ARR"]}><AccountRows accounts={allAccounts.slice(0, 12)} stage={5} symbol={symbol} onAccount={a => openAccount(a, 5)} /></Table></div>
          : dialog === "Retention" ? <div className="p-6"><Table headers={["Metric", "Period", "Retention"]}>{[["Net revenue retention", "Trailing 12m", ledger.nrr], ["Gross revenue retention", period, ledger.grr], ["Logo churn", period, ledger.logoChurn]].map(row => <tr key={String(row[0])} className="h-12 border-b border-[#EAEAEA] last:border-0"><td>{row[0]}</td><td className="font-mono text-[#8F8F8F]">{row[1]}</td><td className="text-right font-mono">{Number(row[2]).toFixed(1)}%</td></tr>)}</Table></div>
          : dialog === "Cohorts" ? <div className="p-6"><Table headers={["Acquisition cohort", "Active accounts", "Closing ARR"]}>{["2023 and earlier", "2024", "2025", "2026"].map((year, index) => {
            const weights = [0.36, 0.24, 0.17, 0.23];
            const count = index < 3 ? Math.floor(ledger.counts[5] * weights[index]) : ledger.counts[5] - weights.slice(0, 3).reduce((sum, w) => sum + Math.floor(ledger.counts[5] * w), 0);
            const arrWeights = [0.38, 0.25, 0.19, 0.18];
            const arr = index < 3 ? Math.round(ledger.values[5] * arrWeights[index] * 10) / 10 : ledger.values[5] - arrWeights.slice(0, 3).reduce((sum, w) => sum + Math.round(ledger.values[5] * w * 10) / 10, 0);
            return <tr key={year} className="h-12 border-b border-[#EAEAEA] last:border-0"><td className="font-mono">{year}</td><td className="font-mono">{number(count)}</td><td className="text-right font-mono">{money(arr, symbol)}</td></tr>;
          })}</Table></div>
          : <div className="p-6"><div className="mb-6 flex items-center justify-between"><div><p className="text-xs text-[#8F8F8F]">Closing ARR</p><p className="mt-2 font-mono text-3xl font-medium">{money(ledger.values[5], symbol)}</p></div><Badge tone={growth >= 0 ? "gain" : "loss"}>{growth >= 0 ? "+" : ""}{growth.toFixed(1)}% QoQ</Badge></div><Table headers={["Segment", "Opening ARR", "Closing ARR"]}>{segments.filter(s => segment === "All" || segment === s).map(s => { const row = getLedger(period, s, region, currency); return <tr key={s} className="h-12 border-b border-[#EAEAEA] last:border-0"><td>{s}</td><td className="font-mono">{money(row.values[0], symbol)}</td><td className="text-right font-mono">{money(row.values[5], symbol)}</td></tr>; })}</Table></div>}
        </Dialog>}
      </AnimatePresence>
    </div>
  </LayoutGroup></MotionConfig>;
}
