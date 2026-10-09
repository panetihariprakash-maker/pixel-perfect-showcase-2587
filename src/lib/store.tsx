import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  seedBookings, roomUnits as seedUnits, opsTasks as seedTasks,
  type Booking, type BookingStatus, type PaymentStatus, type RoomUnit, type RoomReadiness, type OpsTask, type TaskStatus,
} from "@/data/resort";

import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type Role = "guest" | "frontdesk" | "operations";
export const roleLabels: Record<Role, string> = {
  guest: "Guest",
  frontdesk: "Front Desk Staff",
  operations: "Operations Manager",
};

export interface Enquiry { id: string; name: string; topic: string; createdAt: string }
export interface PlannedActivity { id: string; activityId: string; date: string; slot: string; people: number }

interface State {
  role: Role;
  bookings: Booking[];
  units: RoomUnit[];
  tasks: OpsTask[];
  enquiries: Enquiry[];
  plans: PlannedActivity[];
}

interface Store extends State {
  setRole: (r: Role) => void;
  addBooking: (b: Booking) => Promise<void>;
  updateBooking: (id: string, patch: { status?: BookingStatus; payment?: PaymentStatus }) => Promise<void>;
  setReadiness: (num: string, r: RoomReadiness) => void;
  setTaskStatus: (id: string, s: TaskStatus) => void;
  addEnquiry: (e: Enquiry) => void;
  addPlan: (p: PlannedActivity) => void;
  removePlan: (id: string) => void;
}

const KEY = "azure-ridge-demo-v1";
const initial = (): State => ({ role: "guest", bookings: seedBookings(), units: seedUnits, tasks: seedTasks, enquiries: [], plans: [] });

// Keep one context instance across hot reloads so provider and consumers always match.
const g = globalThis as unknown as { __azureStoreCtx?: React.Context<Store | null> };
const Ctx = (g.__azureStoreCtx ??= createContext<Store | null>(null));

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [privateBookings, setPrivateBookings] = useState<Booking[]>([]);
  const [verifiedRole, setVerifiedRole] = useState<Role>("guest");
  const [state, setState] = useState<State>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const saved = JSON.parse(raw); setState({ ...initial(), units: saved.units ?? seedUnits, tasks: saved.tasks ?? seedTasks }); }
    } catch { /* ignore corrupt demo state */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify({ units: state.units, tasks: state.tasks }));
  }, [state, loaded]);

  useEffect(() => {
    let alive = true;
    setPrivateBookings([]); setVerifiedRole("guest");
    setState(s => ({ ...s, plans: [], enquiries: [] }));
    if (user) {
      supabase.from("guest_state").select("plans,enquiries").eq("user_id", user.id).maybeSingle().then(({ data }) => { if (alive && data) setState(s => ({ ...s, plans: data.plans as unknown as PlannedActivity[], enquiries: data.enquiries as unknown as Enquiry[] })); });
      supabase.from("guest_bookings").select("details").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => { if (alive) setPrivateBookings((data ?? []).map(row => row.details as unknown as Booking)); });
      supabase.from("user_roles").select("role").eq("user_id", user.id).then(({ data }) => { if (alive) setVerifiedRole(data?.some(r => r.role === "operations") ? "operations" : data?.some(r => r.role === "frontdesk") ? "frontdesk" : "guest"); });
    }
    return () => { alive = false; };
  }, [user?.id]);
  const persistGuestState = (next: State) => {
    if (user) supabase.from("guest_state").upsert({ user_id: user.id, plans: next.plans as unknown as Json, enquiries: next.enquiries as unknown as Json }).then(({ error }) => { if (error) console.error("Unable to save guest plans."); });
    return next;
  };
  const store: Store = {
    ...state,
    role: verifiedRole,
    bookings: verifiedRole === "guest" ? privateBookings : state.bookings,
    setRole: () => { /* roles are assigned privately by the resort, not by visitors */ },
    addBooking: async (b) => {
      if (!user) throw new Error("Please sign in to save your booking.");
      const booking = { ...b, guestId: user.id };
      const { error } = await supabase.from("guest_bookings").insert({ id: b.id, user_id: user.id, details: booking as unknown as Json });
      if (error) throw new Error("Your booking could not be saved. Please try again.");
      setPrivateBookings(rows => [booking, ...rows]);
    },
    updateBooking: async (id, patch) => {
      if (verifiedRole !== "guest") { setState(s => ({ ...s, bookings: s.bookings.map(b => b.id === id ? { ...b, ...patch } : b) })); return; }
      const existing = privateBookings.find(b => b.id === id);
      if (!user || !existing) throw new Error("Booking not available.");
      const booking = { ...existing, ...patch };
      const { error } = await supabase.from("guest_bookings").update({ details: booking as unknown as Json }).eq("id", id).eq("user_id", user.id);
      if (error) throw new Error("Unable to update this booking.");
      setPrivateBookings(rows => rows.map(b => b.id === id ? booking : b));
    },
    setReadiness: (num, readiness) => setState((s) => ({ ...s, units: s.units.map((u) => (u.number === num ? { ...u, readiness } : u)) })),
    setTaskStatus: (id, status) => setState((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, status } : t)) })),
    addEnquiry: (e) => setState((s) => persistGuestState({ ...s, enquiries: [e, ...s.enquiries] })),
    addPlan: (p) => setState((s) => persistGuestState({ ...s, plans: [p, ...s.plans] })),
    removePlan: (id) => setState((s) => persistGuestState({ ...s, plans: s.plans.filter((p) => p.id !== id) })),
  };

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore must be used inside StoreProvider");
  return c;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHONE_RE = /^(\+?\d{1,3}[\s-]?)?\d{10}$/;
