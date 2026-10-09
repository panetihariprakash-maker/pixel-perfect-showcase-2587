import { useEffect, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Mountain, PanelLeftClose, PanelLeftOpen, Menu, X, LayoutDashboard, Sparkles, Compass, BedDouble, TreePine, CalendarDays, CalendarCheck, History, User, Headphones, ShieldCheck, MapPin, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

export const dashboardItems = [
  ['overview', 'Overview', LayoutDashboard], ['assistant', 'AI Guest Assistant', Sparkles], ['concierge', 'AI Travel Concierge', Compass],
  ['rooms', 'Rooms & Villas', BedDouble], ['activities', 'Activities & Trek Advisor', TreePine], ['my-bookings', 'My Bookings', CalendarDays],
  ['upcoming', 'Upcoming Stays', CalendarCheck], ['past', 'Past Bookings', History], ['profile', 'Guest Profile', User], ['help', 'Guest Support', Headphones],
] as const;

export function DashboardSidebar({ active, children }: { active: string; children: React.ReactNode }) {
  const [compact, setCompact] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  useEffect(() => { setCompact(localStorage.getItem('azure-sidebar-compact') === 'true'); }, []);
  useEffect(() => { if (!drawer) return; const listener = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawer(false); }; const old = document.body.style.overflow; document.body.style.overflow = 'hidden'; window.addEventListener('keydown', listener); return () => { document.body.style.overflow = old; window.removeEventListener('keydown', listener); }; }, [drawer]);
  const signOut = async () => { await queryClient.cancelQueries(); queryClient.clear(); const { error } = await supabase.auth.signOut(); if (error) { setError('Unable to sign out. Please try again.'); return; } await navigate({ to: '/auth', replace: true }); };
  return <div className={cn('dashboard-shell', compact && 'is-compact')}>
    <div className="flex items-center justify-between border-b bg-card px-4 py-3 lg:hidden"><span className="font-display text-xl">Dashboard</span><Button size="icon" variant="outline" aria-label="Open dashboard menu" onClick={() => setDrawer(true)}><Menu /></Button></div>
    {drawer && <div className="fixed inset-0 z-40 bg-ink/60 lg:hidden" onClick={() => setDrawer(false)} />}
    <aside className={cn('dashboard-sidebar', drawer && 'drawer-open')} aria-label="Guest dashboard navigation">
      <div className="flex h-20 items-center justify-between gap-2 border-b px-4">
        <Link to="/" className="flex min-w-0 items-center gap-2" title="Azure Ridge Sanctuary"><Mountain className="h-6 w-6 shrink-0 text-primary" /><span className="sidebar-label font-display text-lg font-semibold leading-tight">Azure Ridge<br />Sanctuary</span></Link>
        <Button size="icon" variant="ghost" className="hidden shrink-0 lg:inline-flex" aria-label={compact ? 'Expand sidebar' : 'Collapse sidebar'} title={compact ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => { setCompact(!compact); localStorage.setItem('azure-sidebar-compact', String(!compact)); }}>{compact ? <PanelLeftOpen /> : <PanelLeftClose />}</Button>
        <Button size="icon" variant="ghost" className="lg:hidden" aria-label="Close dashboard menu" onClick={() => setDrawer(false)}><X /></Button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        <p className="sidebar-label mb-3 px-3 text-xs uppercase tracking-wider text-muted-foreground">Your sanctuary</p>
        {dashboardItems.map(([id, label, Icon]) => <Button key={id} asChild variant="ghost" className={cn('sidebar-link', active === id && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground')}><Link to="/dashboard" hash={id} title={label} aria-label={label} aria-current={active === id ? 'page' : undefined} onClick={() => setDrawer(false)}><Icon /><span className="sidebar-label">{label}</span></Link></Button>)}
        <div className="my-4 border-t" />
        <Button asChild variant="ghost" className="sidebar-link"><Link to="/policies" title="Policies & FAQs" aria-label="Policies & FAQs"><ShieldCheck /><span className="sidebar-label">Policies & FAQs</span></Link></Button>
        <Button asChild variant="ghost" className="sidebar-link"><Link to="/how-to-reach" title="How to Reach Us" aria-label="How to Reach Us"><MapPin /><span className="sidebar-label">How to Reach Us</span></Link></Button>
      </nav>
      <div className="border-t p-3"><Button variant="ghost" className="sidebar-link" aria-label="Sign Out" title="Sign Out" onClick={signOut}><LogOut /><span className="sidebar-label">Sign Out</span></Button>{error && <p role="alert" className="text-xs text-destructive">{error}</p>}</div>
    </aside>
    <div className="dashboard-main min-w-0">{children}</div>
  </div>;
}