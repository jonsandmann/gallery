import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { animate, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Info } from "lucide-react";
import clsx from "clsx";

export const chartTheme = {
  accent: "#0F62FE", context: "#A8A8A8", band: "#EDF3FE",
  grid: "#E0E0E0", muted: "#525252", danger: "#DA1E28",
  fontFamily: "IBM Plex Sans", fontSize: 12,
};
export const ease = [0.22, 1, 0.36, 1] as const;
export const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#0F62FE]";

export function Button({ children, primary, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean }) {
  return <button {...props} className={clsx("inline-flex h-10 items-center justify-between gap-6 rounded-none px-4 text-sm transition-colors disabled:opacity-40", focus, primary ? "bg-[#0F62FE] text-white hover:bg-[#0353E9]" : "border border-[#E0E0E0] bg-white text-[#161616] hover:bg-[#E8E8E8]", className)}>{children}</button>;
}

export function Select({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void }) {
  return <label className="relative flex h-10 min-w-0 items-center gap-3 border-b border-[#8D8D8D] bg-white pl-4 text-sm">
    <span className="shrink-0 text-[#525252]">{label}</span>
    <select aria-label={label} value={value} onChange={e => onChange(e.target.value)} className={clsx("h-full min-w-0 flex-1 appearance-none bg-transparent pr-9 font-semibold", focus)}>
      {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
    <ChevronDown size={14} className="pointer-events-none absolute right-3" />
  </label>;
}

export function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly T[]; onChange: (value: T) => void }) {
  return <div role="group" aria-label={label} className="flex h-10 shrink-0 bg-[#F4F4F4]">
    {options.map(option => <button key={option} onClick={() => onChange(option)} aria-pressed={value === option} className={clsx("relative whitespace-nowrap px-4 text-xs transition-colors", focus, value === option ? "bg-[#E0E0E0] font-semibold text-[#161616] after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[#0F62FE]" : "text-[#525252] hover:bg-[#E8E8E8]")}>{option}</button>)}
  </div>;
}

export function Tabs({ value, options, onChange }: { value: string; options: string[]; onChange: (value: string) => void }) {
  return <div role="tablist" className="flex h-10 shrink-0 border-b border-[#E0E0E0]">{options.map(option => <button role="tab" aria-selected={value === option} key={option} onClick={() => onChange(option)} className={clsx("h-full border-b-2 px-4 text-sm hover:bg-[#E8E8E8]", focus, value === option ? "border-[#0F62FE] font-semibold" : "border-transparent text-[#525252]")}>{option}</button>)}</div>;
}

export function Tile({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={clsx("min-h-0 min-w-0 border border-[#E0E0E0] bg-white", className)}>{children}</section>;
}

export function Badge({ children, status = "neutral" }: { children: ReactNode; status?: "neutral" | "good" | "watch" | "breach" }) {
  return <span className={clsx("inline-flex h-5 items-center gap-1.5 whitespace-nowrap px-1.5 text-xs", status === "neutral" ? "bg-[#F4F4F4] text-[#525252]" : status === "good" ? "bg-[#DEFBE6] text-[#0E6027]" : status === "watch" ? "bg-[#FCF4D6] text-[#684E00]" : "bg-[#FFF1F1] text-[#DA1E28]")}>
    {status !== "neutral" && <span className={clsx("h-1.5 w-1.5", status === "good" ? "bg-[#24A148]" : status === "watch" ? "bg-[#F1C21B]" : "bg-[#DA1E28]")} />}{children}
  </span>;
}

export function Tooltip({ text, children }: { text: string; children?: ReactNode }) {
  return <span className="group relative inline-flex">
    <button type="button" aria-label={text} className={clsx("inline-flex text-[#525252]", focus)}>{children || <Info size={14} />}</button>
    <span role="tooltip" className="pointer-events-none absolute right-0 top-full z-40 mt-2 hidden w-60 border border-[#525252] bg-[#161616] p-3 text-xs text-[#F4F4F4] group-hover:block group-focus-within:block">{text}</span>
  </span>;
}

export function Table({ children }: { children: ReactNode }) {
  return <table className="w-full border-collapse whitespace-nowrap text-xs [&_td]:h-8 [&_td]:border-b [&_td]:border-[#E0E0E0] [&_td]:px-3 [&_th]:h-8 [&_th]:px-3 [&_th]:text-left [&_th]:font-semibold">{children}</table>;
}

export function NumberValue({ value, digits = 1, signed = false }: { value: number; digits?: number; signed?: boolean }) {
  const [shown, setShown] = useState(value);
  const previous = useRef(value);
  const reduced = useReducedMotion();
  useEffect(() => {
    const control = animate(previous.current, value, {
      duration: reduced ? 0 : 0.6, ease,
      onUpdate: next => { previous.current = next; setShown(next); },
    });
    return () => control.stop();
  }, [value, reduced]);
  return <>{signed && shown > 0 ? "+" : ""}{shown.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}</>;
}

export function Kpi({ title, value, suffix, detail, delta, breach, info }: { title: string; value: number; suffix: string; detail: string; delta: number; breach?: boolean; info: string }) {
  return <div className="min-w-0 px-5 py-3">
    <div className="flex items-center justify-between text-xs text-[#525252]"><span>{title}</span><Tooltip text={info} /></div>
    <div className={clsx("mt-1 flex items-baseline gap-2", breach && "text-[#DA1E28]")}><span className="text-5xl font-light"><NumberValue value={value} /></span><span className="text-sm text-[#525252]">{suffix}</span></div>
    <div className="mt-1 flex items-center gap-2 text-xs"><span className="text-[#525252]"><NumberValue value={delta} signed /> vs prior close</span><span className="text-[#8D8D8D]">/</span><span className={breach ? "text-[#DA1E28]" : "text-[#525252]"}>{detail}</span></div>
  </div>;
}

export function Entrance({ children, order = 0, className }: { children: ReactNode; order?: number; className?: string }) {
  const reduced = useReducedMotion();
  return <motion.div initial={reduced ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: order * 0.045, ease }} className={className}>{children}</motion.div>;
}
