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
            <Link to="/concierge" className="btn btn-ghost-light">Plan Your Stay</Link>
            <button onClick={openAssistant} className="btn btn-ghost-light">Ask AI Assistant</button>
          </div>
        </div>
      </section>

      <Section eyebrow="Stay" title="Rooms & Villas" link={<Link to="/rooms" className="btn btn-outline">View all rooms</Link>}>
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

      <Section eyebrow="Explore" title="Activities & Experiences" link={<Link to="/activities" className="btn btn-outline">Trek Advisor</Link>}>
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

const topics = ["Room Booking", "Existing Reservation", "Activities", "Dining", "Resort Facilities", "Other"];

function EnquirySection() {
  const { addEnquiry } = useStore();
  const empty = { name: "", email: "", phone: "", checkIn: "", checkOut: "", guests: "2", topic: "", language: "English", message: "" };
  const [f, setF] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().length < 2) er.name = "Full name is required.";
    if (!EMAIL_RE.test(f.email.trim())) er.email = "Enter a valid email address.";
    if (!PHONE_RE.test(f.phone.replace(/\s/g, ""))) er.phone = "Enter a valid 10-digit mobile number.";
    if (!f.checkIn) er.checkIn = "Choose a check-in date.";
    else if (f.checkIn < isoDay(0)) er.checkIn = "Check-in cannot be in the past.";
    if (!f.checkOut) er.checkOut = "Choose a check-out date.";
    else if (f.checkIn && nightsBetween(f.checkIn, f.checkOut) <= 0) er.checkOut = "Check-out must be after check-in.";
    const g = Number(f.guests);
    if (!Number.isInteger(g) || g < 1 || g > 20) er.guests = "Enter between 1 and 20 guests.";
    if (!f.topic) er.topic = "Please choose a topic.";
    if (f.message.trim().length < 5) er.message = "Please tell us a little about your request.";
    setErrors(er);
    if (Object.keys(er).length) return;
    addEnquiry({ id: "EQ-" + Date.now(), name: f.name, topic: f.topic, createdAt: isoDay(0) });
    setDone(true);
    setF(empty);
  };

  return (
    <section id="help" className="px-4 py-16 sm:px-6 lg:px-12 xl:px-20">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
        <div>
          <p className="eyebrow">Guest enquiry</p>
          <h2 className="mt-2 text-4xl font-semibold sm:text-5xl">How Can We Help You?</h2>
          <p className="mt-4 text-muted-foreground">Tell us about your plans or request and our guest team will understand exactly what you need.</p>
          <p className="mt-4 flex items-center gap-2 text-sm"><Users className="h-4 w-4 text-primary" /> Available in {languages.length} languages</p>
        </div>
        <form onSubmit={submit} noValidate className="rounded-2xl bg-card p-6 shadow-card sm:p-8">
          {done && (
            <div className="mb-6 flex items-start gap-3 rounded-xl bg-success/10 p-4 text-sm text-success" role="status">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> Thank you. Your enquiry has been recorded for demo purposes.
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full Name" htmlFor="e-name" error={errors.name}><input id="e-name" className="field" value={f.name} onChange={set("name")} aria-invalid={!!errors.name} /></Field>
            <Field label="Email Address" htmlFor="e-email" error={errors.email}><input id="e-email" type="email" className="field" value={f.email} onChange={set("email")} aria-invalid={!!errors.email} /></Field>
            <Field label="Mobile Number" htmlFor="e-phone" error={errors.phone}><input id="e-phone" type="tel" className="field" value={f.phone} onChange={set("phone")} aria-invalid={!!errors.phone} /></Field>
            <Field label="Number of Guests" htmlFor="e-guests" error={errors.guests}><input id="e-guests" type="number" min={1} className="field" value={f.guests} onChange={set("guests")} aria-invalid={!!errors.guests} /></Field>
            <Field label="Check-in Date" htmlFor="e-in" error={errors.checkIn}><input id="e-in" type="date" className="field" value={f.checkIn} onChange={set("checkIn")} aria-invalid={!!errors.checkIn} /></Field>
            <Field label="Check-out Date" htmlFor="e-out" error={errors.checkOut}><input id="e-out" type="date" className="field" value={f.checkOut} onChange={set("checkOut")} aria-invalid={!!errors.checkOut} /></Field>
            <Field label="What do you need help with?" htmlFor="e-topic" error={errors.topic}>
              <select id="e-topic" className="field" value={f.topic} onChange={set("topic")} aria-invalid={!!errors.topic}>
                <option value="">Select a topic</option>
                {topics.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Preferred Language" htmlFor="e-lang">
              <select id="e-lang" className="field" value={f.language} onChange={set("language")}>{languages.map((l) => <option key={l}>{l}</option>)}</select>
            </Field>
          </div>
          <div className="mt-4"><Field label="Message / Special Requests" htmlFor="e-msg" error={errors.message}><textarea id="e-msg" rows={4} className="field" value={f.message} onChange={set("message")} aria-invalid={!!errors.message} /></Field></div>
          <button type="submit" className="btn btn-primary mt-6 w-full sm:w-auto">Submit enquiry</button>
          <p className="mt-3 text-xs text-muted-foreground">Demo only — no email is sent.</p>
        </form>
      </div>
    </section>
  );
}
