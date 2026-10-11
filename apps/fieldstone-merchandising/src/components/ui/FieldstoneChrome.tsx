import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Bell, Boxes, ChartNoAxesCombined, ChevronDown, ChevronRight, CircleHelp, Home, Info, Search, Settings2, Shirt, ShoppingBag, Store, Tags, Truck, X } from "lucide-react";
import { clsx } from "clsx";
import { Button, focusClass, Tooltip } from "./fieldstone";

export function Wordmark() {
  return <div className="flex items-center gap-2.5 text-white">
    <svg width="23" height="25" viewBox="0 0 23 25" fill="none" aria-hidden="true">
      <path d="M3 2H19L22 8H1L3 2Z" fill="#DDDCD5" />
      <path d="M1 10H16L19 16H3L1 10Z" fill="#F6F5EE" />
      <path d="M4 18H12L14 24H2L4 18Z" fill="#BBBEB3" />
    </svg>
    <span className="font-display text-xl font-[650] tracking-[-0.7px]">fieldstone</span>
  </div>;
}

const navigation = [
  { label: "Inventory", icon: Boxes },
  { label: "Pricing", icon: Tags },
  { label: "Purchasing", icon: Truck },
  { label: "Stores", icon: Store },
  { label: "E-commerce", icon: ShoppingBag },
  { label: "Reports", icon: ChartNoAxesCombined },
];

export function FieldstoneSidebar({ active, onNavigate, onReset, onOuterwear, onOnline }: { active: "Sell-Through" | "Pricing"; onNavigate: (name: string) => void; onReset: () => void; onOuterwear: () => void; onOnline: () => void }) {
  const [expanded, setExpanded] = useState(true);
  return <aside className="flex w-[200px] shrink-0 flex-col border-r border-[#DFDFDF] bg-[#EBEBEB]">
    <div className="flex h-14 shrink-0 items-center bg-[#1A1A1A] px-5"><Wordmark /></div>
    <div className="px-3 pt-5">
      <button onClick={() => onNavigate("Workspace")} className={clsx("mb-6 flex w-full items-center gap-2.5 rounded-lg border border-[#DCDCDC] bg-[#F6F6F6] p-2.5 text-left shadow-[0_1px_0_#00000004] hover:bg-white", focusClass)}>
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-[#D3D6CE] bg-[#E2E5DC] text-xs font-[650]">F</span>
        <span className="min-w-0 flex-1"><span className="block whitespace-nowrap text-xs font-[650]">Fieldstone retail</span><span className="block text-xs text-[#8A8A8A]">Merchandising</span></span><ChevronDown size={11} className="shrink-0" />
      </button>
      <nav aria-label="Main navigation" className="space-y-1">
        <button onClick={() => onNavigate("Overview")} className={clsx("flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[#616161] hover:bg-black/5", focusClass)}><Home size={17} strokeWidth={1.7} />Overview</button>
        <button onClick={() => setExpanded(!expanded)} aria-expanded={expanded} className={clsx("flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 font-[550] hover:bg-black/5", focusClass)}><Shirt size={17} strokeWidth={1.7} /><span className="flex-1 text-left">Merchandising</span><ChevronDown size={13} className={clsx("transition-transform", !expanded && "-rotate-90")} /></button>
        {expanded && <div className="pb-3 pl-6">
          <button aria-current={active === "Sell-Through" ? "page" : undefined} onClick={() => active === "Sell-Through" ? onReset() : onNavigate("Sell-Through")} className={clsx("flex h-9 w-full items-center gap-2 rounded-lg px-3 text-left", active === "Sell-Through" ? "bg-white font-[550] shadow-[0_1px_3px_#00000006]" : "text-xs text-[#616161] hover:bg-black/5", focusClass)}><span className={clsx("size-1.5 rounded-full", active === "Sell-Through" ? "bg-[#29845A]" : "bg-transparent")} />Sell-Through</button>
          {["Assortment", "Markdowns", "Range planning"].map(label => <button key={label} onClick={() => onNavigate(label)} className={clsx("flex h-9 w-full items-center rounded-lg pl-6 text-left text-xs text-[#616161] hover:bg-black/5", focusClass)}>{label}</button>)}
        </div>}
        {navigation.map(({ label, icon: Icon }) => <button key={label} aria-current={active === label ? "page" : undefined} onClick={() => active === label ? onReset() : onNavigate(label)} className={clsx("flex h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left", active === label ? "bg-white font-[550] shadow-[0_1px_3px_#00000006]" : "text-[#616161] hover:bg-black/5", focusClass)}><Icon size={17} strokeWidth={1.7} className={active === label ? "text-[#29845A]" : ""} />{label}</button>)}
      </nav>
      <div className="mt-7 border-t border-[#DCDCDC] pt-5">
        <div className="mb-2 flex items-center justify-between px-2.5 text-xs text-[#8A8A8A]"><span>Saved views</span><Tooltip content="Views saved by the merchandising team"><Info size={12} /></Tooltip></div>
        <button onClick={onOuterwear} className={clsx("flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-xs text-[#616161] hover:bg-black/5", focusClass)}><span className="size-1.5 rounded-full bg-[#B98900]" />Outerwear review</button>
        <button onClick={onOnline} className={clsx("flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-xs text-[#616161] hover:bg-black/5", focusClass)}><span className="size-1.5 rounded-full bg-[#29845A]" />Online performance</button>
      </div>
    </div>
    <div className="mt-auto px-3 pb-4">
      <button onClick={() => onNavigate("Help & definitions")} className={clsx("flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-xs text-[#616161] hover:bg-black/5", focusClass)}><CircleHelp size={17} strokeWidth={1.7} />Help & definitions</button>
      <button onClick={() => onNavigate("Settings")} className={clsx("flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-xs text-[#616161] hover:bg-black/5", focusClass)}><Settings2 size={17} strokeWidth={1.7} />Settings</button>
      <div className="mt-3 border-t border-[#DCDCDC] px-2.5 pt-4 text-xs text-[#8A8A8A]">212 stores <span className="px-1">·</span> E-commerce</div>
    </div>
  </aside>;
}

export function FieldstoneTopBar({ section, page, crumb, onCrumb, onAction, unread = true }: { section: string; page: string; crumb: string; onCrumb: () => void; onAction: (name: string) => void; unread?: boolean }) {
  return <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#E3E3E3] bg-[#FAFAFA] px-6">
    <div className="flex items-center gap-2 text-xs text-[#8A8A8A]"><span>{section}</span><ChevronRight size={12} /><span className="text-[#616161]">{page}</span><ChevronRight size={12} /><button onClick={onCrumb} title="Reset view" className={clsx("rounded px-1 py-1 font-[550] text-[#303030] hover:bg-[#EAEAEA]", focusClass)}>{crumb}</button></div>
    <div className="flex items-center gap-4">
      <span className="flex items-center gap-1.5 text-xs text-[#8A8A8A]"><span className="size-1.5 rounded-full bg-[#29845A]" />Updated 07:42</span><div className="h-4 w-px bg-[#E3E3E3]" />
      <button aria-label="Search Fieldstone" onClick={() => onAction("Search")} className={clsx("rounded-md p-1.5 text-[#616161] hover:bg-[#EBEBEB]", focusClass)}><Search size={17} /></button>
      <button aria-label="Notifications" onClick={() => onAction("Notifications")} className={clsx("relative rounded-md p-1.5 text-[#616161] hover:bg-[#EBEBEB]", focusClass)}><Bell size={17} />{unread && <span className="absolute right-1.5 top-1 size-1.5 rounded-full bg-[#B98900] ring-2 ring-[#FAFAFA]" />}</button>
      <button aria-label="Emma Mercer account" onClick={() => onAction("Emma Mercer")} className={clsx("flex size-8 items-center justify-center rounded-lg bg-[#E7DFED] text-xs font-[550] text-[#6B5179]", focusClass)}>EM</button>
    </div>
  </header>;
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const node = ref.current;
    (node?.querySelector<HTMLElement>("input") || node?.querySelector<HTMLElement>("button"))?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const items = node?.querySelectorAll<HTMLElement>("button:not(:disabled), input, select, [tabindex='0']");
        if (!items?.length) return;
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); previous?.focus(); };
  }, [onClose]);
  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .2 }} className="absolute inset-0 z-50 flex items-center justify-center bg-[#1A1A1A]/25 p-12 backdrop-blur-[2px]" onClick={onClose}>
    <motion.div ref={ref} role="dialog" aria-modal="true" aria-label={title} initial={{ y: reduced ? 0 : 10 }} animate={{ y: 0 }} className="w-[520px] overflow-hidden rounded-xl border border-[#E3E3E3] bg-white shadow-xl" onClick={e => e.stopPropagation()}>
      <div className="flex h-16 items-center justify-between border-b border-[#E3E3E3] px-6"><h2 className="text-base font-[650]">{title}</h2><Button variant="ghost" aria-label="Close dialog" onClick={onClose}><X size={17} /></Button></div>
      <div className="p-6">{children}</div>
    </motion.div>
  </motion.div>;
}
