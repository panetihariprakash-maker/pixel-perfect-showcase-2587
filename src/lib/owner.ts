import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type T = Database["public"]["Tables"];
export type BusinessOwner = T["business_owners"]["Row"];
export type Property = T["owner_properties"]["Row"];
export type OwnerRoom = T["owner_rooms"]["Row"];
export type Reservation = T["owner_reservations"]["Row"];
export type OwnerNotification = T["owner_notifications"]["Row"];

export const LISTING_STATUSES = ["Draft", "Pending Approval", "Approved", "Rejected", "Suspended"] as const;
export const RESERVATION_STATUSES = ["Requested", "Confirmed", "Declined", "Checked In", "Completed", "Cancelled"] as const;
export const PHOTO_BUCKET = "listing-photos";

/** Nightly price after an active seasonal price and discount are applied. */
export function effectivePrice(room: Pick<OwnerRoom, "price" | "seasonal_price" | "season_start" | "season_end" | "discount_pct">, onDate = new Date().toISOString().slice(0, 10)) {
  const inSeason = room.seasonal_price != null && room.season_start && room.season_end && onDate >= room.season_start && onDate <= room.season_end;
  const base = inSeason ? room.seasonal_price! : room.price;
  return Math.round(base * (1 - (room.discount_pct ?? 0) / 100));
}

/** Share of booked unit-nights for active reservations over the next 30 days. */
export function occupancyPercent(rooms: Pick<OwnerRoom, "id" | "units" | "available">[], reservations: Pick<Reservation, "room_id" | "check_in" | "check_out" | "status">[], from = new Date()) {
  const days = 30;
  const capacity = rooms.filter((r) => r.available).reduce((s, r) => s + r.units, 0) * days;
  if (!capacity) return 0;
  const start = from.getTime();
  const end = start + days * 86400000;
  let booked = 0;
  for (const r of reservations) {
    if (!["Confirmed", "Checked In", "Completed"].includes(r.status)) continue;
    const a = Math.max(start, new Date(r.check_in).getTime());
    const b = Math.min(end, new Date(r.check_out).getTime());
    if (b > a) booked += Math.ceil((b - a) / 86400000);
  }
  return Math.min(100, Math.round((booked / capacity) * 100));
}

export const splitList = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

export function useOwnerData(userId: string, enabled: boolean) {
  const properties = useQuery({ queryKey: ["owner", userId, "properties"], enabled, queryFn: async () => { const { data, error } = await supabase.from("owner_properties").select("*").order("created_at", { ascending: false }); if (error) throw error; return data; } });
  const rooms = useQuery({ queryKey: ["owner", userId, "rooms"], enabled, queryFn: async () => { const { data, error } = await supabase.from("owner_rooms").select("*").order("created_at", { ascending: false }); if (error) throw error; return data; } });
  const reservations = useQuery({ queryKey: ["owner", userId, "reservations"], enabled, queryFn: async () => { const { data, error } = await supabase.from("owner_reservations").select("*").order("check_in", { ascending: false }); if (error) throw error; return data; } });
  const notifications = useQuery({ queryKey: ["owner", userId, "notifications"], enabled, queryFn: async () => { const { data, error } = await supabase.from("owner_notifications").select("*").order("created_at", { ascending: false }); if (error) throw error; return data; } });
  return { properties, rooms, reservations, notifications };
}

export function useSignedUrls(paths: string[]) {
  return useQuery({
    queryKey: ["signed", paths],
    enabled: paths.length > 0,
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(paths, 3600);
      if (error) throw error;
      return Object.fromEntries(data.map((d) => [d.path ?? "", d.signedUrl]));
    },
  });
}

export async function uploadPhotos(userId: string, files: FileList | File[]) {
  const out: string[] = [];
  for (const f of Array.from(files)) {
    if (!f.type.startsWith("image/")) throw new Error(`${f.name} is not an image`);
    const ext = f.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, f, { contentType: f.type });
    if (error) throw error;
    out.push(path);
  }
  return out;
}
