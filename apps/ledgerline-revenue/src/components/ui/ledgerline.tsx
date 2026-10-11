import { useEffect, useRef, useSyncExternalStore, type ButtonHTMLAttributes, type ReactNode } from "react";
import { animate } from "framer-motion";
import { ChevronDown, Info } from "lucide-react";
import { clsx } from "clsx";

export const chartTheme = {
  ink: "#000000", muted: "#8F8F8F", grid: "#EAEAEA", blue: "#0070F3",
  loss: "#E5484D", gain: "#45A557", font: "Geist Mono",
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

const motionQuery = "(prefers-reduced-motion: reduce)";
const subscribeMotion = (notify: () => void) => {
  const media = window.matchMedia(motionQuery);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};
export function useQuietMotion() {
  return useSyncExternalStore(subscribeMotion, () => window.matchMedia(motionQuery).matches, () => true);
}

export function Button({ children, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={clsx("inline-flex h-8 items-center justify-center gap-2 rounded-md border border-[#EAEAEA] bg-white px-3 text-xs font-medium text-[#333] transition-colors hover:border-[#BDBDBD] hover:bg-[#FAFAFA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0070F3] disabled:opacity-40", className)}>{children}</button>;
}

export function Select({ value, options, onChange, label, icon }: { value: string; options: string[]; onChange: (value: string) => void; label: string; icon?: ReactNode }) {
  return <label className="relative inline-flex h-8 items-center gap-2 rounded-md border border-[#EAEAEA] bg-white pl-3 text-xs text-[#444] transition-colors hover:border-[#BDBDBD] focus-within:outline-2 focus-within:outline-[#0070F3]">
    {icon}<span className="sr-only">{label}</span>
    <select aria-label={label} value={value} onChange={e => onChange(e.target.value)} className={clsx("h-full appearance-none bg-transparent pr-8 font-medium outline-none", label === "Reporting period" && "font-mono")}>
      {options.map(option => <option key={option}>{option}</option>)}
    </select><ChevronDown size={13} className="pointer-events-none absolute right-2.5 text-[#8F8F8F]" />
  </label>;
}

export function Segmented({ options, value, onChange, label = "Customer segment" }: { options: string[]; value: string; onChange: (v: string) => void; label?: string }) {
  return <div role="group" aria-label={label} className="inline-flex h-9 items-center gap-0.5 rounded-md border border-[#EAEAEA] bg-[#FAFAFA] p-0.5">
    {options.map(option => <button aria-pressed={value === option} onClick={() => onChange(option)} key={option} className={clsx("h-full rounded px-3.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[#0070F3]", value === option ? "border border-[#EAEAEA] bg-white text-black" : "border border-transparent text-[#666] hover:text-black")}>{option}</button>)}
  </div>;
}

export function Tabs({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (v: string) => void }) {
  return <nav aria-label="Main navigation" className="flex h-full items-stretch gap-7">
    {tabs.map(tab => <button key={tab} onClick={() => onChange(tab)} aria-current={tab === active ? "page" : undefined} className={clsx("relative text-sm font-medium transition-colors hover:text-black focus-visible:outline-2 focus-visible:outline-[#0070F3]", active === tab ? "text-black after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-black" : "text-[#666]")}>{tab}</button>)}
  </nav>;
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={clsx("min-w-0 rounded-lg border border-[#EAEAEA] bg-white", className)}>{children}</section>;
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "gain" | "loss" }) {
  return <span className={clsx("inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs font-mono", tone === "gain" ? "border-[#45A557]/15 bg-[#45A557]/5 text-[#378546]" : tone === "loss" ? "border-[#E5484D]/15 bg-[#E5484D]/5 text-[#E5484D]" : "border-[#EAEAEA] bg-[#FAFAFA] text-[#666]")}>{children}</span>;
}

export function Tooltip({ text }: { text: string }) {
  return <span className="group relative inline-flex">
    <button aria-label={text} className="rounded text-[#8F8F8F] hover:text-black focus-visible:outline-2 focus-visible:outline-[#0070F3]"><Info size={13} /></button>
    <span role="tooltip" className="pointer-events-none absolute right-0 top-6 z-30 hidden w-56 rounded-md border border-[#EAEAEA] bg-white p-3 text-xs font-normal text-[#666] shadow-sm group-hover:block group-focus-within:block">{text}</span>
  </span>;
}

export function AnimatedNumber({ value, decimals = 1, prefix = "", suffix = "" }: { value: number; decimals?: number; prefix?: string; suffix?: string }) {
  const node = useRef<HTMLSpanElement>(null);
  const previous = useRef(value);
  const reduced = useQuietMotion();
  useEffect(() => {
    const format = (v: number) => `${prefix}${v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
    if (previous.current === value) {
      if (node.current) node.current.textContent = format(value);
      return;
    }
    const controls = animate(previous.current, value, {
      duration: reduced ? 0 : 0.4, ease: chartTheme.ease,
      onUpdate: v => { previous.current = v; if (node.current) node.current.textContent = format(v); },
    });
    return () => controls.stop();
  }, [value, decimals, prefix, suffix, reduced]);
  const formatted = `${prefix}${value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
  return <span ref={node} className="font-mono tabular-nums">{formatted}</span>;
}

export function Kpi({ label, value, change, detail, tooltip, children, changeTone = "gain" }: { label: string; value: number; change: string; detail: string; tooltip: string; children: ReactNode; changeTone?: "gain" | "loss" }) {
  return <Card className="flex h-full flex-col px-5 pb-3.5 pt-4">
    <div className="flex items-center justify-between"><h2 className="text-sm font-medium">{label}</h2><Tooltip text={tooltip} /></div>
    <div className="mt-2 flex items-baseline gap-3"><div className="text-3xl font-medium tracking-[-0.02em]"><AnimatedNumber value={value} suffix="%" /></div><span className={clsx("font-mono text-xs", changeTone === "gain" ? "text-[#45A557]" : "text-[#E5484D]")}>{change}</span><span className="ml-auto font-mono text-xs text-[#8F8F8F]">{detail}</span></div>
    {children}
  </Card>;
}

export function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return <table className="w-full border-collapse text-left text-xs"><thead><tr className="border-b border-[#EAEAEA] text-[#8F8F8F]">{headers.map((header, index) => <th key={header} className={clsx("pb-2 font-normal", index === headers.length - 1 && "text-right")}>{header}</th>)}</tr></thead><tbody>{children}</tbody></table>;
}
