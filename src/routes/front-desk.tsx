import { createFileRoute } from "@tanstack/react-router";
import { formatINR, getRoom, isoDay, rooms, type Booking } from "@/data/resort";
import { AccessDenied } from "@/components/AccessDenied";
import { PageHeader, StatusBadge } from "@/components/ui-kit";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/front-desk")({
  head: () => ({
    meta: [
      { title: "Front Desk Dashboard — Azure Ridge (Staff)" },
      { name: "description", content: "Internal front desk view of arrivals, departures and reservations." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Front Desk Dashboard — Azure Ridge" },
      { property: "og:description", content: "Internal front desk view of arrivals, departures and reservations." },
    ],
  }),
  component: FrontDesk,
});

function FrontDesk() {
  const { role, bookings, updateBooking } = useStore();
  if (role !== "frontdesk") return <AccessDenied required="Front Desk Staff" />;

  const today = isoDay(0);
  const active = bookings.filter((b) => b.status !== "Cancelled");
  const arrivals = active.filter((b) => b.checkIn === today);
  const departures = active.filter((b) => b.checkOut === today);
  const inHouse = (roomId: string) => active.filter((b) => b.roomId === roomId && b.checkIn <= today && b.checkOut > today).length;

  const Row = ({ b, action }: { b: Booking; action?: React.ReactNode }) => (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0"><p className="font-medium">{b.guestName} <span className="text-xs text-muted-foreground">· {b.id}</span></p><p className="text-sm text-muted-foreground">{getRoom(b.roomId)?.name} · {b.guests} guests</p></div>
      <div className="flex flex-wrap items-center gap-2"><StatusBadge status={b.status} />{action}</div>
    </li>
  );

  return (
    <div>
      <PageHeader eyebrow="Internal · Demo role-based access" title="Front Desk Dashboard" description="Arrivals, departures, reservations and room availability for today." />
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-4">
          {[["Today's arrivals", arrivals.length], ["Today's departures", departures.length], ["In-house", active.filter((b) => b.status === "Checked In").length], ["Reservations", bookings.length]].map(([k, v]) => (
            <div key={String(k)} className="rounded-2xl bg-card p-5 shadow-card"><p className="text-sm text-muted-foreground">{k}</p><p className="font-display text-4xl font-semibold">{v}</p></div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl bg-card p-6 shadow-card">
            <h2 className="text-2xl font-semibold">Today's Arrivals · Check-in Status</h2>
            {arrivals.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No arrivals today.</p> : (
              <ul className="mt-2 divide-y">{arrivals.map((b) => <Row key={b.id} b={b} action={b.status !== "Checked In" && b.status !== "Checked Out" ? <button className="btn btn-primary !px-3 !py-1.5 !text-xs" onClick={() => updateBooking(b.id, { status: "Checked In" })}>Check in</button> : null} />)}</ul>
            )}
          </section>
          <section className="rounded-2xl bg-card p-6 shadow-card">
            <h2 className="text-2xl font-semibold">Today's Departures · Check-out Status</h2>
            {departures.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No departures today.</p> : (
              <ul className="mt-2 divide-y">{departures.map((b) => <Row key={b.id} b={b} action={b.status === "Checked In" ? <button className="btn btn-primary !px-3 !py-1.5 !text-xs" onClick={() => updateBooking(b.id, { status: "Checked Out" })}>Check out</button> : null} />)}</ul>
            )}
          </section>
        </div>

        <section className="rounded-2xl bg-card p-6 shadow-card">
          <h2 className="text-2xl font-semibold">Guest Reservations</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-muted-foreground"><tr className="border-b">{["Ref", "Guest", "Room", "Dates", "Guests", "Total", "Status", "Payment", "Update"].map((h) => <th key={h} className="py-2 pr-3 font-medium">{h}</th>)}</tr></thead>
              <tbody className="divide-y">
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td className="py-2.5 pr-3 font-medium">{b.id}</td><td className="pr-3">{b.guestName}</td><td className="pr-3">{getRoom(b.roomId)?.name}</td>
                    <td className="pr-3 whitespace-nowrap">{b.checkIn} → {b.checkOut}</td><td className="pr-3">{b.guests}</td><td className="pr-3">{formatINR(b.total)}</td>
                    <td className="pr-3"><StatusBadge status={b.status} /></td><td className="pr-3"><StatusBadge status={b.payment} /></td>
                    <td>
                      <select aria-label={`Update status for ${b.id}`} className="field !py-1 !text-xs" value={b.status} onChange={(e) => updateBooking(b.id, { status: e.target.value as Booking["status"] })}>
                        {["Pending", "Confirmed", "Checked In", "Checked Out", "Cancelled"].map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl bg-card p-6 shadow-card">
          <h2 className="text-2xl font-semibold">Room Availability (tonight)</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {rooms.map((r) => {
              const used = inHouse(r.id);
              return (
                <div key={r.id} className="rounded-xl border p-4">
                  <p className="font-medium">{r.name}</p>
                  <p className="mt-1 font-display text-3xl font-semibold">{r.inventory - used}<span className="text-base text-muted-foreground"> / {r.inventory} free</span></p>
                  <div className="mt-2 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${(used / r.inventory) * 100}%` }} /></div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
