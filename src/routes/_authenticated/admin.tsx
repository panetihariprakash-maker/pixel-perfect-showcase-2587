import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BedDouble,
  Building2,
  CalendarDays,
  LayoutDashboard,
  ScrollText,
  Settings,
  UserCheck,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatINR } from "@/data/resort";
import { StatusBadge } from "@/components/ui-kit";
import { ErrorNote, PortalShell, SectionTitle, StatCard } from "@/components/owner/PortalShell";
import { useAdminData } from "@/components/admin/AdminData";
import { AdminOwners } from "@/components/admin/AdminOwners";
import { AdminBookings, AdminListings, AdminRooms } from "@/components/admin/AdminListings";
import { AdminAudit, AdminSettings, AdminUsers } from "@/components/admin/AdminPlatform";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/admin-login" });
    const { data: ok } = await supabase.rpc("has_role", {
      _user_id: data.user.id,
      _role: "superadmin",
    });
    if (!ok) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Super Admin — The Azure Ridge Sanctuary" },
      {
        name: "description",
        content: "Control business-owner access, property listings and platform operations.",
      },
      { property: "og:title", content: "Super Admin" },
      {
        property: "og:description",
        content: "Control business-owner access, property listings and platform operations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const SECTIONS = [
  "overview",
  "owners",
  "listings",
  "rooms",
  "bookings",
  "users",
  "audit",
  "settings",
];

function AdminPage() {
  const { user } = useAuth();
  const [active, setActive] = useState("overview");
  useEffect(() => {
    const h = window.location.hash.slice(1);
    if (SECTIONS.includes(h)) setActive(h);
  }, []);
  const select = (id: string) => {
    setActive(id);
    history.replaceState(null, "", `#${id}`);
    window.scrollTo({ top: 0 });
  };
  const { owners, listings, rooms, bookings, audit, settings } = useAdminData();
  const O = owners.data ?? [],
    L = listings.data ?? [],
    R = rooms.data ?? [],
    B = bookings.data ?? [];
  const pendingOwners = O.filter((o) => o.status === "Pending Approval");
  const pendingListings = L.filter((l) => l.status === "Pending Approval");
  const revenue = B.filter((b) =>
    ["Confirmed", "Checked In", "Completed"].includes(b.status),
  ).reduce((s, b) => s + b.amount, 0);
  const names: Record<string, string> = Object.fromEntries(
    O.map((o) => [o.user_id, o.business_name]),
  );
  if (user) names[user.id] = "You (Super Admin)";
  const items = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "owners", label: "Business Owners", icon: UserCheck, badge: pendingOwners.length },
    { id: "listings", label: "Listings", icon: Building2, badge: pendingListings.length },
    { id: "rooms", label: "Rooms", icon: BedDouble },
    { id: "bookings", label: "Bookings", icon: CalendarDays },
    { id: "users", label: "Platform Users", icon: Users },
    { id: "audit", label: "Audit Log", icon: ScrollText },
    { id: "settings", label: "Settings", icon: Settings },
  ];
  const loading =
    owners.isLoading ||
    listings.isLoading ||
    rooms.isLoading ||
    bookings.isLoading ||
    (active === "audit" && audit.isLoading) ||
    (active === "settings" && settings.isLoading);
  const err =
    owners.error ||
    listings.error ||
    rooms.error ||
    bookings.error ||
    (active === "audit" && audit.error) ||
    (active === "settings" && settings.error);

  return (
    <PortalShell title="Super Admin" items={items} active={active} onSelect={select}>
      <div className="px-4 py-8 sm:px-8">
        {err && (
          <div className="mb-4">
            <ErrorNote error={err} />
          </div>
        )}
        {loading ? (
          <p className="text-muted-foreground">Loading platform data…</p>
        ) : (
          <>
            {active === "overview" && (
              <section>
                <SectionTitle
                  title="Platform Overview"
                  description="Business owners, listings and bookings across the platform."
                />
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <StatCard label="Business owners" value={O.length} />
                  <StatCard
                    label="Approved businesses"
                    value={O.filter((o) => o.status === "Approved").length}
                    hint={`${O.filter((o) => o.status === "Suspended").length} suspended`}
                  />
                  <StatCard
                    label="Pending approvals"
                    value={pendingOwners.length + pendingListings.length}
                    hint={`${pendingOwners.length} owners · ${pendingListings.length} listings`}
                  />
                  <StatCard
                    label="Properties"
                    value={L.length}
                    hint={`${L.filter((l) => l.status === "Approved").length} live · ${R.length} rooms`}
                  />
                  <StatCard
                    label="Bookings"
                    value={B.length}
                    hint={`${B.filter((b) => b.status === "Requested").length} awaiting reply`}
                  />
                  <StatCard
                    label="Booking value"
                    value={formatINR(revenue)}
                    hint="Not collected payments"
                  />
                </div>
                <div className="mt-8 grid gap-6 lg:grid-cols-2">
                  <div className="rounded-2xl border bg-card p-5">
                    <h2 className="text-2xl font-semibold">Owners awaiting approval</h2>
                    <ul className="mt-3 space-y-2 text-sm">
                      {pendingOwners.length ? (
                        pendingOwners.slice(0, 6).map((o) => (
                          <li key={o.user_id} className="flex justify-between gap-2">
                            <span>{o.business_name}</span>
                            <button
                              className="text-xs font-semibold text-primary"
                              onClick={() => select("owners")}
                            >
                              Review
                            </button>
                          </li>
                        ))
                      ) : (
                        <li className="text-muted-foreground">Nothing waiting.</li>
                      )}
                    </ul>
                  </div>
                  <div className="rounded-2xl border bg-card p-5">
                    <h2 className="text-2xl font-semibold">Listings awaiting approval</h2>
                    <ul className="mt-3 space-y-2 text-sm">
                      {pendingListings.length ? (
                        pendingListings.slice(0, 6).map((l) => (
                          <li key={l.id} className="flex justify-between gap-2">
                            <span>{l.name}</span>
                            <StatusBadge status={l.status} />
                          </li>
                        ))
                      ) : (
                        <li className="text-muted-foreground">Nothing waiting.</li>
                      )}
                    </ul>
                  </div>
                </div>
              </section>
            )}
            {active === "owners" && <AdminOwners owners={O} listings={L} />}
            {active === "listings" && <AdminListings listings={L} rooms={R} owners={O} />}
            {active === "rooms" && <AdminRooms rooms={R} listings={L} />}
            {active === "bookings" && <AdminBookings bookings={B} listings={L} owners={O} />}
            {active === "users" && user && <AdminUsers selfId={user.id} />}
            {active === "audit" && <AdminAudit entries={audit.data ?? []} names={names} />}
            {active === "settings" &&
              (settings.data ? (
                <AdminSettings settings={settings.data} />
              ) : (
                <ErrorNote error={settings.error ?? "Settings unavailable"} />
              ))}
          </>
        )}
      </div>
    </PortalShell>
  );
}
