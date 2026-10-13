import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatINR, nightsBetween } from "@/data/resort";
import { EmptyState, Modal, StatusBadge } from "@/components/ui-kit";
import { EMAIL_RE, PHONE_RE } from "@/lib/store";
import { effectivePrice, RESERVATION_STATUSES, type OwnerRoom, type Property, type Reservation } from "@/lib/owner";
import { ErrorNote, SectionTitle } from "./PortalShell";

const nextActions: Record<string, string[]> = { Requested: ["Confirmed", "Declined"], Confirmed: ["Checked In", "Cancelled"], "Checked In": ["Completed"] };

export function ReservationsSection({ userId, properties, rooms, reservations }: { userId: string; properties: Property[]; rooms: OwnerRoom[]; reservations: Reservation[] }) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const pName = useMemo(() => Object.fromEntries(properties.map((p) => [p.id, p.name])), [properties]);
  const rName = useMemo(() => Object.fromEntries(rooms.map((r) => [r.id, r.name])), [rooms]);
  const list = reservations.filter((r) => (status === "All" || r.status === status) && `${r.guest_name} ${r.guest_email} ${pName[r.property_id] ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  const setRes = async (r: Reservation, s: string) => { setError(""); const { error } = await supabase.from("owner_reservations").update({ status: s }).eq("id", r.id); if (error) setError(error.message); else qc.invalidateQueries({ queryKey: ["owner", userId] }); };

  return (
    <section>
      <SectionTitle title="Bookings & Reservations" description="Review booking requests, confirm or decline them, and track stays." action={<button className="btn btn-primary" disabled={!rooms.length} onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> Add reservation</button>} />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input type="search" className="field" placeholder="Search by guest or property" aria-label="Search reservations" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="field sm:w-48" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status"><option>All</option>{RESERVATION_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
      </div>
      {error && <div className="mb-3"><ErrorNote error={error} /></div>}
      {list.length === 0 ? <EmptyState title="No reservations yet"><p className="text-sm text-muted-foreground">Booking requests you record will appear here.</p></EmptyState> : (
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="p-3">Guest</th><th className="p-3">Stay</th><th className="p-3">Dates</th><th className="p-3">Guests</th><th className="p-3">Amount</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead>
            <tbody>{list.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3"><p className="font-semibold">{r.guest_name}</p><p className="text-xs text-muted-foreground">{r.guest_email || r.guest_phone}</p></td>
                <td className="p-3">{pName[r.property_id]}<p className="text-xs text-muted-foreground">{r.room_id ? rName[r.room_id] : "—"}</p></td>
                <td className="p-3 whitespace-nowrap">{r.check_in} → {r.check_out}</td><td className="p-3">{r.guests}</td><td className="p-3">{formatINR(r.amount)}</td>
                <td className="p-3"><StatusBadge status={r.status} /></td>
                <td className="p-3"><div className="flex justify-end gap-1">{(nextActions[r.status] ?? []).map((s) => <button key={s} className="btn btn-outline !px-3 !py-1.5 text-xs" onClick={() => setRes(r, s)}>{s === "Confirmed" ? "Confirm" : s === "Declined" ? "Decline" : s === "Cancelled" ? "Cancel" : s === "Checked In" ? "Check in" : "Complete"}</button>)}</div></td>
              </tr>))}</tbody>
          </table>
        </div>
      )}
      {adding && <ReservationForm userId={userId} rooms={rooms} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); qc.invalidateQueries({ queryKey: ["owner", userId] }); }} />}
    </section>
  );
}

function ReservationForm({ userId, rooms, onClose, onSaved }: { userId: string; rooms: OwnerRoom[]; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ room_id: rooms[0]?.id ?? "", guest_name: "", guest_email: "", guest_phone: "", check_in: "", check_out: "", guests: "1", notes: "" });
  const [error, setError] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const room = rooms.find((r) => r.id === f.room_id);
  const nights = f.check_in && f.check_out ? nightsBetween(f.check_in, f.check_out) : 0;
  const amount = room && nights > 0 ? effectivePrice(room, f.check_in) * nights : 0;
  const save = async () => {
    if (!room) return setError("Choose a room");
    if (!f.guest_name.trim()) return setError("Guest name is required");
    if (f.guest_email && !EMAIL_RE.test(f.guest_email)) return setError("Enter a valid email");
    if (f.guest_phone && !PHONE_RE.test(f.guest_phone)) return setError("Enter a valid phone number");
    if (nights <= 0) return setError("Check-out must be after check-in");
    if (Number(f.guests) < 1 || Number(f.guests) > room.capacity) return setError(`This room fits up to ${room.capacity} guests`);
    const { error } = await supabase.from("owner_reservations").insert({ owner_id: userId, property_id: room.property_id, room_id: room.id, guest_name: f.guest_name.trim(), guest_email: f.guest_email.trim(), guest_phone: f.guest_phone.trim(), check_in: f.check_in, check_out: f.check_out, guests: Number(f.guests), amount, notes: f.notes });
    if (error) setError(error.message); else onSaved();
  };
  return (
    <Modal open onClose={onClose} title="Add reservation" wide>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium sm:col-span-2">Room<select className="field mt-1" value={f.room_id} onChange={set("room_id")}>{rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
        <label className="text-sm font-medium">Guest name<input className="field mt-1" value={f.guest_name} onChange={set("guest_name")} /></label>
        <label className="text-sm font-medium">Guests<input type="number" min={1} className="field mt-1" value={f.guests} onChange={set("guests")} /></label>
        <label className="text-sm font-medium">Email<input type="email" className="field mt-1" value={f.guest_email} onChange={set("guest_email")} /></label>
        <label className="text-sm font-medium">Phone<input className="field mt-1" value={f.guest_phone} onChange={set("guest_phone")} /></label>
        <label className="text-sm font-medium">Check-in<input type="date" className="field mt-1" value={f.check_in} onChange={set("check_in")} /></label>
        <label className="text-sm font-medium">Check-out<input type="date" className="field mt-1" value={f.check_out} onChange={set("check_out")} /></label>
        <label className="text-sm font-medium sm:col-span-2">Notes<textarea className="field mt-1" value={f.notes} onChange={set("notes")} /></label>
      </div>
      <p className="mt-4 text-sm">{nights > 0 ? <>{nights} night{nights > 1 && "s"} · <strong>{formatINR(amount)}</strong></> : "Pick dates to see the total."}</p>
      {error && <div className="mt-3"><ErrorNote error={error} /></div>}
      <div className="mt-6 flex justify-end gap-2"><button className="btn btn-outline" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={save}>Save request</button></div>
    </Modal>
  );
}

export function GuestsSection({ reservations, properties }: { reservations: Reservation[]; properties: Property[] }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const pName = Object.fromEntries(properties.map((p) => [p.id, p.name]));
  const guests = useMemo(() => {
    const m = new Map<string, { key: string; name: string; email: string; phone: string; stays: Reservation[] }>();
    for (const r of reservations) {
      const key = (r.guest_email || r.guest_phone || r.guest_name).toLowerCase();
      const g = m.get(key) ?? { key, name: r.guest_name, email: r.guest_email, phone: r.guest_phone, stays: [] };
      g.stays.push(r); m.set(key, g);
    }
    return [...m.values()];
  }, [reservations]);
  const list = guests.filter((g) => `${g.name} ${g.email} ${g.phone}`.toLowerCase().includes(q.toLowerCase()));
  const sel = guests.find((g) => g.key === open);
  return (
    <section>
      <SectionTitle title="Guests" description="Guests who have booked with your properties, with their booking history." />
      <input type="search" className="field mb-4" placeholder="Search guests" aria-label="Search guests" value={q} onChange={(e) => setQ(e.target.value)} />
      {list.length === 0 ? <EmptyState title="No guests yet" /> : (
        <div className="overflow-x-auto rounded-2xl border bg-card"><table className="w-full min-w-[640px] text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="p-3">Guest</th><th className="p-3">Contact</th><th className="p-3">Bookings</th><th className="p-3">Total spend</th><th className="p-3" /></tr></thead>
          <tbody>{list.map((g) => <tr key={g.key} className="border-t"><td className="p-3 font-semibold">{g.name}</td><td className="p-3">{g.email}<p className="text-xs text-muted-foreground">{g.phone}</p></td><td className="p-3">{g.stays.length}</td><td className="p-3">{formatINR(g.stays.filter((s) => ["Confirmed", "Checked In", "Completed"].includes(s.status)).reduce((a, s) => a + s.amount, 0))}</td><td className="p-3 text-right"><button className="btn btn-outline !px-3 !py-1.5 text-xs" onClick={() => setOpen(g.key)}>History</button></td></tr>)}</tbody>
        </table></div>
      )}
      <Modal open={!!sel} onClose={() => setOpen(null)} title={sel?.name ?? ""}>
        {sel && <ul className="space-y-3">{sel.stays.map((s) => <li key={s.id} className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm"><div><p className="font-semibold">{pName[s.property_id]}</p><p className="text-xs text-muted-foreground">{s.check_in} → {s.check_out} · {formatINR(s.amount)}</p>{s.notes && <p className="mt-1 text-xs">{s.notes}</p>}</div><StatusBadge status={s.status} /></li>)}</ul>}
      </Modal>
    </section>
  );
}
