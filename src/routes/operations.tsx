import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { getRoom, opsAlerts, type OpsTask, type RoomReadiness, type TaskStatus } from "@/data/resort";
import { AccessDenied } from "@/components/AccessDenied";
import { PageHeader, StatusBadge } from "@/components/ui-kit";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/operations")({
  head: () => ({
    meta: [
      { title: "Operations Dashboard — Azure Ridge (Staff)" },
      { name: "description", content: "Manage room readiness, housekeeping, maintenance and daily resort operations." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Operations Dashboard — Azure Ridge" },
      { property: "og:description", content: "Manage room readiness, housekeeping, maintenance and daily resort operations." },
    ],
  }),
  component: Operations,
});

const readiness: RoomReadiness[] = ["Ready", "Cleaning", "Inspection", "Out of Service"];
const taskStatuses: TaskStatus[] = ["Open", "In Progress", "Done"];

function Operations() {
  const { role, units, tasks, setReadiness, setTaskStatus } = useStore();
  if (role !== "operations") return <AccessDenied required="Operations Manager" />;

  const TaskTable = ({ kind, title }: { kind: OpsTask["kind"]; title: string }) => (
    <section className="rounded-2xl bg-card p-6 shadow-card">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <ul className="mt-2 divide-y">
        {tasks.filter((t) => t.kind === kind).map((t) => (
          <li key={t.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0"><p className="font-medium">{t.title}</p><p className="text-sm text-muted-foreground">{t.location} · {t.assignee}</p></div>
            <div className="flex items-center gap-2">
              <StatusBadge status={t.priority} />
              <select aria-label={`Status for ${t.title}`} className="field !w-auto !py-1 !text-xs" value={t.status} onChange={(e) => setTaskStatus(t.id, e.target.value as TaskStatus)}>
                {taskStatuses.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );

  const ready = units.filter((u) => u.readiness === "Ready").length;
  const open = tasks.filter((t) => t.status !== "Done").length;

  return (
    <div>
      <PageHeader eyebrow="Internal · Demo role-based access" title="Operations Dashboard" description="Manage room readiness, housekeeping, maintenance and daily resort operations." />
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {[["Rooms ready", `${ready} / ${units.length}`], ["Open tasks", open], ["Active alerts", opsAlerts.length]].map(([k, v]) => (
            <div key={String(k)} className="rounded-2xl bg-card p-5 shadow-card"><p className="text-sm text-muted-foreground">{k}</p><p className="font-display text-4xl font-semibold">{v}</p></div>
          ))}
        </div>

        <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
          <h2 className="flex items-center gap-2 text-2xl font-semibold"><AlertTriangle className="h-5 w-5 text-destructive" /> Operational Alerts</h2>
          <ul className="mt-3 space-y-2 text-sm">{opsAlerts.map((a) => <li key={a.id} className="flex items-center gap-2"><StatusBadge status={a.level} /> {a.message}</li>)}</ul>
        </section>

        <section className="rounded-2xl bg-card p-6 shadow-card">
          <h2 className="text-2xl font-semibold">Room Readiness</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {units.map((u) => (
              <div key={u.number} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                <div className="min-w-0"><p className="font-semibold">Unit {u.number}</p><p className="truncate text-xs text-muted-foreground">{getRoom(u.roomId)?.name}</p></div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <StatusBadge status={u.readiness} />
                  <select aria-label={`Readiness for unit ${u.number}`} className="field !w-auto !py-1 !text-xs" value={u.readiness} onChange={(e) => setReadiness(u.number, e.target.value as RoomReadiness)}>
                    {readiness.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <TaskTable kind="Housekeeping" title="Housekeeping Tasks" />
          <TaskTable kind="Maintenance" title="Maintenance Requests" />
        </div>
        <TaskTable kind="Staff" title="Staff Task Status" />
      </div>
    </div>
  );
}
