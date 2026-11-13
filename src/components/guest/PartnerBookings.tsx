import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { usePartnerStays } from "@/lib/partner";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/data/resort";
import { StatusBadge } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";

export function PartnerBookings({ filter = "all" }: { filter?: "all" | "upcoming" | "past" }) {
  const { user } = useAuth();
  const stays = usePartnerStays(user?.id);
  const client = useQueryClient();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const rows = (stays.data ?? []).filter((r) => {
    const past = r.check_out <= today || ["Cancelled", "Declined", "Completed"].includes(r.status);
    return filter === "all" || (filter === "past" ? past : !past);
  });
  const cancel = async (id: string) => {
    if (busy) return;
    setBusy(id);
    setError("");
    try {
      const result = await supabase.rpc("cancel_partner_stay", { _id: id });
      if (result.error) throw result.error;
      await client.invalidateQueries({ queryKey: ["guest-partner-stays", user?.id] });
      await client.invalidateQueries({ queryKey: ["public-listings"] });
    } catch {
      setError("Unable to cancel this request. Please refresh its status and try again.");
    } finally {
      setBusy("");
    }
  };
  return (
    <section className="mb-8">
      <h2 className="text-3xl font-semibold">Partner booking requests</h2>
      {stays.isLoading ? (
        <p role="status" className="mt-3 text-muted-foreground">
          Loading your requests…
        </p>
      ) : stays.error ? (
        <div className="mt-3">
          <p role="alert" className="text-destructive">
            Unable to load your partner requests.
          </p>
          <Button variant="outline" onClick={() => stays.refetch()}>
            Try again
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No partner requests in this view.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {rows.map((r) => (
            <li key={r.id} className="rounded-lg border bg-card p-5 shadow-card">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h3 className="text-2xl font-semibold">{r.room_name ?? "Room"}</h3>
                  <p className="text-sm text-muted-foreground">{r.property_name}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <p className="mt-3 text-sm">
                {r.check_in} → {r.check_out} · {r.guests} guests ·{" "}
                <strong>{formatINR(r.amount)}</strong>
              </p>
              <p className="mt-2 break-all text-xs text-muted-foreground">Reference: {r.id}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                No payment has been taken. Requested stays await owner confirmation.
              </p>
              {["Requested", "Confirmed"].includes(r.status) && r.check_in >= today && (
                <Button
                  variant="outline"
                  className="mt-3"
                  disabled={!!busy}
                  onClick={() => cancel(r.id)}
                >
                  {busy === r.id ? "Cancelling…" : "Cancel request"}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
