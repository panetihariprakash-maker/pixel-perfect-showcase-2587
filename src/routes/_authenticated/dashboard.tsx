import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Headphones, Mail, Phone, User } from "lucide-react";
import { activities, demoGuest, formatINR, getRoom, isoDay, resort, type Booking } from "@/data/resort";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui-kit";
import { DashboardSidebar, dashboardItems } from "@/components/DashboardSidebar";
import { AssistantWidget } from "@/components/AssistantWidget";
import { GuestProfile } from "@/components/guest/GuestProfile";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { ConciergeSection } from "@/components/guest/ConciergeSection";
import { RoomsSection } from "@/components/guest/RoomsSection";
import { ActivitiesSection } from "@/components/guest/ActivitiesSection";
import { EnquirySection } from "@/components/guest/EnquirySection";

function HubSection({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-32 border-t py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={`${id}-h`} className="mt-1 text-4xl font-semibold">{title}</h2>
      </div>
      <div className="mt-2">{children}</div>
    </section>
  );
}

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Dashboard — The Azure Ridge Sanctuary" },
      { name: "description", content: "Your bookings, upcoming stays, payment status and guest support." },
      { property: "og:title", content: "Dashboard — Azure Ridge Sanctuary" },
      { property: "og:description", content: "Your bookings, upcoming stays, payment status and guest support." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const hash = useRouterState({ select: s => s.location.hash });
  const section = dashboardItems.some(([id]) => id === hash) ? hash : 'overview';
  const [cancelError, setCancelError] = useState('');
  const { bookings, updateBooking, plans } = useStore();
  const mine = bookings.filter((b) => b.guestId === user?.id);
  const today = isoDay(0);
  const upcoming = mine.filter((b) => b.checkOut >= today && b.status !== "Cancelled");
  const past = mine.filter((b) => b.checkOut < today || b.status === "Cancelled");
  const [selected, setSelected] = useState<string | null>(null);
  const sel = mine.find((b) => b.id === selected) ?? upcoming[0] ?? mine[0];
  const latest = mine[0];

  return (
    <DashboardSidebar active={section}>
      <PageHeader eyebrow="Your sanctuary" title={dashboardItems.find(([id]) => id === section)?.[1] ?? 'Overview'} />
      {section === 'overview' && <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">Welcome back, {user?.user_metadata?.full_name || user?.user_metadata?.name || 'guest'}.</p>
        <h2 className="mt-2 text-3xl font-semibold">Your next mountain escape</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">{[['Upcoming stays', upcoming.length], ['Booking requests', mine.length], ['Planned activities', plans.length]].map(([label, value]) => <div key={label} className="rounded-lg border bg-card p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 font-display text-4xl font-semibold">{value}</p></div>)}</div>
        <div className="mt-8 grid gap-6 md:grid-cols-2">{[['rooms', 'Find your sanctuary', 'Rooms & Villas'], ['activities', 'Explore the ridgeline', 'Activities & Trek Advisor']].map(([id, title, label]) => <Link key={id} to="/dashboard" hash={id} className="overflow-hidden rounded-lg border bg-card"><img src={id === 'rooms' ? getRoom('deluxe-valley')?.image : activities[0]?.image} alt={label} className="aspect-[16/9] w-full object-cover" /><div className="p-5"><p className="eyebrow">{label}</p><h3 className="mt-2 text-2xl font-semibold">{title} →</h3></div></Link>)}</div>
        <div className="mt-8 flex flex-wrap gap-3"><Link to="/dashboard" hash="concierge" className="btn btn-primary">Plan my stay</Link><Link to="/dashboard" hash="my-bookings" className="btn btn-outline">View my bookings</Link></div>
      </div>}
      {section === 'assistant' && <div className="px-4 py-10 sm:px-6 lg:px-8"><h2 className="text-3xl font-semibold">AI Guest Assistant</h2><AssistantWidget openSignal={1} /></div>}
      {section === "concierge" && <HubSection id="concierge" eyebrow="Plan" title="AI Travel Concierge"><ConciergeSection /></HubSection>}
      {section === "rooms" && <HubSection id="rooms" eyebrow="Stay" title="Rooms & Villas"><RoomsSection /></HubSection>}
      {section === "activities" && <HubSection id="activities" eyebrow="Explore" title="Activities & Trek Advisor"><ActivitiesSection /></HubSection>}
      {["my-bookings", "upcoming", "past", "profile"].includes(section) && <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {section !== "profile" && <section id="my-bookings" aria-labelledby="my-bookings-h" className="scroll-mt-32">
            <h2 id="my-bookings-h" className="mb-4 text-3xl font-semibold">My Bookings</h2>
            {mine.length === 0 ? (
              <EmptyState title="You don't have any bookings yet.">
                <a href="#rooms" className="btn btn-primary">Browse Rooms & Villas</a>
              </EmptyState>
            ) : (
              <div className="space-y-6">
                {section !== "past" && <BookingList title="Upcoming Stays" items={upcoming} onSelect={setSelected} selectedId={sel?.id} empty="No upcoming stays." />}
                {section !== "upcoming" && <BookingList title="Past Bookings" items={past} onSelect={setSelected} selectedId={sel?.id} empty="No past bookings." />}
              </div>
            )}
          </section>}

          {section !== "profile" && sel && (
            <section aria-labelledby="details" className="rounded-2xl bg-card p-6 shadow-card">
              <h2 id="details" className="text-3xl font-semibold">Booking Details</h2>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                {[
                  ["Reference", sel.id], ["Room / Villa", getRoom(sel.roomId)?.name], ["Check-in", sel.checkIn], ["Check-out", sel.checkOut],
                  ["Guests", sel.guests], ["Nights", sel.nights], ["Total", formatINR(sel.total)], ["Booked by", `${sel.guestName} · ${sel.email}`],
                ].map(([k, v]) => <div key={String(k)}><dt className="text-muted-foreground">{k}</dt><dd className="break-words font-medium">{v}</dd></div>)}
                {sel.requests && <div className="sm:col-span-2"><dt className="text-muted-foreground">Special requests</dt><dd>{sel.requests}</dd></div>}
              </dl>
              <div className="mt-4 flex flex-wrap items-center gap-2"><StatusBadge status={sel.status} /><StatusBadge status={sel.payment} /></div>
              {sel.status !== "Cancelled" && sel.checkIn >= today && (
                <Button variant="outline" className="mt-5" onClick={async () => { try { await updateBooking(sel.id, { status: "Cancelled" }); setCancelError(""); } catch { setCancelError("Unable to cancel this booking. Please try again."); } }}>Cancel booking</Button>
              )}
            </section>
          )}

          {section !== "profile" && <section id="payment" aria-labelledby="payment-h" className="scroll-mt-32 rounded-2xl bg-card p-6 shadow-card">
            <h2 id="payment-h" className="text-3xl font-semibold">Payment Status</h2>
            {latest ? (
              <p className="mt-2 text-sm">Latest booking {latest.id}: <StatusBadge status={latest.payment} /></p>
            ) : <p className="mt-2 text-sm text-muted-foreground">No payments yet.</p>}
            <p className="mt-3 text-xs text-muted-foreground">Week 1 prototype: payments are in test/ready mode. No real payment has been taken.</p>
          </section>}
          {cancelError && <p role="alert" className="text-sm text-destructive">{cancelError}</p>}

          {section !== "profile" && plans.length > 0 && (
            <section className="rounded-2xl bg-card p-6 shadow-card">
              <h2 className="text-3xl font-semibold">Planned activities</h2>
              <ul className="mt-3 space-y-1 text-sm">{plans.map((p) => <li key={p.id}>{activities.find((a) => a.id === p.activityId)?.name} · {p.date} {p.slot} · {p.people} people</li>)}</ul>
            </section>
          )}
        </div>

        {section === "profile" && <aside className="space-y-6">
          <section id="profile" className="scroll-mt-32 rounded-2xl bg-card p-6 shadow-card">
            <h2 className="flex items-center gap-2 text-2xl font-semibold"><User className="h-5 w-5 text-primary" /> Guest Profile</h2>
            <GuestProfile />
          </section>
          <section className="rounded-2xl bg-ink p-6 text-ink-foreground">
            <h2 className="flex items-center gap-2 text-2xl font-semibold"><Headphones className="h-5 w-5" /> Guest Support</h2>
            <p className="mt-2 text-sm opacity-80">We're here 24/7 for anything you need.</p>
            <p className="mt-3 flex items-center gap-2 text-sm"><Phone className="h-4 w-4" /> {resort.phone}</p>
            <p className="mt-1 flex items-center gap-2 text-sm"><Mail className="h-4 w-4" /> {resort.email}</p>
            <a href="#help" className="btn btn-accent mt-4 w-full">Send an enquiry</a>
          </section>
        </aside>}
      </div>}
      {section === "help" && <div className="border-t"><EnquirySection /></div>}
    </DashboardSidebar>
  );
}

function BookingList({ title, items, onSelect, selectedId, empty }: { title: string; items: Booking[]; onSelect: (id: string) => void; selectedId?: string; empty: string }) {
  return (
    <div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      {items.length === 0 ? <p className="text-sm text-muted-foreground">{empty}</p> : (
        <ul className="space-y-2">
          {items.map((b) => {
            const r = getRoom(b.roomId);
            return (
              <li key={b.id}>
                <button onClick={() => onSelect(b.id)} className={`flex w-full flex-col gap-3 rounded-xl border bg-card p-4 text-left sm:flex-row sm:items-center ${selectedId === b.id ? "border-primary" : "hover:bg-muted/50"}`}>
                  {r && <img src={r.image} alt="" className="h-16 w-24 shrink-0 rounded-lg object-cover" loading="lazy" />}
                  <div className="min-w-0 flex-1"><p className="font-semibold">{r?.name}</p><p className="text-sm text-muted-foreground">{b.checkIn} → {b.checkOut} · {b.guests} guests · {formatINR(b.total)}</p></div>
                  <div className="flex flex-wrap gap-1.5"><StatusBadge status={b.status} /><StatusBadge status={b.payment} /></div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
