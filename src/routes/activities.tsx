import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarCheck, Clock, Trash2, Users } from "lucide-react";
import { activities, formatINR, isoDay, type Activity } from "@/data/resort";
import { EmptyState, Field, Modal, PageHeader, StatusBadge } from "@/components/ui-kit";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/activities")({
  head: () => ({
    meta: [
      { title: "Activities & Trek Advisor — The Azure Ridge Sanctuary" },
      { name: "description", content: "Sunrise treks, waterfall trails, ziplines and wellness. Filter by type and difficulty." },
      { property: "og:title", content: "Activities & Trek Advisor — Azure Ridge" },
      { property: "og:description", content: "Sunrise treks, waterfall trails, ziplines and wellness. Filter by type and difficulty." },
    ],
  }),
  component: ActivitiesPage,
});

const types = ["All", "Trekking", "Nature", "Adventure", "Wellness", "Family", "Sightseeing"];
const levels = ["All", "Easy", "Moderate", "Challenging"];

function ActivitiesPage() {
  const { plans, addPlan, removePlan } = useStore();
  const [type, setType] = useState("All");
  const [level, setLevel] = useState("All");
  const [view, setView] = useState<Activity | null>(null);
  const [plan, setPlan] = useState<Activity | null>(null);
  const [pf, setPf] = useState({ date: isoDay(1), slot: "", people: "2" });
  const [perr, setPerr] = useState("");

  const list = useMemo(() => activities.filter((a) => (type === "All" || a.type === type) && (level === "All" || a.difficulty === level)), [type, level]);

  const openPlan = (a: Activity) => { setPlan(a); setPf({ date: isoDay(1), slot: a.slots[0], people: "2" }); setPerr(""); setView(null); };
  const savePlan = () => {
    const n = Number(pf.people);
    if (!pf.date || pf.date < isoDay(0)) return setPerr("Choose today or a future date.");
    if (!Number.isInteger(n) || n < 1 || n > 12) return setPerr("Enter between 1 and 12 people.");
    addPlan({ id: "PL-" + Date.now(), activityId: plan!.id, date: pf.date, slot: pf.slot, people: n });
    setPlan(null);
  };

  return (
    <div>
      <PageHeader eyebrow="Activities / Trek Advisor" title="Experiences on the ridge" description="From gentle forest walks to pre-dawn summit treks — find the right pace for your group." />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 grid gap-3 rounded-2xl bg-card p-4 shadow-card sm:grid-cols-2">
          <label className="text-sm font-medium">Activity Type<select className="field mt-1" value={type} onChange={(e) => setType(e.target.value)}>{types.map((t) => <option key={t}>{t}</option>)}</select></label>
          <label className="text-sm font-medium">Difficulty<select className="field mt-1" value={level} onChange={(e) => setLevel(e.target.value)}>{levels.map((t) => <option key={t}>{t}</option>)}</select></label>
        </div>

        {plans.length > 0 && (
          <div className="mb-8 rounded-2xl border bg-secondary/50 p-5">
            <h2 className="flex items-center gap-2 text-2xl font-semibold"><CalendarCheck className="h-5 w-5 text-primary" /> My activity plan</h2>
            <ul className="mt-3 divide-y text-sm">
              {plans.map((p) => {
                const a = activities.find((x) => x.id === p.activityId);
                return (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                    <span><strong>{a?.name}</strong> · {p.date} at {p.slot} · {p.people} people</span>
                    <button onClick={() => removePlan(p.id)} aria-label={`Remove ${a?.name}`} className="rounded-full p-1.5 hover:bg-muted"><Trash2 className="h-4 w-4" /></button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">Demo plan saved on this device. Our team confirms slots at check-in.</p>
          </div>
        )}

        {list.length === 0 ? (
          <EmptyState title="No activities match these filters" />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((a) => (
              <article key={a.id} className="flex flex-col overflow-hidden rounded-2xl bg-card shadow-card">
                <img src={a.image} alt={a.name} loading="lazy" width={1024} height={768} className="aspect-[4/3] w-full object-cover" />
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-2"><span className="text-xs uppercase tracking-wider text-muted-foreground">{a.type}</span><StatusBadge status={a.difficulty} /></div>
                  <h2 className="mt-1 text-2xl font-semibold">{a.name}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{a.description}</p>
                  <p className="mt-3 flex items-center gap-1.5 text-sm"><Clock className="h-4 w-4" /> {a.duration}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm"><Users className="h-4 w-4" /> {a.suitableFor}</p>
                  <div className="mt-auto flex gap-2 pt-5">
                    <button className="btn btn-outline flex-1" onClick={() => setView(a)}>View Activity</button>
                    <button className="btn btn-primary flex-1" onClick={() => openPlan(a)}>Plan Activity</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <Modal open={!!view} onClose={() => setView(null)} title={view?.name ?? ""} wide>
        {view && (
          <div>
            <img src={view.image} alt={view.name} width={1024} height={768} className="aspect-[16/9] w-full rounded-xl object-cover" />
            <p className="mt-4 text-muted-foreground">{view.description}</p>
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <div><dt className="font-semibold">Duration</dt><dd>{view.duration}</dd></div>
              <div><dt className="font-semibold">Difficulty</dt><dd>{view.difficulty}</dd></div>
              <div><dt className="font-semibold">Suitable for</dt><dd>{view.suitableFor}</dd></div>
              <div><dt className="font-semibold">Price</dt><dd>{view.price ? `${formatINR(view.price)} per person` : "Complimentary"}</dd></div>
              <div><dt className="font-semibold">Departures</dt><dd>{view.slots.join(", ")}</dd></div>
            </dl>
            <button className="btn btn-primary mt-6 w-full" onClick={() => openPlan(view)}>Plan Activity</button>
          </div>
        )}
      </Modal>

      <Modal open={!!plan} onClose={() => setPlan(null)} title={`Plan: ${plan?.name ?? ""}`}>
        {plan && (
          <div className="space-y-4">
            <Field label="Date" htmlFor="p-date"><input id="p-date" type="date" min={isoDay(0)} className="field" value={pf.date} onChange={(e) => setPf({ ...pf, date: e.target.value })} /></Field>
            <Field label="Time slot" htmlFor="p-slot"><select id="p-slot" className="field" value={pf.slot} onChange={(e) => setPf({ ...pf, slot: e.target.value })}>{plan.slots.map((s) => <option key={s}>{s}</option>)}</select></Field>
            <Field label="Number of people" htmlFor="p-n"><input id="p-n" type="number" min={1} className="field" value={pf.people} onChange={(e) => setPf({ ...pf, people: e.target.value })} /></Field>
            {plan.difficulty === "Challenging" && <p className="rounded-lg bg-warning/15 p-3 text-xs">Trek advisor tip: this is a challenging route. Carry water, wear trekking shoes and sleep early the night before.</p>}
            {perr && <p className="text-xs font-medium text-destructive" role="alert">{perr}</p>}
            <p className="text-sm">Estimated cost: <strong>{plan.price ? formatINR(plan.price * (Number(pf.people) || 0)) : "Complimentary"}</strong></p>
            <button className="btn btn-primary w-full" onClick={savePlan}>Add to my plan</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
