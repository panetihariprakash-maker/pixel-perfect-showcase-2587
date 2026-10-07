import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  seedBookings, roomUnits as seedUnits, opsTasks as seedTasks,
  type Booking, type BookingStatus, type PaymentStatus, type RoomUnit, type RoomReadiness, type OpsTask, type TaskStatus,
} from "@/data/resort";

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
  addBooking: (b: Booking) => void;
  updateBooking: (id: string, patch: { status?: BookingStatus; payment?: PaymentStatus }) => void;
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
  const [state, setState] = useState<State>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...initial(), ...JSON.parse(raw) });
    } catch { /* ignore corrupt demo state */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, loaded]);

  const store: Store = {
    ...state,
    setRole: (role) => setState((s) => ({ ...s, role })),
    addBooking: (b) => setState((s) => ({ ...s, bookings: [b, ...s.bookings] })),
    updateBooking: (id, patch) => setState((s) => ({ ...s, bookings: s.bookings.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),
    setReadiness: (num, readiness) => setState((s) => ({ ...s, units: s.units.map((u) => (u.number === num ? { ...u, readiness } : u)) })),
    setTaskStatus: (id, status) => setState((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, status } : t)) })),
    addEnquiry: (e) => setState((s) => ({ ...s, enquiries: [e, ...s.enquiries] })),
    addPlan: (p) => setState((s) => ({ ...s, plans: [p, ...s.plans] })),
    removePlan: (id) => setState((s) => ({ ...s, plans: s.plans.filter((p) => p.id !== id) })),
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
