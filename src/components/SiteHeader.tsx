import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, Mountain, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useStore, roleLabels } from "@/lib/store";

const guestNav = [
  { to: "/", label: "Home" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/policies", label: "Policies & FAQs" },
  { to: "/how-to-reach", label: "How to Reach Us" },
] as const;

export function SiteHeader() {
  const { role } = useStore();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const staffLink =
    role === "frontdesk" ? { to: "/front-desk" as const, label: "Front Desk Dashboard" }
    : role === "operations" ? { to: "/operations" as const, label: "Operations Dashboard" }
    : null;

  const linkCls = "rounded-full px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground";
  const active = { className: "bg-secondary text-foreground" };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      {role !== "guest" && (
        <div className="bg-ink px-4 py-1.5 text-center text-xs text-ink-foreground">
          Staff view: {roleLabels[role]} · Operational data remains in demonstration mode
        </div>
      )}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <Mountain className="h-6 w-6 shrink-0 text-primary" />
          <span className="truncate font-display text-xl font-semibold">Azure Ridge Sanctuary</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {guestNav.map((n) => (
            <Link key={n.to} to={n.to} className={linkCls} activeProps={active} activeOptions={{ exact: n.to === "/" }}>{n.label}</Link>
          ))}
          {staffLink && (
            <Link to={staffLink.to} className="ml-2 rounded-full bg-ink px-3 py-2 text-sm font-semibold text-ink-foreground">{staffLink.label}</Link>
          )}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {!user && <Button asChild variant="outline" className="rounded-full"><Link to="/auth">Sign In</Link></Button>}
          <button className="rounded-full p-2 hover:bg-muted lg:hidden" aria-label="Toggle menu" onClick={() => setOpen(!open)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav aria-label="Mobile" className="border-t px-4 py-3 lg:hidden">
          <div className="flex flex-col gap-1">
            {guestNav.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className={linkCls} activeProps={active} activeOptions={{ exact: n.to === "/" }}>{n.label}</Link>
            ))}
            {staffLink && <Link to={staffLink.to} onClick={() => setOpen(false)} className="rounded-full bg-ink px-3 py-2 text-sm font-semibold text-ink-foreground">{staffLink.label}</Link>}
          </div>
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <p className="font-display text-2xl font-semibold">The Azure Ridge Sanctuary</p>
          <p className="mt-2 text-sm opacity-75">Ridge Road, Coonoor Hills, Tamil Nadu</p>
        </div>
        <div className="text-sm opacity-75">
          <p>Check-in 2:00 PM · Check-out 11:00 AM</p>
          <p className="mt-1">+91 98765 43210 · stay@azureridge.example</p>
        </div>
        <div className="space-y-3 text-sm">
          <Link to="/policies" className="block hover:underline">Policies & FAQs</Link>
          <Link to="/how-to-reach" className="block hover:underline">How to Reach Us</Link>
          <p className="text-xs opacity-60">Bookings are requests only. Live payments are not enabled.</p>
        </div>
      </div>
    </footer>
  );
}
