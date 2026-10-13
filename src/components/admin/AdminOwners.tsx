import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState, Modal, StatusBadge } from "@/components/ui-kit";
import { ErrorNote, SectionTitle } from "@/components/owner/PortalShell";
import { inviteOwner } from "@/lib/admin.functions";
import { EMAIL_RE, PHONE_RE } from "@/lib/store";
import type { BusinessOwner, Property } from "@/lib/owner";
import { errText } from "./AdminData";

const PERMS = [["can_add", "Add listings"], ["can_edit", "Edit listings"], ["can_publish", "Submit for publishing"], ["can_remove", "Remove listings"]] as const;

export function AdminOwners({ owners, listings }: { owners: BusinessOwner[]; listings: Property[] }) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [sel, setSel] = useState<BusinessOwner | null>(null);
  const [inviting, setInviting] = useState(false);
  const list = owners.filter((o) => (status === "All" || o.status === status) && `${o.business_name} ${o.contact_name} ${o.contact_email}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <section>
      <SectionTitle title="Business Owners" description="Authorize owners, set what they can do, and suspend or reactivate accounts." action={<button className="btn btn-primary" onClick={() => setInviting(true)}><UserPlus className="h-4 w-4" /> Invite owner</button>} />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input type="search" className="field" placeholder="Search owners" aria-label="Search owners" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="field sm:w-56" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">{["All", "Pending Approval", "Approved", "Rejected", "Suspended"].map((s) => <option key={s}>{s}</option>)}</select>
      </div>
      {list.length === 0 ? <EmptyState title="No business owners found" /> : (
        <div className="overflow-x-auto rounded-2xl border bg-card"><table className="w-full min-w-[820px] text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="p-3">Business</th><th className="p-3">Contact</th><th className="p-3">Properties</th><th className="p-3">Permissions</th><th className="p-3">Status</th><th className="p-3" /></tr></thead>
          <tbody>{list.map((o) => (
            <tr key={o.user_id} className="border-t">
              <td className="p-3"><p className="font-semibold">{o.business_name}</p><p className="text-xs text-muted-foreground">Since {new Date(o.created_at).toLocaleDateString("en-IN")}</p></td>
              <td className="p-3">{o.contact_name}<p className="text-xs text-muted-foreground">{o.contact_email} · {o.contact_phone}</p></td>
              <td className="p-3">{listings.filter((l) => l.owner_id === o.user_id).length}</td>
              <td className="p-3 text-xs">{PERMS.filter(([k]) => o[k]).map(([, l]) => l).join(", ") || "None"}</td>
              <td className="p-3"><StatusBadge status={o.status} /></td>
              <td className="p-3 text-right"><button className="btn btn-outline !px-3 !py-1.5 text-xs" onClick={() => setSel(o)}>Manage</button></td>
            </tr>))}</tbody>
        </table></div>
      )}
      {sel && <OwnerDialog owner={sel} listings={listings.filter((l) => l.owner_id === sel.user_id)} onClose={() => setSel(null)} onDone={() => { setSel(null); qc.invalidateQueries({ queryKey: ["admin"] }); }} />}
      {inviting && <InviteDialog onClose={() => setInviting(false)} onDone={() => { setInviting(false); qc.invalidateQueries({ queryKey: ["admin"] }); }} />}
    </section>
  );
}

function OwnerDialog({ owner, listings, onClose, onDone }: { owner: BusinessOwner; listings: Property[]; onClose: () => void; onDone: () => void }) {
  const [note, setNote] = useState(owner.admin_note);
  const [perms, setPerms] = useState({ can_add: owner.can_add, can_edit: owner.can_edit, can_publish: owner.can_publish, can_remove: owner.can_remove });
  const [error, setError] = useState("");
  const update = async (status?: string) => {
    if ((status === "Rejected" || status === "Suspended") && !note.trim()) return setError("Add a reason for the owner");
    const { error } = await supabase.from("business_owners").update({ ...perms, admin_note: note.trim(), ...(status ? { status } : {}) }).eq("user_id", owner.user_id);
    if (error) setError(errText(error)); else onDone();
  };
  return (
    <Modal open onClose={onClose} title={owner.business_name} wide>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div><dt className="text-muted-foreground">Contact</dt><dd>{owner.contact_name}</dd></div>
        <div><dt className="text-muted-foreground">Email / phone</dt><dd>{owner.contact_email} · {owner.contact_phone}</dd></div>
        <div className="sm:col-span-2"><dt className="text-muted-foreground">Address</dt><dd>{owner.address || "—"}</dd></div>
        <div className="sm:col-span-2"><dt className="text-muted-foreground">About</dt><dd>{owner.about || "—"}</dd></div>
        <div className="sm:col-span-2"><dt className="text-muted-foreground">Properties</dt><dd>{listings.length ? listings.map((l) => `${l.name} (${l.status})`).join(", ") : "None yet"}</dd></div>
      </dl>
      <p className="mt-4 text-sm">Current status: <StatusBadge status={owner.status} /></p>
      <fieldset className="mt-5"><legend className="mb-2 text-sm font-semibold">Listing permissions</legend>
        <div className="grid gap-2 sm:grid-cols-2">{PERMS.map(([k, l]) => <label key={k} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={perms[k]} onChange={(e) => setPerms({ ...perms, [k]: e.target.checked })} /> {l}</label>)}</div>
      </fieldset>
      <label className="mt-5 block text-sm font-medium">Note / reason<textarea className="field mt-1" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Required when rejecting or suspending" /></label>
      {error && <div className="mt-3"><ErrorNote error={error} /></div>}
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button className="btn btn-outline" onClick={() => update()}>Save permissions</button>
        {owner.status !== "Rejected" && owner.status !== "Approved" && <button className="btn btn-outline" onClick={() => update("Rejected")}>Reject</button>}
        {owner.status === "Approved" && <button className="btn btn-outline" onClick={() => update("Suspended")}>Suspend</button>}
        {owner.status !== "Approved" && <button className="btn btn-primary" onClick={() => update("Approved")}>{owner.status === "Suspended" ? "Reactivate" : "Approve"}</button>}
      </div>
    </Modal>
  );
}

function InviteDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const invite = useServerFn(inviteOwner);
  const [f, setF] = useState({ email: "", business_name: "", contact_name: "", contact_phone: "", can_add: true, can_edit: true, can_publish: true, can_remove: true });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");
  const send = async () => {
    if (!EMAIL_RE.test(f.email)) return setError("Enter a valid email");
    if (!f.business_name.trim() || !f.contact_name.trim()) return setError("Business and contact name are required");
    if (f.contact_phone && !PHONE_RE.test(f.contact_phone)) return setError("Enter a valid phone number");
    setBusy(true); setError("");
    try { const r = await invite({ data: { ...f, origin: window.location.origin } }); setDone(r.invited ? `Invitation sent to ${f.email}.` : `${f.email} already had an account and is now an approved owner.`); }
    catch (e) { setError(errText(e)); } finally { setBusy(false); }
  };
  const set = (k: "email" | "business_name" | "contact_name" | "contact_phone") => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal open onClose={done ? onDone : onClose} title="Invite a business owner">
      {done ? <><p className="text-sm">{done}</p><button className="btn btn-primary mt-6 w-full" onClick={onDone}>Done</button></> : <>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium sm:col-span-2">Owner email<input type="email" className="field mt-1" value={f.email} onChange={set("email")} /></label>
          <label className="text-sm font-medium">Business name<input className="field mt-1" value={f.business_name} onChange={set("business_name")} /></label>
          <label className="text-sm font-medium">Contact person<input className="field mt-1" value={f.contact_name} onChange={set("contact_name")} /></label>
          <label className="text-sm font-medium sm:col-span-2">Phone (optional)<input className="field mt-1" value={f.contact_phone} onChange={set("contact_phone")} /></label>
        </div>
        <fieldset className="mt-4"><legend className="mb-2 text-sm font-semibold">Permissions</legend><div className="grid gap-2 sm:grid-cols-2">{PERMS.map(([k, l]) => <label key={k} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.checked })} /> {l}</label>)}</div></fieldset>
        <p className="mt-4 text-xs text-muted-foreground">New people get an email invitation to set their password. Existing accounts are approved straight away.</p>
        {error && <div className="mt-3"><ErrorNote error={error} /></div>}
        <div className="mt-6 flex justify-end gap-2"><button className="btn btn-outline" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={busy} onClick={send}>{busy ? "Sending…" : "Send invitation"}</button></div>
      </>}
    </Modal>
  );
}
