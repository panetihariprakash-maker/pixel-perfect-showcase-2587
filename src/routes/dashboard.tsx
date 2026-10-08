import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Headphones, Mail, Phone, User } from "lucide-react";
import { activities, demoGuest, formatINR, getRoom, isoDay, resort, type Booking } from "@/data/resort";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui-kit";
import { useStore } from "@/lib/store";
import { ConciergeSection } from "@/components/guest/ConciergeSection";
import { RoomsSection } from "@/components/guest/RoomsSection";
import { ActivitiesSection } from "@/components/guest/ActivitiesSection";
import { EnquirySection } from "@/components/guest/EnquirySection";

const hubNav = [
  ["concierge", "AI Travel Concierge"], ["rooms", "Rooms & Villas"], ["activities", "Activities & Trek Advisor"],
  ["my-bookings", "My Bookings"], ["payment", "Payment Status"], ["profile", "Guest Profile"], ["help", "Guest Support"],
] as const;

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

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "My Dashboard — The Azure Ridge Sanctuary" },
      { name: "description", content: "Your bookings, upcoming stays, payment status and guest support." },
      { property: "og:title", content: "My Dashboard — Azure Ridge Sanctuary" },
      { property: "og:description", content: "Your bookings, upcoming stays, payment status and guest support." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { bookings, updateBooking, plans } = useStore();
  const mine = bookings.filter((b) => b.guestId === demoGuest.id);
  const today = isoDay(0);
  const upcoming = mine.filter((b) => b.checkOut >= today && b.status !== "Cancelled");
  const past = mine.filter((b) => b.checkOut < today || b.status === "Cancelled");
  const [selected, setSelected] = useState<string | null>(null);
  const sel = mine.find((b) => b.id === selected) ?? upcoming[0] ?? mine[0];
  const latest = mine[0];

  return (
    <div>
      <PageHeader eyebrow="Guest" title="My Dashboard" description="Plan, book and manage your stay at The Azure Ridge Sanctuary — all in one place." />
      <nav aria-label="Dashboard sections" className="sticky top-[57px] z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
          {hubNav.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">{label}</a>
          ))}
        </div>
      </nav>
      <HubSection id="concierge" eyebrow="Plan" title="AI Travel Concierge"><ConciergeSection /></HubSection>
      <HubSection id="rooms" eyebrow="Stay" title="Rooms & Villas"><RoomsSection /></HubSection>
      <HubSection id="activities" eyebrow="Explore" title="Activities & Trek Advisor"><ActivitiesSection /></HubSection>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8">
        <div className="space-y-8">
          <section id="my-bookings" aria-labelledby="my-bookings-h" className="scroll-mt-32">
            <h2 id="my-bookings-h" className="mb-4 text-3xl font-semibold">My Bookings</h2>
            {mine.length === 0 ? (
              <EmptyState title="You don't have any bookings yet.">
                <a href="#rooms" className="btn btn-primary">Browse Rooms & Villas</a>
              </EmptyState>
            ) : (
              <div className="space-y-6">
                <BookingList title="Upcoming Stays" items={upcoming} onSelect={setSelected} selectedId={sel?.id} empty="No upcoming stays." />
                <BookingList title="Past Bookings" items={past} onSelect={setSelected} selectedId={sel?.id} empty="No past bookings." />
              </div>
            )}
          </section>

          {sel && (
            <section aria-labelledby="details" className="rounded-2xl bg-card p-6 shadow-card">
              <h2 id="details" className="text-3xl font-semibold">Booking Details</h2>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                {[
                  ["Reference", sel.id], ["Room / Villa", getRoom(sel.roomId)?.name], ["Check-in", sel.checkIn], ["Check-out", sel.checkOut],
                  ["Guests", sel.guests], ["Nights", sel.nights], ["Total", formatINR(sel.total)], ["Booked by", `${sel.guestName} · ${sel.email}`],
                ].map(([k, v]) => <div key={String(k)}><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>)}
                {sel.requests && <div className="sm:col-span-2"><dt className="text-muted-foreground">Special requests</dt><dd>{sel.requests}</dd></div>}
              </dl>
              <div className="mt-4 flex flex-wrap items-center gap-2"><StatusBadge status={sel.status} /><StatusBadge status={sel.payment} /></div>
              {sel.status !== "Cancelled" && sel.checkIn >= today && (
                <button className="btn btn-outline mt-5" onClick={() => updateBooking(sel.id, { status: "Cancelled" })}>Cancel booking</button>
              )}
            </section>
          )}

          <section id="payment" aria-labelledby="payment-h" className="scroll-mt-32 rounded-2xl bg-card p-6 shadow-card">
            <h2 id="payment-h" className="text-3xl font-semibold">Payment Status</h2>
            {latest ? (
              <p className="mt-2 text-sm">Latest booking {latest.id}: <StatusBadge status={latest.payment} /></p>
            ) : <p className="mt-2 text-sm text-muted-foreground">No payments yet.</p>}
            <p className="mt-3 text-xs text-muted-foreground">Week 1 prototype: payments are in test/ready mode. No real payment has been taken.</p>
          </section>

          {plans.length > 0 && (
            <section className="rounded-2xl bg-card p-6 shadow-card">
              <h2 className="text-3xl font-semibold">Planned activities</h2>
              <ul className="mt-3 space-y-1 text-sm">{plans.map((p) => <li key={p.id}>{activities.find((a) => a.id === p.activityId)?.name} · {p.date} {p.slot} · {p.people} people</li>)}</ul>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <section id="profile" className="scroll-mt-32 rounded-2xl bg-card p-6 shadow-card">
            <h2 className="flex items-center gap-2 text-2xl font-semibold"><User className="h-5 w-5 text-primary" /> Guest Profile</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div><dt className="text-muted-foreground">Name</dt><dd>{latest?.guestName ?? demoGuest.name}</dd></div>
              <div><dt className="text-muted-foreground">Email</dt><dd>{latest?.email ?? demoGuest.email}</dd></div>
              <div><dt className="text-muted-foreground">Phone</dt><dd>{latest?.phone ?? demoGuest.phone}</dd></div>
              <div><dt className="text-muted-foreground">Preferred language</dt><dd>{demoGuest.language}</dd></div>
            </dl>
          </section>
          <section className="rounded-2xl bg-ink p-6 text-ink-foreground">
            <h2 className="flex items-center gap-2 text-2xl font-semibold"><Headphones className="h-5 w-5" /> Guest Support</h2>
            <p className="mt-2 text-sm opacity-80">We're here 24/7 for anything you need.</p>
            <p className="mt-3 flex items-center gap-2 text-sm"><Phone className="h-4 w-4" /> {resort.phone}</p>
            <p className="mt-1 flex items-center gap-2 text-sm"><Mail className="h-4 w-4" /> {resort.email}</p>
            <a href="#help" className="btn btn-accent mt-4 w-full">Send an enquiry</a>
          </section>
        </aside>
      </div>
      <div className="border-t"><EnquirySection /></div>
    </div>
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
