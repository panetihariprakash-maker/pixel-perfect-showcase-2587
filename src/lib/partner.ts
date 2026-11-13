import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const publicRoomSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  room_type: z.string(),
  description: z.string(),
  capacity: z.number(),
  price: z.number(),
  seasonal_price: z.number().nullable(),
  season_start: z.string().nullable(),
  season_end: z.string().nullable(),
  discount_pct: z.number(),
  facilities: z.array(z.string()),
  photos: z.array(z.string()),
  available: z.boolean(),
  units: z.number(),
  occupied_units: z.number(),
});
export const publicListingSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  kind: z.string(),
  description: z.string(),
  location: z.string(),
  amenities: z.array(z.string()),
  check_in: z.string(),
  check_out: z.string(),
  photos: z.array(z.string()),
  rooms: z.array(publicRoomSchema),
});
export type PublicRoom = z.infer<typeof publicRoomSchema>;
export type PublicListing = z.infer<typeof publicListingSchema>;
export const partnerStaySchema = z.object({
  id: z.string().uuid(),
  property_name: z.string().nullable(),
  room_name: z.string().nullable(),
  check_in: z.string(),
  check_out: z.string(),
  guests: z.number(),
  amount: z.number(),
  status: z.string(),
  created_at: z.string(),
});
export type PartnerStay = z.infer<typeof partnerStaySchema>;
export const quoteSchema = z.object({
  room_id: z.string().uuid(),
  check_in: z.string(),
  check_out: z.string(),
  nights: z.number(),
  capacity: z.number(),
  remaining_units: z.number(),
  available: z.boolean(),
  amount: z.number(),
  nightly_rates: z.array(z.object({ date: z.string(), amount: z.number() })),
});
export function useRoomQuote(roomId: string | undefined, checkIn: string, checkOut: string) {
  const datesValid = validStayDates(checkIn, checkOut);
  return useQuery({
    queryKey: ["partner-room-quote", roomId, checkIn, checkOut],
    enabled: !!roomId && datesValid,
    retry: false,
    refetchInterval: 30000,
    queryFn: async () => {
      if (!roomId) throw new Error("Choose a room.");
      const { data, error } = await supabase.rpc("partner_room_quote", {
        _room_id: roomId,
        _check_in: checkIn,
        _check_out: checkOut,
      });
      if (error) throw error;
      return quoteSchema.parse(data);
    },
  });
}
export function validStayDates(checkIn: string, checkOut: string) {
  const exact = (date: string) => {
    const time = Date.parse(date + "T00:00:00Z");
    return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === date;
  };
  const nights = (Date.parse(checkOut) - Date.parse(checkIn)) / 86400000;
  return (
    exact(checkIn) &&
    exact(checkOut) &&
    nights >= 1 &&
    nights <= 90 &&
    checkIn >= new Date().toISOString().slice(0, 10)
  );
}
export const partnerRequestSchema = z
  .object({
    _room_id: z.string().uuid(),
    _check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    _check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    _guests: z.number().int().min(1),
    _name: z.string().trim().min(2).max(100),
    _email: z.string().trim().email().max(255),
    _phone: z.string().regex(/^\+?[0-9]{10,15}$/),
    _requests: z.string().max(2000),
  })
  .refine((v) => {
    return validStayDates(v._check_in, v._check_out);
  }, "Choose a future stay of 1 to 90 nights.");

export function usePublicListings() {
  return useQuery({
    queryKey: ["public-listings"],
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("public_listings");
      if (error) throw error;
      return z.array(publicListingSchema).parse(data ?? []);
    },
  });
}
export function usePartnerStays(userId?: string) {
  return useQuery({
    queryKey: ["guest-partner-stays", userId],
    enabled: !!userId,
    refetchInterval: 15000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("my_partner_stays");
      if (error) throw error;
      return z.array(partnerStaySchema).parse(data ?? []);
    },
  });
}
export function inventorySummary(listings: PublicListing[]) {
  return listings
    .flatMap((l) => l.rooms)
    .reduce(
      (s, r) => {
        if (!r.available) return s;
        s.occupied += r.occupied_units;
        s.available += Math.max(0, r.units - r.occupied_units);
        return s;
      },
      { available: 0, occupied: 0 },
    );
}
