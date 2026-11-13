import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const q = <T>(key: string, fn: () => PromiseLike<{ data: T | null; error: unknown }>) => ({
  queryKey: ["admin", key],
  refetchInterval: 30000,
  queryFn: async () => {
    const { data, error } = await fn();
    if (error) throw error;
    return data as T;
  },
});

export function useAdminData() {
  const owners = useQuery(
    q("owners", () =>
      supabase.from("business_owners").select("*").order("created_at", { ascending: false }),
    ),
  );
  const listings = useQuery(
    q("listings", () =>
      supabase.from("owner_properties").select("*").order("updated_at", { ascending: false }),
    ),
  );
  const rooms = useQuery(
    q("rooms", () =>
      supabase.from("owner_rooms").select("*").order("created_at", { ascending: false }),
    ),
  );
  const bookings = useQuery(
    q("bookings", () =>
      supabase.from("owner_reservations").select("*").order("check_in", { ascending: false }),
    ),
  );
  const audit = useQuery(
    q("audit", () =>
      supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300),
    ),
  );
  const settings = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("*")
        .eq("id", 1)
        .single();
      if (error) throw error;
      return data;
    },
  });
  return { owners, listings, rooms, bookings, audit, settings };
}

export const errText = (e: unknown) =>
  (e as { message?: string })?.message ?? "Something went wrong";
