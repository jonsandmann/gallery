import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Area, CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from "recharts";
import { ArrowDown, ArrowDownToLine, ArrowUpRight, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Download, Info, Layers3, Package, Search, Shirt, SlidersHorizontal, Store, X } from "lucide-react";
import { clsx } from "clsx";
import { AnimatedNumber, Badge, Button, Card, chartTheme, focusClass, Kpi, Select, Table, Tabs, Tooltip } from "./ui/fieldstone";
import { compact, curveData, getCategories, getStyles, integer, points, squarify, summarize, type Category, type CategoryName, type Channel } from "./fieldstone-data";
import { FieldstoneSidebar, FieldstoneTopBar, Modal } from "./ui/FieldstoneChrome";

function colorFor(variance: number) {
  return variance < -6 ? "#EDC9BC" : variance < -2 ? "#E8DCC0" : variance < 0 ? "#DEE6DA" : variance < 2 ? "#C6DCCB" : "#AACBB6";
}

function CategoryMap({ categories, selected, onSelect, reduced }: { categories: Category[]; selected: CategoryName | null; onSelect: (name: CategoryName) => void; reduced: boolean }) {
  const tiles = squarify(categories.map(c => c.revenue), 320, 276);
  return <svg className="h-[276px] w-full overflow-visible" viewBox="0 0 320 276" aria-label="Categories by net revenue. Select a category to filter all panels.">
    {tiles.map(tile => {
      const category = categories[tile.index];
      const isSelected = selected === category.name;
      const dim = !!selected && !isSelected;
      const x = tile.x + 2, y = tile.y + 2, width = tile.width - 4, height = tile.height - 4;
      const small = height < 90 || width < 115;
      const subY = y + (small ? 49 : 61);
      const available = height - (small ? 54 : 66);
      return <g key={category.name} className="group cursor-pointer outline-none" role="button" tabIndex={0} aria-pressed={isSelected} aria-label={`${category.name}, ${category.rate.toFixed(1)}% sell-through, ${points(category.variance)} versus plan. ${category.sub.join(", ")}.`} onClick={() => onSelect(category.name)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(category.name); } }}>
        <title>{category.name}: {category.rate.toFixed(1)}% sell-through; plan {category.plan.toFixed(1)}%. Revenue ${integer(category.revenue)}. {category.sub.join(", ")}.</title>
        <motion.rect x={x} y={y} width={width} height={height} rx={5} animate={{ fill: dim ? "#EBEBE7" : colorFor(category.variance), stroke: isSelected ? "#303030" : "transparent", strokeWidth: isSelected ? 2 : 0 }} transition={{ duration: reduced ? 0 : .35 }} className="group-hover:brightness-[0.97]" />
        <rect x={x + 1} y={y + 1} width={width - 2} height={height - 2} rx={4} fill="none" stroke="#303030" strokeWidth={2} className="pointer-events-none opacity-0 group-focus-visible:opacity-100" />
        <g fill={dim ? "#8A8A8A" : "#303F34"} className="pointer-events-none">
          <text x={x + 10} y={y + 19} fontSize={12} fontWeight={550}>{category.name}</text>
          <text x={x + 10} y={y + (height < 50 ? 37 : small ? 42 : 45)} fontSize={height < 50 ? 16 : small ? 20 : 28} fontWeight={550}>{category.rate.toFixed(1)}%</text>
          {width > 155 && <text x={x + width - 10} y={y + 44} textAnchor="end" fontSize={12} fill={dim ? "#8A8A8A" : category.variance < -6 ? "#A2432D" : "#4C6754"}>{points(category.variance)}</text>}
          {width > 190 && available > 10 ? <text x={x + 10} y={subY + 12} fontSize={12} opacity={.72}>{category.sub.join(" · ")}</text> : available > 34 ? category.sub.map((name, i) => {
            const rowHeight = available / 3;
            return <g key={name}>
              <line x1={x + 9} x2={x + width - 9} y1={subY + i * rowHeight} y2={subY + i * rowHeight} stroke={dim ? "#DADBD6" : "#303030"} strokeOpacity={.12} />
              <text x={x + 10} y={subY + i * rowHeight + Math.min(15, rowHeight - 2)} fontSize={12} opacity={.78}>{name}</text>
              {width > 135 && <text x={x + width - 10} y={subY + i * rowHeight + Math.min(15, rowHeight - 2)} textAnchor="end" fontSize={12} opacity={.65}>{[32, 40, 28][i]}%</text>}
            </g>;
          }) : available > 12 && <text x={x + 10} y={subY + 10} fontSize={12} opacity={.72}>{category.sub[0]}</text>}
        </g>
        {isSelected && <g transform={`translate(${x + width - 21}, ${y + 9})`}><circle cx={6} cy={6} r={8} fill="#303030" /><path d="M2.5 6 5 8.5 9.5 3.5" stroke="white" fill="none" strokeWidth={1.5} /></g>}
      </g>;
    })}
  </svg>;
}

function SizeCurve({ sizes, reduced }: { sizes: ReturnType<typeof summarize>["sizes"]; reduced: boolean }) {
  const sorted = [...sizes].sort((a, b) => b.sold - a.sold);
  const max = Math.max(...sizes.map(s => s.received));
  return <svg viewBox="0 0 220 162" className="h-[162px] w-full" aria-label="Size curve, units sold compared with units received, sorted by units sold">
    {sorted.map((size, index) => <motion.g key={size.size} initial={false} animate={{ y: index * 26 }} transition={{ duration: reduced ? 0 : .42, ease: chartTheme.ease }}>
      <title>{size.size}: {integer(size.sold)} sold / {integer(size.received)} received</title>
      <text x={0} y={19} fill="#616161" fontSize={12}>{size.size}</text>
      <motion.rect x={31} y={6} height={6} rx={2} fill={chartTheme.context} initial={false} animate={{ width: size.received / max * 139 }} transition={{ duration: reduced ? 0 : .42, ease: chartTheme.ease }} />
      <motion.rect x={31} y={14} height={6} rx={2} fill={chartTheme.accent} initial={false} animate={{ width: size.sold / max * 139 }} transition={{ duration: reduced ? 0 : .42, ease: chartTheme.ease }} />
      <text x={220} y={18} textAnchor="end" fill="#303030" fontSize={12}>{compact(size.sold)}</text>
    </motion.g>)}
  </svg>;
}

export default function SellThrough() {
  const reduced = !!useReducedMotion();
  const [selected, setSelected] = useState<CategoryName | null>(null);
  const [channel, setChannel] = useState<Channel>("all");
  const [season, setSeason] = useState("fw26");
  const [week, setWeek] = useState("9");
  const [currency, setCurrency] = useState("USD");
  const [tableTab, setTableTab] = useState<"below" | "all">("below");
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<string | null>(null);
  const [detail, setDetail] = useState<ReturnType<typeof getStyles>[number] | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [readNotifications, setReadNotifications] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const categories = useMemo(() => getCategories(channel, Number(week), season), [channel, week, season]);
  const scoped = selected ? categories.filter(c => c.name === selected) : categories;
  const stats = summarize(scoped);
  const total = summarize(categories);
  const fx = currency === "USD" ? 1 : 1.36;
  const curves = curveData(stats.rate, stats.plan, Number(week));
  const styles = getStyles(scoped);
  const filteredStyles = styles.filter(style => (tableTab === "all" || style.variance < 0) && `${style.name} ${style.sku}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => a.variance - b.variance);
  const pages = Math.max(1, Math.ceil(filteredStyles.length / 3));
  const currentPage = Math.min(page, pages - 1);
  const visibleStyles = filteredStyles.slice(currentPage * 3, currentPage * 3 + 3);
  const dateEnd = season === "fw26" ? week === "9" ? "Oct 9" : week === "8" ? "Oct 4" : "Sep 27" : week === "9" ? "Apr 10" : week === "8" ? "Apr 5" : "Mar 29";
  const dateStart = season === "fw26" ? "Aug 10" : "Feb 9";
  const selectCategory = (name: CategoryName) => { setSelected(current => current === name ? null : name); setTableTab("all"); setPage(0); setSearch(""); };
  const reset = () => { setSelected(null); setTableTab("below"); setPage(0); setSearch(""); };
  const closeModal = useCallback(() => { setModal(null); setDetail(null); }, []);
  const transition = { duration: reduced ? 0 : .4, ease: chartTheme.ease };
  const exportData = () => {
    const csv = ["Category,Received,Net units sold,Sell-through %,Plan %,Weeks of supply,Net revenue " + currency, ...scoped.map(c => [c.name, c.received, c.sold, c.rate.toFixed(1), c.plan.toFixed(1), c.wos.toFixed(1), (c.revenue * fx).toFixed(2)].join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url; link.download = `fieldstone-sell-through-${season}-w${week}-${channel}.csv`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setExportOpen(false);
  };

  return <div className="relative flex h-full min-h-[960px] w-full overflow-hidden bg-[#F1F1F1] font-body text-sm font-[450] text-[#303030] tabular-nums [--text-3xl:1.75rem]">
    <FieldstoneSidebar active="Sell-Through" onNavigate={setModal} onReset={reset} onOuterwear={() => selectCategory("Outerwear")} onOnline={() => { setChannel("online"); reset(); }} />

    <div className="flex min-w-0 flex-1 flex-col">
      <FieldstoneTopBar section="Merchandising" page="Sell-Through" crumb={selected || "All categories"} onCrumb={reset} onAction={setModal} unread={!readNotifications} />

      <main className="flex min-h-0 flex-1 flex-col px-6 py-5">
        <motion.div initial={{ opacity: 0, y: reduced ? 0 : 6 }} animate={{ opacity: 1, y: 0 }} transition={transition} className="flex h-9 shrink-0 items-center justify-between">
          <h1 className="font-display text-3xl font-[650]">Sell-Through</h1>
          <div className="flex items-center gap-2">
            <Select label="Season" value={season} onChange={value => { setSeason(value); setPage(0); }} icon={<Layers3 size={14} />} options={[{ value: "fw26", label: "Fall/Winter 26" }, { value: "ss26", label: "Spring/Summer 26" }]} />
            <div className="relative">
              <Button variant="primary" onClick={() => setExportOpen(!exportOpen)} aria-expanded={exportOpen}><Download size={14} />Export<ChevronDown size={12} /></Button>
              {exportOpen && <div className="absolute right-0 top-10 z-30 w-56 rounded-xl border border-[#E3E3E3] bg-white p-1.5 shadow-lg"><button onClick={exportData} className={clsx("flex w-full items-center gap-2 rounded-lg px-3 py-3 text-left text-xs hover:bg-[#F1F1F1]", focusClass)}><ArrowDownToLine size={15} />Category summary (.csv)</button></div>}
            </div>
          </div>
        </motion.div>

        <div className="mb-5 mt-3 flex h-8 shrink-0 items-center justify-between">
          <div className="flex items-center gap-2">
            <Select label="Reporting period" value={week} onChange={value => { setWeek(value); setPage(0); }} icon={<CalendarDays size={14} />} options={[{ value: "9", label: `${dateStart} – ${season === "fw26" ? "Oct 9" : "Apr 10"}, 2026` }, { value: "8", label: `${dateStart} – ${season === "fw26" ? "Oct 4" : "Apr 5"}, 2026` }, { value: "7", label: `${dateStart} – ${season === "fw26" ? "Sep 27" : "Mar 29"}, 2026` }]} />
            <Select label="Channel" value={channel} onChange={value => { setChannel(value as Channel); setPage(0); }} icon={<Store size={14} />} options={[{ value: "all", label: "All channels" }, { value: "stores", label: "Stores · 212" }, { value: "online", label: "E-commerce" }]} />
            <Select label="Currency" value={currency} onChange={setCurrency} options={[{ value: "USD", label: "USD" }, { value: "CAD", label: "CAD · 1.36" }]} />
            {selected && <button onClick={reset} className={clsx("flex h-7 items-center gap-1.5 rounded-md border border-[#D1DAD2] bg-[#E6ECE7] px-2 text-xs font-[550]", focusClass)}>{selected}<X size={12} /></button>}
          </div>
          <span className="text-xs text-[#8A8A8A]">Season to date <span className="px-1.5 text-[#BDBDBD]">/</span> Week {week} of 26</span>
        </div>

        <motion.div initial={{ opacity: 0, y: reduced ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...transition, delay: reduced ? 0 : .05 }}>
          <Card className="grid h-24 grid-cols-4 divide-x divide-[#E3E3E3]">
            <Kpi title="Net revenue" value={stats.revenue * fx / 1e6} digits={2} prefix="$" suffix="m" info="Net units sold × realized unit price. Excludes tax and shipping."><span className="text-xs text-[#8A8A8A]">{currency}</span></Kpi>
            <Kpi title="Net units sold" value={stats.sold}><span className="text-xs text-[#8A8A8A]">of {compact(stats.received)} received</span></Kpi>
            <Kpi title="Sell-through" value={stats.rate} digits={1} suffix="%" info="Net units sold divided by units received, season to date."><Tooltip content={`Plan ${stats.plan.toFixed(1)}%. Variance in percentage points.`}><Badge tone={stats.variance < -2 ? "critical" : stats.variance < 0 ? "caution" : "good"}>{stats.variance < 0 ? <ArrowDown size={11} /> : <ArrowUpRight size={11} />}{Math.abs(stats.variance).toFixed(1)} pp</Badge></Tooltip></Kpi>
            <Kpi title="Units on hand" value={stats.onHand}><span className="text-xs text-[#8A8A8A]">{selected ? "1 category" : "6 categories"}</span></Kpi>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: reduced ? 0 : 9 }} animate={{ opacity: 1, y: 0 }} transition={{ ...transition, delay: reduced ? 0 : .10 }} className="mt-4 grid h-[382px] shrink-0 grid-cols-[352px_minmax(0,1fr)_252px] gap-4">
          <Card className="flex flex-col p-4">
            <div className="mb-3 flex items-start justify-between">
              <div><h2 className="text-sm font-[650]">Categories</h2><p className="mt-0.5 text-xs text-[#8A8A8A]">Net revenue · ${(total.revenue * fx / 1e6).toFixed(2)}m</p></div>
              <Tooltip content="Area shows category revenue. Color shows sell-through versus plan. Subcategory percentages are shares of category revenue. Click to focus; click the breadcrumb to reset."><Info size={14} className="mt-1 text-[#8A8A8A]" /></Tooltip>
            </div>
            <CategoryMap categories={categories} selected={selected} onSelect={selectCategory} reduced={reduced} />
            <div className="mt-auto flex items-center justify-between pt-2 text-xs text-[#8A8A8A]"><span>vs plan</span><span className="flex items-center gap-1"><span className="mr-1">Behind</span><i className="h-2.5 w-5 rounded-sm bg-[#EDC9BC]" /><i className="h-2.5 w-5 rounded-sm bg-[#E8DCC0]" /><i className="h-2.5 w-5 rounded-sm bg-[#DEE6DA]" /><i className="h-2.5 w-5 rounded-sm bg-[#AACBB6]" /><span className="ml-1">Ahead</span></span></div>
          </Card>

          <Card className="flex flex-col px-5 pb-4 pt-4">
            <div className="flex items-center justify-between"><h2 className="text-sm font-[650]">Weekly sell-through vs plan</h2><Tooltip content="Cumulative sell-through. The dashed line is the approved 26-week season plan."><Info size={14} className="text-[#8A8A8A]" /></Tooltip></div>
            <div className="mb-1 mt-3 flex items-center justify-between">
              <div className="flex items-baseline gap-2.5"><span className="text-3xl font-[550]"><AnimatedNumber value={stats.rate} digits={1} suffix="%" /></span><span className="text-xs text-[#8A8A8A]">Plan {stats.plan.toFixed(1)}%</span></div>
              <span className="rounded-md bg-[#F1F1F1] px-2 py-1 text-xs text-[#616161]">{selected || "All categories"}</span>
            </div>
            <div className="h-[245px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={curves} margin={{ top: 25, right: 14, bottom: 5, left: -24 }}>
                  <CartesianGrid stroke="#EFEFEF" vertical={false} />
                  <XAxis dataKey="week" type="number" domain={[1, 26]} ticks={[1, 5, 9, 13, 17, 21, 26]} tickFormatter={value => `${value}`} tick={{ fontSize: 12, fill: "#8A8A8A" }} axisLine={false} tickLine={false} tickMargin={10} />
                  <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={value => `${value}%`} tick={{ fontSize: 12, fill: "#8A8A8A" }} axisLine={false} tickLine={false} width={60} />
                  <ReferenceArea x1={Number(week)} x2={26} fill="#FAFAFA" fillOpacity={1} />
                  <ReferenceLine x={Number(week)} stroke="#B8B8B8" strokeDasharray="3 4" label={{ value: `W${week} · ${dateEnd}`, position: "top", fontSize: 12, fill: "#616161" }} />
                  <ChartTooltip cursor={{ stroke: "#D0D0D0", strokeDasharray: "3 3" }} content={({ active, payload, label }) => active && payload?.length ? <div className="rounded-lg border border-[#E3E3E3] bg-white p-3 text-xs shadow-lg"><p className="mb-2 font-[650]">Week {label}</p>{payload.map(item => <div key={item.dataKey?.toString()} className="flex min-w-32 justify-between gap-5 py-0.5"><span className={item.dataKey === "actual" ? "text-[#29845A]" : "text-[#616161]"}>{item.dataKey === "actual" ? "Actual" : "Plan"}</span><span>{Number(item.value).toFixed(1)}%</span></div>)}</div> : null} />
                  <Area type="monotone" dataKey="actual" stroke={chartTheme.accent} fill="#29845A" fillOpacity={.075} strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: "#29845A", stroke: "white", strokeWidth: 2 }} isAnimationActive={!reduced} animationDuration={420} animationEasing="ease-out" />
                  <Line type="monotone" dataKey="plan" stroke="#A9A9A9" strokeWidth={1.75} strokeDasharray="5 5" dot={false} activeDot={false} isAnimationActive={!reduced} animationDuration={420} animationEasing="ease-out" />
                  <ReferenceDot x={Number(week)} y={stats.rate} r={4.5} fill="#29845A" stroke="white" strokeWidth={2} label={{ value: `${stats.rate.toFixed(1)}%`, position: "bottom", offset: 11, fill: "#29845A", fontSize: 12, fontWeight: 550 }} />
                  <ReferenceDot x={24.5} y={89} r={0} label={{ value: "Plan 89%", position: "top", offset: 12, fill: "#8A8A8A", fontSize: 12 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-auto flex items-center justify-between border-t border-[#EEEEEE] pt-3 text-xs text-[#8A8A8A]"><span className="flex items-center gap-1.5"><span className="h-0.5 w-3 rounded bg-[#29845A]" />Actual through {dateEnd}</span><span>Season week</span></div>
          </Card>

          <div className="grid grid-rows-[252px_118px] gap-3">
            <Card className="px-4 pb-3 pt-4">
              <div className="flex items-center justify-between"><h2 className="text-sm font-[650]">Size curve</h2><Tooltip content="Units by normalized size, sorted by units sold. Footwear uses equivalent apparel sizes; one-size accessories are allocated by the assortment size mix."><SlidersHorizontal size={13} className="text-[#8A8A8A]" /></Tooltip></div>
              <div className="mb-2 mt-2 flex items-center justify-between text-xs text-[#8A8A8A]"><span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-[#29845A]" />Sold<span className="ml-2 size-2 rounded-sm bg-[#CCCCCC]" />Received</span><span>Units</span></div>
              <SizeCurve sizes={stats.sizes} reduced={reduced} />
              <div className="text-xs text-[#8A8A8A]">Ranked by units sold <ArrowDown size={11} className="inline" /></div>
            </Card>
            <Card className="px-4 py-3">
              <div className="flex items-center justify-between"><h2 className="text-xs font-[550]">Weeks of supply</h2><Tooltip content="On-hand units ÷ trailing 4-week average weekly unit sales. Policy range: 8–12 weeks."><Info size={12} className="text-[#8A8A8A]" /></Tooltip></div>
              <div className="mt-1 flex items-center justify-between"><div className="text-3xl font-[550]"><AnimatedNumber value={stats.wos} digits={1} /><span className="ml-1.5 text-xs font-[450] text-[#8A8A8A]">weeks</span></div><Badge tone={stats.wos > 12 ? "critical" : stats.wos < 8 ? "caution" : "good"}>{stats.wos > 12 ? "Overstock" : stats.wos < 8 ? "Low cover" : "In range"}</Badge></div>
              <svg className="mt-1 h-3 w-full" viewBox="0 0 220 12" aria-label={`Weeks of supply ${stats.wos.toFixed(1)}; policy eight to twelve`}>
                <rect x={0} y={4} width={220} height={4} rx={2} fill="#EBEBEB" /><rect x={220 / 3} y={3} width={220 / 6} height={6} rx={2} fill="#C9DBCE" />
                <motion.rect x={0} y={4} height={4} rx={2} fill={stats.wos > 12 ? "#B98900" : "#29845A"} initial={false} animate={{ width: Math.min(stats.wos / 24, 1) * 220 }} transition={transition} />
                <line x1={110} x2={110} y1={0} y2={12} stroke="#616161" />
              </svg>
              <div className="mt-0.5 flex justify-between text-xs text-[#8A8A8A]"><span>Policy 8–12 weeks</span><span>24</span></div>
            </Card>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: reduced ? 0 : 9 }} animate={{ opacity: 1, y: 0 }} transition={{ ...transition, delay: reduced ? 0 : .15 }} className="mt-4 min-h-[248px] flex-1">
          <Card className="flex h-full flex-col overflow-hidden">
            <div className="flex h-12 shrink-0 items-center justify-between px-4">
              <div className="flex items-center gap-4"><h2 className="text-sm font-[650]">Style performance</h2><Tabs value={tableTab} onChange={value => { setTableTab(value); setPage(0); }} options={[{ value: "below", label: "Below plan" }, { value: "all", label: "All styles" }]} /></div>
              <div className="relative"><Search size={13} className="pointer-events-none absolute left-2.5 top-2 text-[#8A8A8A]" /><input aria-label="Search styles" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Search styles" className={clsx("h-7 w-44 rounded-md border border-[#E3E3E3] bg-[#FAFAFA] pl-8 pr-2 text-xs placeholder:text-[#8A8A8A]", focusClass)} /></div>
            </div>
            <Table headers={[{ label: "Style" }, { label: "Category" }, { label: "Received", right: true }, { label: "Net sold", right: true }, { label: "Sell-through", right: true }, { label: <span className="inline-flex items-center gap-1">vs plan<ArrowDown size={11} /></span>, right: true }, { label: "Weeks of supply", right: true }]}>
              {visibleStyles.map(style => <tr key={style.sku} className="group transition-colors hover:bg-[#FAFAFA]">
                <td><button onClick={() => { setDetail(style); setModal("Style detail"); }} className={clsx("flex items-center gap-2.5 rounded text-left", focusClass)}><span className="flex size-7 items-center justify-center rounded-md border border-[#E4E4DF] bg-[#F3F3EE]"><Shirt size={15} strokeWidth={1.4} className="text-[#7D8075]" /></span><span><span className="block font-[550] group-hover:underline">{style.name}</span><span className="block text-xs text-[#8A8A8A]">{style.sku}</span></span></button></td>
                <td className="text-[#616161]">{style.category}</td><td className="text-right">{integer(style.received)}</td><td className="text-right">{integer(style.sold)}</td><td className="text-right font-[550]">{style.rate.toFixed(1)}%</td>
                <td className="text-right"><span className={style.variance < -6 ? "text-[#C33A25]" : style.variance < -2 ? "text-[#947014]" : style.variance >= 0 ? "text-[#29845A]" : "text-[#616161]"}>{points(style.variance)}</span></td>
                <td className="text-right"><span className="inline-flex min-w-12 items-center justify-end gap-2">{style.wos > 12 && <span className="size-1.5 rounded-full bg-[#B98900]" />}{style.wos.toFixed(1)}</span></td>
              </tr>)}
              {!visibleStyles.length && <tr><td colSpan={7}><div className="flex h-[131px] items-center justify-center gap-3 text-[#8A8A8A]">No matching styles.<Button onClick={() => { setSearch(""); setTableTab("all"); }}>Show all styles</Button></div></td></tr>}
            </Table>
            <div className="mt-auto flex min-h-9 items-center justify-between px-4 text-xs text-[#8A8A8A]"><span>Net units after returns <span className="px-1.5 text-[#CACACA]">·</span> {selected || "All categories"}</span><div className="flex items-center gap-3"><span>{filteredStyles.length ? `${currentPage * 3 + 1}–${Math.min((currentPage + 1) * 3, filteredStyles.length)}` : "0"} of {filteredStyles.length} styles</span><div className="flex gap-1"><Button size="icon" aria-label="Previous styles" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={13} /></Button><Button size="icon" aria-label="Next styles" disabled={currentPage === pages - 1} onClick={() => setPage(currentPage + 1)}><ChevronRight size={13} /></Button></div></div></div>
          </Card>
        </motion.div>
      </main>
    </div>

    <AnimatePresence>
      {modal && <Modal title={detail ? detail.name : modal} onClose={closeModal}>
        {detail ? <div className="space-y-5">
          <div className="flex items-center justify-between text-xs text-[#616161]"><span>{detail.sku} <span className="px-2">·</span> {detail.category}</span><Badge tone={detail.variance < 0 ? "caution" : "good"}>{detail.variance < 0 ? "Below plan" : "Above plan"}</Badge></div>
          <div className="grid grid-cols-2 gap-3"><Card><Kpi title="Sell-through" value={detail.rate} digits={1} suffix="%"><span className="text-xs text-[#8A8A8A]">{points(detail.variance)}</span></Kpi></Card><Card><Kpi title="Weeks of supply" value={detail.wos} digits={1}><span /></Kpi></Card></div>
          <dl className="space-y-3 text-sm">{[["Units received", integer(detail.received)], ["Net units sold", integer(detail.sold)], ["Units on hand", integer(detail.received - detail.sold)], ["Net revenue", `$${integer(detail.revenue * fx)} ${currency}`]].map(([label, value]) => <div key={label} className="flex justify-between border-b border-[#EEEEEE] pb-2"><dt className="text-[#616161]">{label}</dt><dd className="font-[550]">{value}</dd></div>)}</dl>
          <div className="flex justify-end"><Button variant="primary" onClick={() => { selectCategory(detail.category); closeModal(); }}>Focus {detail.category}<ArrowUpRight size={13} /></Button></div>
        </div> : modal === "Search" ? <div><input autoFocus aria-label="Search categories and styles" value={globalSearch} onChange={e => setGlobalSearch(e.target.value)} placeholder="Search categories or styles..." className={clsx("mb-4 h-10 w-full rounded-lg border border-[#D5D5D5] px-3 text-sm", focusClass)} /><div className="space-y-1">{categories.filter(c => `${c.name} ${c.styles.join(" ")}`.toLowerCase().includes(globalSearch.toLowerCase())).map(c => <button key={c.name} onClick={() => { selectCategory(c.name); closeModal(); }} className={clsx("flex w-full items-center justify-between rounded-lg p-3 text-left hover:bg-[#F1F1F1]", focusClass)}><span className="flex items-center gap-3"><Shirt size={16} />{c.name}</span><span className="text-xs text-[#8A8A8A]">{c.rate.toFixed(1)}%<ChevronRight size={13} className="ml-3 inline" /></span></button>)}{!categories.some(c => `${c.name} ${c.styles.join(" ")}`.toLowerCase().includes(globalSearch.toLowerCase())) && <p className="py-6 text-center text-sm text-[#8A8A8A]">No results.</p>}</div></div>
          : modal === "Notifications" ? <div className="space-y-4"><div className="flex gap-3 rounded-lg bg-[#FFF8E9] p-4"><Info size={17} className="shrink-0 text-[#B98900]" /><div><p className="font-[550]">Outerwear exceeds supply policy</p><p className="mt-1 text-xs text-[#616161]">{categories[0].wos.toFixed(1)} weeks of supply · policy 8–12 weeks</p><button onClick={() => { selectCategory("Outerwear"); closeModal(); }} className="mt-3 text-xs font-[550] underline underline-offset-4">Review Outerwear</button></div></div><div className="flex gap-3 p-3"><Check size={16} className="text-[#29845A]" /><div><p className="text-sm">Season data refreshed</p><p className="mt-1 text-xs text-[#8A8A8A]">Today, 07:42 · 212 stores and e-commerce</p></div></div><Button onClick={() => setReadNotifications(true)} disabled={readNotifications}>{readNotifications ? "All read" : "Mark all as read"}</Button></div>
          : modal === "Help & definitions" ? <dl className="space-y-5">{[["Sell-through", "Net units sold ÷ units received, season to date. Returns are deducted from units sold."], ["Weeks of supply", "Units on hand ÷ trailing 4-week average weekly sales. The merchandising policy is 8–12 weeks."], ["Category map", "Tile area is net revenue. Color is the percentage-point variance to plan. Select a tile to focus the curves, size mix, and style table."], ["Size curve", "Sizes are normalized across categories. Footwear is mapped to equivalent apparel sizes; one-size units use the assortment size mix."]].map(([title, text]) => <div key={title}><dt className="mb-1 font-[550]">{title}</dt><dd className="max-w-measure text-sm text-[#616161]">{text}</dd></div>)}</dl>
          : modal === "Settings" ? <div className="space-y-5"><div className="flex items-center justify-between"><span>Reporting currency</span><Select label="Reporting currency" value={currency} onChange={setCurrency} options={[{ value: "USD", label: "USD" }, { value: "CAD", label: "CAD · 1.36" }]} /></div><div className="flex justify-between border-t border-[#E3E3E3] pt-4"><span className="text-[#616161]">Fiscal week starts</span><span>Monday</span></div><div className="flex justify-between"><span className="text-[#616161]">Data refresh</span><span>Daily, 07:30 ET</span></div><div className="flex justify-between"><span className="text-[#616161]">Supply policy</span><span>8–12 weeks</span></div></div>
          : modal === "Emma Mercer" ? <div><div className="mb-6 flex items-center gap-4"><span className="flex size-12 items-center justify-center rounded-xl bg-[#E7DFED] text-base font-[550] text-[#6B5179]">EM</span><div><p className="font-[550]">Emma Mercer</p><p className="mt-1 text-xs text-[#8A8A8A]">Merchandise planning · Editor</p></div></div><div className="flex items-center justify-between rounded-lg bg-[#F6F6F6] p-4"><span>Fieldstone retail</span><Badge tone="good">Active workspace</Badge></div></div>
          : modal === "Workspace" ? <div><button onClick={closeModal} className={clsx("flex w-full items-center justify-between rounded-lg border border-[#D5D5D5] p-4", focusClass)}><span className="text-left"><span className="block font-[550]">Fieldstone retail</span><span className="mt-1 block text-xs text-[#8A8A8A]">212 stores · E-commerce · USD</span></span><Check size={17} className="text-[#29845A]" /></button><p className="mt-4 text-xs text-[#8A8A8A]">1 workspace available</p></div>
          : <div><div className="mb-5 flex items-center gap-2 text-xs text-[#8A8A8A]"><Package size={14} />{season === "fw26" ? "Fall/Winter 26" : "Spring/Summer 26"}<span>·</span>Week {week}</div><div className="mb-5 grid grid-cols-2 gap-3"><Card><Kpi title={modal === "Stores" ? "Store count" : "Units on hand"} value={modal === "Stores" ? 212 : total.onHand}><span /></Kpi></Card><Card><Kpi title="Net revenue" value={total.revenue * fx / 1e6} digits={2} prefix="$" suffix="m"><span /></Kpi></Card></div><div className="mb-4 text-xs font-[550] text-[#616161]">Category reports</div>{categories.map(c => <button key={c.name} className={clsx("flex w-full items-center justify-between border-t border-[#EEEEEE] py-3 text-left text-sm hover:bg-[#FAFAFA]", focusClass)} onClick={() => { selectCategory(c.name); closeModal(); }}><span>{c.name}</span><span className="flex items-center gap-3 text-xs text-[#616161]">{c.rate.toFixed(1)}%<ChevronRight size={13} /></span></button>)}</div>}
      </Modal>}
    </AnimatePresence>
  </div>;
}
