import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { activities, diningVenues, facilities, formatINR, isoDay, nightsBetween, rooms, type Room } from "@/data/resort";
import { Field, EmptyState, StatusBadge } from "@/components/ui-kit";
import { BookingDialog } from "@/components/BookingDialog";


const interestsList = ["Relaxation", "Adventure", "Trekking", "Family", "Dining", "Nature"];
const preferences = ["Any", "Room", "Suite", "Villa", "Cottage"];

interface Result { room: Room; acts: typeof activities; extras: string[]; why: string; nights: number }

export function ConciergeSection() {
  const [f, setF] = useState({ guests: "2", checkIn: isoDay(14), checkOut: isoDay(17), budget: "15000", pref: "Any", interests: [] as string[] });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [errMsg, setErrMsg] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [booking, setBooking] = useState(false);

  const toggle = (i: string) => setF({ ...f, interests: f.interests.includes(i) ? f.interests.filter((x) => x !== i) : [...f.interests, i] });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    const g = Number(f.guests), b = Number(f.budget);
    if (!Number.isInteger(g) || g < 1 || g > 10) er.guests = "Enter between 1 and 10 guests.";
    if (!f.checkIn) er.checkIn = "Choose a check-in date.";
    else if (f.checkIn < isoDay(0)) er.checkIn = "Check-in cannot be in the past.";
    if (!f.checkOut || nightsBetween(f.checkIn, f.checkOut) <= 0) er.checkOut = "Check-out must be after check-in.";
    if (!b || b < 1000) er.budget = "Enter a nightly budget of at least ₹1,000.";
    if (!f.interests.length) er.interests = "Pick at least one interest.";
    setErrors(er);
    if (Object.keys(er).length) return;

    setStatus("loading");
    setResult(null);
    setTimeout(() => {
      const fits = rooms.filter((r) => r.capacity >= g && r.price <= b && (f.pref === "Any" || r.type === f.pref));
      if (!fits.length) {
        const cheapest = rooms.filter((r) => r.capacity >= g).sort((a, c) => a.price - c.price)[0];
        setErrMsg(
          cheapest
            ? `We couldn't find a ${f.pref === "Any" ? "stay" : f.pref.toLowerCase()} for ${g} guests within ${formatINR(b)}/night. Try a budget of ${formatINR(cheapest.price)} or "Any" stay type.`
            : `None of our stays fit ${g} guests in one unit. Try fewer guests per room.`,
        );
        setStatus("error");
        return;
      }
      const scored = fits.map((r) => ({ r, s: r.tags.filter((t) => f.interests.includes(t)).length * 10 - r.price / 10000 })).sort((a, c) => c.s - a.s);
      const room = scored[0].r;
      const acts = activities
        .map((a) => ({ a, s: a.interests.filter((i) => f.interests.includes(i)).length }))
        .filter((x) => x.s > 0)
        .sort((a, c) => c.s - a.s)
        .slice(0, 3)
        .map((x) => x.a);
      const extras: string[] = [];
      if (f.interests.includes("Dining")) extras.push(`${diningVenues[1].name} — ${diningVenues[1].cuisine}`);
      extras.push(`${diningVenues[0].name} — breakfast included`);
      if (f.interests.includes("Relaxation")) extras.push(facilities[1].name + " — " + facilities[1].description);
      if (f.interests.includes("Family")) extras.push(facilities[3].name + " — " + facilities[3].description);
      extras.push(facilities[0].name);
      const nights = nightsBetween(f.checkIn, f.checkOut);
      const matched = room.tags.filter((t) => f.interests.includes(t));
      const why = `For ${g} guest${g > 1 ? "s" : ""} over ${nights} night${nights > 1 ? "s" : ""} with a ${formatINR(b)} nightly budget, the ${room.name} is the best fit${matched.length ? ` — it's ideal for ${matched.join(" & ").toLowerCase()}` : ""}. It sleeps up to ${room.capacity} and comes to ${formatINR(room.price * nights)} for your stay.`;
      setResult({ room, acts: acts.length ? acts : activities.slice(0, 2), extras, why, nights });
      setStatus("done");
    }, 1100);
  };

  return (
    <div>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,420px)_1fr] lg:px-8">
        <form onSubmit={submit} noValidate className="h-fit space-y-4 rounded-2xl bg-card p-6 shadow-card">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Number of Guests" htmlFor="c-g" error={errors.guests}><input id="c-g" type="number" min={1} className="field" value={f.guests} onChange={(e) => setF({ ...f, guests: e.target.value })} aria-invalid={!!errors.guests} /></Field>
            <Field label="Budget (₹ / night)" htmlFor="c-b" error={errors.budget}><input id="c-b" type="number" min={1000} step={500} className="field" value={f.budget} onChange={(e) => setF({ ...f, budget: e.target.value })} aria-invalid={!!errors.budget} /></Field>
            <Field label="Check-in Date" htmlFor="c-in" error={errors.checkIn}><input id="c-in" type="date" className="field" value={f.checkIn} onChange={(e) => setF({ ...f, checkIn: e.target.value })} aria-invalid={!!errors.checkIn} /></Field>
            <Field label="Check-out Date" htmlFor="c-out" error={errors.checkOut}><input id="c-out" type="date" className="field" value={f.checkOut} onChange={(e) => setF({ ...f, checkOut: e.target.value })} aria-invalid={!!errors.checkOut} /></Field>
          </div>
          <Field label="Stay Preference" htmlFor="c-p"><select id="c-p" className="field" value={f.pref} onChange={(e) => setF({ ...f, pref: e.target.value })}>{preferences.map((p) => <option key={p}>{p}</option>)}</select></Field>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Interests</legend>
            <div className="flex flex-wrap gap-2">
              {interestsList.map((i) => (
                <button type="button" key={i} aria-pressed={f.interests.includes(i)} onClick={() => toggle(i)}
                  className={`rounded-full border px-3 py-1.5 text-sm ${f.interests.includes(i) ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}>{i}</button>
              ))}
            </div>
            {errors.interests && <p className="mt-1.5 text-xs font-medium text-destructive" role="alert">{errors.interests}</p>}
          </fieldset>
          <button type="submit" disabled={status === "loading"} className="btn btn-primary w-full">
            {status === "loading" ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : <><Sparkles className="h-4 w-4" /> Get recommendation</>}
          </button>
        </form>

        <div aria-live="polite">
          {status === "idle" && <EmptyState title="Your recommendation will appear here"><p className="text-sm text-muted-foreground">Fill in the form and choose your interests to get started.</p></EmptyState>}
          {status === "loading" && (
            <div className="space-y-4 rounded-2xl bg-card p-6 shadow-card">
              <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Matching rooms, activities and dining to your preferences…</p>
              {[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}
            </div>
          )}
          {status === "error" && (
            <div className="rounded-2xl border border-warning/50 bg-warning/10 p-6" role="alert">
              <p className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-5 w-5 text-warning" /> No perfect match yet</p>
              <p className="mt-2 text-sm">{errMsg}</p>
              <button className="btn btn-outline mt-4" onClick={() => setStatus("idle")}>Adjust my preferences</button>
            </div>
          )}
          {status === "done" && result && (
            <div className="space-y-6">
              <div className="overflow-hidden rounded-2xl bg-card shadow-card md:grid md:grid-cols-2">
                <img src={result.room.image} alt={result.room.name} width={1024} height={768} className="h-full w-full object-cover" />
                <div className="p-6">
                  <p className="eyebrow">Recommended room</p>
                  <h2 className="mt-1 text-3xl font-semibold">{result.room.name}</h2>
                  <p className="mt-1 text-sm font-semibold text-primary">{formatINR(result.room.price)} / night · {formatINR(result.room.price * result.nights)} total</p>
                  <p className="mt-3 text-sm text-muted-foreground">{result.why}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button className="btn btn-primary" onClick={() => setBooking(true)}>Book this room</button>
                    <Link to="/dashboard" hash="rooms" className="btn btn-outline">Compare rooms</Link>
                  </div>
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl bg-card p-6 shadow-card">
                  <h3 className="text-2xl font-semibold">Suggested activities</h3>
                  <ul className="mt-3 space-y-3">
                    {result.acts.map((a) => (
                      <li key={a.id} className="flex items-start justify-between gap-3 text-sm">
                        <div><p className="font-medium">{a.name}</p><p className="text-muted-foreground">{a.duration} · {a.price ? formatINR(a.price) : "Complimentary"}</p></div>
                        <StatusBadge status={a.difficulty} />
                      </li>
                    ))}
                  </ul>
                  <Link to="/dashboard" hash="activities" className="mt-4 inline-block text-sm font-semibold text-primary underline">Plan activities →</Link>
                </div>
                <div className="rounded-2xl bg-card p-6 shadow-card">
                  <h3 className="text-2xl font-semibold">Dining & facilities</h3>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">{result.extras.map((x) => <li key={x}>{x}</li>)}</ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {booking && result && <BookingDialog room={result.room} onClose={() => setBooking(false)} initial={{ checkIn: f.checkIn, checkOut: f.checkOut, guests: Number(f.guests) }} />}
    </div>
  );
}
