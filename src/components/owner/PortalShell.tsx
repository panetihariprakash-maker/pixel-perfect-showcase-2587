import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, Mountain, PanelLeftClose, PanelLeftOpen, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export type PortalItem = { id: string; label: string; icon: ComponentType; badge?: number };

/** Collapsible sidebar shell shared by the business owner and Super Admin portals. */
export function PortalShell({ title, items, active, onSelect, children }: { title: string; items: PortalItem[]; active: string; onSelect: (id: string) => void; children: ReactNode }) {
  const [compact, setCompact] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  useEffect(() => { setCompact(localStorage.getItem("azure-sidebar-compact") === "true"); }, []);
  const signOut = async () => { await queryClient.cancelQueries(); queryClient.clear(); await supabase.auth.signOut(); await navigate({ to: "/auth", replace: true }); };
  return (
    <div className={cn("dashboard-shell", compact && "is-compact")}>
      <div className="flex items-center justify-between border-b bg-card px-4 py-3 lg:hidden"><span className="font-display text-xl">{title}</span><Button size="icon" variant="outline" aria-label="Open menu" onClick={() => setDrawer(true)}><Menu /></Button></div>
      {drawer && <div className="fixed inset-0 z-40 bg-ink/60 lg:hidden" onClick={() => setDrawer(false)} />}
      <aside className={cn("dashboard-sidebar", drawer && "drawer-open")} aria-label={`${title} navigation`}>
        <div className="flex h-20 items-center justify-between gap-2 border-b px-4">
          <Link to="/" className="flex min-w-0 items-center gap-2"><Mountain className="h-6 w-6 shrink-0 text-primary" /><span className="sidebar-label font-display text-lg font-semibold leading-tight">Azure Ridge<br />{title}</span></Link>
          <Button size="icon" variant="ghost" className="hidden shrink-0 lg:inline-flex" aria-label={compact ? "Expand sidebar" : "Collapse sidebar"} onClick={() => { setCompact(!compact); localStorage.setItem("azure-sidebar-compact", String(!compact)); }}>{compact ? <PanelLeftOpen /> : <PanelLeftClose />}</Button>
          <Button size="icon" variant="ghost" className="lg:hidden" aria-label="Close menu" onClick={() => setDrawer(false)}><X /></Button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          {items.map(({ id, label, icon: Icon, badge }) => (
            <Button key={id} variant="ghost" title={label} aria-label={label} aria-current={active === id ? "page" : undefined}
              className={cn("sidebar-link", active === id && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground")}
              onClick={() => { onSelect(id); setDrawer(false); }}>
              <Icon /><span className="sidebar-label flex-1 text-left">{label}</span>
              {!!badge && <span className="sidebar-label rounded-full bg-accent px-2 text-xs text-accent-foreground">{badge}</span>}
            </Button>
          ))}
        </nav>
        <div className="border-t p-3"><Button variant="ghost" className="sidebar-link" aria-label="Sign Out" onClick={signOut}><LogOut /><span className="sidebar-label">Sign Out</span></Button></div>
      </aside>
      <div className="dashboard-main min-w-0">{children}</div>
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return <div className="rounded-2xl border bg-card p-5 shadow-card"><p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-2 font-display text-3xl font-semibold">{value}</p>{hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}</div>;
}

export function SectionTitle({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>{description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}</div>{action}</div>;
}

export function ErrorNote({ error }: { error: unknown }) {
  if (!error) return null;
  return <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error instanceof Error ? error.message : String((error as { message?: string })?.message ?? error)}</p>;
}
