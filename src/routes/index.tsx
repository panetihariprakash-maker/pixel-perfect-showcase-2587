import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Clock, Users } from "lucide-react";
import { activities, diningVenues, facilities, formatINR, images, isoDay, languages, nightsBetween, resort, rooms } from "@/data/resort";
import { AssistantWidget } from "@/components/AssistantWidget";
import { Field, StatusBadge } from "@/components/ui-kit";
import { EMAIL_RE, PHONE_RE, useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "The Azure Ridge Sanctuary — Hillside Resort & AI Concierge" },
      { name: "description", content: "Rooms, villas, treks and dining above the clouds. Plan your stay with our AI concierge." },
      { property: "og:title", content: "The Azure Ridge Sanctuary" },
      { property: "og:description", content: "Rooms, villas, treks and dining above the clouds. Plan your stay with our AI concierge." },
    ],
  }),
  component: Home,
});

function Section({ eyebrow, title, children, link }: { eyebrow: string; title: string; children: React.ReactNode; link?: React.ReactNode }) {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-12 xl:px-20">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="eyebrow">{eyebrow}</p><h2 className="mt-2 text-4xl font-semibold sm:text-5xl">{title}</h2></div>
        {link}
      </div>
      {children}
    </section>
  );
}

function Home() {
  const [openSignal, setOpenSignal] = useState(0);
  const openAssistant = () => setOpenSignal((k) => k + 1);

  return (
    <div>
      <section className="relative isolate flex min-h-[78vh] items-end overflow-hidden">
        <img src={images.hero} alt="Infinity pool at The Azure Ridge Sanctuary overlooking misty ridges at sunset" width={1920} height={1088} className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-hero-overlay" />
        <div className="w-full px-4 pb-16 pt-32 text-ink-foreground sm:px-6 lg:px-12 xl:px-20">
          <p className="eyebrow">Welcome to</p>
          <h1 className="mt-3 max-w-4xl text-5xl font-semibold leading-[1.02] sm:text-7xl">{resort.name}</h1>
          <p className="mt-5 max-w-2xl text-base opacity-90 sm:text-lg">{resort.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/rooms" className="btn btn-accent">Explore Rooms</Link>
            <Link to="/dashboard" hash="concierge" className="btn btn-ghost-light">Plan Your Stay</Link>
            <button onClick={openAssistant} className="btn btn-ghost-light">Ask AI Assistant</button>
          </div>
        </div>
      </section>

      <Section eyebrow="Stay" title="Rooms & Villas" link={<Link to="/rooms" className="btn btn-outline">View all rooms</Link>}>
        <p className="mb-5 text-sm text-muted-foreground">Sanctuary sample stays · Browse all rooms for approved partner properties.</p>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {rooms.map((r) => (
            <Link key={r.id} to="/rooms" className="group overflow-hidden rounded-2xl bg-card shadow-card">
              <img src={r.image} alt={r.name} loading="lazy" width={1024} height={768} className="aspect-[4/3] w-full object-cover" />
              <div className="p-5">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{r.type} · up to {r.capacity}</p>
                <h3 className="mt-1 text-2xl font-semibold">{r.name}</h3>
                <p className="mt-2 text-sm font-semibold text-primary">{formatINR(r.price)} / night</p>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section eyebrow="Explore" title="Activities & Experiences" link={<Link to="/dashboard" hash="activities" className="btn btn-outline">Trek Advisor</Link>}>
        <div className="grid gap-6 md:grid-cols-3">
          {activities.slice(0, 3).map((a) => (
            <div key={a.id} className="relative overflow-hidden rounded-2xl">
              <img src={a.image} alt={a.name} loading="lazy" width={1024} height={768} className="aspect-[4/3] w-full object-cover" />
              <div className="absolute inset-0 flex flex-col justify-end bg-hero-overlay p-5 text-ink-foreground">
                <StatusBadge status={a.difficulty} />
                <h3 className="mt-2 text-2xl font-semibold">{a.name}</h3>
                <p className="text-sm opacity-85">{a.duration} · {a.type}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <section className="grid bg-ink text-ink-foreground lg:grid-cols-2">
        <img src={images.dining} alt="Candlelit dinner on Ember Terrace at sunset" loading="lazy" width={1024} height={768} className="h-full max-h-[560px] w-full object-cover" />
        <div className="px-4 py-14 sm:px-10 lg:px-16">
          <p className="eyebrow">Dining</p>
          <h2 className="mt-2 text-4xl font-semibold sm:text-5xl">Slow mountain dining</h2>
          <ul className="mt-8 space-y-6">
            {diningVenues.map((d) => (
              <li key={d.name} className="border-b border-ink-foreground/15 pb-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="text-2xl font-semibold">{d.name}</h3><span className="text-xs opacity-70">{d.hours}</span></div>
                <p className="text-sm text-accent">{d.cuisine}</p>
                <p className="mt-1 text-sm opacity-80">{d.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Section eyebrow="Amenities" title="Resort Facilities">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {facilities.map((f) => (
            <div key={f.name} className="rounded-2xl border bg-card p-6">
              <h3 className="text-2xl font-semibold">{f.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.description}</p>
              <p className="mt-3 flex items-center gap-1.5 text-xs font-medium"><Clock className="h-3.5 w-3.5" /> {f.hours}</p>
            </div>
          ))}
        </div>
      </Section>

      <section className="bg-secondary/60 px-4 py-16 sm:px-6 lg:px-12 xl:px-20">
        <div className="grid gap-10 lg:grid-cols-2">
          <div><p className="eyebrow">About the Resort</p><h2 className="mt-2 text-4xl font-semibold sm:text-5xl">{resort.tagline}</h2></div>
          <div className="space-y-4 text-muted-foreground">
            <p>{resort.about}</p>
            <p className="text-sm">{resort.address} · Check-in {resort.checkInTime} · Check-out {resort.checkOutTime}</p>
          </div>
        </div>
      </section>

      <EnquirySection />
      <AssistantWidget openSignal={openSignal} />
    </div>
  );
}

import { EnquirySection } from "@/components/guest/EnquirySection";
