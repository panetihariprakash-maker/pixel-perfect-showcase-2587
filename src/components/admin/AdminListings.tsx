import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/data/resort";
import { EmptyState, Modal, StatusBadge } from "@/components/ui-kit";
import { ErrorNote, SectionTitle } from "@/components/owner/PortalShell";
import { PhotoStrip } from "@/components/owner/PhotoManager";
import { effectivePrice, RESERVATION_STATUSES, type BusinessOwner, type OwnerRoom, type Property, type Reservation } from "@/lib/owner";
import { errText } from "./AdminData";

function Filters({ q, setQ, status, setStatus, options }: { q: string; setQ: (v: string) => void; status: string; setStatus: (v: string) => void; options: readonly string[] }) {
  return <div className="mb-4 flex flex-col gap-2 sm:flex-row"><input type="search" className="field" placeholder="Search" aria-label="Search" value={q} onChange={(e) => setQ(e.target.value)} /><select className="field sm:w-56" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status"><option>All</option>{options.map((s) => <option key={s}>{s}</option>)}</select></div>;
}

export function AdminListings({ listings, rooms, owners }: { listings: Property[]; rooms: OwnerRoom[]; owners: BusinessOwner[] }) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("Pending Approval");
  const [sel, setSel] = useState<Property | null>(null);
  const oName = Object.fromEntries(owners.map((o) => [o.user_id, o.business_name]));
  const list = listings.filter((l) => (status === "All" || l.status === status) && `${l.name} ${l.location} ${oName[l.owner_id] ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <section>
      <SectionTitle title="Property Listings" description="Only approved listings from approved owners appear on the public booking site." />
      <Filters q={q} setQ={setQ} status={status} setStatus={setStatus} options={["Draft", "Pending Approval", "Approved", "Rejected", "Suspended"]} />
      {list.length === 0 ? <EmptyState title="No listings found" /> : (
        <div className="overflow-x-auto rounded-2xl border bg-card"><table className="w-full min-w-[760px] text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="p-3">Listing</th><th className="p-3">Owner</th><th className="p-3">Rooms</th><th className="p-3">Updated</th><th className="p-3">Status</th><th className="p-3" /></tr></thead>
          <tbody>{list.map((l) => <tr key={l.id} className="border-t"><td className="p-3"><div className="flex items-center gap-3"><PhotoStrip paths={l.photos.slice(0, 1)} /><div><p className="font-semibold">{l.name}</p><p className="text-xs text-muted-foreground">{l.kind} · {l.location}</p></div></div></td><td className="p-3">{oName[l.owner_id]}</td><td className="p-3">{rooms.filter((r) => r.property_id === l.id).length}</td><td className="p-3">{new Date(l.updated_at).toLocaleDateString("en-IN")}</td><td className="p-3"><StatusBadge status={l.status} /></td><td className="p-3 text-right"><button className="btn btn-outline !px-3 !py-1.5 text-xs" onClick={() => setSel(l)}>Review</button></td></tr>)}</tbody>
        </table></div>
      )}
      {sel && <ListingReview listing={sel} owner={owners.find((o) => o.user_id === sel.owner_id)} owners={owners} rooms={rooms.filter((r) => r.property_id === sel.id)} onClose={() => setSel(null)} onDone={() => { setSel(null); qc.invalidateQueries({ queryKey: ["admin"] }); }} />}
    </section>
  );
}

function ListingReview({ listing, owner, owners, rooms, onClose, onDone }: { listing: Property; owner?: BusinessOwner; owners: BusinessOwner[]; rooms: OwnerRoom[]; onClose: () => void; onDone: () => void }) {
  const [note, setNote] = useState(listing.admin_note);
  const [assignee, setAssignee] = useState(listing.owner_id);
  const [error, setError] = useState("");
  const update = async (patch: Partial<Property>) => {
    if ((patch.status === "Rejected" || patch.status === "Suspended") && !note.trim()) return setError("Add a reason for the owner");
    const { error } = await supabase.from("owner_properties").update({ ...patch, admin_note: note.trim() }).eq("id", listing.id);
    if (error) return setError(errText(error));
    if (patch.owner_id) { const r = await supabase.from("owner_rooms").update({ owner_id: patch.owner_id }).eq("property_id", listing.id); if (r.error) return setError(errText(r.error)); }
    onDone();
  };
  const remove = async () => { if (!confirm(`Permanently delete "${listing.name}"?`)) return; const { error } = await supabase.from("owner_properties").delete().eq("id", listing.id); if (error) setError(errText(error)); else onDone(); };
  return (
    <Modal open onClose={onClose} title={listing.name} wide>
      <div className="space-y-4 text-sm">
        <PhotoStrip paths={listing.photos} size="h-24 w-32" />
        <dl className="grid gap-2 sm:grid-cols-2">
          <div><dt className="text-muted-foreground">Type</dt><dd>{listing.kind}</dd></div>
          <div><dt className="text-muted-foreground">Owner</dt><dd>{owner?.business_name} {owner && <StatusBadge status={owner.status} />}</dd></div>
          <div className="sm:col-span-2"><dt className="text-muted-foreground">Location</dt><dd>{listing.location || "—"}</dd></div>
          <div><dt className="text-muted-foreground">Check-in / out</dt><dd>{listing.check_in} / {listing.check_out}</dd></div>
          <div><dt className="text-muted-foreground">Amenities</dt><dd>{listing.amenities.join(", ") || "—"}</dd></div>
          <div className="sm:col-span-2"><dt className="text-muted-foreground">Description</dt><dd>{listing.description || "—"}</dd></div>
        </dl>
        <div><p className="mb-2 font-semibold">Rooms ({rooms.length})</p>
          <ul className="space-y-2">{rooms.map((r) => <li key={r.id} className="flex items-center gap-3 rounded-xl border p-2"><PhotoStrip paths={r.photos} size="h-12 w-14" /><div className="flex-1"><p className="font-semibold">{r.name} <span className="font-normal text-muted-foreground">· {r.room_type} · up to {r.capacity}</span></p><p className="text-xs text-muted-foreground">{formatINR(r.price)}/night{r.seasonal_price != null && ` · season ${formatINR(r.seasonal_price)} (${r.season_start} → ${r.season_end})`}{r.discount_pct > 0 && ` · −${r.discount_pct}%`} · today {formatINR(effectivePrice(r))} · {r.facilities.join(", ")}</p></div></li>)}{!rooms.length && <li className="text-muted-foreground">No rooms added.</li>}</ul>
        </div>
        <p>Current status: <StatusBadge status={listing.status} /></p>
        <label className="block font-medium">Reason / note to owner<textarea className="field mt-1" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Required when rejecting or suspending" /></label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end"><label className="flex-1 font-medium">Assigned owner<select className="field mt-1" value={assignee} onChange={(e) => setAssignee(e.target.value)}>{owners.map((o) => <option key={o.user_id} value={o.user_id}>{o.business_name}</option>)}</select></label>{assignee !== listing.owner_id && <button className="btn btn-outline" onClick={() => update({ owner_id: assignee })}>Reassign</button>}</div>
      </div>
      {error && <div className="mt-3"><ErrorNote error={error} /></div>}
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button className="btn btn-outline text-destructive" onClick={remove}><Trash2 className="h-4 w-4" /> Delete</button>
        {listing.status !== "Rejected" && <button className="btn btn-outline" onClick={() => update({ status: "Rejected" })}>Reject</button>}
        {listing.status === "Approved" && <button className="btn btn-outline" onClick={() => update({ status: "Suspended" })}>Suspend</button>}
        {listing.status !== "Approved" && <button className="btn btn-primary" onClick={() => update({ status: "Approved" })}>{listing.status === "Suspended" ? "Reactivate" : "Approve & publish"}</button>}
      </div>
    </Modal>
  );
}

export function AdminRooms({ rooms, listings }: { rooms: OwnerRoom[]; listings: Property[] }) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const pName = Object.fromEntries(listings.map((l) => [l.id, l.name]));
  const list = rooms.filter((r) => `${r.name} ${r.room_type} ${pName[r.property_id] ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  const act = async (p: PromiseLike<{ error: unknown }>) => { const { error } = await p; if (error) setError(errText(error)); else qc.invalidateQueries({ queryKey: ["admin"] }); };
  return (
    <section>
      <SectionTitle title="All Rooms" description="Every room across all properties." />
      <input type="search" className="field mb-4" placeholder="Search rooms" aria-label="Search rooms" value={q} onChange={(e) => setQ(e.target.value)} />
      <ErrorNote error={error} />
      {list.length === 0 ? <EmptyState title="No rooms found" /> : (
        <div className="overflow-x-auto rounded-2xl border bg-card"><table className="w-full min-w-[720px] text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="p-3">Room</th><th className="p-3">Property</th><th className="p-3">Guests</th><th className="p-3">Price</th><th className="p-3">Units</th><th className="p-3">Bookable</th><th className="p-3" /></tr></thead>
          <tbody>{list.map((r) => <tr key={r.id} className="border-t"><td className="p-3 font-semibold">{r.name}<p className="text-xs font-normal text-muted-foreground">{r.room_type}</p></td><td className="p-3">{pName[r.property_id]}</td><td className="p-3">{r.capacity}</td><td className="p-3">{formatINR(effectivePrice(r))}</td><td className="p-3">{r.units}</td>
            <td className="p-3"><button className="rounded-full border px-3 py-1 text-xs font-semibold" onClick={() => act(supabase.from("owner_rooms").update({ available: !r.available }).eq("id", r.id))}>{r.available ? "Open" : "Closed"}</button></td>
            <td className="p-3 text-right"><button aria-label={`Delete ${r.name}`} className="rounded-full p-2 text-destructive hover:bg-muted" onClick={() => confirm(`Delete "${r.name}"?`) && act(supabase.from("owner_rooms").delete().eq("id", r.id))}><Trash2 className="h-4 w-4" /></button></td></tr>)}</tbody>
        </table></div>
      )}
    </section>
  );
}

export function AdminBookings({ bookings, listings, owners }: { bookings: Reservation[]; listings: Property[]; owners: BusinessOwner[] }) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [error, setError] = useState("");
  const pName = Object.fromEntries(listings.map((l) => [l.id, l.name]));
  const oName = Object.fromEntries(owners.map((o) => [o.user_id, o.business_name]));
  const list = bookings.filter((b) => (status === "All" || b.status === status) && `${b.guest_name} ${b.guest_email} ${pName[b.property_id] ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  const change = async (b: Reservation, s: string) => { const { error } = await supabase.from("owner_reservations").update({ status: s }).eq("id", b.id); if (error) setError(errText(error)); else qc.invalidateQueries({ queryKey: ["admin"] }); };
  return (
    <section>
      <SectionTitle title="All Bookings" description="Reservations across every business." />
      <Filters q={q} setQ={setQ} status={status} setStatus={setStatus} options={RESERVATION_STATUSES} />
      <ErrorNote error={error} />
      {list.length === 0 ? <EmptyState title="No bookings found" /> : (
        <div className="overflow-x-auto rounded-2xl border bg-card"><table className="w-full min-w-[820px] text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="p-3">Guest</th><th className="p-3">Property</th><th className="p-3">Business</th><th className="p-3">Dates</th><th className="p-3">Amount</th><th className="p-3">Status</th></tr></thead>
          <tbody>{list.map((b) => <tr key={b.id} className="border-t"><td className="p-3 font-semibold">{b.guest_name}<p className="text-xs font-normal text-muted-foreground">{b.guest_email || b.guest_phone}</p></td><td className="p-3">{pName[b.property_id]}</td><td className="p-3">{oName[b.owner_id]}</td><td className="p-3 whitespace-nowrap">{b.check_in} → {b.check_out}</td><td className="p-3">{formatINR(b.amount)}</td>
            <td className="p-3"><select className="field !py-1 text-xs" value={b.status} aria-label={`Status for ${b.guest_name}`} onChange={(e) => change(b, e.target.value)}>{RESERVATION_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></td></tr>)}</tbody>
        </table></div>
      )}
    </section>
  );
}
