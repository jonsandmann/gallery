import type { ReactNode } from "react";
import { Activity, ArrowDownToLine, ArrowLeftRight, Bell, BedDouble, ChevronRight, HelpCircle, LayoutGrid, Settings2, Users } from "lucide-react";
import clsx from "clsx";
import { focus, Tooltip } from "./HaldenKit";

const navigation = [
  { name: "Overview", icon: LayoutGrid },
  { name: "Capacity", icon: BedDouble },
  { name: "Emergency", icon: Activity },
  { name: "Patient flow", icon: ArrowLeftRight },
  { name: "Staffing", icon: Users },
  { name: "Discharges", icon: ArrowDownToLine },
];

export function HaldenShell({ active, onAction, children }: { active: string; onAction: (action: string) => void; children: ReactNode }) {
  return <div className="flex h-full max-h-[960px] min-h-[960px] w-full bg-[#F8FAF9] font-body text-sm text-[#191C1B] tabular-nums [--font-body:Roboto_Flex,Roboto,sans-serif] [--font-display:Roboto_Flex,Roboto,sans-serif] [--text-xl:1.375rem] [--text-3xl:1.75rem] [--text-5xl:2.8125rem]">
    <aside className="flex w-[88px] shrink-0 flex-col items-center bg-[#E6ECEA] pb-5 pt-5">
      <button aria-label="Halden Health home" onClick={() => onAction("Overview")} className={clsx("mb-8 flex h-10 w-10 items-center justify-center rounded-xl bg-[#006A6A] text-[#D2FFFA]", focus)}>
        <svg width="25" height="25" viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M5 4H11V11H17V4H23V24H17V17H11V24H5V4Z" fill="currentColor" /></svg>
      </button>
      <nav aria-label="Main navigation" className="flex w-full flex-col gap-5">{navigation.map(({ name, icon: Icon }) => <button key={name} onClick={() => { if (name !== active) onAction(name); }} aria-current={name === active ? "page" : undefined} className={clsx("group flex flex-col items-center gap-1 rounded-lg text-xs", focus, name === active ? "font-semibold text-[#004F50]" : "text-[#53615A]")}>
        <span className={clsx("flex h-8 w-14 items-center justify-center rounded-[28px] transition-colors motion-reduce:transition-none", name === active ? "bg-[#9CF1F0]" : "group-hover:bg-[#D5E2DC]")}><Icon size={21} strokeWidth={1.7} /></span>{name}
      </button>)}</nav>
      <div className="mt-auto flex flex-col gap-5">
        <Tooltip label="Display settings"><button onClick={() => onAction("Display settings")} aria-label="Display settings" className={clsx("rounded-full p-2 text-[#53615A] hover:bg-[#D5E2DC]", focus)}><Settings2 size={21} strokeWidth={1.7} /></button></Tooltip>
        <Tooltip label="Help"><button onClick={() => onAction(`${active} definitions`)} aria-label="Help" className={clsx("rounded-full p-2 text-[#53615A] hover:bg-[#D5E2DC]", focus)}><HelpCircle size={21} strokeWidth={1.7} /></button></Tooltip>
      </div>
    </aside>
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between bg-[#F1F5F3] px-6">
        <div className="flex items-center gap-7">
          <div className="flex items-baseline gap-1.5 text-xl font-semibold text-[#264D43]">halden<span className="text-sm font-normal text-[#53615A]">health</span></div>
          <span className="h-4 w-px bg-[#BEC9C5]/70" />
          <div className="flex items-center gap-2 text-xs text-[#53615A]"><span>Operations</span><ChevronRight size={13} /><span className="font-medium text-[#191C1B]">{active}</span></div>
        </div>
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-1.5 text-xs text-[#53615A]"><span className="h-1.5 w-1.5 rounded-full bg-[#006A6A]" />Updated 07:42</span>
          <button onClick={() => onAction("Notifications")} aria-label="Notifications, 2 unread" className={clsx("relative rounded-full p-2 text-[#53615A] hover:bg-[#E6ECEA]", focus)}><Bell size={18} /><span className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full bg-[#BA1A1A] ring-2 ring-[#F1F5F3]" /></button>
          <button onClick={() => onAction("Account")} aria-label="Account: Anna Mercer" className={clsx("flex h-8 w-8 items-center justify-center rounded-full bg-[#DCE5E9] text-xs font-semibold text-[#4B607C]", focus)}>AM</button>
        </div>
      </header>
      {children}
    </div>
  </div>;
}
