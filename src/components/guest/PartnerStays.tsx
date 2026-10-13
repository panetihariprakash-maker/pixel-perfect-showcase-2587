import { useQuery } from "@tanstack/react-query";
import { MapPin, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/data/resort";
import { effectivePrice, useSignedUrls } from "@/lib/owner";

type PublicRoom = { id: string; name: string; room_type: string; capacity: number; price: number; seasonal_price: number | null; season_start: string | null; season_end: string | null; discount_pct: number; facilities: string[]; photos: string[] };
type PublicListing = { id: string; name: string; kind: string; description: string; location: string; amenities: string[]; check_in: string; check_out: string; photos: string[]; rooms: PublicRoom[] };

/** Approved partner listings only; the database function never returns drafts, pending, rejected or suspended listings. */
export function PartnerStays() {
  const listings = useQuery({ queryKey: ["public-listings"], queryFn: async () => { const { data, error } = await supabase.rpc("public_listings"); if (error) throw error; return (data ?? []) as unknown as PublicListing[]; } });
  const covers = useSignedUrls((listings.data ?? []).map((l) => l.photos[0]).filter(Boolean));
  if (listings.isLoading || listings.error || !listings.data?.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
      <p className="eyebrow">Partner stays</p>
      <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Approved partner properties</h2>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {listings.data.map((l) => {
          const from = l.rooms.length ? Math.min(...l.rooms.map((r) => effectivePrice(r))) : null;
          return (
            <article key={l.id} className="overflow-hidden rounded-2xl bg-card shadow-card">
              {covers.data?.[l.photos[0]] ? <img src={covers.data[l.photos[0]]} alt={l.name} loading="lazy" className="aspect-[16/10] w-full object-cover" /> : <div className="aspect-[16/10] w-full bg-muted" />}
              <div className="p-6">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{l.kind}</p>
                <h3 className="text-2xl font-semibold">{l.name}</h3>
                {l.location && <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{l.location}</p>}
                <p className="mt-2 text-sm text-muted-foreground">{l.description}</p>
                <ul className="mt-3 space-y-1 text-sm">{l.rooms.map((r) => <li key={r.id} className="flex justify-between gap-2"><span>{r.name} <span className="text-muted-foreground"><Users className="inline h-3.5 w-3.5" /> {r.capacity}</span></span><span className="font-semibold text-primary">{formatINR(effectivePrice(r))}</span></li>)}</ul>
                {from != null && <p className="mt-3 text-xs text-muted-foreground">From {formatINR(from)} per night · Contact the property to book.</p>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
