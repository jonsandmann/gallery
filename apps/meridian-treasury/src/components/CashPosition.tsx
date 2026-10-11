import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowDownLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, ChevronLeft, ChevronRight, Download, FileText, X } from "lucide-react";
import clsx from "clsx";
import { Badge, Button, Entrance, Kpi, NumberValue, Segmented, Select, Table, Tabs, Tile, Tooltip, ease, focus } from "./ui/meridian";
import { adjustedEntities, entities, flows, paths, scenarios, weeks, type Entity, type Scenario } from "./ui/cash-data";
import CashForecast from "./ui/CashForecast";
import { MeridianHeader, MeridianRail } from "./ui/MeridianChrome";
const documents: Record<string, string[]> = {
  "Cash forecast": ["13-week rolling forecast · v26.40", "FY2027 liquidity plan · Draft", "Forecast accuracy · September"],
  Payments: ["Payment run · 07 Oct · USD 28.6m", "Capex settlement · 12 Oct · USD 86.4m", "Bond coupon · 15 Oct · USD 17.8m"],
  "Bank accounts": ["Operating accounts · 86", "Cash pool participants · 12", "Statements received · 86 of 86"],
  "FX exposure": ["EUR / USD · 1.0920", "GBP / USD · 1.3080", "Net EUR cash · USD 418.0m"],
  "Debt & funding": ["Revolving credit facility · USD 600.0m undrawn", "2029 senior notes · 4.75%", "Next coupon · 15 Oct"],
  Reports: ["Daily cash report · 02 Oct 2026", "Liquidity committee · September", "Bank reconciliation · September"],
  Policies: ["Minimum group liquidity · USD 400.0m", "Counterparty limit · USD 350.0m", "Liquidity watch · USD 500.0m"],
  "Audit trail": ["07:42 · Bank statements reconciled", "07:38 · FX rates fixed", "07:31 · Entity balances consolidated"],
};
const f = (value: number) => value.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export default function CashPosition() {
  const [scenario, setScenario] = useState<Scenario>("Base");
  const [scope, setScope] = useState("All entities");
  const [date, setDate] = useState("02 Oct 2026");
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<"balance" | "name">("balance");
  const [flowTab, setFlowTab] = useState("All flows");
  const [dialog, setDialog] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [query, setQuery] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const reduced = useReducedMotion();
  const dateScale = date === "02 Oct 2026" ? 1 : 1263.2 / 1284.6;
  const baseScope = entities.filter(entity => scope === "All entities" || entity.region === scope);
  const scale = baseScope.reduce((total, entity) => total + entity.usd, 0) / 1284.6 * dateScale;
  const rows = useMemo(() => adjustedEntities(scenario)
    .filter(entity => scope === "All entities" || entity.region === scope)
    .map(entity => ({ ...entity, usd: entity.usd * dateScale }))
    .sort((a, b) => sort === "balance" ? b.usd - a.usd : a.name.localeCompare(b.name)), [scenario, scope, sort, dateScale]);
  const cash = rows.reduce((total, entity) => total + entity.usd, 0);
  const trapped = rows.filter(entity => entity.trapped).reduce((total, entity) => total + entity.usd, 0);
  const available = cash - trapped + 600 * scale;
  const min = Math.min(...paths[scenario]) * scale;
  const minWeek = paths[scenario].indexOf(Math.min(...paths[scenario])) + 1;
  const cover = cash / (24.8 * scale);
  const priorCash = 1263.2 * scale;
  const priorAvailable = priorCash - 128.6 * scale + 600 * scale;
  const breach = min < 400 * scale;
  const watch = min < 500 * scale;
  const pageCount = Math.max(1, Math.ceil(rows.length / 7));
  const visibleRows = rows.slice(page * 7, page * 7 + 7);
  const selectedFlows = flows.map(flow => ({
    ...flow,
    amount: (flow.name === "Capex milestone" && scenario === "Capex pull-forward" ? -299.2 : flow.name === "Customer receipts" && scenario === "DSO +7 days" ? 38.4 : flow.amount) * scale,
    date: flow.name === "Capex milestone" && scenario === "Capex pull-forward" ? "07 Oct" : flow.date,
  })).sort((a, b) => Number(a.date.slice(0, 2)) - Number(b.date.slice(0, 2)));
  const netFlows = selectedFlows.filter(flow => flow.category !== "Intercompany").reduce((sum, flow) => sum + flow.amount, 0);
  const changeScenario = (value: Scenario) => { setScenario(value); setPage(0); setSort("balance"); };
  const closeDialog = () => { setDialog(null); setSelectedEntity(null); setQuery(""); };

  function download(kind: "cash" | "forecast") {
    const csv = kind === "cash"
      ? ["Entity,Country,Currency,Local balance m,USD balance m,Trapped", ...rows.map(entity => [entity.name, entity.country, entity.currency, (entity.usd / entity.rate).toFixed(1), entity.usd.toFixed(1), entity.trapped ? "Yes" : "No"].join(","))].join("\n")
      : ["Week,Closing date,Closing balance USD m,Scenario", ...paths[scenario].map((value, i) => `${i + 1},${weeks[i + 4]},${(value * scale).toFixed(1)},${scenario}`)].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `meridian-${kind}-${scenario.toLowerCase().replaceAll(" ", "-")}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDownloaded(true);
    setExportOpen(false);
  }

  return <div className="relative flex h-full min-h-[960px] max-h-[960px] flex-col overflow-hidden bg-[#F4F4F4] font-body text-sm font-normal text-[#161616] tabular-nums [--text-3xl:28px] [--text-5xl:42px]">
    <MeridianHeader title="Cash Position" area="Liquidity" collapsed={railCollapsed} onAction={setDialog} />
    <div className="flex min-h-0 flex-1">
      <MeridianRail active="Cash position" collapsed={railCollapsed} onCollapse={() => setRailCollapsed(!railCollapsed)} onAction={action => action === "Cash position" ? closeDialog() : setDialog(action)} />
      <main className="grid min-h-0 min-w-0 flex-1 grid-rows-[40px_40px_104px_264px_minmax(352px,1fr)] gap-4 p-6">
        <Entrance className="flex items-center justify-between">
          <div className="flex items-center gap-4"><h1 className="font-display text-3xl">Cash Position</h1><Badge status={breach ? "breach" : watch ? "watch" : "good"}>{breach ? "Policy breach" : watch ? "Watch" : "Within policy"}</Badge>{scenario !== "Base" && <span className="text-xs text-[#525252]">Pro forma</span>}</div>
          <div className="relative flex items-center gap-4"><span className="text-xs text-[#525252]">USD reporting</span><Button primary onClick={() => setExportOpen(!exportOpen)} aria-expanded={exportOpen}>{downloaded ? "Exported" : "Export"}{downloaded ? <Check size={16} /> : <Download size={16} />}</Button>
            {exportOpen && <div className="absolute right-0 top-12 z-30 w-56 border border-[#E0E0E0] bg-white"><button className={clsx("h-10 w-full px-4 text-left hover:bg-[#F4F4F4]", focus)} onClick={() => download("cash")}>Entity balances (.csv)</button><button className={clsx("h-10 w-full px-4 text-left hover:bg-[#F4F4F4]", focus)} onClick={() => download("forecast")}>Cash forecast (.csv)</button></div>}
          </div>
        </Entrance>
        <Entrance order={1} className="grid grid-cols-[272px_304px_240px_1fr] gap-4">
          <Select label="As of" value={date} options={["02 Oct 2026", "01 Oct 2026"].map(value => ({ value, label: value }))} onChange={setDate} />
          <Select label="Entity" value={scope} options={[{ value: "All entities", label: "All entities (14)" }, { value: "Europe", label: "Europe (7)" }, { value: "Americas", label: "Americas (5)" }, { value: "Asia Pacific", label: "Asia Pacific (2)" }]} onChange={value => { setScope(value); setPage(0); }} />
          <button onClick={() => setDialog("Reporting currency")} className={clsx("flex h-10 items-center justify-between border-b border-[#8D8D8D] bg-white px-4 text-sm hover:bg-[#E8E8E8]", focus)}><span className="text-[#525252]">Currency</span><span className="font-semibold">USD</span><ChevronDown size={14} /></button>
          <div className="flex items-center justify-end gap-2 text-xs text-[#525252]"><Check size={14} className="text-[#24A148]" />86 / 86 accounts reconciled</div>
        </Entrance>
        <Entrance order={2}><Tile className="grid h-full grid-cols-4 divide-x divide-[#E0E0E0]">
          <Kpi title={scope === "All entities" ? "Group cash" : `${scope} cash`} value={cash} suffix="USD m" delta={cash - priorCash} detail={`${rows.length} entities`} info="Closing bank balances, including restricted cash. Scenarios show pro forma balances." />
          <Kpi title="Available liquidity" value={available} suffix="USD m" delta={available - priorAvailable} detail={`RCF ${f(600 * scale)}`} info={`Unrestricted cash plus undrawn RCF. Excludes USD ${f(trapped)}m trapped cash. Regional RCF is allocated by base cash share.`} />
          <Kpi title="Minimum projected" value={min} suffix="USD m" delta={min - 651.8 * scale} detail={`W${minWeek} · ${weeks[minWeek + 3]}`} breach={breach} info="Lowest weekly closing balance in the 13-week forecast. Regional forecast and policy are allocated by base cash share." />
          <Kpi title="Days of cover" value={cover} suffix="days" delta={cover - priorCash / (24.8 * scale)} detail="Cash / daily opex" info="Group cash divided by average daily operating cash outflow of USD 24.8m. Regional outflow is allocated by base cash share." />
        </Tile></Entrance>
        <Entrance order={3}><Tile className="flex h-full flex-col">
          <div className="flex h-16 shrink-0 items-center justify-between gap-4 px-5">
            <h2 className="text-base font-semibold">13-Week Cash Forecast<span className="font-normal text-[#525252]">, USD m</span></h2>
            <div className="flex items-center gap-3"><span className="text-xs text-[#525252]">Scenario</span><Segmented label="Scenario" options={scenarios} value={scenario} onChange={changeScenario} /></div>
          </div>
          <div className="flex h-4 shrink-0 items-center justify-between px-6 text-xs text-[#525252]"><div className="flex items-center gap-5"><span className="flex items-center gap-2"><span className="w-5 border-t-2 border-[#525252]" />Actual</span><span className="flex items-center gap-2 text-[#0F62FE]"><span className="w-5 border-t-2 border-dashed border-[#0F62FE]" />{scenario} forecast</span><span className="flex items-center gap-2"><span className="h-2.5 w-5 bg-[#EDF3FE]" />P10–P90</span></div><span>Weekly close · 09 Oct – 01 Jan</span></div>
          <CashForecast scenario={scenario} cash={cash} scale={scale} />
        </Tile></Entrance>
        <Entrance order={4} className="grid min-h-0 grid-cols-[minmax(0,1fr)_320px] gap-4">
          <Tile className="flex flex-col">
            <div className="flex h-12 shrink-0 items-center justify-between px-4"><div className="flex items-center gap-3"><h2 className="text-base font-semibold">Cash by entity</h2><span className="text-xs text-[#525252]">{rows.length} entities</span></div><span className="text-xs text-[#525252]">Balances in millions{scenario !== "Base" && " · pro forma"}</span></div>
            <div className="min-h-0 flex-1 overflow-auto">
              <Table>
                <thead className="sticky top-0 z-10 bg-[#F4F4F4] text-[#525252]"><tr>
                  <th><button onClick={() => { setSort(sort === "name" ? "balance" : "name"); setPage(0); }} className={clsx("flex h-8 w-full items-center gap-1", focus)}>Entity{sort === "name" && <ArrowDown size={12} />}</button></th>
                  <th>Country</th><th>Ccy</th><th className="!text-right">Balance (local)</th>
                  <th><button onClick={() => { setSort("balance"); setPage(0); }} className={clsx("ml-auto flex h-8 items-center gap-1", focus)}>Balance (USD){sort === "balance" && <ArrowDown size={12} />}</button></th><th>Trapped</th><th>Share</th>
                </tr></thead>
                <tbody>
                  {visibleRows.map(entity => {
                    const original = entities.find(item => item.id === entity.id)!;
                    const affected = Math.abs(entity.usd - original.usd * dateScale) > 0.01;
                    const share = entity.usd / cash * 100;
                    return <motion.tr key={entity.id} layout="position" transition={{ duration: reduced ? 0 : 0.6, ease }} className={clsx("group hover:bg-[#F4F4F4]", affected && "bg-[#F7F9FF]")}>
                      <td><button onClick={() => { setSelectedEntity(entity); setDialog("Entity detail"); }} className={clsx("flex h-7 items-center text-left group-hover:text-[#0F62FE]", focus)}>{entity.name}</button></td>
                      <td className="text-[#525252]">{entity.country}</td><td className="font-mono text-[#525252]">{entity.currency}</td>
                      <td className="text-right font-mono"><NumberValue value={entity.usd / entity.rate} /></td>
                      <td className={clsx("text-right font-mono", affected && "text-[#0F62FE]")}><NumberValue value={entity.usd} /></td>
                      <td><Badge status={entity.trapped ? "watch" : "neutral"}>{entity.trapped ? "Yes" : "No"}</Badge></td>
                      <td><div className="flex items-center gap-2"><svg width="48" height="8" viewBox="0 0 48 8" aria-hidden="true" className="shrink-0"><rect width="48" height="8" fill="#F4F4F4" /><motion.rect animate={{ width: share / Math.max(35, ...rows.map(row => row.usd / cash * 100)) * 48 }} transition={{ duration: reduced ? 0 : 0.6, ease }} height="8" fill={entity.usd === Math.max(...rows.map(row => row.usd)) ? "#0F62FE" : "#A8A8A8"} /></svg><span className="w-9 text-right font-mono text-[#525252]"><NumberValue value={share} />%</span></div></td>
                    </motion.tr>;
                  })}
                </tbody>
              </Table>
            </div>
            <div className="flex h-[46px] shrink-0 items-center justify-between border-t border-[#E0E0E0] bg-[#F4F4F4] px-4 text-xs">
              <div className="flex items-center gap-4"><span className="font-semibold">{scope === "All entities" ? "Group total" : `${scope} total`}</span><span className="font-mono font-semibold"><NumberValue value={cash} /><span className="ml-2 font-body font-normal text-[#525252]">USD m</span></span></div>
              <div className="flex items-center gap-3 text-[#525252]"><span>{page * 7 + 1}–{Math.min(page * 7 + 7, rows.length)} of {rows.length}</span><button aria-label="Previous entities" disabled={page === 0} onClick={() => setPage(page - 1)} className={clsx("flex h-8 w-8 items-center justify-center hover:bg-[#E0E0E0] disabled:opacity-30", focus)}><ChevronLeft size={16} /></button><button aria-label="Next entities" disabled={page >= pageCount - 1} onClick={() => setPage(page + 1)} className={clsx("flex h-8 w-8 items-center justify-center hover:bg-[#E0E0E0] disabled:opacity-30", focus)}><ChevronRight size={16} /></button></div>
            </div>
          </Tile>
          <Tile className="flex flex-col">
            <div className="flex h-12 shrink-0 items-center justify-between px-4"><h2 className="text-base font-semibold">Largest flows<span className="font-normal text-[#525252]">, next 14 days</span></h2><Tooltip text="Dated cash movements, 03–16 October. Intercompany transfers are excluded from net external flows. Regional views use allocated amounts." /></div>
            <Tabs value={flowTab} options={["All flows", "External"]} onChange={setFlowTab} />
            <div className="min-h-0 flex-1">{selectedFlows.filter(flow => flowTab === "All flows" || flow.category !== "Intercompany").map(flow => <button key={flow.name} onClick={() => setDialog(flow.name)} className={clsx("flex h-10 w-full items-center gap-2 border-b border-[#E0E0E0] px-4 text-left hover:bg-[#F4F4F4]", focus)}>
              <span className="w-10 shrink-0 text-xs text-[#525252]">{flow.date}</span><div className="min-w-0 flex-1"><div className="truncate text-xs">{flow.name}</div><div className="truncate text-xs text-[#8D8D8D]">{flow.entity}</div></div><span className="font-mono text-xs"><NumberValue value={flow.amount} signed /></span>{flow.amount > 0 ? <ArrowDownLeft size={12} className="text-[#525252]" /> : <ArrowUpRight size={12} className="text-[#525252]" />}
            </button>)}</div>
            <div className="flex h-[62px] shrink-0 items-center justify-between border-t border-[#E0E0E0] bg-[#F4F4F4] px-4"><div><div className="text-xs font-semibold">Net external flows</div><div className="mt-1 text-xs text-[#525252]">Intercompany excluded</div></div><div className="text-right"><span className="font-mono text-base"><NumberValue value={netFlows} signed /></span><div className="text-xs text-[#525252]">USD m</div></div></div>
          </Tile>
        </Entrance>
      </main>
    </div>
    <AnimatePresence>
      {dialog && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.2 }} className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 p-10" onClick={closeDialog}>
        <motion.section role="dialog" aria-modal="true" aria-label={dialog} onClick={e => e.stopPropagation()} onKeyDown={e => { if (e.key === "Escape") closeDialog(); if (e.key === "Tab") { const items = e.currentTarget.querySelectorAll<HTMLElement>("button, input, select, [tabindex='0']"); const first = items[0], last = items[items.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); } } }} initial={reduced ? false : { y: 8 }} animate={{ y: 0 }} transition={{ duration: 0.3, ease }} className="w-[560px] border border-[#E0E0E0] bg-white">
          <div className="flex h-16 items-center justify-between border-b border-[#E0E0E0] px-6"><h2 className="text-xl">{selectedEntity?.name || dialog}</h2><button autoFocus onClick={closeDialog} aria-label="Close dialog" className={clsx("flex h-10 w-10 items-center justify-center hover:bg-[#F4F4F4]", focus)}><X size={20} /></button></div>
          <div className="p-6">
            {selectedEntity ? <><div className="mb-6 flex gap-3"><Badge>{selectedEntity.id}</Badge><Badge>{selectedEntity.country}</Badge><Badge status={selectedEntity.trapped ? "watch" : "good"}>{selectedEntity.trapped ? "Trapped cash" : "Unrestricted"}</Badge></div><div className="grid grid-cols-2 gap-6"><div><div className="text-xs text-[#525252]">Balance, USD m</div><div className="mt-2 text-3xl">{f(selectedEntity.usd)}</div></div><div><div className="text-xs text-[#525252]">Balance, {selectedEntity.currency} m</div><div className="mt-2 text-3xl">{f(selectedEntity.usd / selectedEntity.rate)}</div></div></div><div className="mt-6 border-t border-[#E0E0E0] pt-4 text-xs text-[#525252]">{scenario} · {date} · Reconciled 07:42 UTC</div></>
              : dialog === "Search" ? <><input aria-label="Search treasury" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search entity names or IDs" className={clsx("mb-4 h-10 w-full border-b border-[#8D8D8D] bg-[#F4F4F4] px-3", focus)} /><div className="max-h-80 overflow-auto">{entities.filter(entity => entity.name.toLowerCase().includes(query.toLowerCase()) || entity.id.toLowerCase().includes(query.toLowerCase())).map(entity => <button key={entity.id} onClick={() => setSelectedEntity(adjustedEntities(scenario).map(item => ({ ...item, usd: item.usd * dateScale })).find(row => row.id === entity.id)!)} className={clsx("flex h-10 w-full items-center justify-between border-b border-[#E0E0E0] px-3 hover:bg-[#F4F4F4]", focus)}>{entity.name}<span className="font-mono text-xs text-[#525252]">{entity.id}</span></button>)}</div>{entities.every(entity => !entity.name.toLowerCase().includes(query.toLowerCase()) && !entity.id.toLowerCase().includes(query.toLowerCase())) && <p className="text-[#525252]">No matching entities.</p>}</>
              : dialog === "Reporting currency" ? <><div className="mb-4 flex justify-between"><span>Group reporting currency</span><Badge>USD</Badge></div><Table><thead className="bg-[#F4F4F4]"><tr><th>Currency</th><th>USD per unit</th><th>Rate date</th></tr></thead><tbody>{[...new Map(entities.map(entity => [entity.currency, entity])).values()].map(entity => <tr key={entity.currency}><td>{entity.currency}</td><td className="font-mono">{(entity.rate * (scenario === "EUR -5%" && entity.currency === "EUR" ? 0.95 : 1)).toFixed(4)}</td><td>{date}</td></tr>)}</tbody></Table></>
              : dialog === "Notifications" ? <div className="space-y-4"><Badge status={breach ? "breach" : "good"}>{breach ? "Scenario policy breach" : "All accounts reconciled"}</Badge><div>{breach ? `Week ${minWeek} projected cash: USD ${f(min)}m. Policy minimum: USD ${f(400 * scale)}m.` : "86 bank accounts reconciled at 07:42 UTC."}</div><div className="border-t border-[#E0E0E0] pt-4 text-xs text-[#525252]">Next statement import · 11:00 UTC</div></div>
              : dialog === "Profile" ? <><div className="text-base font-semibold">Amelia Laurent</div><div className="mt-1 text-[#525252]">Group Treasurer · Velmora Group</div><div className="mt-6 flex gap-3"><Badge>Production</Badge><Badge>USD reporting</Badge><Badge>UTC</Badge></div></>
              : dialog === "Help" ? <div className="space-y-4 text-[#525252]"><p className="max-w-measure">Select a scenario to revalue cash balances and the 13-week forecast. All figures are illustrative, in millions.</p><p className="max-w-measure">Available liquidity excludes trapped cash and includes the undrawn revolving credit facility. Regional forecasts, facilities and policy limits are allocated by base cash share.</p><p className="max-w-measure">Entity balances are sorted by USD balance. Select an entity for local-currency detail, or export the full view as CSV.</p></div>
              : documents[dialog] ? <div>{documents[dialog].map(item => <div key={item} className="flex min-h-12 items-center gap-3 border-b border-[#E0E0E0] py-3"><FileText size={16} className="shrink-0 text-[#525252]" />{item}</div>)}</div>
              : <>{selectedFlows.filter(flow => flow.name === dialog).map(flow => <div key={flow.name}><div className="flex items-center justify-between"><Badge>{flow.category}</Badge><span className="text-xs text-[#525252]">{flow.date} 2026</span></div><div className="my-6 text-5xl font-light">{flow.amount > 0 ? "+" : ""}{f(flow.amount)}<span className="ml-3 text-sm text-[#525252]">USD m</span></div><div className="text-[#525252]">{flow.entity}</div><div className="mt-6 border-t border-[#E0E0E0] pt-4 text-xs">Status: scheduled · {scenario}{flow.category === "Intercompany" && " · Eliminated on consolidation"}</div></div>)}</>}
          </div>
          <div className="flex justify-end border-t border-[#E0E0E0] bg-[#F4F4F4] p-4"><Button onClick={closeDialog}>Close<ArrowRight size={16} /></Button></div>
        </motion.section>
      </motion.div>}
    </AnimatePresence>
  </div>;
}
