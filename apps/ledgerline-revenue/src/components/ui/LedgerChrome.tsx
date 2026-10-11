import { useEffect, useRef, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Command, Search, X } from "lucide-react";
import { Button, Tabs, Tooltip } from "./ledgerline";

export function LedgerChrome({ title, active, onNavigate, onSearch, onProfile, onWorkspace }: {
  title: string;
  active: string;
  onNavigate: (tab: string) => void;
  onSearch: () => void;
  onProfile: () => void;
  onWorkspace: () => void;
}) {
  return <>
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#EAEAEA] px-10">
      <div className="flex h-full items-center gap-10">
        <div aria-label="Ledgerline" className="flex items-center gap-2.5">
          <svg width="22" height="24" viewBox="0 0 22 24" fill="none" aria-hidden="true"><path d="M2 3v18h18M8 3v12h12M14 3v6h6" stroke="currentColor" strokeWidth="2.2" /></svg>
          <span className="font-display text-base font-semibold tracking-[-0.02em]">ledgerline</span>
        </div>
        <span className="h-5 w-px rotate-[20deg] bg-[#EAEAEA]" />
        <Tabs tabs={["Overview", "ARR", "Retention", "Cohorts", "Accounts"]} active={active} onChange={onNavigate} />
      </div>
      <div className="flex items-center gap-5">
        <button onClick={onSearch} className="flex h-8 w-[214px] items-center gap-2 rounded-md border border-[#EAEAEA] bg-[#FAFAFA] px-2.5 text-xs text-[#8F8F8F] transition-colors hover:border-[#BDBDBD] focus-visible:outline-2 focus-visible:outline-[#0070F3]"><Search size={14} /><span>Search anything...</span><kbd className="ml-auto flex items-center gap-0.5 rounded border border-[#EAEAEA] bg-white px-1 font-mono text-xs"><Command size={11} />K</kbd></button>
        <button aria-label="User menu, Alex Morgan" onClick={onProfile} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#EAEAEA] bg-[#F3F3F3] font-mono text-xs font-medium hover:bg-[#EAEAEA] focus-visible:outline-2 focus-visible:outline-[#0070F3]">AM</button>
      </div>
    </header>
    <div className="flex h-11 shrink-0 items-center justify-between border-b border-[#EAEAEA] bg-[#FAFAFA]/70 px-10 text-xs">
      <div className="flex items-center gap-2.5"><span className="flex h-5 w-5 items-center justify-center rounded border border-[#EAEAEA] bg-white font-mono text-xs">L</span><button onClick={onWorkspace} className="text-[#666] hover:text-black">Ledgerline, Inc.</button><ChevronRight size={13} className="mx-2 text-[#BDBDBD]" /><button onClick={() => onNavigate("Overview")} className="text-[#666] hover:text-black">Revenue</button><ChevronRight size={13} className="mx-2 text-[#BDBDBD]" /><span>{title}</span></div>
      <span className="flex items-center gap-2 text-[#8F8F8F]"><span className="h-1.5 w-1.5 rounded-full bg-[#8F8F8F]" /><span>Updated <span className="font-mono">07:42</span></span><Tooltip text="Last reconciled October 1, 2026 at 07:42 UTC. Billing and CRM sync complete." /></span>
    </div>
  </>;
}

export function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.current?.querySelector<HTMLElement>("input, button, select, [tabindex='0']")?.focus();
    return () => previous?.focus();
  }, []);
  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-start justify-center bg-black/15 pt-36" onClick={onClose}>
    <motion.div ref={dialog} role="dialog" aria-modal="true" aria-label={title} initial={{ y: 8 }} animate={{ y: 0 }} onClick={e => e.stopPropagation()} onKeyDown={e => {
      if (e.key !== "Tab") return;
      const focusable = dialog.current?.querySelectorAll<HTMLElement>("button, input, select, [tabindex='0']");
      if (!focusable?.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }} className="max-h-[680px] w-[640px] overflow-auto rounded-lg border border-[#EAEAEA] bg-white shadow-[0_12px_40px_-12px_rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between border-b border-[#EAEAEA] px-6 py-4"><h2 className="text-base font-medium">{title}</h2><Button aria-label="Close dialog" onClick={onClose} className="h-7 w-7 border-transparent px-0"><X size={16} /></Button></div>
      {children}
    </motion.div>
  </motion.div>;
}

export function ownsShortcut(root: HTMLElement | null) {
  if (!root) return false;
  const active = document.activeElement;
  if (active && active !== document.body) return root.contains(active);
  return root.matches(":hover") || document.querySelectorAll("[data-ledger-screen]").length === 1;
}
