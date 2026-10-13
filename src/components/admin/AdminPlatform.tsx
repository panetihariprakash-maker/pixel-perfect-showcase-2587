import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState, Modal, StatusBadge } from "@/components/ui-kit";
import { ErrorNote, SectionTitle } from "@/components/owner/PortalShell";
import { listPlatformUsers, setUserRole } from "@/lib/admin.functions";
import { EMAIL_RE } from "@/lib/store";
import type { Database } from "@/integrations/supabase/types";
import { errText } from "./AdminData";

type Audit = Database["public"]["Tables"]["admin_audit_log"]["Row"];
type Settings = Database["public"]["Tables"]["platform_settings"]["Row"];
const ROLES = [["superadmin", "Super Admin"], ["frontdesk", "Front Desk"], ["operations", "Operations"]] as const;

export function AdminUsers({ selfId }: { selfId: string }) {
  const list = useServerFn(listPlatformUsers);
  const setRole = useServerFn(setUserRole);
  const qc = useQueryClient();
  const users = useQuery({ queryKey: ["admin", "users"], queryFn: () => list() });
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const toggle = async (userId: string, role: (typeof ROLES)[number][0], grant: boolean) => {
    if (role === "superadmin" && grant && !confirm("Give this person full Super Admin access?")) return;
    setError("");
    try { await setRole({ data: { userId, role, grant } }); qc.invalidateQueries({ queryKey: ["admin", "users"] }); } catch (e) { setError(errText(e)); }
  };
  const rows = (users.data ?? []).filter((u) => `${u.email} ${u.name}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <section>
      <SectionTitle title="Platform Users" description="Everyone with an account, their business status and staff roles." />
      <input type="search" className="field mb-4" placeholder="Search by name or email" aria-label="Search users" value={q} onChange={(e) => setQ(e.target.value)} />
      <ErrorNote error={error || users.error} />
      {users.isLoading ? <p className="text-muted-foreground">Loading users…</p> : rows.length === 0 ? <EmptyState title="No users found" /> : (
        <div className="overflow-x-auto rounded-2xl border bg-card"><table className="w-full min-w-[820px] text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="p-3">User</th><th className="p-3">Joined</th><th className="p-3">Last sign-in</th><th className="p-3">Business</th>{ROLES.map(([, l]) => <th key={l} className="p-3">{l}</th>)}</tr></thead>
          <tbody>{rows.map((u) => <tr key={u.id} className="border-t"><td className="p-3"><p className="font-semibold">{u.name || "—"}{u.id === selfId && " (you)"}</p><p className="text-xs text-muted-foreground">{u.email}</p></td><td className="p-3">{new Date(u.created_at).toLocaleDateString("en-IN")}</td><td className="p-3">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString("en-IN") : "Never"}</td><td className="p-3">{u.owner ? <><p>{u.owner.business_name}</p><StatusBadge status={u.owner.status} /></> : "—"}</td>
            {ROLES.map(([r, l]) => <td key={r} className="p-3"><input type="checkbox" aria-label={`${l} role for ${u.email}`} checked={u.roles.includes(r)} disabled={r === "superadmin" && u.id === selfId} onChange={(e) => toggle(u.id, r, e.target.checked)} /></td>)}</tr>)}</tbody>
        </table></div>
      )}
    </section>
  );
}

export function AdminAudit({ entries, names }: { entries: Audit[]; names: Record<string, string> }) {
  const [q, setQ] = useState("");
  const [entity, setEntity] = useState("All");
  const [sel, setSel] = useState<Audit | null>(null);
  const label: Record<string, string> = { business_owners: "Business owner", owner_properties: "Property", owner_rooms: "Room", user_roles: "Role", platform_settings: "Settings" };
  const list = entries.filter((e) => (entity === "All" || e.entity === entity) && `${e.action} ${e.summary} ${names[e.actor_id ?? ""] ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <section>
      <SectionTitle title="Audit Log" description="Every admin decision and every change to businesses, listings and rooms (latest 300)." />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row"><input type="search" className="field" placeholder="Search log" aria-label="Search log" value={q} onChange={(e) => setQ(e.target.value)} /><select className="field sm:w-56" value={entity} onChange={(e) => setEntity(e.target.value)} aria-label="Filter by record type"><option>All</option>{Object.entries(label).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
      {list.length === 0 ? <EmptyState title="No activity yet" /> : (
        <div className="overflow-x-auto rounded-2xl border bg-card"><table className="w-full min-w-[720px] text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="p-3">When</th><th className="p-3">Who</th><th className="p-3">Action</th><th className="p-3">Record</th><th className="p-3" /></tr></thead>
          <tbody>{list.map((e) => <tr key={e.id} className="border-t"><td className="p-3 whitespace-nowrap">{new Date(e.created_at).toLocaleString("en-IN")}</td><td className="p-3">{e.actor_id ? names[e.actor_id] ?? "Owner / user" : "System"}</td><td className="p-3 capitalize">{e.action}</td><td className="p-3">{label[e.entity] ?? e.entity}{e.summary && `: ${e.summary}`}</td><td className="p-3 text-right"><button className="text-xs font-semibold text-primary" onClick={() => setSel(e)}>Details</button></td></tr>)}</tbody>
        </table></div>
      )}
      <Modal open={!!sel} onClose={() => setSel(null)} title="Change details">{sel && <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-muted p-3 text-xs">{JSON.stringify(sel.details, null, 2)}</pre>}</Modal>
    </section>
  );
}

export function AdminSettings({ settings }: { settings: Settings }) {
  const qc = useQueryClient();
  const [f, setF] = useState(settings);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const save = async () => {
    if (!f.platform_name.trim()) return setError("Platform name is required");
    if (f.support_email && !EMAIL_RE.test(f.support_email)) return setError("Enter a valid support email");
    setError(""); setMsg("");
    const { error } = await supabase.from("platform_settings").update({ platform_name: f.platform_name.trim(), support_email: f.support_email.trim(), support_phone: f.support_phone.trim(), allow_owner_applications: f.allow_owner_applications, notify_owners: f.notify_owners, announcement: f.announcement.trim(), updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) setError(errText(error)); else { setMsg("Settings saved."); qc.invalidateQueries({ queryKey: ["admin", "settings"] }); }
  };
  const set = (k: "platform_name" | "support_email" | "support_phone" | "announcement") => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <section>
      <SectionTitle title="Platform Settings" description="Contact details, owner applications and notifications." />
      <div className="rounded-2xl bg-card p-6 shadow-card">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium sm:col-span-2">Platform name<input className="field mt-1" value={f.platform_name} onChange={set("platform_name")} /></label>
          <label className="text-sm font-medium">Support email<input type="email" className="field mt-1" value={f.support_email} onChange={set("support_email")} /></label>
          <label className="text-sm font-medium">Support phone<input className="field mt-1" value={f.support_phone} onChange={set("support_phone")} /></label>
          <label className="text-sm font-medium sm:col-span-2">Announcement for business owners<textarea className="field mt-1" value={f.announcement} onChange={set("announcement")} placeholder="Shown at the top of every owner's dashboard" /></label>
        </div>
        <fieldset className="mt-5 space-y-2"><legend className="mb-2 text-sm font-semibold">Access & notifications</legend>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.allow_owner_applications} onChange={(e) => setF({ ...f, allow_owner_applications: e.target.checked })} /> Accept new business-owner applications</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.notify_owners} onChange={(e) => setF({ ...f, notify_owners: e.target.checked })} /> Notify owners when their account or listings change status</label>
        </fieldset>
        <ErrorNote error={error} />
        {msg && <p role="status" className="mt-3 text-sm text-success">{msg}</p>}
        <button className="btn btn-primary mt-6" onClick={save}>Save settings</button>
      </div>
    </section>
  );
}
