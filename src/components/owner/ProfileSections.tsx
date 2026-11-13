import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState, StatusBadge } from "@/components/ui-kit";
import { EMAIL_RE, PHONE_RE } from "@/lib/store";
import type { BusinessOwner, OwnerNotification } from "@/lib/owner";
import { ErrorNote, SectionTitle } from "./PortalShell";
import { Button } from "@/components/ui/button";

type ProfileForm = {
  business_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  about: string;
  notify_email: boolean;
  notify_bookings: boolean;
};

export function validateBusiness(f: ProfileForm) {
  if (!f.business_name.trim()) return "Business name is required";
  if (!f.contact_name.trim()) return "Contact name is required";
  if (!EMAIL_RE.test(f.contact_email)) return "Enter a valid contact email";
  if (!PHONE_RE.test(f.contact_phone)) return "Enter a valid contact phone number";
  return "";
}

function BusinessFields({ f, setF }: { f: ProfileForm; setF: (f: ProfileForm) => void }) {
  const set =
    (k: keyof ProfileForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setF({ ...f, [k]: e.target.value });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-medium">
        Business name
        <input className="field mt-1" value={f.business_name} onChange={set("business_name")} />
      </label>
      <label className="text-sm font-medium">
        Contact person
        <input className="field mt-1" value={f.contact_name} onChange={set("contact_name")} />
      </label>
      <label className="text-sm font-medium">
        Contact email
        <input
          type="email"
          className="field mt-1"
          value={f.contact_email}
          onChange={set("contact_email")}
        />
      </label>
      <label className="text-sm font-medium">
        Contact phone
        <input
          className="field mt-1"
          value={f.contact_phone}
          onChange={set("contact_phone")}
          placeholder="+91 98765 43210"
        />
      </label>
      <label className="text-sm font-medium sm:col-span-2">
        Business address
        <input className="field mt-1" value={f.address} onChange={set("address")} />
      </label>
      <label className="text-sm font-medium sm:col-span-2">
        About your business
        <textarea className="field mt-1 min-h-24" value={f.about} onChange={set("about")} />
      </label>
    </div>
  );
}

const toForm = (o?: Partial<BusinessOwner>, email = ""): ProfileForm => ({
  business_name: o?.business_name ?? "",
  contact_name: o?.contact_name ?? "",
  contact_email: o?.contact_email ?? email,
  contact_phone: o?.contact_phone ?? "",
  address: o?.address ?? "",
  about: o?.about ?? "",
  notify_email: o?.notify_email ?? true,
  notify_bookings: o?.notify_bookings ?? true,
});

export function OwnerApplication({
  userId,
  email,
  existing,
}: {
  userId: string;
  email: string;
  existing?: BusinessOwner;
}) {
  const qc = useQueryClient();
  const [f, setF] = useState(toForm(existing, email));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    const v = validateBusiness(f);
    if (v) return setError(v);
    setSaving(true);
    setError("");
    const res = existing
      ? await supabase
          .from("business_owners")
          .update({ ...f, status: "Pending Approval" })
          .eq("user_id", userId)
      : await supabase.from("business_owners").insert({ ...f, user_id: userId });
    setSaving(false);
    if (res.error) setError(res.error.message);
    else qc.invalidateQueries({ queryKey: ["business-owner", userId] });
  };
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="eyebrow">Business owners</p>
      <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">
        {existing ? "Update your application" : "List your property with us"}
      </h1>
      <p className="mt-3 text-muted-foreground">
        Tell us about your business. The Super Admin reviews every application before you can add
        properties.
      </p>
      {existing?.status === "Rejected" && (
        <p className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
          Your application was not approved{existing.admin_note ? `: ${existing.admin_note}` : "."}{" "}
          You can update it and apply again.
        </p>
      )}
      <div className="mt-8 rounded-2xl bg-card p-6 shadow-card">
        <BusinessFields f={f} setF={setF} />
        {error && (
          <div className="mt-4">
            <ErrorNote error={error} />
          </div>
        )}
        <button className="btn btn-primary mt-6 w-full" disabled={saving} onClick={submit}>
          {saving ? "Sending…" : "Submit application"}
        </button>
      </div>
    </div>
  );
}

export function OwnerStatusScreen({ owner }: { owner: BusinessOwner }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <StatusBadge status={owner.status} />
      <h1 className="mt-4 text-4xl font-semibold">
        {owner.status === "Suspended" ? "Your account is suspended" : "Application under review"}
      </h1>
      <p className="mt-3 text-muted-foreground">
        {owner.status === "Suspended"
          ? "Your business dashboard is unavailable. Please contact the resort team."
          : `Thanks, ${owner.business_name}. You'll get access to the dashboard as soon as the Super Admin approves your application.`}
      </p>
      {owner.admin_note && <p className="mt-4 text-sm">Note: {owner.admin_note}</p>}
    </div>
  );
}

export function BusinessProfileSection({
  userId,
  owner,
}: {
  userId: string;
  owner: BusinessOwner;
}) {
  const qc = useQueryClient();
  const [f, setF] = useState(toForm(owner));
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (saving) return;
    const v = validateBusiness(f);
    if (v) return setError(v);
    setError("");
    setMsg("");
    setSaving(true);
    const { error } = await supabase
      .from("business_owners")
      .update(f)
      .eq("user_id", userId)
      .select("user_id")
      .single();
    setSaving(false);
    if (error) setError(error.message);
    else {
      setMsg("Profile saved.");
      qc.invalidateQueries({ queryKey: ["business-owner", userId] });
    }
  };
  return (
    <section>
      <SectionTitle
        title="Business Profile"
        description="Your business and contact details, plus notification preferences."
      />
      <div className="rounded-2xl bg-card p-6 shadow-card">
        <BusinessFields f={f} setF={setF} />
        <fieldset className="mt-6 space-y-2">
          <legend className="mb-2 text-sm font-semibold">Notifications</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={f.notify_bookings}
              onChange={(e) => setF({ ...f, notify_bookings: e.target.checked })}
            />{" "}
            Notify me about new booking requests
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={f.notify_email}
              onChange={(e) => setF({ ...f, notify_email: e.target.checked })}
            />{" "}
            I'd like email updates (sent once email delivery is set up)
          </label>
        </fieldset>
        {error && (
          <div className="mt-4">
            <ErrorNote error={error} />
          </div>
        )}
        {msg && (
          <p className="mt-4 text-sm text-success" role="status">
            {msg}
          </p>
        )}
        <Button className="mt-6" disabled={saving} onClick={save}>
          {saving ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </section>
  );
}

export function NotificationsSection({
  userId,
  items,
}: {
  userId: string;
  items: OwnerNotification[];
}) {
  const qc = useQueryClient();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ["owner", userId, "notifications"] });
  const act = async (action: PromiseLike<{ error: { message: string } | null }>) => {
    if (busy) return;
    setBusy(true);
    setError("");
    const result = await action;
    setBusy(false);
    if (result.error) setError(result.error.message);
    else refresh();
  };
  const markAll = () =>
    act(
      supabase
        .from("owner_notifications")
        .update({ read: true })
        .eq("owner_id", userId)
        .eq("read", false),
    );
  const remove = (id: string) =>
    act(supabase.from("owner_notifications").delete().eq("id", id).eq("owner_id", userId));
  return (
    <section>
      <SectionTitle
        title="Notifications"
        description="Approval decisions and new booking requests."
        action={
          items.some((n) => !n.read) && (
            <Button variant="outline" disabled={busy} onClick={markAll}>
              Mark all as read
            </Button>
          )
        }
      />
      <ErrorNote error={error} />
      {items.length === 0 ? (
        <EmptyState title="You're all caught up" />
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li
              key={n.id}
              className={`flex items-start justify-between gap-3 rounded-2xl border bg-card p-4 ${n.read ? "opacity-70" : ""}`}
            >
              <div>
                <p className={`text-sm ${n.read ? "" : "font-semibold"}`}>{n.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(n.created_at).toLocaleString("en-IN")}
                </p>
              </div>
              <Button variant="ghost" size="sm" disabled={busy} onClick={() => remove(n.id)}>
                Dismiss
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
