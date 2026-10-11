import { Activity, BatteryCharging, Bell, CircleHelp, Clock3, Layers3, LayoutGrid, Network, Settings2, ShieldCheck, TrendingUp } from "lucide-react";
import clsx from "clsx";
import { Select, Tooltip, focusClass, number } from "./NorthwindKit";

export function NorthwindHeader({ region, onRegion, reserve, onProfile }: { region: string; onRegion: (region: string) => void; reserve: number; onProfile: () => void }) {
  return <header className="flex h-14 shrink-0 items-center border-b border-[#262B33] bg-[#14171C] px-5">
    <div className="flex w-[222px] shrink-0 items-center gap-2.5" aria-label="Northwind Grid">
      <svg width="25" height="27" viewBox="0 0 25 27" aria-hidden="true"><path d="M3 23V5L21 23V5M3 14L12 5M12 23L21 14" fill="none" stroke="#C7CDD5" strokeWidth="2" strokeLinejoin="miter" /></svg>
      <span className="font-display text-base font-semibold">northwind<span className="ml-2 text-xs font-normal uppercase tracking-[0.14em] text-[#7E8895]">grid</span></span>
    </div>
    <div className="border-l border-[#303640] pl-5"><Select aria-label="Operating area" value={region} onChange={event => onRegion(event.target.value)} className="w-[180px] border-transparent bg-transparent"><option value="system">Northwind system</option><option value="east">East operating area</option><option value="west">West operating area</option></Select></div>
    <div className="ml-auto flex items-center gap-5">
      <span className="flex items-center gap-2 text-[#9AA3AE]"><Clock3 size={13} className="text-[#5C6672]" /><span className="font-mono">Tue 14 Oct 2026 <span className="text-[#D3D7DD]">17:35</span> CDT</span></span>
      <div className="h-4 w-px bg-[#303640]" />
      <Tooltip content="System frequency · nominal 60.000 Hz"><span tabIndex={0} className={clsx("flex items-center gap-2 rounded", focusClass)}><Activity size={13} className="text-[#7E8895]" /><span className="font-mono">60.002 <span className="text-[#7E8895]">Hz</span></span></span></Tooltip>
      <span className="text-[#9AA3AE]">Reserve <span className="ml-1 font-mono text-[#E6E8EB]">{number(reserve, 1)}%</span></span>
      <button onClick={onProfile} aria-label="Open operator profile" className={clsx("flex size-7 items-center justify-center rounded bg-[#2C323A] font-medium text-[#C7CDD5] hover:bg-[#3A424D]", focusClass)}>EL</button>
    </div>
  </header>;
}

const areas = [
  { name: "Workspace", icon: LayoutGrid },
  { name: "System operations", icon: Activity },
  { name: "Transmission", icon: Network },
  { name: "Markets", icon: TrendingUp },
  { name: "Generation assets", icon: Layers3 },
  { name: "Storage fleet", icon: BatteryCharging },
  { name: "Reliability", icon: ShieldCheck },
];

export function NorthwindRail({ active, onNavigate }: { active: string; onNavigate: (name: string) => void }) {
  function item({ name, icon: Icon }: typeof areas[number]) {
    return <button key={name} title={name} aria-label={name} aria-current={active === name ? "page" : undefined} onClick={() => onNavigate(name)} className={clsx("group relative flex h-12 w-full items-center justify-center transition-colors", focusClass, active === name ? "bg-[#F5A524]/[0.07] text-[#F5A524]" : "text-[#697380] hover:bg-[#1A1E24] hover:text-[#C7CDD5]")}>
      {active === name && <span className="absolute bottom-3 left-0 top-3 w-0.5 rounded-r bg-[#F5A524]" />}<Icon size={19} />
      <span className="pointer-events-none absolute left-[56px] z-40 hidden whitespace-nowrap rounded border border-[#3A424D] bg-[#1A1E24] px-2.5 py-2 text-xs text-[#E6E8EB] shadow-lg group-hover:block group-focus-visible:block">{name}</span>
    </button>;
  }
  return <nav aria-label="Primary navigation" className="flex w-16 shrink-0 flex-col border-r border-[#262B33] bg-[#111419] py-3">
    {areas.map(item)}
    <div className="mx-4 my-3 h-px bg-[#262B33]" />
    {item({ name: "Notifications", icon: Bell })}
    <div className="mt-auto">{item({ name: "Keyboard shortcuts", icon: CircleHelp })}{item({ name: "Display settings", icon: Settings2 })}</div>
  </nav>;
}
