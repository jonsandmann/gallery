import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { animate, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, X } from "lucide-react";
import clsx from "clsx";

export const chartTheme = {
  ground: "#0D0F12",
  panel: "#14171C",
  raised: "#1A1E24",
  border: "#262B33",
  ink: "#E6E8EB",
  muted: "#9AA3AE",
  quiet: "#5C6672",
  amber: "#F5A524",
  axis: { fill: "#7E8895", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" },
  fuels: {
    nuclear: "#4FB0C6",
    coal: "#6B7280",
    gas: "#8E6CCF",
    hydro: "#3B82C4",
    wind: "#5FB98E",
    solar: "#E3B341",
    storage: "#D9775B",
  },
};

export const focusClass = "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#F5A524] focus-visible:ring-offset-2 focus-visible:ring-offset-[#14171C]";
export const labelClass = "text-xs font-medium uppercase tracking-[0.06em] text-[#9AA3AE]";
export const number = (value: number, decimals = 0) => value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export function useTween(value: number, duration = 0.24) {
  const [display, setDisplay] = useState(value);
  const current = useRef(value);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) {
      current.current = value;
      setDisplay(value);
      return;
    }
    const animation = animate(current.current, value, { duration, ease: [0.2, 0.8, 0.2, 1], onUpdate: next => { current.current = next; setDisplay(next); } });
    return () => animation.stop();
  }, [value, duration, reduced]);
  return display;
}

export function Button({ children, className, active, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return <button type="button" {...props} className={clsx("inline-flex h-8 shrink-0 items-center justify-center gap-2 rounded border px-3 text-xs font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40", active ? "border-[#F5A524]/35 bg-[#F5A524]/10 text-[#F5A524]" : "border-[#303640] bg-[#1A1E24] text-[#C7CDD5] hover:border-[#5C6672] hover:bg-[#22272F]", focusClass, className)}>{children}</button>;
}

export function Select({ children, className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <div className="relative">
    <select {...props} className={clsx("h-8 w-full appearance-none rounded border border-[#303640] bg-[#1A1E24] pl-3 pr-8 text-xs text-[#C7CDD5] transition-colors hover:border-[#5C6672]", focusClass, className)}>{children}</select>
    <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-2.5 text-[#9AA3AE]" />
  </div>;
}

export function Tabs({ options, value, onChange }: { options: string[]; value: string; onChange: (value: string) => void }) {
  return <div role="tablist" className="flex h-8 items-center gap-0.5 rounded border border-[#262B33] bg-[#0D0F12] p-0.5">{options.map(option =>
    <button role="tab" aria-selected={value === option} key={option} onClick={() => onChange(option)} className={clsx("h-full rounded-sm px-3 text-xs transition-colors", focusClass, value === option ? "bg-[#262B33] text-[#E6E8EB]" : "text-[#9AA3AE] hover:bg-[#1A1E24] hover:text-[#E6E8EB]")}>{option}</button>
  )}</div>;
}

export function Badge({ children, action = false }: { children: ReactNode; action?: boolean }) {
  return <span className={clsx("inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5 text-xs", action ? "border-[#F5A524]/25 bg-[#F5A524]/[0.07] text-[#F5A524]" : "border-[#303640] bg-[#1A1E24] text-[#9AA3AE]")}>{children}</span>;
}

export function Tooltip({ children, content }: { children: ReactNode; content: ReactNode }) {
  return <span className="group relative inline-flex">
    {children}
    <span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-max max-w-64 -translate-x-1/2 rounded border border-[#3B424D] bg-[#22272F] px-2.5 py-2 text-xs font-normal normal-case tracking-normal text-[#E6E8EB] shadow-lg group-hover:block group-focus-within:block">{content}</span>
  </span>;
}

export function Card({ children, title, action, className, bodyClassName }: { children: ReactNode; title?: ReactNode; action?: ReactNode; className?: string; bodyClassName?: string }) {
  return <section className={clsx("flex min-h-0 min-w-0 flex-col rounded border border-[#262B33] bg-[#14171C]", className)}>
    {title && <div className="flex h-11 shrink-0 items-center justify-between gap-3 px-4"><h2 className={labelClass}>{title}</h2>{action}</div>}
    <div className={clsx("min-h-0 min-w-0 flex-1", bodyClassName)}>{children}</div>
  </section>;
}

export function Kpi({ title, value, unit, detail, accent = false }: { title: string; value: number; unit: string; detail: ReactNode; accent?: boolean }) {
  return <Card bodyClassName="flex h-full items-center justify-between px-4">
    <div><div className={labelClass}>{title}</div><div className="mt-1 flex items-baseline gap-2"><span className={clsx("font-mono text-3xl tabular-nums", accent ? "text-[#F5A524]" : "text-[#E6E8EB]")}>{number(value)}</span><span className="font-mono text-xs text-[#7E8895]">{unit}</span></div></div>
    <div className="pl-2 text-right text-xs text-[#9AA3AE]">{detail}</div>
  </Card>;
}

export function Table({ columns, rows, className }: { columns: ReactNode[]; rows: { key: string; cells: ReactNode[]; onClick?: () => void; onPreview?: () => void; onEscape?: () => void; className?: string; ariaLabel?: string }[]; className?: string }) {
  return <table className={clsx("w-full border-collapse text-left text-xs", className)}>
    <thead><tr className="border-b border-[#262B33] text-[#7E8895]">{columns.map((column, i) => <th key={i} className={clsx("px-3 py-2 font-normal", i > 0 && "text-right")}>{column}</th>)}</tr></thead>
    <tbody>{rows.map(row => <tr key={row.key} tabIndex={row.onPreview ? 0 : undefined} aria-label={row.ariaLabel} onMouseEnter={row.onPreview} onFocus={row.onPreview} onClick={row.onPreview ? row.onClick : undefined} onKeyDown={event => {
      if (row.onPreview && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); row.onClick?.(); }
      if (event.key === "Escape") row.onEscape?.();
    }} className={clsx("border-b border-[#262B33]/70 last:border-0 hover:bg-[#1A1E24]", row.onPreview && focusClass, row.className)}>{row.cells.map((cell, i) => <td key={i} className={clsx("px-3 py-2.5", i > 0 && "text-right font-mono tabular-nums")}>{i === 0 && row.onClick && !row.onPreview ? <button onClick={row.onClick} className={clsx("w-full text-left hover:text-[#F5A524]", focusClass)}>{cell}</button> : cell}</td>)}</tr>)}</tbody>
  </table>;
}

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const reduced = useReducedMotion();
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    panel.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => { if (previous instanceof HTMLElement) previous.focus(); };
  }, []);
  return <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-12" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <motion.section ref={panel} role="dialog" aria-modal="true" aria-label={title} initial={{ opacity: 0, y: reduced ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : 0.3 }} className="w-[640px] rounded border border-[#3A424D] bg-[#14171C] shadow-2xl" onKeyDown={event => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const controls = panel.current?.querySelectorAll<HTMLElement>("button:not(:disabled), a[href], select, input, [tabindex='0']");
        const first = controls?.[0];
        const last = controls?.[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }}>
      <header className="flex items-center justify-between border-b border-[#262B33] p-4"><h2 className="font-display text-base font-semibold">{title}</h2><button aria-label="Close dialog" onClick={onClose} className={clsx("rounded p-1.5 text-[#9AA3AE] hover:bg-[#262B33] hover:text-white", focusClass)}><X size={17} /></button></header>
      {children}
    </motion.section>
  </div>;
}
