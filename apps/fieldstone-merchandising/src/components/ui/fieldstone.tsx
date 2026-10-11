import { useEffect, useState, type ReactNode, type ButtonHTMLAttributes } from "react";
import { animate, useMotionValue, useReducedMotion } from "framer-motion";
import { ChevronDown, Info } from "lucide-react";
import { clsx } from "clsx";

export const chartTheme = {
  accent: "#29845A",
  context: "#CCCCCC",
  ink: "#303030",
  muted: "#8A8A8A",
  border: "#E3E3E3",
  critical: "#E51C00",
  caution: "#B98900",
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

export const focusClass = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#29845A] focus-visible:ring-offset-2";

export function Button({ children, variant = "secondary", size = "standard", className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost"; size?: "standard" | "icon" }) {
  return <button {...props} className={clsx("inline-flex shrink-0 items-center justify-center gap-2 rounded-lg text-xs font-[550] transition-colors disabled:cursor-not-allowed disabled:opacity-35 [&_svg]:shrink-0", size === "icon" ? "h-7 w-7 p-0" : "h-8 px-3", focusClass, variant === "primary" ? "border border-[#303030] bg-[#303030] text-white shadow-sm hover:bg-[#181818]" : variant === "secondary" ? "border border-[#D5D5D5] bg-white text-[#303030] shadow-[0_1px_0_rgba(26,26,26,0.06)] hover:bg-[#F7F7F7]" : "text-[#616161] hover:bg-black/5 hover:text-[#303030]", className)}>{children}</button>;
}

export function Select({ label, value, options, onChange, icon }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void; icon?: ReactNode }) {
  return <div className="relative inline-flex h-8 items-center rounded-lg border border-[#D5D5D5] bg-white shadow-[0_1px_0_rgba(26,26,26,0.04)] hover:bg-[#FAFAFA]">
    {icon && <span className="pointer-events-none absolute left-2.5 text-[#616161]">{icon}</span>}
    <select aria-label={label} value={value} onChange={e => onChange(e.target.value)} className={clsx("h-full w-full appearance-none rounded-lg bg-transparent py-0 pr-8 text-xs font-[550] text-[#303030]", icon ? "pl-8" : "pl-3", focusClass)}>
      {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
    <ChevronDown size={13} className="pointer-events-none absolute right-2.5 text-[#616161]" />
  </div>;
}

export function Tabs<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (value: T) => void }) {
  return <div className="inline-flex items-center gap-1 rounded-lg bg-[#F1F1F1] p-0.5" role="tablist">
    {options.map(option => <button key={option.value} role="tab" aria-selected={option.value === value} onClick={() => onChange(option.value)} className={clsx("rounded-md px-3 py-1 text-xs font-[550] transition-colors", focusClass, value === option.value ? "bg-white text-[#303030] shadow-[0_1px_3px_#00000015]" : "text-[#616161] hover:text-[#303030]")}>{option.label}</button>)}
  </div>;
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={clsx("min-w-0 rounded-xl bg-white shadow-[0_1px_0_rgba(26,26,26,0.07),inset_0_0_0_1px_rgba(26,26,26,0.10)]", className)}>{children}</section>;
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "critical" | "caution" }) {
  return <span className={clsx("inline-flex whitespace-nowrap items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-[550]", tone === "good" ? "bg-[#E3F1E8] text-[#216C48]" : tone === "critical" ? "bg-[#FCE9E5] text-[#B92D19]" : tone === "caution" ? "bg-[#FFF1CC] text-[#876500]" : "bg-[#F1F1F1] text-[#616161]")}>{children}</span>;
}

export function Tooltip({ children, content }: { children: ReactNode; content: ReactNode }) {
  return <span className="group/tip relative inline-flex items-center">
    <span tabIndex={0} aria-label={typeof content === "string" ? content : undefined} className={clsx("inline-flex rounded-sm", focusClass)}>{children}</span>
    <span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-52 -translate-x-1/2 rounded-lg bg-[#303030] px-3 py-2 text-left text-xs font-normal text-white shadow-lg group-hover/tip:block group-focus-within/tip:block">{content}</span>
  </span>;
}

export function AnimatedNumber({ value, digits = 0, prefix = "", suffix = "" }: { value: number; digits?: number; prefix?: string; suffix?: string }) {
  const reduced = useReducedMotion();
  const motionValue = useMotionValue(value);
  const [shown, setShown] = useState(value);
  useEffect(() => {
    const unsubscribe = motionValue.on("change", setShown);
    const controls = animate(motionValue, value, { duration: reduced ? 0 : 0.42, ease: chartTheme.ease });
    return () => { controls.stop(); unsubscribe(); };
  }, [value, motionValue, reduced]);
  return <span>{prefix}{shown.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}{suffix}</span>;
}

export function Kpi({ title, value, digits, prefix, suffix, children, info, compact = false, caution = false }: { title: string; value: number; digits?: number; prefix?: string; suffix?: string; children: ReactNode; info?: string; compact?: boolean; caution?: boolean }) {
  return <div className={clsx("min-w-0", compact ? "px-3 py-2" : "px-5 py-4")}>
    <div className="mb-1 flex items-center gap-1.5 text-xs font-[550] text-[#616161]">{title}{info && <Tooltip content={info}><Info size={12} className="text-[#8A8A8A]" /></Tooltip>}</div>
    <div className={clsx("flex", compact ? "flex-col items-start gap-1" : "items-baseline gap-3")}>
      <div className={clsx("text-3xl font-[550]", caution ? "text-[#B98900]" : "text-[#303030]")}><AnimatedNumber value={value} digits={digits} prefix={prefix} suffix={suffix} /></div>
      {children}
    </div>
  </div>;
}

export function Table({ headers, children, compact = false }: { headers: { label: ReactNode; right?: boolean }[]; children: ReactNode; compact?: boolean }) {
  return <table className="w-full border-collapse text-xs">
    <thead className="h-8 border-y border-[#E3E3E3] bg-[#F7F7F7] text-[#616161]">
      <tr>{headers.map((header, index) => <th key={index} scope="col" className={clsx("whitespace-nowrap font-[550]", compact ? "px-3" : "px-4", header.right ? "text-right" : "text-left")}>{header.label}</th>)}</tr>
    </thead>
    <tbody className={clsx("[&_tr]:h-11 [&_tr]:border-b [&_tr]:border-[#EEEEEE]", compact ? "[&_td]:px-3" : "[&_td]:px-4")}>{children}</tbody>
  </table>;
}
