import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { usePublicListings, type PublicListing, type PublicRoom } from "@/lib/partner";
import { BookingDialog } from "@/components/BookingDialog";
import { MapPin, Users } from "lucide-react";
import { formatINR } from "@/data/resort";
import { effectivePrice, useSignedUrls } from "@/lib/owner";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui-kit";

/** Approved partner listings only; the database function never returns drafts, pending, rejected or suspended listings. */
export function PartnerStays() {
  const { user } = useAuth();
  const listings = usePublicListings();
  const [booking, setBooking] = useState<{ listing: PublicListing; room: PublicRoom } | null>(null);
  const [detail, setDetail] = useState<{ listing: PublicListing; room: PublicRoom } | null>(null);
  const covers = useSignedUrls(
    (listings.data ?? []).flatMap((l) => [...l.photos, ...l.rooms.flatMap((r) => r.photos)]),
  );
  if (listings.error)
    return (
      <section className="mx-auto max-w-7xl px-4 pb-8">
        <p role="alert" className="text-sm text-destructive">
          Unable to load partner properties.
        </p>
        <Button variant="outline" className="mt-3" onClick={() => listings.refetch()}>
          Try again
        </Button>
      </section>
    );
  if (listings.isLoading)
    return (
      <p role="status" className="mx-auto max-w-7xl px-4 py-8 text-muted-foreground">
        Loading approved rooms…
      </p>
    );
  if (!listings.data?.length)
    return (
      <p className="mx-auto max-w-7xl px-4 py-8 text-muted-foreground">
        No approved partner rooms are listed yet.
      </p>
    );
  return (
    <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
      <p className="eyebrow">Partner stays</p>
      <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Approved partner properties</h2>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {listings.data.map((l) => {
          const openRooms = l.rooms.filter((r) => r.available && r.units > 0);
          const from = openRooms.length
            ? Math.min(...openRooms.map((r) => effectivePrice(r)))
            : null;
          return (
            <article key={l.id} className="overflow-hidden rounded-2xl bg-card shadow-card">
              {covers.data?.[l.photos[0]] ? (
                <img
                  src={covers.data[l.photos[0]] ?? undefined}
                  alt={l.name}
                  loading="lazy"
                  className="aspect-[16/10] w-full object-cover"
                />
              ) : (
                <div className="aspect-[16/10] w-full bg-muted" />
              )}
              <div className="p-6">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{l.kind}</p>
                <h3 className="text-2xl font-semibold">{l.name}</h3>
                {l.location && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {l.location}
                  </p>
                )}
                <p className="mt-2 text-sm text-muted-foreground">{l.description}</p>
                <ul className="mt-3 space-y-1 text-sm">
                  {l.rooms.map((r) => (
                    <li key={r.id} className="border-t py-3">
                      <div className="flex flex-wrap justify-between gap-2">
                        <span className="font-semibold">
                          {r.name} · {r.room_type}
                        </span>
                        <span className="font-semibold text-primary">
                          {formatINR(effectivePrice(r))}/night
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        <Users className="inline h-3.5 w-3.5" /> Up to {r.capacity} ·{" "}
                        {r.available && r.units > 0 ? "Open for requests" : "Unavailable"}
                      </p>
                      <Button
                        variant="outline"
                        className="mr-2 mt-3"
                        onClick={() => setDetail({ listing: l, room: r })}
                      >
                        Room details
                      </Button>
                      {r.available &&
                        r.units > 0 &&
                        (user ? (
                          <Button
                            className="mt-3"
                            onClick={() => setBooking({ listing: l, room: r })}
                          >
                            Request booking
                          </Button>
                        ) : (
                          <Button asChild className="mt-3">
                            <Link to="/auth">Sign in to book</Link>
                          </Button>
                        ))}
                    </li>
                  ))}
                </ul>
                {from != null && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    From {formatINR(from)} per night · Final total depends on your dates.
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.room.name ?? "Room details"}
        wide
      >
        {detail && (
          <div>
            <p className="text-sm text-muted-foreground">
              {detail.listing.name} · {detail.room.room_type}
            </p>
            {covers.data?.[detail.room.photos[0] ?? detail.listing.photos[0]] && (
              <img
                className="mt-4 aspect-video w-full rounded-lg object-cover"
                src={covers.data[detail.room.photos[0] ?? detail.listing.photos[0]] ?? undefined}
                alt={detail.room.name}
              />
            )}
            <p className="mt-4">{detail.room.description || detail.listing.description}</p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Capacity</dt>
                <dd>Up to {detail.room.capacity} guests</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Nightly rate</dt>
                <dd>{formatINR(effectivePrice(detail.room))}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Check-in / Check-out</dt>
                <dd>
                  {detail.listing.check_in} / {detail.listing.check_out}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Availability</dt>
                <dd>
                  {detail.room.available && detail.room.units > 0
                    ? "Open for requests; check your dates"
                    : "Unavailable"}
                </dd>
              </div>
            </dl>
            <ul className="mt-4 flex flex-wrap gap-2">
              {[...detail.listing.amenities, ...detail.room.facilities].map((f, i) => (
                <li key={`${f}-${i}`} className="rounded bg-secondary/10 px-3 py-1 text-sm">
                  {f}
                </li>
              ))}
            </ul>
            {detail.room.available &&
              detail.room.units > 0 &&
              (user ? (
                <Button
                  className="mt-6"
                  onClick={() => {
                    setBooking(detail);
                    setDetail(null);
                  }}
                >
                  Request booking
                </Button>
              ) : (
                <Button asChild className="mt-6">
                  <Link to="/auth">Sign in to book</Link>
                </Button>
              ))}
          </div>
        )}
      </Modal>
      {booking && <BookingDialog room={null} partner={booking} onClose={() => setBooking(null)} />}
    </section>
  );
}
