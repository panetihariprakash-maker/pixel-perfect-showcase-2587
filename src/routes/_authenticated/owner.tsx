import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Bell, BedDouble, Building2, CalendarDays, LayoutDashboard, UserCog, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatINR } from "@/data/resort";
import { StatusBadge } from "@/components/ui-kit";
import { occupancyPercent, useOwnerData, type BusinessOwner } from "@/lib/owner";
import { ErrorNote, PortalShell, SectionTitle, StatCard } from "@/components/owner/PortalShell";
import { PropertiesSection, RoomsManager } from "@/components/owner/ListingsSections";
import { GuestsSection, ReservationsSection } from "@/components/owner/BookingsSections";
import { BusinessProfileSection, NotificationsSection, OwnerApplication, OwnerStatusScreen } from "@/components/owner/ProfileSections";

export const Route = createFileRoute("/_authenticated/owner")({
  head: () => ({
    meta: [
      { title: "Business Owner Dashboard — The Azure Ridge Sanctuary" },
      { name: "description", content: "Manage your properties, rooms, pricing and reservations." },
      { property: "og:title", content: "Business Owner Dashboard" },
      { property: "og:description", content: "Manage your properties, rooms, pricing and reservations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OwnerPage,
});

const sections = ["overview", "properties", "rooms", "reservations", "guests", "profile", "notifications"];

function OwnerPage() {
  const { user } = useAuth();
  const uid = user?.id ?? "";
  const owner = useQuery({ queryKey: ["business-owner", uid], enabled: !!uid, queryFn: async () => { const { data, error } = await supabase.from("business_owners").select("*").eq("user_id", uid).maybeSingle(); if (error) throw error; return data; } });
  if (!uid || owner.isLoading) return <p className="p-10 text-center text-muted-foreground">Loading…</p>;
  if (owner.error) return <div className="p-10"><ErrorNote error={owner.error} /></div>;
  const o = owner.data;
  if (!o || o.status === "Rejected") return <OwnerApplication userId={uid} email={user?.email ?? ""} existing={o ?? undefined} />;
  if (o.status !== "Approved") return <OwnerStatusScreen owner={o} />;
  return <ApprovedOwner uid={uid} owner={o} />;
}

function ApprovedOwner({ uid, owner }: { uid: string; owner: BusinessOwner }) {
  const [active, setActive] = useState("overview");
  useEffect(() => { const h = window.location.hash.slice(1); if (sections.includes(h)) setActive(h); }, []);
  const select = (id: string) => { setActive(id); history.replaceState(null, "", `#${id}`); window.scrollTo({ top: 0 }); };
  const { properties, rooms, reservations, notifications } = useOwnerData(uid, true);
  const announcement = useQuery({ queryKey: ["platform-announcement"], queryFn: async () => (await supabase.from("platform_settings").select("announcement").eq("id", 1).maybeSingle()).data?.announcement ?? "" });
  const P = properties.data ?? [], R = rooms.data ?? [], B = reservations.data ?? [], N = notifications.data ?? [];
  const unread = N.filter((n) => !n.read).length;
  const items = [
    { id: "overview", label: "Overview", icon: LayoutDashboard }, { id: "properties", label: "Properties", icon: Building2 }, { id: "rooms", label: "Rooms & Pricing", icon: BedDouble },
    { id: "reservations", label: "Reservations", icon: CalendarDays, badge: B.filter((b) => b.status === "Requested").length }, { id: "guests", label: "Guests", icon: Users },
    { id: "profile", label: "Business Profile", icon: UserCog }, { id: "notifications", label: "Notifications", icon: Bell, badge: unread },
  ];
  const loading = properties.isLoading || rooms.isLoading || reservations.isLoading;
  const err = properties.error || rooms.error || reservations.error || notifications.error;
  const revenue = B.filter((b) => ["Confirmed", "Checked In", "Completed"].includes(b.status)).reduce((s, b) => s + b.amount, 0);

  return (
    <PortalShell title="Owner Portal" items={items} active={active} onSelect={select}>
      <div className="px-4 py-8 sm:px-8">
        {announcement.data && <p className="mb-4 rounded-xl bg-accent/20 p-3 text-sm" role="status">{announcement.data}</p>}
        {err && <div className="mb-4"><ErrorNote error={err} /></div>}
        {loading ? <p className="text-muted-foreground">Loading your business…</p> : <>
          {active === "overview" && (
            <section>
              <SectionTitle title={`Welcome, ${owner.business_name}`} description="A snapshot of your properties and bookings." />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <StatCard label="Properties" value={P.length} hint={`${P.filter((p) => p.status === "Approved").length} approved`} />
                <StatCard label="Rooms" value={R.length} hint={`${R.reduce((s, r) => s + r.units, 0)} units`} />
                <StatCard label="Bookings" value={B.length} hint={`${B.filter((b) => b.status === "Requested").length} awaiting reply`} />
                <StatCard label="Revenue" value={formatINR(revenue)} hint="Confirmed and completed stays" />
                <StatCard label="Occupancy" value={`${occupancyPercent(R, B)}%`} hint="Next 30 days" />
              </div>
              <div className="mt-8 grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border bg-card p-5"><h2 className="text-2xl font-semibold">Listing status</h2><ul className="mt-3 space-y-2 text-sm">{P.length ? P.slice(0, 6).map((p) => <li key={p.id} className="flex justify-between gap-2"><span>{p.name}</span><StatusBadge status={p.status} /></li>) : <li className="text-muted-foreground">No properties yet.</li>}</ul></div>
                <div className="rounded-2xl border bg-card p-5"><h2 className="text-2xl font-semibold">Latest requests</h2><ul className="mt-3 space-y-2 text-sm">{B.length ? B.slice(0, 6).map((b) => <li key={b.id} className="flex justify-between gap-2"><span>{b.guest_name} · {b.check_in}</span><StatusBadge status={b.status} /></li>) : <li className="text-muted-foreground">No bookings yet.</li>}</ul></div>
              </div>
            </section>
          )}
          {active === "properties" && <PropertiesSection userId={uid} properties={P} rooms={R} perms={owner} />}
          {active === "rooms" && <RoomsManager userId={uid} properties={P} rooms={R} perms={owner} />}
          {active === "reservations" && <ReservationsSection userId={uid} properties={P} rooms={R} reservations={B} />}
          {active === "guests" && <GuestsSection reservations={B} properties={P} />}
          {active === "profile" && <BusinessProfileSection userId={uid} owner={owner} />}
          {active === "notifications" && <NotificationsSection userId={uid} items={N} />}
        </>}
      </div>
    </PortalShell>
  );
}
