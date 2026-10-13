import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Building2, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState, Modal, StatusBadge } from "@/components/ui-kit";
import { ErrorNote, PortalShell, SectionTitle } from "@/components/owner/PortalShell";
import { PhotoStrip } from "@/components/owner/PhotoManager";
import { formatINR } from "@/data/resort";
import type { BusinessOwner, Property } from "@/lib/owner";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    const { data: ok } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "superadmin" });
    if (!ok) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Super Admin — The Azure Ridge Sanctuary" },
      { name: "description", content: "Review business owners and property listings." },
      { property: "og:title", content: "Super Admin" },
      { property: "og:description", content: "Review business owners and property listings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Target = { kind: "owner"; row: BusinessOwner } | { kind: "listing"; row: Property };

function AdminPage() {
  const qc = useQueryClient();
  const [active, setActive] = useState("owners");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [target, setTarget] = useState<Target | null>(null);
  const owners = useQuery({ queryKey: ["admin", "owners"], queryFn: async () => { const { data, error } = await supabase.from("business_owners").select("*").order("created_at", { ascending: false }); if (error) throw error; return data; } });
  const listings = useQuery({ queryKey: ["admin", "listings"], queryFn: async () => { const { data, error } = await supabase.from("owner_properties").select("*").order("updated_at", { ascending: false }); if (error) throw error; return data; } });
  const rooms = useQuery({ queryKey: ["admin", "rooms"], queryFn: async () => { const { data, error } = await supabase.from("owner_rooms").select("*"); if (error) throw error; return data; } });
  const ownerName = Object.fromEntries((owners.data ?? []).map((o) => [o.user_id, o.business_name]));
  const match = (s: string, st: string) => (status === "All" || st === status) && s.toLowerCase().includes(q.toLowerCase());
  const O = (owners.data ?? []).filter((o) => match(`${o.business_name} ${o.contact_email}`, o.status));
  const L = (listings.data ?? []).filter((l) => match(`${l.name} ${l.location} ${ownerName[l.owner_id] ?? ""}`, l.status));
  const items = [
    { id: "owners", label: "Business Owners", icon: UserCheck, badge: (owners.data ?? []).filter((o) => o.status === "Pending Approval").length },
    { id: "listings", label: "Listings", icon: Building2, badge: (listings.data ?? []).filter((l) => l.status === "Pending Approval").length },
  ];
  const statuses = active === "owners" ? ["All", "Pending Approval", "Approved", "Rejected", "Suspended"] : ["All", "Draft", "Pending Approval", "Approved", "Rejected", "Suspended"];

  return (
    <PortalShell title="Super Admin" items={items} active={active} onSelect={(id) => { setActive(id); setStatus("All"); }}>
      <div className="px-4 py-8 sm:px-8">
        <SectionTitle title={active === "owners" ? "Business Owners" : "Property Listings"} description="Approve, reject or suspend. Owners are notified of every decision." />
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <input type="search" className="field" placeholder="Search" aria-label="Search" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="field sm:w-56" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">{statuses.map((s) => <option key={s}>{s}</option>)}</select>
        </div>
        <ErrorNote error={owners.error || listings.error} />
        {active === "owners" ? (O.length === 0 ? <EmptyState title="No business owners found" /> : (
          <div className="overflow-x-auto rounded-2xl border bg-card"><table className="w-full min-w-[720px] text-sm">
            <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="p-3">Business</th><th className="p-3">Contact</th><th className="p-3">Applied</th><th className="p-3">Status</th><th className="p-3" /></tr></thead>
            <tbody>{O.map((o) => <tr key={o.user_id} className="border-t"><td className="p-3"><p className="font-semibold">{o.business_name}</p><p className="max-w-64 truncate text-xs text-muted-foreground">{o.address}</p></td><td className="p-3">{o.contact_name}<p className="text-xs text-muted-foreground">{o.contact_email} · {o.contact_phone}</p></td><td className="p-3">{new Date(o.created_at).toLocaleDateString("en-IN")}</td><td className="p-3"><StatusBadge status={o.status} /></td><td className="p-3 text-right"><button className="btn btn-outline !px-3 !py-1.5 text-xs" onClick={() => setTarget({ kind: "owner", row: o })}>Review</button></td></tr>)}</tbody>
          </table></div>
        )) : (L.length === 0 ? <EmptyState title="No listings found" /> : (
          <div className="overflow-x-auto rounded-2xl border bg-card"><table className="w-full min-w-[760px] text-sm">
            <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="p-3">Listing</th><th className="p-3">Owner</th><th className="p-3">Rooms</th><th className="p-3">Status</th><th className="p-3" /></tr></thead>
            <tbody>{L.map((l) => <tr key={l.id} className="border-t"><td className="p-3"><div className="flex items-center gap-3"><PhotoStrip paths={l.photos.slice(0, 1)} /><div><p className="font-semibold">{l.name}</p><p className="text-xs text-muted-foreground">{l.kind} · {l.location}</p></div></div></td><td className="p-3">{ownerName[l.owner_id]}</td><td className="p-3">{(rooms.data ?? []).filter((r) => r.property_id === l.id).length}</td><td className="p-3"><StatusBadge status={l.status} /></td><td className="p-3 text-right"><button className="btn btn-outline !px-3 !py-1.5 text-xs" onClick={() => setTarget({ kind: "listing", row: l })}>Review</button></td></tr>)}</tbody>
          </table></div>
        ))}
      </div>
      {target && <ReviewDialog target={target} rooms={(rooms.data ?? []).filter((r) => target.kind === "listing" && r.property_id === target.row.id)} onClose={() => setTarget(null)} onDone={() => { setTarget(null); qc.invalidateQueries({ queryKey: ["admin"] }); }} />}
    </PortalShell>
  );
}

function ReviewDialog({ target, rooms, onClose, onDone }: { target: Target; rooms: { id: string; name: string; price: number; capacity: number; room_type: string }[]; onClose: () => void; onDone: () => void }) {
  const [note, setNote] = useState(target.row.admin_note);
  const [error, setError] = useState("");
  const decide = async (status: string) => {
    if ((status === "Rejected" || status === "Suspended") && !note.trim()) return setError("Add a short reason for the owner");
    const res = target.kind === "owner"
      ? await supabase.from("business_owners").update({ status, admin_note: note.trim() }).eq("user_id", target.row.user_id)
      : await supabase.from("owner_properties").update({ status, admin_note: note.trim() }).eq("id", target.row.id);
    if (res.error) setError(res.error.message); else onDone();
  };
  const r = target.row;
  return (
    <Modal open onClose={onClose} title={target.kind === "owner" ? (r as BusinessOwner).business_name : (r as Property).name} wide>
      {target.kind === "owner" ? (
        <dl className="grid gap-2 text-sm sm:grid-cols-2"><div><dt className="text-muted-foreground">Contact</dt><dd>{target.row.contact_name}</dd></div><div><dt className="text-muted-foreground">Email / phone</dt><dd>{target.row.contact_email} · {target.row.contact_phone}</dd></div><div className="sm:col-span-2"><dt className="text-muted-foreground">Address</dt><dd>{target.row.address || "—"}</dd></div><div className="sm:col-span-2"><dt className="text-muted-foreground">About</dt><dd>{target.row.about || "—"}</dd></div></dl>
      ) : (
        <div className="space-y-3 text-sm">
          <PhotoStrip paths={target.row.photos} size="h-24 w-32" />
          <p>{target.row.kind} · {target.row.location} · Check-in {target.row.check_in}, out {target.row.check_out}</p>
          <p className="text-muted-foreground">{target.row.description || "No description."}</p>
          {target.row.amenities.length > 0 && <p><strong>Amenities:</strong> {target.row.amenities.join(", ")}</p>}
          <ul className="space-y-1">{rooms.map((x) => <li key={x.id}>• {x.name} ({x.room_type}) — {formatINR(x.price)}/night, up to {x.capacity}</li>)}{!rooms.length && <li className="text-muted-foreground">No rooms added.</li>}</ul>
        </div>
      )}
      <p className="mt-4 text-sm">Current status: <StatusBadge status={r.status} /></p>
      <label className="mt-4 block text-sm font-medium">Note to owner<textarea className="field mt-1" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Required when rejecting or suspending" /></label>
      {error && <div className="mt-3"><ErrorNote error={error} /></div>}
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button className="btn btn-outline" onClick={() => decide("Rejected")}>Reject</button>
        <button className="btn btn-outline" onClick={() => decide("Suspended")}>Suspend</button>
        <button className="btn btn-primary" onClick={() => decide("Approved")}>Approve</button>
      </div>
    </Modal>
  );
}
