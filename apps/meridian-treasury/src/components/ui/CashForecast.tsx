import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";
import { Area, CartesianGrid, ComposedChart, Line, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from "recharts";
import { chartTheme, ease } from "./meridian";
import { paths, weeks, type Scenario } from "./cash-data";

function targets(scenario: Scenario, cash: number, scale: number) {
  const forecast = paths[scenario].map(value => value * scale);
  const min = Math.min(...forecast);
  return { values: [1329.8 * scale, 1302.4 * scale, 1341.2 * scale, cash, ...forecast], min, index: forecast.indexOf(min) + 4 };
}

export default function CashForecast({ scenario, cash, scale = 1 }: { scenario: Scenario; cash: number; scale?: number }) {
  const policy = 400 * scale;
  const initial = targets(scenario, cash, scale);
  const [frame, setFrame] = useState(initial);
  const current = useRef(initial);
  const reduced = useReducedMotion();
  useEffect(() => {
    const start = current.current;
    const end = targets(scenario, cash, scale);
    const controller = animate(0, 1, {
      duration: reduced ? 0 : 0.6, ease,
      onUpdate: t => {
        const next = {
          values: end.values.map((value, i) => start.values[i] + (value - start.values[i]) * t),
          min: start.min + (end.min - start.min) * t,
          index: start.index + (end.index - start.index) * t,
        };
        current.current = next;
        setFrame(next);
      },
    });
    return () => controller.stop();
  }, [scenario, cash, scale, reduced]);
  const data = frame.values.map((value, i) => {
    const spread = i < 3 ? 0 : ((i - 3) * 6 + 21) * scale;
    return { x: i, actual: i <= 3 ? value : null, forecast: i >= 3 ? value : null, range: i >= 3 ? [value - spread, value + spread * 0.8] : null };
  });
  const breaches: [number, number][] = [];
  for (let i = 3; i < frame.values.length - 1; i++) {
    const a = frame.values[i], b = frame.values[i + 1];
    if (a < policy || b < policy) {
      const cross = i + (policy - a) / (b - a);
      breaches.push([a < policy ? i : cross, b < policy ? i + 1 : cross]);
    }
  }
  return <div className="h-[184px] w-full" aria-label={`13-week forecast. Minimum ${frame.min.toFixed(1)} million USD in week ${Math.round(frame.index - 3)}.`}>
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 18, right: 28, bottom: 0, left: 8 }}>
        <CartesianGrid vertical={false} stroke={chartTheme.grid} strokeOpacity={0.6} />
        <XAxis dataKey="x" type="number" domain={[0, 16]} ticks={Array.from({ length: 17 }, (_, i) => i)} tickFormatter={i => weeks[i]} tickLine={false} axisLine={{ stroke: chartTheme.grid }} tick={{ fill: "#8D8D8D", fontSize: 12, fontFamily: chartTheme.fontFamily }} tickMargin={10} height={30} />
        <YAxis domain={[200 * scale, 1600 * scale]} ticks={[400, 800, 1200, 1600].map(value => value * scale)} width={48} tickFormatter={value => Math.round(value).toLocaleString("en-US")} axisLine={false} tickLine={false} tick={{ fill: "#8D8D8D", fontSize: 12, fontFamily: chartTheme.fontFamily }} />
        <Area dataKey="range" type="linear" stroke="none" fill={chartTheme.band} fillOpacity={1} isAnimationActive={false} />
        <ReferenceLine x={3} stroke="#C6C6C6" strokeDasharray="3 3" />
        <ReferenceLine y={policy} stroke="#8D8D8D" strokeDasharray="4 4" label={{ value: `${scale === 1 ? "Minimum liquidity" : "Allocated minimum"} ${policy.toFixed(scale === 1 ? 0 : 1)}`, position: "insideBottomLeft", fill: "#525252", fontSize: 12, offset: 6 }} />
        {breaches.map(([start, end], i) => <ReferenceLine key={i} segment={[{ x: start, y: policy }, { x: end, y: policy }]} stroke={chartTheme.danger} strokeWidth={3} />)}
        <Line dataKey="actual" type="linear" stroke="#525252" strokeWidth={2} dot={false} activeDot={{ r: 3 }} isAnimationActive={false} />
        <Line dataKey="forecast" type="linear" stroke={chartTheme.accent} strokeWidth={2} strokeDasharray="6 4" dot={false} activeDot={{ r: 3 }} isAnimationActive={false} />
        <ReferenceDot x={3} y={cash} r={3} fill="#525252" stroke="white" />
        <ReferenceDot x={frame.index} y={frame.min} r={4} fill={frame.min < policy ? chartTheme.danger : chartTheme.accent} stroke="white" strokeWidth={2}
          label={{ value: `${frame.min.toFixed(1)} · W${Math.round(frame.index - 3)}`, position: "top", offset: 12, fill: frame.min < policy ? chartTheme.danger : chartTheme.accent, fontSize: 12, fontWeight: 600 }} />
        <ChartTooltip content={({ active, label, payload }) => {
          if (!active || !payload?.length) return null;
          const row = data[Number(label)];
          return <div className="border border-[#E0E0E0] bg-white p-3 text-xs"><div className="mb-1 font-semibold">{weeks[Number(label)]} · {Number(label) > 3 ? `W${Number(label) - 3}` : "Actual"}</div><div>Closing balance <span className="ml-4 font-mono">{(row.forecast ?? row.actual)?.toLocaleString("en-US", { minimumFractionDigits: 1 })}</span></div>{row.range && <div className="mt-1 text-[#525252]">P10–P90 <span className="ml-4 font-mono">{row.range[0].toFixed(1)}–{row.range[1].toFixed(1)}</span></div>}</div>;
        }} />
      </ComposedChart>
    </ResponsiveContainer>
  </div>;
}
