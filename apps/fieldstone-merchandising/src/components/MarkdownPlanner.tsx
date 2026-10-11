import { useCallback, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from "recharts";
import { ArrowDownToLine, CalendarDays, Check, ChevronRight, Info, Layers3, RotateCcw, Save, Search, Shirt, Store, X } from "lucide-react";
import { clsx } from "clsx";
import { AnimatedNumber, Badge, Button, Card, chartTheme, focusClass, Kpi, Select, Table, Tooltip } from "./ui/fieldstone";
import { FieldstoneSidebar, FieldstoneTopBar, Modal } from "./ui/FieldstoneChrome";
import { channelStyle, ELASTICITY, markdownStyles, MARGIN_FLOOR, priceBounds, projectScenario, recommendation, snapPrice, weeklyDemand, type MarkdownChannel, type MarkdownStyle } from "./markdown-data";
import { integer } from "./fieldstone-data";

function PriceResponse({ style, price, recommended, onChange, reduced }: { style: MarkdownStyle; price: number; recommended: number; onChange: (price: number) => void; reduced: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pointer = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const { min, max } = priceBounds(style);
  const width = 520, left = 42, right = 494, top = 15, bottom = 139;
  const maximumDemand = Math.ceil(weeklyDemand(style, min) / 100) * 100;
  const x = (value: number) => left + (value - min) / (max - min) * (right - left);
  const y = (value: number) => bottom - value / maximumDemand * (bottom - top);
  const path = Array.from({ length: 61 }, (_, index) => {
    const point = min + (max - min) * index / 60;
    return `${index ? "L" : "M"}${x(point).toFixed(2)},${y(weeklyDemand(style, point)).toFixed(2)}`;
  }).join(" ");
  const currentX = x(style.basePrice), currentY = y(style.baseUnits);
  const recommendedX = x(recommended), recommendedY = y(weeklyDemand(style, recommended));
  const activeX = x(price), activeY = y(weeklyDemand(style, price));
  const ticks = [min, Math.round((min + (max - min) / 3) / 5) * 5, Math.round((min + (max - min) * 2 / 3) / 5) * 5, max];
  const stepKey = (event: KeyboardEvent<SVGElement | HTMLInputElement>) => {
    let next: number | undefined;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") next = (Math.floor(price / 5) + 1) * 5;
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = (Math.ceil(price / 5) - 1) * 5;
    if (event.key === "Home") next = min;
    if (event.key === "End") next = max;
    if (next !== undefined) { event.preventDefault(); onChange(snapPrice(style, next)); }
  };
  const dragTo = (clientX: number) => {
    const bounds = svgRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const svgX = (clientX - bounds.left) / bounds.width * width;
    onChange(snapPrice(style, min + (svgX - left) / (right - left) * (max - min)));
  };
  const stopDrag = (pointerId: number) => {
    if (pointer.current !== pointerId) return;
    if (svgRef.current?.hasPointerCapture(pointerId)) svgRef.current.releasePointerCapture(pointerId);
    pointer.current = null;
    setDragging(false);
  };

  return <div>
    <div className="h-[174px] w-full">
      <svg ref={svgRef} viewBox="0 0 520 174" preserveAspectRatio="none" className={clsx("h-full w-full touch-none select-none overflow-visible", dragging && "cursor-grabbing")} aria-label="Price response. Demand in units per week against price in US dollars." onPointerMove={event => { if (pointer.current === event.pointerId) dragTo(event.clientX); }} onPointerUp={event => stopDrag(event.pointerId)} onPointerCancel={event => stopDrag(event.pointerId)}>
        {[0, maximumDemand / 2, maximumDemand].map(value => <g key={value}><line x1={left} x2={right} y1={y(value)} y2={y(value)} stroke="#EEEEEE" /><text x={left - 10} y={y(value) + 4} textAnchor="end" fontSize={12} fill="#8A8A8A">{integer(value)}</text></g>)}
        {ticks.map(value => <text key={value} x={x(value)} y={161} fontSize={12} textAnchor={value === min ? "start" : value === max ? "end" : "middle"} fill="#8A8A8A">${value}</text>)}
        <motion.path initial={false} animate={{ d: path }} transition={{ duration: reduced ? 0 : .35, ease: chartTheme.ease }} fill="none" stroke={chartTheme.accent} strokeWidth={2.25} />
        <line x1={recommendedX} x2={recommendedX} y1={recommendedY} y2={bottom} stroke="#A5BFAE" strokeDasharray="3 4" />
        <rect x={recommendedX - 4} y={recommendedY - 4} width={8} height={8} rx={1} transform={`rotate(45 ${recommendedX} ${recommendedY})`} fill="white" stroke="#29845A" strokeWidth={1.5} />
        <text x={recommendedX - 9} y={recommendedY - 17} textAnchor="end" fontSize={12} fill="#29845A">Recommended ${recommended}</text>
        <circle cx={currentX} cy={currentY} r={4} fill="#999999" stroke="white" strokeWidth={1.5} />
        <text x={right} y={currentY - 15} textAnchor="end" fontSize={12} fill="#616161">Current ${style.basePrice}</text>
        <line x1={activeX} x2={activeX} y1={activeY + 9} y2={bottom} stroke="#29845A" strokeOpacity={.35} strokeDasharray="2 3" />
        <g role="slider" aria-label="Price handle" aria-orientation="horizontal" aria-valuemin={min} aria-valuemax={max} aria-valuenow={price} aria-valuetext={`$${price}; ${Math.round(weeklyDemand(style, price))} units per week`} tabIndex={0} onKeyDown={stepKey} onPointerDown={event => { event.preventDefault(); event.currentTarget.focus(); pointer.current = event.pointerId; setDragging(true); svgRef.current?.setPointerCapture(event.pointerId); }} className="group cursor-grab outline-none active:cursor-grabbing">
          <title>Drag price in $5 increments</title>
          <circle cx={activeX} cy={activeY} r={16} fill="transparent" />
          <circle cx={activeX} cy={activeY} r={12} fill="#29845A" opacity={.12} className="group-focus-visible:stroke-[#303030] group-focus-visible:stroke-2" />
          <circle cx={activeX} cy={activeY} r={7} fill="#FFFFFF" stroke="#29845A" strokeWidth={2.5} />
          <circle cx={activeX} cy={activeY} r={2.25} fill="#29845A" />
        </g>
      </svg>
    </div>
    <div className="mt-1 border-t border-[#EEEEEE] pt-2">
      <div className="mb-2 flex h-7 items-center justify-between">
        <div className="flex items-baseline gap-2"><span className="text-xs text-[#616161]">Scenario price</span><output aria-label="Selected scenario price" className="text-xl font-[550]">${price}</output><span className="text-xs text-[#8A8A8A]">{price === style.basePrice ? "Current" : price > style.basePrice ? `+${((price / style.basePrice - 1) * 100).toFixed(1)}%` : `${((1 - price / style.basePrice) * 100).toFixed(1)}% off`}</span></div>
        <button onClick={() => onChange(recommended)} className={clsx("rounded-md bg-[#E8F1EB] px-2 py-1 text-xs font-[550] text-[#216C48] hover:bg-[#DCEBDF]", focusClass)}>Use ${recommended}</button>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-[#8A8A8A]">${min}</span>
        <input type="range" aria-label="Scenario price slider" aria-valuetext={`$${price}`} min={min} max={max} step={1} value={price} onKeyDown={stepKey} onChange={event => onChange(snapPrice(style, Number(event.target.value)))} className={clsx("h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-[#E3E3E3] accent-[#29845A] [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#29845A] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#29845A] [&::-moz-range-thumb]:bg-white", focusClass)} />
        <span className="text-xs text-[#8A8A8A]">${max}</span><Tooltip content="Drag either control or use arrow keys. Changes snap to $5; Reset restores the exact current ticket price."><span className="text-xs text-[#8A8A8A]">$5 steps</span></Tooltip>
      </div>
    </div>
  </div>;
}

export default function MarkdownPlanner() {
  const reduced = !!useReducedMotion();
  const [selectedId, setSelectedId] = useState(markdownStyles[0].id);
  const [price, setPrice] = useState(348);
  const [channel, setChannel] = useState<MarkdownChannel>("all");
  const [effectiveWeek, setEffectiveWeek] = useState("10");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [category, setCategory] = useState("all");
  const [modal, setModal] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const [scenarioName, setScenarioName] = useState("Harbor · FW26");
  const [saved, setSaved] = useState<{ id: string; price: number; channel: MarkdownChannel; week: string; name: string } | null>(null);
  const [notificationsRead, setNotificationsRead] = useState(false);
  const selected = markdownStyles.find(style => style.id === selectedId)!;
  const style = useMemo(() => channelStyle(selected, channel), [selected, channel]);
  const rows = useMemo(() => markdownStyles.map(item => channelStyle(item, channel)), [channel]);
  const filtered = rows.filter(item => `${item.name} ${item.colourway}`.toLowerCase().includes(search.toLowerCase()) && (category === "all" || item.category === category));
  const recommended = recommendation(style, Number(effectiveWeek));
  const projection = projectScenario(style, price, Number(effectiveWeek));
  const baseline = projectScenario(style, style.basePrice, Number(effectiveWeek));
  const sellThroughDelta = projection.sellThrough - baseline.sellThrough;
  const chartData = projection.weeks.map((week, index) => ({ ...week, current: baseline.weeks[index].inventory }));
  const marginCaution = projection.marginRate < MARGIN_FLOOR - 1e-8;
  const isSaved = saved?.id === selectedId && saved.price === price && saved.channel === channel && saved.week === effectiveWeek;
  const maxInventory = Math.ceil(style.onHand / 1000) * 1000;
  const totalStock = rows.reduce((sum, item) => sum + item.onHand, 0);
  const closeModal = useCallback(() => setModal(null), []);
  const transition = { duration: reduced ? 0 : .4, ease: chartTheme.ease };
  const selectStyle = (next: MarkdownStyle) => { setSelectedId(next.id); setPrice(next.basePrice); setScenarioName(`${next.name.split(" ")[0]} · FW26`); };
  const reset = () => { setPrice(selected.basePrice); };
  const resetView = () => { selectStyle(markdownStyles[0]); setChannel("all"); setEffectiveWeek("10"); setSearch(""); setCategory("all"); };
  const exportScenario = () => {
    const csv = [`Style,Colourway,Week,Price USD,Units sold,Units on hand`, ...projection.weeks.map(week => `${style.name},${style.colourway},${week.week},${week.price},${week.units},${week.inventory}`)].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${style.id}-markdown-${price}.csv`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return <div className="relative flex h-full min-h-[960px] w-full overflow-hidden bg-[#F1F1F1] font-body text-sm font-[450] text-[#303030] tabular-nums [--text-3xl:1.75rem]" data-screen="markdown-planner">
    <FieldstoneSidebar active="Pricing" onNavigate={name => name === "Markdowns" ? resetView() : setModal(name)} onReset={resetView} onOuterwear={() => { setCategory("Outerwear"); selectStyle(markdownStyles[0]); }} onOnline={() => setChannel("online")} />
    <div className="flex min-w-0 flex-1 flex-col">
      <FieldstoneTopBar section="Pricing" page="Markdown Planner" crumb="Fall/Winter 26" onCrumb={resetView} onAction={setModal} unread={!notificationsRead} />
      <main className="flex min-h-0 flex-1 flex-col px-6 py-5">
        <motion.div initial={{ opacity: 0, y: reduced ? 0 : 6 }} animate={{ opacity: 1, y: 0 }} transition={transition} className="flex h-9 shrink-0 items-center justify-between">
          <h1 className="font-display text-3xl font-[650]">Markdown Planner</h1>
          <div className="flex items-center gap-2">
            {isSaved && <span className="mr-2 flex items-center gap-1.5 text-xs text-[#29845A]"><Check size={13} />Saved</span>}
            <Button variant="ghost" onClick={reset} disabled={price === style.basePrice}><RotateCcw size={13} />Reset price</Button>
            <Button onClick={exportScenario}><ArrowDownToLine size={13} />Export</Button>
            <Button variant="primary" onClick={() => setModal("Save scenario")}><Save size={13} />Save scenario</Button>
          </div>
        </motion.div>
        <div className="mb-5 mt-3 flex h-8 shrink-0 items-center justify-between">
          <div className="flex items-center gap-2">
            <Button onClick={() => setModal("Season")}><Layers3 size={14} />Fall/Winter 26</Button>
            <Select label="Effective date" value={effectiveWeek} onChange={setEffectiveWeek} icon={<CalendarDays size={14} />} options={[{ value: "10", label: "Effective Oct 12, 2026" }, { value: "11", label: "Effective Oct 19, 2026" }, { value: "12", label: "Effective Oct 26, 2026" }]} />
            <Select label="Planner channel" value={channel} onChange={value => setChannel(value as MarkdownChannel)} icon={<Store size={14} />} options={[{ value: "all", label: "All channels" }, { value: "stores", label: "Stores · 212" }, { value: "online", label: "E-commerce" }]} />
            <Tooltip content="All ticket prices, costs and projections are in USD."><span className="rounded-md border border-[#E3E3E3] px-2.5 py-1.5 text-xs text-[#616161]">USD</span></Tooltip>
          </div>
          <span className="text-xs text-[#8A8A8A]">As of Oct 9 <span className="px-1.5 text-[#BDBDBD]">/</span> Week 9 of 26</span>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[616px_minmax(0,1fr)] gap-4">
          <motion.div initial={{ opacity: 0, y: reduced ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...transition, delay: reduced ? 0 : .05 }} className="min-h-0">
            <Card className="flex h-full flex-col overflow-hidden">
              <div className="flex h-[52px] shrink-0 items-center justify-between px-4">
                <div className="flex items-center gap-2"><h2 className="text-sm font-[650]">Styles behind plan</h2><Badge>{filtered.length}</Badge>{category !== "all" && <button aria-label="Clear category filter" onClick={() => setCategory("all")} className={clsx("flex items-center gap-1 rounded-md bg-[#E8F1EB] px-1.5 py-1 text-xs text-[#216C48]", focusClass)}>{category}<X size={10} /></button>}</div>
                <div className="flex items-center gap-1">
                  {showSearch && <input autoFocus aria-label="Search planner styles" placeholder="Style or colourway" value={search} onChange={e => setSearch(e.target.value)} className={clsx("mr-1 h-7 w-36 rounded-md border border-[#D5D5D5] px-2 text-xs", focusClass)} />}
                  <Button size="icon" variant="ghost" aria-label={showSearch ? "Close style search" : "Search styles"} onClick={() => { setShowSearch(!showSearch); if (showSearch) setSearch(""); }}>{showSearch ? <X size={14} /> : <Search size={14} />}</Button>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-auto">
                <Table compact headers={[{ label: "Style" }, { label: "Colourway" }, { label: <>Current<br />price</>, right: true }, { label: <>On<br />hand</>, right: true }, { label: <Tooltip content="Weeks of supply at the current price"><span>WOS</span></Tooltip>, right: true }, { label: <>Recommended<br />markdown</>, right: true }]}>
                  {filtered.map(item => {
                    const rec = recommendation(item, Number(effectiveWeek));
                    return <tr key={item.id} aria-selected={selectedId === item.id} onClick={() => selectStyle(item)} className={clsx("cursor-pointer transition-colors", selectedId === item.id ? "bg-[#EDF4EF] shadow-[inset_3px_0_0_#29845A]" : "hover:bg-[#FAFAFA]")}>
                      <td><button className={clsx("whitespace-nowrap rounded text-left text-xs font-[550]", selectedId === item.id && "text-[#216C48]", focusClass)}>{item.name}</button></td>
                      <td><span className="flex items-center gap-1.5 whitespace-nowrap text-[#616161]"><span className={clsx("size-2 shrink-0 rounded-full border border-black/5", item.swatch)} />{item.colourway}</span></td>
                      <td className="text-right">${item.basePrice}</td><td className="text-right">{integer(item.onHand)}</td><td className="text-right text-[#616161]">{(item.onHand / item.baseUnits).toFixed(1)}</td>
                      <td className="text-right"><span className="inline-flex items-center gap-2"><span className="text-[#8A8A8A]">−{Math.round((1 - rec / item.basePrice) * 100)}%</span><span className="min-w-8 font-[550]">${rec}</span></span></td>
                    </tr>;
                  })}
                  {!filtered.length && <tr><td colSpan={6}><div className="flex h-32 items-center justify-center gap-3 text-[#8A8A8A]">No matching styles.<Button onClick={() => { setSearch(""); setCategory("all"); }}>Clear filters</Button></div></td></tr>}
                </Table>
              </div>
              <div className="flex h-11 shrink-0 items-center justify-between border-t border-[#E3E3E3] px-4 text-xs text-[#8A8A8A]"><span>{filtered.length} of 14 styles</span><span>{integer(totalStock)} units on hand</span></div>
            </Card>
          </motion.div>

          <div className="grid min-h-0 grid-rows-[350px_226px_minmax(0,1fr)] gap-3">
            <motion.div initial={{ opacity: 0, y: reduced ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...transition, delay: reduced ? 0 : .09 }}>
              <Card className="h-full">
                <div className="flex h-16 items-center justify-between border-b border-[#E3E3E3] px-5">
                  <div className="flex items-center gap-2.5"><span className="flex size-9 items-center justify-center rounded-lg border border-[#DDDFDA] bg-[#F0F0EB]"><Shirt size={21} strokeWidth={1.3} className="text-[#656B5E]" /></span><div><h2 className="text-base font-[650]">{style.name}</h2><p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#8A8A8A]"><span className={clsx("size-2 rounded-full", style.swatch)} />{style.colourway}<span className="px-1">·</span>{style.id}</p></div></div>
                  <Badge tone={price === style.basePrice ? "neutral" : "good"}>{price === style.basePrice ? "Current price" : "Scenario"}</Badge>
                </div>
                <div className="px-5 pt-3">
                  <div className="mb-1 flex items-center justify-between"><h3 className="text-sm font-[650]">Price response</h3><div className="flex items-center gap-1.5 text-xs text-[#616161]"><span className="font-[550] text-[#29845A]"><AnimatedNumber value={projection.weeklyUnits} /></span>units / week<Tooltip content={`Constant elasticity ${ELASTICITY}. At $${style.basePrice}, demand is ${style.baseUnits.toFixed(1)} units per week. Demand = base × (price / current price)^−1.8.`}><Info size={12} className="ml-1 text-[#8A8A8A]" /></Tooltip></div></div>
                  <PriceResponse style={style} price={price} recommended={recommended} onChange={setPrice} reduced={reduced} />
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: reduced ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...transition, delay: reduced ? 0 : .13 }}>
              <Card className="flex h-full flex-col px-5 pb-3 pt-3">
                <div className="flex items-center justify-between"><h2 className="text-sm font-[650]">Projected end-of-season inventory</h2><Tooltip content="End-of-week inventory, capped at zero. Grey bars retain the current-price forecast. Sales before the effective date remain at the current price. No future receipts."><Info size={13} className="text-[#8A8A8A]" /></Tooltip></div>
                <div className="mt-1 flex items-center justify-between text-xs text-[#8A8A8A]"><span>{integer(style.onHand)} units on hand</span><span className="flex items-center gap-3"><span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-[#CCCCCC]" />Current</span><span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-[#29845A]" />Scenario</span></span></div>
                <div className="mt-1 h-[140px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barGap={-12} margin={{ top: 12, left: -18, right: 2, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="#EFEFEF" />
                      <XAxis dataKey="week" ticks={[10, 14, 18, 22, 26]} tick={{ fontSize: 12, fill: "#8A8A8A" }} tickFormatter={week => `W${week}`} axisLine={false} tickLine={false} tickMargin={8} />
                      <YAxis domain={[0, maxInventory]} ticks={[0, maxInventory / 2, maxInventory]} tickFormatter={value => value ? `${value / 1000}k` : "0"} tick={{ fontSize: 12, fill: "#8A8A8A" }} axisLine={false} tickLine={false} width={48} />
                      <ChartTooltip cursor={{ fill: "#F5F5F5" }} content={({ active, payload, label }) => active && payload?.length ? <div className="rounded-lg border border-[#E3E3E3] bg-white p-3 text-xs shadow-lg"><div className="mb-1 font-[550]">Week {label} · units left</div>{payload.map(item => <div key={String(item.dataKey)} className="flex min-w-32 justify-between gap-4 py-0.5"><span className={item.dataKey === "inventory" ? "text-[#29845A]" : "text-[#8A8A8A]"}>{item.dataKey === "inventory" ? "Scenario" : "Current"}</span><span>{integer(Number(item.value))}</span></div>)}</div> : null} />
                      <Bar dataKey="current" fill="#D7D7D7" barSize={12} radius={[2, 2, 0, 0]} isAnimationActive={false} />
                      <Bar dataKey="inventory" fill={chartTheme.accent} barSize={12} radius={[2, 2, 0, 0]} isAnimationActive={!reduced} animationDuration={320} animationEasing="ease-out" />
                      <ReferenceLine y={0} stroke="#616161" strokeDasharray="3 3" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-auto flex items-center justify-between text-xs text-[#8A8A8A]"><span>{projection.selloutWeek ? `Sold out in week ${projection.selloutWeek}` : `${integer(projection.remaining)} units at week 26`}</span><span className="flex items-center gap-1.5"><span className="w-3 border-t border-dashed border-[#616161]" />Target 0 units</span></div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: reduced ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...transition, delay: reduced ? 0 : .17 }} className="min-h-0">
              <Card className="flex h-full flex-col">
                <div className="flex h-8 shrink-0 items-center justify-between px-4 pt-1"><h2 className="text-xs font-[650]">Projected outcome</h2><span className="text-xs text-[#8A8A8A]">Week 26</span></div>
                <div className="grid flex-1 grid-cols-4 divide-x divide-[#EEEEEE]">
                  <Kpi compact title="Sell-through" value={projection.sellThrough} digits={1} suffix="%"><span className="text-xs text-[#8A8A8A]">{sellThroughDelta === 0 ? "At current price" : `${sellThroughDelta > 0 ? "+" : ""}${sellThroughDelta.toFixed(1)} pp`}</span></Kpi>
                  <Kpi compact title="Gross margin" value={projection.grossMargin / 1000} digits={1} prefix="$" suffix="k"><Tooltip content="Projected revenue less product cost for sales in weeks 10–26; excludes previously realized margin."><span className="text-xs text-[#8A8A8A]">Remaining sales</span></Tooltip></Kpi>
                  <Kpi compact title="Margin rate" value={projection.marginRate} digits={1} suffix="%" caution={marginCaution}><span className={clsx("flex items-center gap-1 text-xs", marginCaution ? "text-[#B98900]" : "text-[#8A8A8A]")}>{marginCaution && <Info size={11} />}Floor 52%</span></Kpi>
                  <Kpi compact title="Units left" value={projection.remaining}><span className="text-xs text-[#8A8A8A]">Target 0</span></Kpi>
                </div>
                <div className="flex h-9 shrink-0 items-center justify-between border-t border-[#EEEEEE] px-4 text-xs text-[#8A8A8A]"><button onClick={() => setModal("Model assumptions")} className={clsx("rounded hover:text-[#303030] hover:underline", focusClass)}>Elasticity −1.8 <span className="px-1">·</span> No replenishment</button><span>{isSaved ? "Saved draft" : "Not applied"}</span></div>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </div>

    <AnimatePresence>
      {modal && <Modal title={modal} onClose={closeModal}>
        {modal === "Save scenario" ? <form onSubmit={event => { event.preventDefault(); setSaved({ id: selectedId, price, channel, week: effectiveWeek, name: scenarioName.trim() }); closeModal(); }} className="space-y-5">
          <label className="block text-xs font-[550]">Scenario name<input required maxLength={80} value={scenarioName} onChange={event => setScenarioName(event.target.value)} className={clsx("mt-2 h-10 w-full rounded-lg border border-[#D5D5D5] px-3 text-sm font-[450]", focusClass)} /></label>
          <div className="rounded-lg bg-[#F6F6F6] p-4"><p className="font-[550]">{style.name}, {style.colourway}</p><dl className="mt-3 space-y-2 text-xs text-[#616161]">{[["Scenario price", `$${price}`], ["Effective week", effectiveWeek], ["Projected margin", `${projection.marginRate.toFixed(1)}%`], ["Units left at week 26", integer(projection.remaining)]].map(([label, value]) => <div key={label} className="flex justify-between"><dt>{label}</dt><dd className="font-[550] text-[#303030]">{value}</dd></div>)}</dl></div>
          {marginCaution && <div className="flex items-center gap-2 rounded-lg bg-[#FFF4D8] p-3 text-xs text-[#896700]"><Info size={15} />Margin is below the 52% floor. Approval required before publishing.</div>}
          <p className="max-w-measure text-xs text-[#8A8A8A]">Saved for this session. Store and online prices are not changed.</p><div className="flex justify-end gap-2"><Button type="button" onClick={closeModal}>Cancel</Button><Button type="submit" variant="primary" disabled={!scenarioName.trim()}>Save draft</Button></div>
        </form> : modal === "Search" ? <div><input aria-label="Search planner globally" value={globalSearch} onChange={event => setGlobalSearch(event.target.value)} placeholder="Search styles or colourways" className={clsx("mb-4 h-10 w-full rounded-lg border border-[#D5D5D5] px-3 text-sm", focusClass)} /><div className="max-h-80 space-y-1 overflow-auto">{rows.filter(item => `${item.name} ${item.colourway}`.toLowerCase().includes(globalSearch.toLowerCase())).map(item => <button key={item.id} onClick={() => { selectStyle(item); setSearch(""); setCategory("all"); closeModal(); }} className={clsx("flex w-full items-center justify-between rounded-lg p-3 text-left hover:bg-[#F1F1F1]", focusClass)}><span>{item.name}<span className="mt-1 block text-xs text-[#8A8A8A]">{item.colourway}</span></span><ChevronRight size={14} /></button>)}{!rows.some(item => `${item.name} ${item.colourway}`.toLowerCase().includes(globalSearch.toLowerCase())) && <p className="py-6 text-center text-xs text-[#8A8A8A]">No results.</p>}</div></div>
          : modal === "Model assumptions" || modal === "Help & definitions" ? <dl className="space-y-5">{[["Price response", "Weekly units = base units × (scenario price / current price)^−1.8. Base demand is the trailing four-week average."], ["Inventory", "Projects weeks 10–26. Prices before the effective week stay unchanged. No receipts or stock transfers; sales are capped at available stock."], ["Recommended markdown", "The highest $5 ticket price projected to clear remaining inventory by week 26. Margin below 52% requires approval."], ["Gross margin", "Projected revenue less product cost on remaining-season sales. Margin rate is gross margin / projected revenue."], ["Sell-through", "Previously sold units plus projected units sold, divided by total season receipts."]].map(([label, value]) => <div key={label}><dt className="mb-1 font-[550]">{label}</dt><dd className="max-w-measure text-sm text-[#616161]">{value}</dd></div>)}</dl>
          : modal === "Notifications" ? <div className="space-y-4"><div className="flex gap-3 rounded-lg bg-[#FFF8E9] p-4"><Info size={17} className="shrink-0 text-[#B98900]" /><div><p className="font-[550]">14 styles behind sell-through plan</p><p className="mt-1 text-xs text-[#616161]">{integer(totalStock)} units on hand · Fall/Winter 26</p></div></div><p className="text-xs text-[#8A8A8A]">Recommendations refreshed today at 07:42.</p><Button disabled={notificationsRead} onClick={() => setNotificationsRead(true)}>{notificationsRead ? "All read" : "Mark all as read"}</Button></div>
          : modal === "Emma Mercer" ? <div className="flex items-center gap-4"><span className="flex size-12 items-center justify-center rounded-xl bg-[#E7DFED] text-base font-[550] text-[#6B5179]">EM</span><div><p className="font-[550]">Emma Mercer</p><p className="mt-1 text-xs text-[#8A8A8A]">Merchandise planning · Editor</p><p className="mt-2 text-xs text-[#616161]">Fieldstone retail</p></div></div>
          : modal === "Season" || modal === "Workspace" || modal === "Settings" ? <dl className="space-y-4">{[["Workspace", "Fieldstone retail"], ["Season", "Fall/Winter 26"], ["Season dates", "Aug 10, 2026 – Feb 7, 2027"], ["Reporting week", "9 of 26"], ["Planning horizon", "Weeks 10–26"], ["Currency", "USD"], ["Margin floor", "52%"], ["Data refresh", "Daily, 07:30 ET"]].map(([label, value]) => <div key={label} className="flex justify-between border-b border-[#EEEEEE] pb-3"><dt className="text-[#616161]">{label}</dt><dd>{value}</dd></div>)}</dl>
          : <div><h3 className="mb-4 text-sm font-[550]">Fall/Winter 26 reports</h3><div className="space-y-2"><button onClick={() => { resetView(); closeModal(); }} className={clsx("flex w-full items-center justify-between rounded-lg border border-[#E3E3E3] p-4 text-left hover:bg-[#F7F7F7]", focusClass)}><span>Markdown Planner<span className="mt-1 block text-xs text-[#8A8A8A]">14 styles behind plan</span></span><ChevronRight size={15} /></button>{saved && <button onClick={() => { setSelectedId(saved.id); setPrice(saved.price); setChannel(saved.channel); setEffectiveWeek(saved.week); closeModal(); }} className={clsx("flex w-full items-center justify-between rounded-lg border border-[#E3E3E3] p-4 text-left hover:bg-[#F7F7F7]", focusClass)}><span>{saved.name}<span className="mt-1 block text-xs text-[#8A8A8A]">Saved scenario · ${saved.price}</span></span><ChevronRight size={15} /></button>}</div></div>}
      </Modal>}
    </AnimatePresence>
  </div>;
}
