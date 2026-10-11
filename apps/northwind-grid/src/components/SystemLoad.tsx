import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AppBar, Avatar, Badge, Box, Breadcrumbs, Button, Card, CardContent, CardHeader,
  Checkbox, Chip, Divider, FormControlLabel, IconButton, InputAdornment,
  List, ListItemButton, ListItemIcon, Menu, MenuItem, Paper, ScopedCssBaseline,
  Slider, Stack, SvgIcon, Switch, Tab, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Tabs, TextField, ThemeProvider, ToggleButton, ToggleButtonGroup,
  Toolbar, Tooltip, Typography, createTheme, lighten, useTheme,
} from "@mui/material";
import { useReducedMotion } from "framer-motion";
import {
  Area, CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceDot,
  ReferenceLine, ResponsiveContainer, XAxis, YAxis,
} from "recharts";
import {
  NOW, clock, daySeries, dispatch, fuelNames, fuelOrder, shadowPrices,
  type Dispatch, type Fuel,
} from "./data/dispatch";
import { storageSites } from "./data/storage";

const amber = "#F5A524";
const fuelColors: Record<Fuel, string> = {
  gas: "#8E6CCF", coal: "#6B7280", nuclear: "#4FB0C6", hydro: "#3B82C4",
  wind: "#5FB98E", solar: "#E3B341", storage: "#D9775B",
};
function materialIcon(path: string) {
  return function MaterialIcon({ size = 24, className }: { size?: number; className?: string }) {
    return <SvgIcon className={className} fontSize={size <= 16 ? "small" : "medium"}><path d={path} /></SvgIcon>;
  };
}
const Activity = materialIcon("M3 3h18v18H3V3zm2 10h3l2-5 4 10 2-5h3v-2h-4l-1 3-4-10-3 7H5v2z");
const Network = materialIcon("M9 2h6v6h-2v3h7v5h2v6h-6v-6h2v-3h-5v3h2v6H9v-6h2v-3H6v3h2v6H2v-6h2v-5h7V8H9V2z");
const Wind = materialIcon("M4 10h12a4 4 0 1 0-4-4h2a2 2 0 1 1 2 2H4v2zm-2 4h17a3 3 0 1 0-3-3h2a1 1 0 1 1 1 1H2v2zm2 4h8a1 1 0 1 1-1 1H9a3 3 0 1 0 3-3H4v2z");
const BatteryCharging = materialIcon("M15 2H9v2H6v18h12V4h-3V2zm-3 18v-6H9l3-8v6h3l-3 8z");
const TrendingUp = materialIcon("M3 17l6-6 4 4 7-7v4h2V4h-8v2h4l-5 6-4-4-8 8 2 1z");
const ShieldCheck = materialIcon("M12 1 3 5v6c0 6 9 12 9 12s9-6 9-12V5l-9-4zm-2 15-4-4 1.5-1.5 2.5 2.5 6.5-6.5L18 8l-8 8z");
const LayoutGrid = materialIcon("M3 3h5v5H3zm7 0h5v5h-5zm7 0h5v5h-5zM3 10h5v5H3zm7 0h5v5h-5zm7 0h5v5h-5zM3 17h5v5H3zm7 0h5v5h-5zm7 0h5v5h-5z");
const Settings = materialIcon("m19.4 13 .1-1-.1-1 2-1.6-2-3.4-2.4 1a8 8 0 0 0-1.7-1L15 3H9l-.4 3a8 8 0 0 0-1.7 1L4.5 6l-2 3.4L4.5 11l-.1 1 .1 1-2 1.6 2 3.4 2.4-1a8 8 0 0 0 1.7 1L9 21h6l.4-3a8 8 0 0 0 1.7-1l2.4 1 2-3.4-2.1-1.6zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8z");
const CircleHelp = materialIcon("M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 16h-2v-2h2v2zm0-4h-2v-1c0-2 3-2.5 3-4a2 2 0 0 0-4 0H8a4 4 0 0 1 8 0c0 3-3 3.5-3 5z");
const Zap = materialIcon("M13 2 3 14h7l-1 8 12-14h-8l1-6z");
const Bell = materialIcon("M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2zm6-6v-5c0-3-1.5-5-4-5.7V4a2 2 0 0 0-4 0v1.3C7.5 6 6 8 6 11v5l-2 2v1h16v-1l-2-2z");
const CalendarDays = materialIcon("M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 16H5V9h14v11zM7 11h5v5H7v-5z");
const Check = materialIcon("m9 16-5-5-1.5 1.5L9 19 22 6l-1.5-1.5L9 16z");
const ChevronDown = materialIcon("m7 9 5 5 5-5 1.5 1.5L12 17l-6.5-6.5L7 9z");
const ChevronRight = materialIcon("m9 6 6 6-6 6-1.5-1.5L12 12 7.5 7.5 9 6z");
const Clock3 = materialIcon("M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 11 5 3-1 1.7-6-3.7V6h2v7z");
const Download = materialIcon("M19 9h-4V3H9v6H5l7 7 7-7zM5 18h14v3H5v-3z");
const GripVertical = materialIcon("M7 3h3v3H7zm7 0h3v3h-3zM7 10h3v3H7zm7 0h3v3h-3zM7 17h3v3H7zm7 0h3v3h-3z");
const Maximize2 = materialIcon("M3 3h7v2H5v5H3V3zm11 0h7v7h-2V5h-5V3zM3 14h2v5h5v2H3v-7zm16 0h2v7h-7v-2h5v-5z");
const Radio = materialIcon("M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM5 5 3.6 3.6a12 12 0 0 0 0 16.8L5 19A10 10 0 0 1 5 5zm14 0a10 10 0 0 1 0 14l1.4 1.4a12 12 0 0 0 0-16.8L19 5z");
const RotateCcw = materialIcon("M12 4a8 8 0 1 1-8 8h2a6 6 0 1 0 2-4.5L11 11H3V3l3.5 3.5A8 8 0 0 1 12 4z");
const ArrowUpRight = materialIcon("M6 5h13v13h-2V8.4L5.4 20 4 18.6 15.6 7H6V5z");
const ArrowDownLeft = materialIcon("M18 19H5V6h2v9.6L18.6 4 20 5.4 8.4 17H18v2z");
const Sun = materialIcon("M11 0h2v4h-2zm0 20h2v4h-2zM0 11h4v2H0zm20 0h4v2h-4zM3 4.4 4.4 3l2.8 2.8-1.4 1.4zm13.8 13.8 1.4-1.4 2.8 2.8-1.4 1.4zM3 19.6l2.8-2.8 1.4 1.4L4.4 21zM16.8 5.8 19.6 3 21 4.4l-2.8 2.8zM12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12z");
const X = materialIcon("m6 4 6 6 6-6 2 2-6 6 6 6-2 2-6-6-6 6-2-2 6-6-6-6 2-2z");

function useChartTokens() {
  const theme = useTheme();
  return {
    surface: lighten(theme.palette.background.paper, 0.07),
    border: theme.palette.divider,
    muted: theme.palette.text.secondary,
    text: theme.palette.text.primary,
    axis: { fill: theme.palette.text.secondary, fontFamily: theme.typography.fontFamily, fontSize: 12 },
  };
}
const constraints = [
  { name: "Westridge - Alder", line: "345 kV", limit: 1840, contingency: "Alder - Bracken 345 kV", area: "Western corridor" },
  { name: "Blackwater interface", line: "North > South", limit: 3260, contingency: "Blackwater transformer T2", area: "Central interface" },
  { name: "Juniper - Mercer", line: "230 kV", limit: 1125, contingency: "Juniper - Ashford 230 kV", area: "Eastern corridor" },
];
const navigation = [
  { name: "System operations", icon: Activity },
  { name: "Transmission", icon: Network },
  { name: "Generation assets", icon: Wind },
  { name: "Storage fleet", icon: BatteryCharging },
  { name: "Markets", icon: TrendingUp },
  { name: "Reliability", icon: ShieldCheck },
];
const number = (value: number, decimals = 0) => value.toLocaleString("en-US", {
  minimumFractionDigits: decimals, maximumFractionDigits: decimals,
});

function useTween(target: number, duration = 220) {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(target);
  const current = useRef(target);
  useEffect(() => {
    if (reduced) {
      current.current = target;
      setValue(target);
      return;
    }
    const from = current.current;
    if (from === target) return;
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      current.current = from + (target - from) * (1 - (1 - progress) ** 3);
      setValue(current.current);
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, reduced]);
  return value;
}

function Swatch({ fuel, className = "" }: { fuel: Fuel; className?: string }) {
  return <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true" className={`shrink-0 ${className}`}>
    <rect width="8" height="8" rx="2" fill={fuelColors[fuel]} />
  </svg>;
}

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return <Card className="flex h-full min-h-0 min-w-0 flex-col">
    <CardHeader title={title} action={action} />
    {children}
  </Card>;
}

function Metric({ title, value, detail, note }: { title: string; value: number; detail: string; note: string }) {
  return <Card elevation={4}>
    <CardContent className="flex h-full items-center justify-between gap-2">
      <Box className="min-w-0">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{title}</Typography>
        <Stack direction="row" sx={{ alignItems: "baseline" }} spacing={0.75}>
          <Typography variant="h5">{number(value)}</Typography>
          <Typography variant="caption" color="text.secondary">MW</Typography>
        </Stack>
      </Box>
      <Box className="shrink-0 text-right">
        <Typography variant="body2">{detail}</Typography>
        <Typography variant="caption" color="text.secondary">{note}</Typography>
      </Box>
    </CardContent>
  </Card>;
}

function DataTable({ headings, rows }: { headings: string[]; rows: { key: string; cells: ReactNode[]; onClick?: () => void }[] }) {
  return <TableContainer className="min-h-0 overflow-auto">
    <Table size="small">
      <TableHead><TableRow>{headings.map((heading, index) =>
        <TableCell key={heading} align={index ? "right" : "left"}>{heading}</TableCell>
      )}</TableRow></TableHead>
      <TableBody>{rows.map(row => <TableRow key={row.key} hover={!!row.onClick}>
        {row.cells.map((cell, index) => <TableCell key={index} align={index ? "right" : "left"}>
          {index === 0 && row.onClick
            ? <Button color="inherit" onClick={row.onClick} sx={{ textAlign: "left", justifyContent: "flex-start" }}>{cell}</Button>
            : cell}
        </TableCell>)}
      </TableRow>)}</TableBody>
    </Table>
  </TableContainer>;
}

function GenerationChart({ series, state, setTime, forecast, regionScale, actualUntil }: {
  series: ReturnType<typeof daySeries>; state: Dispatch; setTime: (time: number) => void;
  forecast: boolean; regionScale: number; actualUntil: number;
}) {
  const { surface, border, muted, text, axis } = useChartTokens();
  return <Box className="relative h-[210px] w-full shrink-0 select-none">
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={series} accessibilityLayer={false} margin={{ top: 39, right: 34, left: 7, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={border} strokeDasharray="2 3" />
        <XAxis type="number" dataKey="time" domain={[0, 24]} ticks={[0, 3, 6, 9, 12, 15, 18, 21, 24]}
          tickFormatter={value => clock(value)} axisLine={false} tickLine={false} tick={axis} height={26} />
        <YAxis domain={[0, 80000 * regionScale]} ticks={[0, 20000, 40000, 60000, 80000].map(value => value * regionScale)}
          tickFormatter={value => `${number(value / 1000)}k`} axisLine={false} tickLine={false} tick={axis} width={50} />
        {fuelOrder.map(fuel => <Area key={fuel} type="monotone" dataKey={fuel} stackId="generation"
          stroke={fuelColors[fuel]} strokeWidth={0.6} fill={fuelColors[fuel]} fillOpacity={0.77}
          activeDot={false} isAnimationActive={false} />)}
        {forecast && <Line dataKey="actualForecast" type="monotone" stroke={muted} strokeDasharray="5 4"
          strokeWidth={1.3} dot={false} activeDot={false} isAnimationActive={false} />}
        {forecast && <Line dataKey="projectedForecast" type="monotone" stroke={muted} strokeOpacity={0.6}
          strokeDasharray="5 4" strokeWidth={1.3} dot={false} activeDot={false} isAnimationActive={false} />}
        <Line dataKey="actualLoad" type="monotone" stroke={text} strokeWidth={2} dot={false} activeDot={false} isAnimationActive={false} />
        <Line dataKey="projectedLoad" type="monotone" stroke={text} strokeOpacity={0.5} strokeWidth={2}
          dot={false} activeDot={false} isAnimationActive={false} />
        <ReferenceArea x1={actualUntil} x2={24} y1={0} y2={80000 * regionScale} fill={surface} fillOpacity={0.55} stroke="none" />
        {actualUntil < 24 && <ReferenceLine x={actualUntil} stroke={muted} strokeDasharray="2 4" strokeOpacity={0.6} />}
        <ReferenceDot x={state.time} y={state.load} r={4} stroke={surface} strokeWidth={2} fill={amber} />
      </ComposedChart>
    </ResponsiveContainer>
    <Typography variant="caption" color="text.secondary" className="pointer-events-none absolute left-14 top-2">ACTUAL</Typography>
    {actualUntil < 24 && <Typography variant="caption" color="text.secondary" className="pointer-events-none absolute right-8 top-2">PROJECTED</Typography>}
    <Box className="absolute bottom-[26px] left-[57px] right-[34px] top-[39px]">
      <Slider aria-label="Dispatch time" min={0} max={1440} step={5} shiftStep={60}
        value={state.time * 60} onChange={(_, value) => { if (typeof value === "number") setTime(value / 60); }}
        getAriaValueText={value => `${clock(value / 60)} CDT`}
        valueLabelDisplay="on" valueLabelFormat={value => clock(value / 60)} track={false} />
    </Box>
  </Box>;
}

function SupplyStack({ state, scale, expanded = false }: { state: Dispatch; scale: number; expanded?: boolean }) {
  const { surface, border, axis } = useChartTokens();
  return <Box className={expanded ? "h-[310px] w-full" : "h-[136px] w-full"}>
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart accessibilityLayer={false} margin={{ top: 15, right: 72, left: 9, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={border} strokeDasharray="2 3" />
        <XAxis type="number" dataKey="capacity" domain={[0, 95000 * scale]}
          ticks={[0, 20000, 40000, 60000, 80000].map(value => value * scale)}
          tickFormatter={value => `${number(value / 1000)}k`} tick={axis} tickLine={false} axisLine={false} height={26} allowDataOverflow />
        <YAxis type="number" domain={[-10, 160]} ticks={[0, 40, 80, 120, 160]} interval={0} tick={axis}
          tickLine={false} axisLine={false} width={48} allowDataOverflow />
        {state.offers.filter(offer => offer.capacity > 0).map(offer =>
          <ReferenceArea key={offer.id} x1={offer.start} x2={offer.end} y1={-10} y2={offer.cost}
            fill={fuelColors[offer.fuel]} fillOpacity={0.15} stroke={surface} strokeWidth={1} />)}
        {state.offers.filter(offer => offer.dispatched > 0).map(offer =>
          <ReferenceArea key={`dispatched-${offer.id}`} x1={offer.start} x2={offer.start + offer.dispatched}
            y1={-10} y2={offer.cost} fill={fuelColors[offer.fuel]} fillOpacity={0.85} stroke={surface} strokeWidth={1} />)}
        <ReferenceLine y={state.price} stroke={amber} strokeDasharray="4 3" label={{
          value: number(state.price, 2), position: "right", fill: amber, fontSize: 12, fontFamily: axis.fontFamily,
        }} />
        <ReferenceLine x={state.demand} stroke={amber} strokeWidth={1.5} label={{
          value: `${number(state.demand)} MW`, position: "insideTopLeft", fill: amber, fontSize: 12, fontFamily: axis.fontFamily,
        }} />
        <ReferenceDot x={state.demand} y={state.price} r={4} fill={amber} stroke={surface} strokeWidth={2} />
      </ComposedChart>
    </ResponsiveContainer>
  </Box>;
}

function Sparkline({ series, state }: { series: ReturnType<typeof daySeries>; state: Dispatch }) {
  const { surface, border, muted } = useChartTokens();
  return <Box className="h-[52px] w-full">
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={series} accessibilityLayer={false} margin={{ top: 8, right: 4, left: 4, bottom: 1 }}>
        <XAxis type="number" dataKey="time" domain={[0, 24]} hide />
        <YAxis domain={[0, 100]} hide />
        <ReferenceLine y={50} stroke={border} strokeDasharray="3 4" />
        <Line type="monotone" dataKey="price" dot={false} activeDot={false} stroke={muted} strokeWidth={1.5} isAnimationActive={false} />
        <ReferenceLine x={state.time} stroke={amber} strokeOpacity={0.35} />
        <ReferenceDot x={state.time} y={state.price} r={3.5} fill={amber} stroke={surface} strokeWidth={1.5} />
      </ComposedChart>
    </ResponsiveContainer>
  </Box>;
}

export default function SystemLoad() {
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const [targetTime, setTargetTime] = useState(NOW);
  const [region, setRegion] = useState("system");
  const [day, setDay] = useState("2026-10-14");
  const [forecast, setForecast] = useState(true);
  const [tab, setTab] = useState("Overview");
  const [panel, setPanel] = useState<string | null>(null);
  const [constraint, setConstraint] = useState<number | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [timeAnchor, setTimeAnchor] = useState<HTMLElement | null>(null);
  const reduced = useReducedMotion();
  const time = useTween(targetTime);
  const scale = useTween(region === "east" ? 0.57 : region === "west" ? 0.43 : 1, 350);
  const dayScale = useTween(day === "2026-10-14" ? 1 : 0.976, 350);
  const solved = useMemo(() => dispatch(time, scale, dayScale), [time, scale, dayScale]);
  const price = useTween(solved.price, 240);
  const state = { ...solved, price, shadow: shadowPrices(price) };
  const actualUntil = day === "2026-10-14" ? NOW : 24;
  const series = useMemo(() => daySeries(scale, dayScale, actualUntil), [scale, dayScale, actualUntil]);
  const peak = useMemo(() => series.reduce((best, point) => point.load > best.load ? point : best, series[0]), [series]);
  const availableByFuel = fuelOrder.map(fuel => ({
    fuel, offered: state.offers.filter(offer => offer.fuel === fuel).reduce((sum, offer) => sum + offer.capacity, 0),
  }));
  const priceDA = state.price * 0.88 - 2.23;
  const atCurrent = Math.abs(targetTime - NOW) < 0.001 && day === "2026-10-14";
  const selectedDate = day === "2026-10-14" ? "14 Oct 2026" : "13 Oct 2026";
  const areaName = region === "system" ? "Northwind system" : region === "east" ? "East operating area" : "West operating area";
  const csv = `Time,Fuel,Generation MW,Offered MW\n${availableByFuel.map(({ fuel, offered }) =>
    `${clock(time)},${fuelNames[fuel]},${state.fuel[fuel]},${offered}`).join("\n")}\n${clock(time)},Net imports,${state.netImports},\n${clock(time)},System load,${state.load},`;
  const theme = useMemo(() => createTheme({
    palette: {
      mode: "dark", primary: { main: amber },
      background: { default: "#121212", paper: "#121212" },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    },
    shape: { borderRadius: 12 },
    components: {
      MuiPopper: { defaultProps: { container: root } },
      MuiButton: { styleOverrides: { root: { borderRadius: 4 } } },
      MuiIconButton: { defaultProps: { size: "small" } },
      MuiChip: { defaultProps: { size: "small" } },
      MuiCard: { defaultProps: { elevation: 2 } },
      MuiCardContent: { styleOverrides: { root: { padding: 16, "&:last-child": { paddingBottom: 16 } } } },
      MuiTextField: { defaultProps: { size: "small" } },
      MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 4 } } },
      MuiFilledInput: { styleOverrides: { root: { borderTopLeftRadius: 4, borderTopRightRadius: 4 } } },
      MuiAppBar: { defaultProps: { color: "default", elevation: 4 } },
      MuiAvatar: { styleOverrides: { root: { width: 32, height: 32, fontSize: "0.875rem" } } },
      MuiCardHeader: {
        defaultProps: { slotProps: { title: { variant: "subtitle2" } } },
        styleOverrides: {
          root: { height: 44, minHeight: 44, padding: "8px 16px" },
          action: { margin: 0, alignSelf: "center" },
        },
      },
      MuiTable: {
        styleOverrides: { root: {
          '&[aria-label="Binding constraints"]': {
            "& th": { fontSize: "0.6875rem", padding: "2px 12px", whiteSpace: "nowrap" },
            "& td": { padding: "0 12px" },
            "& tr:last-child td": { borderBottom: 0 },
            "& .MuiButton-root": { display: "block", textAlign: "left", padding: 0, minWidth: 0, textTransform: "none" },
            "& .MuiTypography-caption": { lineHeight: 1.25 },
          },
        } },
      },
      MuiTabs: { styleOverrides: { root: ({ ownerState }) => ownerState.orientation === "vertical" ? {
        width: "100%",
        "& .MuiTab-root": { minWidth: 0, minHeight: 76, padding: "12px 8px", textTransform: "none", fontSize: "0.75rem", lineHeight: 1.25 },
        "& .MuiTabs-indicator": { width: 3 },
      } : {} } },
      MuiToggleButton: { styleOverrides: { root: { borderRadius: 4 } } },
      MuiPaper: { styleOverrides: { root: {
        '&[aria-label="Main navigation"] .MuiListItemButton-root': { flexDirection: "column", gap: 4, padding: "8px 4px" },
      } } },
      MuiSlider: { styleOverrides: {
        root: { display: "block", height: "100%", padding: 0, borderRadius: 0, cursor: "ew-resize" },
        rail: { opacity: 0 },
        thumb: {
          width: 2, height: "100%", borderRadius: 0, boxShadow: "none",
          "&:before": { boxShadow: "none" },
          "&:after": { width: 28, height: "100%", borderRadius: 0 },
          "&:hover, &.Mui-active": { boxShadow: "none" },
          "&.Mui-focusVisible": { boxShadow: "0 0 0 4px #F5A52433" },
        },
        valueLabel: ({ theme }) => ({
          top: 0, backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText, borderRadius: 4, padding: "3px 8px",
        }),
      } },
      MuiTooltip: { defaultProps: { arrow: true } },
    },
  }), [root]);

  const openPanel = (name: string) => { setConstraint(null); setPanel(name); };
  const closePanel = () => { setConstraint(null); setPanel(null); };
  const fuelRows = availableByFuel.map(({ fuel, offered }) => ({
    key: fuel, cells: [
      <Stack direction="row" sx={{ alignItems: "center" }} spacing={1}><Swatch fuel={fuel} /><span>{fuelNames[fuel]}</span></Stack>,
      number(state.fuel[fuel]), number(offered), offered ? `${number(state.fuel[fuel] / offered * 100, 1)}%` : "--",
    ],
  }));
  let panelContent: ReactNode = null;
  if (constraint !== null) {
    const item = constraints[constraint];
    panelContent = <Stack spacing={2}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
        <Chip label="Binding" color="primary" variant="outlined" />
        <Typography variant="body2" color="text.secondary">{clock(time)} CDT</Typography>
      </Stack>
      <DataTable headings={["Constraint parameter", "Value"]} rows={[
        { key: "area", cells: ["Operating corridor", item.area] },
        { key: "line", cells: ["Monitored voltage / direction", item.line] },
        { key: "contingency", cells: ["Limiting contingency", item.contingency] },
        { key: "flow", cells: ["Post-contingency flow", `${number(item.limit * scale)} MW`] },
        { key: "limit", cells: ["Emergency rating", `${number(item.limit * scale)} MW`] },
        { key: "shadow", cells: ["Shadow price", `$${number(state.shadow[constraint], 2)}/MWh`] },
      ]} />
      <Typography variant="body2" color="text.secondary" className="max-w-measure">
        N-1 security-constrained dispatch. Shadow price is the marginal cost of one additional MW of transfer capability.
      </Typography>
    </Stack>;
  } else if (panel === "Dispatch snapshot" || panel === "Generation assets") {
    panelContent = <Stack spacing={2}>
      <Stack direction="row" sx={{ justifyContent: "space-between" }}>
        <Typography variant="body2" color="text.secondary">{areaName}</Typography>
        <Typography variant="body2" color="text.secondary">{selectedDate} · {clock(time)} CDT</Typography>
      </Stack>
      <DataTable headings={["Fuel", "Dispatched, MW", "Offered, MW"]} rows={fuelRows.map(row => ({ ...row, cells: row.cells.slice(0, 3) }))} />
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="body2">Total generation {number(state.generation)} MW</Typography>
        <Button component="a" variant="contained" startIcon={<Download size={15} />}
          download={`northwind-dispatch-${day}-${clock(time).replace(":", "")}.csv`}
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`}>Export CSV</Button>
      </Stack>
    </Stack>;
  } else if (panel === "Storage fleet") {
    panelContent = <DataTable headings={["Battery site", "Nameplate, MW", "Energy, MWh"]}
      rows={storageSites.map(site => ({ key: site.id, cells: [site.name, number(site.mw), number(site.mwh)] }))} />;
  } else if (panel === "Supply stack") {
    panelContent = <Stack spacing={2}>
      <Stack direction="row" sx={{ justifyContent: "space-between" }}>
        <Typography variant="body2" color="text.secondary">Offer, $/MWh</Typography>
        <Typography variant="body2">{clock(time)} CDT · {number(state.demand)} MW</Typography>
      </Stack>
      <SupplyStack state={state} scale={scale} expanded />
      <Divider />
      <Stack direction="row" sx={{ justifyContent: "space-between" }}>
        <Typography variant="body2">Marginal fuel: {fuelNames[state.marginal]}</Typography>
        <Typography variant="body2" color="primary">${number(state.price, 2)}/MWh</Typography>
      </Stack>
    </Stack>;
  } else if (panel === "Keyboard shortcuts") {
    panelContent = <DataTable headings={["Time cursor", "Control"]} rows={[
      { key: "drag", cells: ["Select interval", "Click or drag generation chart"] },
      { key: "arrows", cells: ["Previous / next 5 minutes", "Left / Right arrow"] },
      { key: "shift", cells: ["Previous / next hour", "Shift + Left / Right"] },
      { key: "edges", cells: ["Start / end of day", "Home / End"] },
      { key: "close", cells: ["Close panel", "Escape"] },
    ]} />;
  } else if (panel === "Display settings") {
    panelContent = <Stack spacing={3}>
      <FormControlLabel label="Day-ahead forecast overlay" labelPlacement="start" className="justify-between"
        control={<Switch checked={forecast} onChange={(_, checked) => setForecast(checked)} />} />
      <Divider />
      <Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography variant="body2">Time zone</Typography>
        <Typography variant="body2" color="text.secondary">America/Chicago · CDT</Typography></Stack>
      <Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography variant="body2">Reduced motion</Typography>
        <Typography variant="body2" color="text.secondary">{reduced ? "Enabled" : "System preference"}</Typography></Stack>
    </Stack>;
  } else if (panel === "Operator profile") {
    panelContent = <Stack spacing={3}>
      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}><Avatar>EL</Avatar><Box>
        <Typography variant="h6">Ellis Lane</Typography>
        <Typography variant="body2" color="text.secondary">System operations · Desk 04</Typography>
      </Box></Stack>
      <DataTable headings={["Session", "Value"]} rows={[
        { key: "role", cells: ["Role", "Shift supervisor"] },
        { key: "shift", cells: ["Shift", "14:00 - 22:00 CDT"] },
        { key: "access", cells: ["Access", "Operations · read-only"] },
      ]} />
    </Stack>;
  } else if (panel === "Notifications") {
    panelContent = <Stack spacing={2}>
      <Stack direction="row" sx={{ justifyContent: "space-between" }}>
        <Chip label={acknowledged ? "0 unread" : "2 unread"} variant="outlined" color={acknowledged ? "default" : "primary"} />
        <Button variant="contained" disabled={acknowledged} onClick={() => setAcknowledged(true)}
          startIcon={acknowledged ? <Check size={14} /> : undefined}>{acknowledged ? "Acknowledged" : "Acknowledge all"}</Button>
      </Stack>
      <DataTable headings={["Event", "Time, CDT"]} rows={[
        { key: "c", cells: ["Westridge - Alder constraint binding", "17:25"] },
        { key: "s", cells: ["Evening dispatch schedule published", "17:00"] },
        { key: "m", cells: ["State estimator converged", "16:55"] },
      ]} />
    </Stack>;
  } else if (panel === "Transmission") {
    panelContent = <DataTable headings={["Binding element", "Flow, MW", "Shadow, $/MWh"]} rows={constraints.map((item, i) => ({
      key: item.name, onClick: () => { setPanel(null); setConstraint(i); },
      cells: [item.name, number(item.limit * scale), number(state.shadow[i], 2)],
    }))} />;
  } else if (panel === "Markets") {
    panelContent = <DataTable headings={["Price component", "$/MWh"]} rows={[
      { key: "rt", cells: ["Real-time system clearing", number(state.price, 2)] },
      { key: "da", cells: ["Day-ahead system clearing", number(priceDA, 2)] },
      { key: "spread", cells: ["Real-time / day-ahead spread", number(state.price - priceDA, 2)] },
    ]} />;
  } else if (panel === "Reliability") {
    panelContent = <DataTable headings={["System check", "Current", "Threshold"]} rows={[
      { key: "freq", cells: ["Frequency, Hz", "60.002", "59.950 - 60.050"] },
      { key: "margin", cells: ["Reserve margin", `${number(state.margin, 1)}%`, "7.0% minimum"] },
      { key: "reserve", cells: ["Available reserve, MW", number(state.reserve), number(state.load * 0.07)] },
      { key: "estimator", cells: ["State estimator", "Converged", "Converged"] },
    ]} />;
  } else if (panel) {
    panelContent = <List>{[
      { name: "System operations", icon: Activity, detail: "Load, generation & dispatch" },
      { name: "Transmission", icon: Network, detail: "Flows & binding constraints" },
      { name: "Markets", icon: TrendingUp, detail: "Real-time & day-ahead prices" },
      { name: "Reliability", icon: ShieldCheck, detail: "Reserves & system conditions" },
    ].map(item => <ListItemButton key={item.name} onClick={() => item.name === "System operations" ? closePanel() : openPanel(item.name)}>
      <ListItemIcon><item.icon size={20} /></ListItemIcon>
      <Box><Typography variant="body1">{item.name}</Typography><Typography variant="body2" color="text.secondary">{item.detail}</Typography></Box>
    </ListItemButton>)}</List>;
  }

  return <div ref={setRoot} data-design-root className="h-full min-h-[960px] max-h-[960px] w-full font-body antialiased" onKeyDown={event => {
    if (event.key === "Escape") closePanel();
  }}>
    <ThemeProvider theme={theme}>
      <ScopedCssBaseline className="relative flex h-[960px] w-full flex-col tabular-nums">
        <AppBar position="static">
          <Toolbar className="h-[72px] gap-5">
            <Stack direction="row" sx={{ alignItems: "center" }} spacing={1.2}>
              <Box className="flex size-8 items-center justify-center" sx={{ color: "primary.main" }}><Zap size={26} /></Box>
              <Typography variant="h6">Northwind Grid</Typography>
            </Stack>
            <TextField select label="Operating area" variant="filled" className="w-60"
              value={region} onChange={event => setRegion(event.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><Network size={16} /></InputAdornment> } }}>
              <MenuItem value="system">Northwind system</MenuItem>
              <MenuItem value="east">East operating area</MenuItem>
              <MenuItem value="west">West operating area</MenuItem>
            </TextField>
            <Box className="flex-1" />
            <Chip icon={<ShieldCheck size={14} />} label={state.margin >= 7 ? "Normal operations" : "Reserve advisory"}
              color={state.margin >= 7 ? "default" : "primary"} />
            <Typography variant="body2" color="text.secondary">60.002 <Box component="span" sx={{ color: "text.disabled" }}>Hz</Box></Typography>
            <Divider orientation="vertical" flexItem sx={{ my: 1.75 }} />
            <Typography variant="body2">{clock(time)} <Box component="span" sx={{ color: "text.secondary" }}>CDT</Box></Typography>
            <Tooltip title="Notifications"><IconButton aria-label="Notifications" onClick={() => openPanel("Notifications")}>
              <Badge variant="dot" color="primary" invisible={acknowledged}><Bell size={19} /></Badge>
            </IconButton></Tooltip>
            <Tooltip title="Ellis Lane · Shift supervisor"><IconButton aria-label="Operator profile" onClick={() => openPanel("Operator profile")}>
              <Avatar>EL</Avatar>
            </IconButton></Tooltip>
          </Toolbar>
        </AppBar>

        <Box className="flex min-h-0 flex-1">
          <Paper component="nav" aria-label="Main navigation" square elevation={1}
            className="flex w-28 shrink-0 flex-col items-center py-3">
            <Tabs orientation="vertical" aria-label="Operations navigation"
              value={navigation.some(item => item.name === panel) ? panel : "System operations"}
              onChange={(_, value: string) => value === "System operations" ? (closePanel(), setTab("Overview")) : openPanel(value)}>
              {navigation.map(item => <Tab key={item.name} value={item.name} label={item.name} icon={<item.icon />} iconPosition="top" />)}
            </Tabs>
            <Box className="flex-1" />
            <List className="w-full">
              {[{ label: "Applications", icon: LayoutGrid }, { label: "Display settings", icon: Settings }, { label: "Keyboard shortcuts", icon: CircleHelp }].map(item =>
                <ListItemButton key={item.label} aria-label={item.label} onClick={() => openPanel(item.label)}>
                  <item.icon /><Typography variant="caption">{item.label}</Typography>
                </ListItemButton>
              )}
            </List>
          </Paper>

          <Box component="main" className="grid min-h-0 min-w-0 flex-1 grid-rows-[52px_52px_88px_minmax(0,1fr)] gap-3 p-4">
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Breadcrumbs separator={<ChevronRight size={12} />} sx={{ mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">Operations</Typography>
                  <Typography variant="caption" color="text.secondary">System overview</Typography>
                </Breadcrumbs>
                <Typography component="h1" variant="h5" className="font-display">System Load &amp; Generation</Typography>
              </Box>
              <Stack direction="row" sx={{ alignItems: "center" }} spacing={2}>
                <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", color: "text.secondary" }}>
                  <Check size={13} /><Typography variant="caption">Updated 17:35:04</Typography>
                </Stack>
                <Button variant="contained" startIcon={<Download size={15} />} onClick={() => openPanel("Dispatch snapshot")}>Snapshot</Button>
              </Stack>
            </Stack>

            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
              <Stack direction="row" sx={{ alignItems: "center" }} spacing={2}>
                <TextField select label="Operating date" variant="outlined" className="w-44"
                  value={day} onChange={event => setDay(event.target.value)}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><CalendarDays size={14} /></InputAdornment> } }}>
                  <MenuItem value="2026-10-14">14 Oct 2026</MenuItem><MenuItem value="2026-10-13">13 Oct 2026</MenuItem>
                </TextField>
                <Chip icon={<Radio size={13} />} label="Real-time market" />
                <FormControlLabel sx={{ m: 0 }} control={<Checkbox size="small" checked={forecast} onChange={(_, checked) => setForecast(checked)} />}
                  label={<Typography variant="body2" color="text.secondary">Day-ahead forecast</Typography>} />
              </Stack>
              <Stack direction="row" sx={{ alignItems: "center" }} spacing={2}>
                <Typography variant="caption" color="text.secondary">5-min intervals · CDT</Typography>
                <ToggleButtonGroup aria-label="Dispatch view" exclusive value={tab} color="primary" size="small"
                  onChange={(_, value: string | null) => { if (value !== null) setTab(value); }}>
                  <ToggleButton value="Overview">Overview</ToggleButton>
                  <ToggleButton value="Dispatch detail">Dispatch detail</ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            </Stack>

            <Box className="grid grid-cols-4 gap-3">
              <Metric title="System load" value={state.load} detail={number(peak.load)} note={`day peak · ${clock(peak.time)}`} />
              <Metric title="Generation" value={state.generation} detail={`+${number(state.netImports)}`} note="net imports" />
              <Metric title="Available reserve" value={state.reserve} detail={`${number(state.margin, 1)}%`} note="floor 7.0%" />
              <Metric title="Load vs day-ahead" value={state.load - state.forecast}
                detail={`${number((state.load / state.forecast - 1) * 100, 2)}%`} note={`forecast ${number(state.forecast)}`} />
            </Box>

            <Box className="grid min-h-0 grid-cols-[minmax(0,1fr)_304px] gap-3">
              <Box className="grid min-h-0 min-w-0 grid-rows-[344px_minmax(0,1fr)] gap-3">
                <Panel title="Generation by fuel, MW" action={<Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                  <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}><Box className="h-0.5 w-4 bg-current" /><Typography variant="caption" color="text.secondary">Load</Typography></Stack>
                  {forecast && <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}><Box className="w-4 border-t border-dashed border-current" /><Typography variant="caption" color="text.secondary">Day-ahead</Typography></Stack>}
                  <Tooltip title="Drag the amber cursor or use the arrow keys"><IconButton aria-label="Time cursor help" onClick={() => openPanel("Keyboard shortcuts")}><CircleHelp size={15} /></IconButton></Tooltip>
                </Stack>}>
                  <GenerationChart series={series} state={state} setTime={setTargetTime} forecast={forecast} regionScale={scale} actualUntil={actualUntil} />
                  <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }} className="h-7 shrink-0 px-4">
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", color: "text.secondary" }}><GripVertical size={13} /><Typography variant="caption">Drag to inspect</Typography></Stack>
                    <Stack direction="row" sx={{ alignItems: "center" }} spacing={1}>
                      <Typography variant="caption" color="text.secondary">Selected interval</Typography>
                      <Typography variant="caption" color="primary">{clock(time)} CDT</Typography>
                      <Typography variant="caption" color="text.disabled">/</Typography>
                      <Typography variant="caption" color="text.secondary">{time <= actualUntil ? "Actual" : "Projected"}</Typography>
                    </Stack>
                  </Stack>
                  <Box className="mx-4 grid min-h-0 flex-1 grid-cols-7 items-center gap-1">
                    {fuelOrder.map(fuel => <Tooltip key={fuel} title={`${fuelNames[fuel]} · ${number(state.fuel[fuel] / state.generation * 100, 1)}% of generation`}>
                      <Box className="flex flex-col items-start gap-1">
                        <Chip tabIndex={0} icon={<Swatch fuel={fuel} />} label={fuelNames[fuel]} />
                        <Typography variant="body2">{number(state.fuel[fuel])} <Typography component="span" variant="caption" color="text.secondary">MW</Typography></Typography>
                      </Box>
                    </Tooltip>)}
                  </Box>
                </Panel>

                <Panel title={tab === "Overview" ? "Supply stack" : "Dispatch by fuel"} action={<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <Typography variant="caption" color="text.secondary">{clock(time)} CDT</Typography>
                  <Tooltip title="Expand supply stack"><IconButton aria-label="Expand supply stack" onClick={() => openPanel("Supply stack")}><Maximize2 size={14} /></IconButton></Tooltip>
                </Stack>}>
                  {tab === "Overview" ? <>
                    <Stack direction="row" sx={{ justifyContent: "space-between" }} className="px-4">
                      <Typography variant="caption" color="text.secondary">Offer, $/MWh</Typography>
                      <Typography variant="caption" color="text.secondary">Demand <Box component="span" sx={{ color: "text.primary" }}>{number(state.demand)} MW</Box></Typography>
                    </Stack>
                    <SupplyStack state={state} scale={scale} />
                    <Stack direction="row" className="mx-4 min-h-8 flex-1" sx={{ alignItems: "center", justifyContent: "space-between" }}>
                      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}><Swatch fuel={state.marginal} />
                        <Typography variant="caption" color="text.secondary">Marginal fuel <Box component="span" sx={{ color: "text.primary" }}>{fuelNames[state.marginal]}</Box></Typography>
                        <Typography variant="caption" color="text.secondary">{state.marginalId}</Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">Offered capacity <Box component="span" sx={{ color: "text.primary" }}>{number(state.total)} MW</Box></Typography>
                      <Typography variant="caption" color="text.secondary">Cumulative capacity, MW</Typography>
                    </Stack>
                  </> : <DataTable headings={["Fuel", "Dispatched, MW", "Offered, MW", "Utilization"]} rows={fuelRows} />}
                </Panel>
              </Box>

              <Box component="aside" className="grid min-h-0 grid-rows-[188px_104px_104px_minmax(0,1fr)] gap-3">
                <Panel title="Real-time price" action={<Typography variant="caption" color="text.secondary">$/MWh</Typography>}>
                  <Box className="px-4">
                    <Stack direction="row" sx={{ alignItems: "baseline", justifyContent: "space-between" }}>
                      <Typography variant="h4" color="primary">{number(state.price, 2)}</Typography>
                      <Stack direction="row" sx={{ alignItems: "center" }} spacing={0.25}><ArrowUpRight size={13} /><Typography variant="caption">+{number(state.price - priceDA, 2)}</Typography></Stack>
                    </Stack>
                    <Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography variant="caption" color="text.secondary">System clearing price</Typography><Typography variant="caption" color="text.secondary">vs day-ahead</Typography></Stack>
                    <Sparkline series={series} state={state} />
                    <Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography variant="caption" color="text.secondary">00:00</Typography><Typography variant="caption">{clock(time)}</Typography><Typography variant="caption" color="text.secondary">24:00</Typography></Stack>
                  </Box>
                </Panel>
                <Panel title="Net interchange" action={<ArrowDownLeft size={16} />}>
                  <Box className="px-4">
                    <Stack direction="row" sx={{ alignItems: "baseline" }} spacing={0.75}>
                      <Typography variant="h5">+{number(state.netImports)}</Typography><Typography variant="caption" color="text.secondary">MW</Typography>
                      <Box className="flex-1" /><Typography variant="caption" color="text.secondary">Import</Typography>
                    </Stack>
                    <Stack direction="row" sx={{ justifyContent: "space-between", mt: 0.4 }}>
                      <Typography variant="caption" color="text.secondary">East tie <Box component="span" sx={{ color: "text.primary" }}>+{number(state.eastTie)}</Box></Typography>
                      <Typography variant="caption" color="text.secondary">West tie <Box component="span" sx={{ color: "text.primary" }}>{number(state.westTie)}</Box></Typography>
                    </Stack>
                  </Box>
                </Panel>
                <Panel title="Renewable share" action={<Sun size={15} />}>
                  <Box className="px-4">
                    <Stack direction="row" sx={{ alignItems: "baseline" }} spacing={0.5}><Typography variant="h5">{number(state.renewableShare, 1)}</Typography>
                      <Typography variant="body2" color="text.secondary">%</Typography><Box className="flex-1" />
                      <Typography variant="caption">{number(state.renewable)} MW</Typography>
                    </Stack>
                    <Stack direction="row" sx={{ justifyContent: "space-between", mt: 0.4 }}><Typography variant="caption" color="text.secondary">Wind + solar + hydro</Typography><Typography variant="caption" color="text.secondary">of generation</Typography></Stack>
                  </Box>
                </Panel>
                <Panel title="Binding constraints" action={<Chip label={constraints.length} color="primary" />}>
                  <TableContainer className="min-h-0 flex-1">
                    <Table size="small" aria-label="Binding constraints">
                      <TableHead><TableRow><TableCell>Monitored element</TableCell><TableCell align="right">Shadow, $/MWh</TableCell></TableRow></TableHead>
                      <TableBody>{constraints.map((item, i) => <TableRow hover key={item.name}>
                        <TableCell><Button color="inherit" onClick={() => { setPanel(null); setConstraint(i); }}>
                          <Typography variant="caption" component="span" className="block whitespace-nowrap">{item.name}</Typography>
                          <Typography variant="caption" color="text.secondary" component="span" className="block">{item.line}</Typography>
                        </Button></TableCell>
                        <TableCell align="right"><Typography variant="body2">{number(state.shadow[i], 2)}</Typography></TableCell>
                      </TableRow>)}</TableBody>
                    </Table>
                  </TableContainer>
                </Panel>
              </Box>
            </Box>
          </Box>
        </Box>

        <Paper component="footer" square elevation={1} className="flex h-8 shrink-0 items-center justify-between px-4">
          <Stack direction="row" sx={{ alignItems: "center" }} spacing={2.5}>
            <Chip icon={<Check size={13} />} label="EMS connected" />
            <Typography variant="caption" color="text.secondary">State estimator <Box component="span" sx={{ color: "text.primary", ml: 0.5 }}>Converged</Box></Typography>
            <Typography variant="caption" color="text.secondary">SE-20261014-1735</Typography>
          </Stack>
          <Stack direction="row" sx={{ alignItems: "center" }} spacing={1.5}>
            <Typography variant="caption" color="text.secondary">{selectedDate}</Typography>
            <Button aria-haspopup="menu" aria-expanded={!!timeAnchor} onClick={event => setTimeAnchor(event.currentTarget)}
              startIcon={<Clock3 size={12} />} endIcon={<ChevronDown size={12} />} size="small">
              {atCurrent ? "Current interval" : targetTime > actualUntil ? "Projected interval" : "Historical interval"} {clock(time)}
            </Button>
            {!atCurrent && <Button color="inherit" size="small" startIcon={<RotateCcw size={12} />} onClick={() => { setTargetTime(NOW); setDay("2026-10-14"); }}>Reset</Button>}
          </Stack>
        </Paper>
        <Menu anchorEl={timeAnchor} open={!!timeAnchor} onClose={() => setTimeAnchor(null)}
          anchorOrigin={{ vertical: "top", horizontal: "right" }} transformOrigin={{ vertical: "bottom", horizontal: "right" }}>
          {[{ name: "Morning ramp", time: 7.5 }, { name: "Solar peak", time: 13 }, { name: "Evening peak", time: NOW }].map(item =>
            <MenuItem key={item.name} selected={Math.abs(targetTime - item.time) < 0.001}
              onClick={() => { setTargetTime(item.time); setTimeAnchor(null); }}>
              <Stack direction="row" sx={{ justifyContent: "space-between" }} spacing={3} className="w-full">
                <Typography variant="body2">{item.name}</Typography><Typography variant="body2" color="text.secondary">{clock(item.time)}</Typography>
              </Stack>
            </MenuItem>
          )}
        </Menu>
        {(panel || constraint !== null) && <Paper elevation={16} component="section" aria-label={constraint !== null ? constraints[constraint].name : panel ?? ""}
          className="absolute bottom-10 right-2 top-20 z-20 flex w-[640px] flex-col">
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }} className="px-5 py-4">
            <Typography variant="h6">{constraint !== null ? constraints[constraint].name : panel}</Typography>
            <IconButton aria-label="Close panel" autoFocus onClick={closePanel}><X size={20} /></IconButton>
          </Stack>
          <Divider /><Box className="min-h-0 flex-1 overflow-auto p-5">{panelContent}</Box>
        </Paper>}
      </ScopedCssBaseline>
    </ThemeProvider>
  </div>;
}
