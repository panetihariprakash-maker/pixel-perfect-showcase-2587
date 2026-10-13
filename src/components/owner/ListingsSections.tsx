import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Send, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/data/resort";
import { EmptyState, Modal, StatusBadge } from "@/components/ui-kit";
import { effectivePrice, splitList, type BusinessOwner, type OwnerRoom, type Property } from "@/lib/owner";

export type Perms = Pick<BusinessOwner, "can_add" | "can_edit" | "can_publish" | "can_remove">;
import { PhotoManager, PhotoStrip } from "./PhotoManager";
import { ErrorNote, SectionTitle } from "./PortalShell";

const errMsg = (e: unknown) => (e as { message?: string })?.message ?? "Something went wrong";

function SearchBar({ value, onChange, placeholder, children }: { value: string; onChange: (v: string) => void; placeholder: string; children?: React.ReactNode }) {
  return <div className="mb-4 flex flex-col gap-2 sm:flex-row"><input type="search" className="field" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} aria-label={placeholder} />{children}</div>;
}

export function PropertiesSection({ userId, properties, rooms, perms }: { userId: string; properties: Property[]; rooms: OwnerRoom[]; perms: Perms }) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [editing, setEditing] = useState<Partial<Property> | null>(null);
  const [error, setError] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: ["owner", userId] });
  const list = properties.filter((p) => (status === "All" || p.status === status) && `${p.name} ${p.location} ${p.kind}`.toLowerCase().includes(q.toLowerCase()));

  const submit = async (p: Property) => {
    setError("");
    const { error } = await supabase.from("owner_properties").update({ status: "Pending Approval" }).eq("id", p.id);
    if (error) setError(errMsg(error)); else refresh();
  };
  const remove = async (p: Property) => {
    if (!confirm(`Delete "${p.name}" and all its rooms?`)) return;
    const { error } = await supabase.from("owner_properties").delete().eq("id", p.id);
    if (error) setError(errMsg(error)); else refresh();
  };

  return (
    <section>
      <SectionTitle title="Properties" description="Resorts, hotels and villas. Submit a listing for Super Admin approval when it's ready." action={perms.can_add && <button className="btn btn-primary" onClick={() => setEditing({ kind: "Resort", amenities: [], photos: [], check_in: "14:00", check_out: "11:00" })}><Plus className="h-4 w-4" /> Add property</button>} />
      <SearchBar value={q} onChange={setQ} placeholder="Search properties">
        <select className="field sm:w-56" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">{["All", "Draft", "Pending Approval", "Approved", "Rejected", "Suspended"].map((s) => <option key={s}>{s}</option>)}</select>
      </SearchBar>
      {error && <div className="mb-3"><ErrorNote error={error} /></div>}
      {list.length === 0 ? <EmptyState title={properties.length ? "No properties match" : "No properties yet"}><p className="text-sm text-muted-foreground">Add your first resort, hotel or villa to get started.</p></EmptyState> : (
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="p-3">Property</th><th className="p-3">Type</th><th className="p-3">Location</th><th className="p-3">Rooms</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead>
            <tbody>{list.map((p) => (
              <tr key={p.id} className="border-t align-top">
                <td className="p-3"><div className="flex items-center gap-3"><PhotoStrip paths={p.photos.slice(0, 1)} /><div><p className="font-semibold">{p.name}</p><p className="text-xs text-muted-foreground">Check-in {p.check_in} · out {p.check_out}</p></div></div></td>
                <td className="p-3">{p.kind}</td><td className="p-3">{p.location || "—"}</td><td className="p-3">{rooms.filter((r) => r.property_id === p.id).length}</td>
                <td className="p-3"><StatusBadge status={p.status} />{p.admin_note && <p className="mt-1 max-w-48 text-xs text-muted-foreground">Note: {p.admin_note}</p>}</td>
                <td className="p-3"><div className="flex justify-end gap-1">
                  {perms.can_publish && (p.status === "Draft" || p.status === "Rejected") && <button className="btn btn-outline !px-3 !py-1.5 text-xs" onClick={() => submit(p)}><Send className="h-3.5 w-3.5" /> Submit</button>}
                  {perms.can_edit && p.status !== "Suspended" && <button className="rounded-full p-2 hover:bg-muted" aria-label={`Edit ${p.name}`} onClick={() => setEditing(p)}><Pencil className="h-4 w-4" /></button>}
                  {perms.can_remove && <button className="rounded-full p-2 text-destructive hover:bg-muted" aria-label={`Delete ${p.name}`} onClick={() => remove(p)}><Trash2 className="h-4 w-4" /></button>}
                </div></td>
              </tr>))}</tbody>
          </table>
        </div>
      )}
      {editing && <PropertyForm userId={userId} canPublish={perms.can_publish} initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} />}
    </section>
  );
}

function PropertyForm({ userId, canPublish, initial, onClose, onSaved }: { userId: string; canPublish: boolean; initial: Partial<Property>; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ name: initial.name ?? "", kind: initial.kind ?? "Resort", description: initial.description ?? "", location: initial.location ?? "", amenities: (initial.amenities ?? []).join(", "), check_in: initial.check_in ?? "14:00", check_out: initial.check_out ?? "11:00", photos: initial.photos ?? [] });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const save = async (submit: boolean) => {
    if (!f.name.trim()) { setError("Property name is required"); return; }
    if (!f.location.trim()) { setError("Location is required"); return; }
    setSaving(true); setError("");
    const row = { name: f.name.trim(), kind: f.kind, description: f.description, location: f.location.trim(), amenities: splitList(f.amenities), check_in: f.check_in, check_out: f.check_out, photos: f.photos, status: submit ? "Pending Approval" : "Draft" };
    const res = initial.id ? await supabase.from("owner_properties").update(row).eq("id", initial.id) : await supabase.from("owner_properties").insert({ ...row, owner_id: userId });
    setSaving(false);
    if (res.error) setError(errMsg(res.error)); else onSaved();
  };
  return (
    <Modal open onClose={onClose} title={initial.id ? "Edit property" : "Add property"} wide>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">Name<input className="field mt-1" value={f.name} onChange={set("name")} /></label>
        <label className="text-sm font-medium">Type<select className="field mt-1" value={f.kind} onChange={set("kind")}>{["Resort", "Hotel", "Villa"].map((k) => <option key={k}>{k}</option>)}</select></label>
        <label className="text-sm font-medium sm:col-span-2">Location<input className="field mt-1" value={f.location} onChange={set("location")} placeholder="Town, district, state" /></label>
        <label className="text-sm font-medium sm:col-span-2">Description<textarea className="field mt-1 min-h-24" value={f.description} onChange={set("description")} /></label>
        <label className="text-sm font-medium sm:col-span-2">Amenities & facilities (comma separated)<input className="field mt-1" value={f.amenities} onChange={set("amenities")} placeholder="Pool, Spa, Free Wi-Fi" /></label>
        <label className="text-sm font-medium">Check-in time<input type="time" className="field mt-1" value={f.check_in} onChange={set("check_in")} /></label>
        <label className="text-sm font-medium">Check-out time<input type="time" className="field mt-1" value={f.check_out} onChange={set("check_out")} /></label>
        <div className="sm:col-span-2"><p className="mb-2 text-sm font-medium">Photos</p><PhotoManager userId={userId} paths={f.photos} onChange={(photos) => setF({ ...f, photos })} /></div>
      </div>
      {initial.status === "Approved" && <p className="mt-4 text-xs text-muted-foreground">Saving changes to an approved listing moves it back to Draft until it's approved again.</p>}
      {error && <div className="mt-4"><ErrorNote error={error} /></div>}
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button className="btn btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn btn-outline" disabled={saving} onClick={() => save(false)}>Save as draft</button>
        {canPublish && <button className="btn btn-primary" disabled={saving} onClick={() => save(true)}>Save & submit for approval</button>}
      </div>
    </Modal>
  );
}

export function RoomsManager({ userId, properties, rooms, perms }: { userId: string; properties: Property[]; rooms: OwnerRoom[]; perms: Perms }) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [prop, setProp] = useState("All");
  const [editing, setEditing] = useState<Partial<OwnerRoom> | null>(null);
  const [error, setError] = useState("");
  const names = useMemo(() => Object.fromEntries(properties.map((p) => [p.id, p.name])), [properties]);
  const list = rooms.filter((r) => (prop === "All" || r.property_id === prop) && `${r.name} ${r.room_type}`.toLowerCase().includes(q.toLowerCase()));
  const refresh = () => qc.invalidateQueries({ queryKey: ["owner", userId] });
  const toggle = async (r: OwnerRoom) => { const { error } = await supabase.from("owner_rooms").update({ available: !r.available }).eq("id", r.id); if (error) setError(errMsg(error)); else refresh(); };
  const remove = async (r: OwnerRoom) => { if (!confirm(`Delete "${r.name}"?`)) return; const { error } = await supabase.from("owner_rooms").delete().eq("id", r.id); if (error) setError(errMsg(error)); else refresh(); };

  return (
    <section>
      <SectionTitle title="Rooms & Pricing" description="Rooms, suites, cottages and villas with nightly, seasonal and discounted prices." action={perms.can_add && <button className="btn btn-primary" disabled={!properties.length} onClick={() => setEditing({ property_id: properties[0]?.id, room_type: "Room", capacity: 2, price: 0, discount_pct: 0, units: 1, available: true, facilities: [], photos: [] })}><Plus className="h-4 w-4" /> Add room</button>} />
      {!properties.length && <p className="mb-4 text-sm text-muted-foreground">Add a property first, then add its rooms.</p>}
      <SearchBar value={q} onChange={setQ} placeholder="Search rooms">
        <select className="field sm:w-56" value={prop} onChange={(e) => setProp(e.target.value)} aria-label="Filter by property"><option value="All">All properties</option>{properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      </SearchBar>
      {error && <div className="mb-3"><ErrorNote error={error} /></div>}
      {list.length === 0 ? <EmptyState title="No rooms yet" /> : (
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="p-3">Room</th><th className="p-3">Property</th><th className="p-3">Guests</th><th className="p-3">Nightly</th><th className="p-3">Today</th><th className="p-3">Units</th><th className="p-3">Availability</th><th className="p-3 text-right">Actions</th></tr></thead>
            <tbody>{list.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3"><div className="flex items-center gap-3"><PhotoStrip paths={r.photos.slice(0, 1)} /><div><p className="font-semibold">{r.name}</p><p className="text-xs text-muted-foreground">{r.room_type}</p></div></div></td>
                <td className="p-3">{names[r.property_id]}</td><td className="p-3">{r.capacity}</td><td className="p-3">{formatINR(r.price)}</td>
                <td className="p-3 font-semibold text-primary">{formatINR(effectivePrice(r))}{r.discount_pct > 0 && <span className="ml-1 text-xs text-success">−{r.discount_pct}%</span>}</td>
                <td className="p-3">{r.units}</td>
                <td className="p-3"><button onClick={() => perms.can_edit && toggle(r)} disabled={!perms.can_edit} className="rounded-full border px-3 py-1 text-xs font-semibold" aria-label={`Toggle availability for ${r.name}`}>{r.available ? "Open" : "Closed"}</button></td>
                <td className="p-3"><div className="flex justify-end gap-1">{perms.can_edit && <button className="rounded-full p-2 hover:bg-muted" aria-label={`Edit ${r.name}`} onClick={() => setEditing(r)}><Pencil className="h-4 w-4" /></button>}{perms.can_remove && <button className="rounded-full p-2 text-destructive hover:bg-muted" aria-label={`Delete ${r.name}`} onClick={() => remove(r)}><Trash2 className="h-4 w-4" /></button>}</div></td>
              </tr>))}</tbody>
          </table>
        </div>
      )}
      {editing && <RoomForm userId={userId} properties={properties} initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} />}
    </section>
  );
}

function RoomForm({ userId, properties, initial, onClose, onSaved }: { userId: string; properties: Property[]; initial: Partial<OwnerRoom>; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    property_id: initial.property_id ?? "", name: initial.name ?? "", room_type: initial.room_type ?? "Room", description: initial.description ?? "",
    capacity: String(initial.capacity ?? 2), facilities: (initial.facilities ?? []).join(", "), price: String(initial.price ?? ""), seasonal_price: initial.seasonal_price != null ? String(initial.seasonal_price) : "",
    season_start: initial.season_start ?? "", season_end: initial.season_end ?? "", discount_pct: String(initial.discount_pct ?? 0), units: String(initial.units ?? 1), available: initial.available ?? true, photos: initial.photos ?? [],
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const save = async () => {
    const price = Number(f.price), capacity = Number(f.capacity), discount = Number(f.discount_pct), units = Number(f.units);
    if (!f.name.trim()) return setError("Room name is required");
    if (!f.property_id) return setError("Choose a property");
    if (!Number.isInteger(price) || price <= 0) return setError("Enter a nightly price in whole rupees");
    if (!Number.isInteger(capacity) || capacity < 1) return setError("Guest capacity must be at least 1");
    if (!Number.isInteger(discount) || discount < 0 || discount > 90) return setError("Discount must be between 0 and 90%");
    if (f.seasonal_price && (!f.season_start || !f.season_end || f.season_end < f.season_start)) return setError("Seasonal pricing needs a valid start and end date");
    setSaving(true); setError("");
    const row = { property_id: f.property_id, name: f.name.trim(), room_type: f.room_type, description: f.description, capacity, facilities: splitList(f.facilities), price, seasonal_price: f.seasonal_price ? Number(f.seasonal_price) : null, season_start: f.seasonal_price ? f.season_start : null, season_end: f.seasonal_price ? f.season_end : null, discount_pct: discount, units: Math.max(0, units || 0), available: f.available, photos: f.photos };
    const res = initial.id ? await supabase.from("owner_rooms").update(row).eq("id", initial.id) : await supabase.from("owner_rooms").insert({ ...row, owner_id: userId });
    setSaving(false);
    if (res.error) setError(errMsg(res.error)); else onSaved();
  };
  return (
    <Modal open onClose={onClose} title={initial.id ? "Edit room" : "Add room"} wide>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">Property<select className="field mt-1" value={f.property_id} onChange={set("property_id")}>{properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        <label className="text-sm font-medium">Room type<select className="field mt-1" value={f.room_type} onChange={set("room_type")}>{["Room", "Suite", "Cottage", "Villa"].map((k) => <option key={k}>{k}</option>)}</select></label>
        <label className="text-sm font-medium">Name<input className="field mt-1" value={f.name} onChange={set("name")} /></label>
        <label className="text-sm font-medium">Max guests<input type="number" min={1} className="field mt-1" value={f.capacity} onChange={set("capacity")} /></label>
        <label className="text-sm font-medium sm:col-span-2">Description<textarea className="field mt-1 min-h-20" value={f.description} onChange={set("description")} /></label>
        <label className="text-sm font-medium sm:col-span-2">Facilities (comma separated)<input className="field mt-1" value={f.facilities} onChange={set("facilities")} placeholder="King bed, Balcony, Rain shower" /></label>
        <label className="text-sm font-medium">Nightly price (₹)<input type="number" min={0} className="field mt-1" value={f.price} onChange={set("price")} /></label>
        <label className="text-sm font-medium">Discount (%)<input type="number" min={0} max={90} className="field mt-1" value={f.discount_pct} onChange={set("discount_pct")} /></label>
        <label className="text-sm font-medium">Seasonal price (₹, optional)<input type="number" min={0} className="field mt-1" value={f.seasonal_price} onChange={set("seasonal_price")} /></label>
        <div className="grid grid-cols-2 gap-2"><label className="text-sm font-medium">Season from<input type="date" className="field mt-1" value={f.season_start} onChange={set("season_start")} /></label><label className="text-sm font-medium">to<input type="date" className="field mt-1" value={f.season_end} onChange={set("season_end")} /></label></div>
        <label className="text-sm font-medium">Units available<input type="number" min={0} className="field mt-1" value={f.units} onChange={set("units")} /></label>
        <label className="flex items-center gap-2 self-end text-sm font-medium"><input type="checkbox" checked={f.available} onChange={(e) => setF({ ...f, available: e.target.checked })} /> Open for bookings</label>
        <div className="sm:col-span-2"><p className="mb-2 text-sm font-medium">Photos</p><PhotoManager userId={userId} paths={f.photos} onChange={(photos) => setF({ ...f, photos })} /></div>
      </div>
      {error && <div className="mt-4"><ErrorNote error={error} /></div>}
      <div className="mt-6 flex justify-end gap-2"><button className="btn btn-outline" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save room"}</button></div>
    </Modal>
  );
}
