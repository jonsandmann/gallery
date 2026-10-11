import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { animate, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Check, Info, X } from "lucide-react";
import clsx from "clsx";

export const chartTheme = {
  primary: "#006A6A",
  interval: "#B8DCD7",
  secondary: "#4B607C",
  muted: "#6D7975",
  grid: "#DCE4E0",
  error: "#BA1A1A",
  fontFamily: '"Roboto Flex", Roboto, sans-serif',
  tick: { fill: "#64716C", fontSize: 11 },
};

export const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006A6A] focus-visible:ring-offset-2";

export function Button({ children, className, tone = "quiet", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "quiet" | "filled" }) {
  return <button {...props} className={clsx("inline-flex h-9 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition-colors motion-reduce:transition-none", focus, tone === "filled" ? "bg-[#006A6A] text-white hover:bg-[#005757]" : "text-[#3F4946] hover:bg-[#E6ECEA]", className)}>{children}</button>;
}

export function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="relative inline-flex h-8 items-center gap-2 rounded-lg bg-[#EEF3F1] pl-3 text-xs text-[#3F4946]">
    <span>{label}</span>
    <select aria-label={label} value={value} onChange={event => onChange(event.target.value)} className={clsx("h-full appearance-none rounded-lg bg-transparent pl-1 pr-8 text-xs font-medium text-[#191C1B]", focus)}>
      {options.map(option => <option key={option}>{option}</option>)}
    </select>
    <ChevronDown size={13} className="pointer-events-none absolute right-2.5" />
  </label>;
}

export function Segmented({ value, options, onChange, label }: { value: string; options: string[]; onChange: (value: string) => void; label: string }) {
  return <div role="group" aria-label={label} className="flex items-center gap-1">
    {options.map(option => <button key={option} aria-pressed={value === option} onClick={() => onChange(option)} className={clsx("flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors motion-reduce:transition-none", focus, value === option ? "bg-[#9CF1F0] text-[#004F50]" : "bg-[#EEF3F1] text-[#3F4946] hover:bg-[#E1E9E5]")}>{value === option && <Check size={13} />}{option}</button>)}
  </div>;
}

export function Tabs({ value, options, onChange }: { value: string; options: string[]; onChange: (value: string) => void }) {
  return <div role="tablist" className="flex gap-5 border-b border-[#BEC9C5]/50">{options.map(option => <button role="tab" aria-selected={value === option} key={option} onClick={() => onChange(option)} className={clsx("border-b-2 py-3 text-sm font-medium", focus, value === option ? "border-[#006A6A] text-[#006A6A]" : "border-transparent text-[#3F4946] hover:text-[#006A6A]")}>{option}</button>)}</div>;
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={clsx("min-w-0 rounded-xl bg-[#EEF3F1]", className)}>{children}</section>;
}

export function Badge({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return <span className={clsx("inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium", error ? "bg-[#FFDAD6] text-[#93000A]" : "bg-[#E6ECEA] text-[#3F4946]")}>{children}</span>;
}

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return <span className="group relative inline-flex">
    {children}
    <span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 w-max max-w-64 -translate-x-1/2 rounded-md bg-[#29332F] px-3 py-2 text-xs text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">{label}</span>
  </span>;
}

export function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const reduced = useReducedMotion();
  const last = useRef(value);
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    if (reduced) { last.current = value; setDisplay(value); return; }
    const control = animate(last.current, value, {
      duration: .32, ease: [0.2, 0, 0, 1],
      onUpdate: next => { last.current = next; setDisplay(next); },
    });
    return () => control.stop();
  }, [value, reduced]);
  return <>{display.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</>;
}

export function Kpi({ label, value, suffix, detail, primary, error, index = 0, decimals }: { label: string; value: number | null; suffix?: string; detail: ReactNode; primary?: boolean; error?: boolean; index?: number; decimals?: number }) {
  const reduced = useReducedMotion();
  return <motion.section initial={reduced ? false : { opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .36, delay: index * .035, ease: [0.2, 0, 0, 1] }} className={clsx("flex min-w-0 flex-col justify-between rounded-xl px-5 py-3", error ? "bg-[#FFDAD6]" : primary ? "bg-[#DCEEE9]" : "bg-[#EEF3F1]")}>
    <div className="text-xs font-medium text-[#3F4946]">{label}</div>
    <div className={clsx("font-display text-5xl font-normal", error ? "text-[#93000A]" : primary ? "text-[#006A6A]" : "text-[#191C1B]")}>{value === null ? <span aria-label="No encounters">—</span> : <><AnimatedNumber value={value} decimals={decimals ?? (suffix === "%" ? 1 : 0)} />{suffix && <span className="ml-0.5 text-3xl">{suffix}</span>}</>}</div>
    <div className="text-xs text-[#53615A]">{detail}</div>
  </motion.section>;
}

export function Table({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return <div className="overflow-auto"><table className="w-full text-left text-sm"><thead><tr>{headers.map(header => <th key={header} className="bg-[#E6ECEA] px-4 py-3 text-xs font-medium text-[#3F4946]">{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index} className="border-b border-[#E6ECEA] last:border-0 hover:bg-[#EEF3F1]">{row.map((cell, column) => <td key={column} className="px-4 py-3">{cell}</td>)}</tr>)}</tbody></table></div>;
}

export function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);
  return <dialog ref={dialog} onCancel={onClose} onClick={event => { if (event.target === dialog.current) onClose(); }} className="fixed inset-0 m-auto w-[600px] max-w-[90%] rounded-3xl bg-[#F8FAF9] p-0 font-body text-[#191C1B] shadow-2xl backdrop:bg-[#191C1B]/30">
    <header className="flex items-center justify-between px-6 pb-4 pt-6"><h2 className="text-xl font-medium">{title}</h2><Button aria-label="Close dialog" onClick={onClose} className="!h-9 !w-9 !px-0"><X size={20} /></Button></header>
    <div className="px-6 pb-6">{children}</div>
  </dialog>;
}

export function Information({ label }: { label: string }) {
  return <Tooltip label={label}><button aria-label={label} className={clsx("rounded-full text-[#6D7975] hover:text-[#006A6A]", focus)}><Info size={14} /></button></Tooltip>;
}
