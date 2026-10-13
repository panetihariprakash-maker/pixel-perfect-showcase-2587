import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarDays, ChevronDown, CircleUserRound, Headphones, KeyRound, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const items = [
  { to: '/dashboard', hash: 'profile', label: 'My Profile', Icon: CircleUserRound },
  { to: '/dashboard', hash: 'my-bookings', label: 'My Bookings', Icon: CalendarDays },
  { to: '/reset-password', hash: undefined, label: 'Change Password', Icon: KeyRound },
  { to: '/dashboard', hash: 'help', label: 'Help & Support', Icon: Headphones },
] as const;

export function AccountMenu() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); window.removeEventListener('keydown', onKey); };
  }, [open]);

  const signOut = async () => {
    setOpen(false);
    await queryClient.cancelQueries();
    queryClient.clear();
    const { error } = await supabase.auth.signOut();
    if (error) { setError('Unable to sign out. Please try again.'); return; }
    await navigate({ to: '/auth', replace: true });
  };

  const email = user?.email ?? 'Guest account';

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="My Account menu"
        className="flex items-center gap-2 rounded-full border bg-card py-1.5 pl-2 pr-2 hover:bg-muted sm:pl-3"
      >
        <span className="hidden max-w-48 truncate text-xs text-muted-foreground sm:block sm:max-w-64">{email}</span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <CircleUserRound className="h-5 w-5" />
        </span>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div role="menu" aria-label="My Account" className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border bg-card py-1.5 shadow-card">
          <p className="truncate px-4 py-2 text-xs text-muted-foreground sm:hidden">{email}</p>
          {items.map(({ to, hash, label, Icon }) => (
            <Link key={label} to={to} hash={hash} onClick={() => setOpen(false)} role="menuitem" className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted">
              <Icon className="h-4 w-4 text-primary" />{label}
            </Link>
          ))}
          <div className="my-1.5 border-t" />
          <button onClick={signOut} role="menuitem" className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm hover:bg-muted">
            <LogOut className="h-4 w-4 text-primary" />Sign Out
          </button>
        </div>
      )}
      {error && <p role="alert" className="absolute right-0 top-full mt-1 rounded bg-card px-2 py-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
