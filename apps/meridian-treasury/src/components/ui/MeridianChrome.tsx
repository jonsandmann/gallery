import { ArrowUpRight, Bell, Building2, CircleHelp, FileText, Landmark, Layers, PanelLeftClose, ReceiptText, Search, ShieldCheck, SlidersHorizontal, Wallet } from "lucide-react";
import clsx from "clsx";
import { focus } from "./meridian";

const navigation = [
  { title: "Cash position", icon: Wallet }, { title: "Cash forecast", icon: Layers },
  { title: "Payments", icon: ArrowUpRight }, { title: "Bank accounts", icon: Landmark },
  { title: "FX exposure", icon: SlidersHorizontal }, { title: "Debt & funding", icon: Building2 },
];

export function MeridianHeader({ title, area, collapsed, onAction }: { title: string; area: string; collapsed: boolean; onAction: (action: string) => void }) {
  return <header className="flex h-12 shrink-0 items-center border-b border-[#393939] bg-[#161616] text-[#F4F4F4]">
    <div className={clsx("flex h-full shrink-0 items-center border-r border-[#393939] px-6 text-xl", collapsed ? "w-16 px-4" : "w-44")}>{collapsed ? "M" : <span className="font-semibold">meridian<span className="font-normal text-[#8D8D8D]">.</span></span>}</div>
    <div className="flex items-center gap-3 px-6 text-xs"><span className="text-[#C6C6C6]">Treasury</span><span className="text-[#6F6F6F]">/</span><span className="text-[#C6C6C6]">{area}</span><span className="text-[#6F6F6F]">/</span><span>{title}</span></div>
    <div className="ml-auto flex h-full items-center">
      <span className="mr-5 flex items-center gap-2 text-xs text-[#C6C6C6]"><span className="h-1.5 w-1.5 bg-[#24A148]" />Updated 07:42 UTC</span>
      {[{ icon: Search, label: "Search" }, { icon: Bell, label: "Notifications" }, { icon: CircleHelp, label: "Help" }].map(({ icon: Icon, label }) => <button key={label} aria-label={label} onClick={() => onAction(label)} className={clsx("flex h-12 w-12 items-center justify-center border-l border-[#393939] hover:bg-[#353535]", focus)}><Icon size={17} strokeWidth={1.5} /></button>)}
      <button aria-label="User profile" onClick={() => onAction("Profile")} className={clsx("mx-4 flex h-8 w-8 items-center justify-center bg-[#393939] text-xs hover:bg-[#525252]", focus)}>AL</button>
    </div>
  </header>;
}

export function MeridianRail({ active, collapsed, onCollapse, onAction }: { active: string; collapsed: boolean; onCollapse: () => void; onAction: (action: string) => void }) {
  return <aside className={clsx("flex shrink-0 flex-col bg-[#161616] text-[#C6C6C6]", collapsed ? "w-16" : "w-44")}>
    {!collapsed && <div className="px-5 pb-4 pt-6 text-xs text-[#8D8D8D]">WORKSPACE</div>}
    <nav aria-label="Primary navigation" className={collapsed ? "pt-5" : ""}>
      {navigation.map(({ title, icon: Icon }) => <button key={title} title={title} aria-current={active === title ? "page" : undefined} onClick={() => onAction(title)} className={clsx("flex h-10 w-full items-center gap-3 border-l-2 px-[18px] text-left text-xs hover:bg-[#353535]", focus, active === title ? "border-[#0F62FE] bg-[#262626] font-semibold text-white" : "border-transparent")}><Icon size={16} strokeWidth={1.5} className="shrink-0" />{!collapsed && title}</button>)}
      <div className="mx-4 my-5 border-t border-[#393939]" />
      {[{ title: "Reports", icon: FileText }, { title: "Policies", icon: ShieldCheck }, { title: "Audit trail", icon: ReceiptText }].map(({ title, icon: Icon }) => <button key={title} title={title} onClick={() => onAction(title)} className={clsx("flex h-10 w-full items-center gap-3 px-5 text-xs hover:bg-[#353535]", focus)}><Icon size={16} strokeWidth={1.5} className="shrink-0" />{!collapsed && title}</button>)}
    </nav>
    <div className="mt-auto">
      {!collapsed && <div className="mx-5 mb-5 border-t border-[#393939] pt-4"><div className="text-xs text-[#F4F4F4]">Velmora Group</div><div className="mt-1 text-xs text-[#8D8D8D]">14 entities · 9 currencies</div><div className="mt-3 inline-flex border border-[#525252] px-2 py-1 text-xs text-[#C6C6C6]">Production</div></div>}
      <button aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} onClick={onCollapse} className={clsx("flex h-12 w-full items-center border-t border-[#393939] px-5 hover:bg-[#353535]", focus)}><PanelLeftClose size={16} className={collapsed ? "rotate-180" : ""} /></button>
    </div>
  </aside>;
}
