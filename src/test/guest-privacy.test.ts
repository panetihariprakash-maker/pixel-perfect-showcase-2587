import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Integration checks run only in the secured sandbox, never in the browser.
const url = process.env.SUPABASE_URL;
const admin = process.env.SUPABASE_SERVICE_ROLE_KEY;
const publicKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const ready = !!url && !!admin && !!publicKey;
const accounts: { id: string; token: string }[] = [];
const reference = `AR-QA-${crypto.randomUUID()}`;
async function request(path: string, key: string, token: string, method = "GET", body?: unknown) {
  return fetch(`${url}${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
describe.skipIf(!ready)("Private guest data and payment integrity", () => {
  beforeAll(async () => {
    if (!admin || !publicKey) return;
    for (let i = 0; i < 2; i++) {
      const email = `azure-qa-${crypto.randomUUID()}@example.com`;
      const password = `Mountain8-${crypto.randomUUID()}`;
      const created = await request("/auth/v1/admin/users", admin, admin, "POST", {
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: "Privacy Test Guest", mobile: "+919876543210" },
      });
      expect(created.ok).toBe(true);
      const profile = await created.json();
      const signedIn = await request(
        "/auth/v1/token?grant_type=password",
        publicKey,
        publicKey,
        "POST",
        { email, password },
      );
      expect(signedIn.ok).toBe(true);
      const session = await signedIn.json();
      accounts.push({ id: profile.id, token: session.access_token });
    }
  }, 30000);
  afterAll(async () => {
    if (!admin) return;
    for (const account of accounts)
      await request(`/auth/v1/admin/users/${account.id}`, admin, admin, "DELETE");
  });
  it("creates the private full name and mobile profile at signup", async () => {
    const owner = accounts[0];
    if (!owner || !publicKey) throw new Error("Test account unavailable");
    const res = await request(
      `/rest/v1/profiles?id=eq.${owner.id}&select=full_name,mobile`,
      publicKey,
      owner.token,
    );
    expect(await res.json()).toEqual([
      { full_name: "Privacy Test Guest", mobile: "+919876543210" },
    ]);
  });
  it("prevents a guest from reading another guest profile", async () => {
    const [owner, other] = accounts;
    if (!owner || !other || !publicKey) throw new Error("Test accounts unavailable");
    const res = await request(
      `/rest/v1/profiles?id=eq.${owner.id}&select=id`,
      publicKey,
      other.token,
    );
    expect(await res.json()).toEqual([]);
  });
  it("keeps another guest’s booking and payment information private", async () => {
    const [owner, other] = accounts;
    if (!owner || !other || !publicKey) throw new Error("Test accounts unavailable");
    const details = {
      id: reference,
      guestId: owner.id,
      payment: "Payment Ready/Test",
      status: "Pending",
      roomId: "deluxe-valley",
      checkIn: "2026-12-01",
      checkOut: "2026-12-03",
      guests: 2,
      nights: 2,
      total: 17000,
      guestName: "Privacy Test Guest",
      email: "guest@example.com",
      phone: "+919876543210",
    };
    const insert = await request("/rest/v1/guest_bookings", publicKey, owner.token, "POST", {
      id: reference,
      user_id: owner.id,
      details,
    });
    expect(insert.ok).toBe(true);
    const readOwn = await request(
      `/rest/v1/guest_bookings?id=eq.${reference}`,
      publicKey,
      owner.token,
    );
    expect((await readOwn.json()).length).toBe(1);
    const readOther = await request(
      `/rest/v1/guest_bookings?id=eq.${reference}`,
      publicKey,
      other.token,
    );
    expect(await readOther.json()).toEqual([]);
  });
  it("does not allow a guest to assign staff roles", async () => {
    const owner = accounts[0];
    if (!owner || !publicKey) throw new Error("Test account unavailable");
    const res = await request("/rest/v1/user_roles", publicKey, owner.token, "POST", {
      user_id: owner.id,
      role: "operations",
    });
    expect(res.ok).toBe(false);
  });
  const bookingDetails = (id: string, guestId: string) => ({
    id,
    guestId,
    payment: "Payment Ready/Test",
    status: "Pending",
    roomId: "deluxe-valley",
    checkIn: "2026-12-01",
    checkOut: "2026-12-03",
    guests: 2,
    nights: 2,
    total: 17000,
    guestName: "Validation Guest",
    email: "guest@example.com",
    phone: "+919876543210",
  });
  it("rejects guest counts above the Deluxe room capacity of two", async () => {
    const owner = accounts[0];
    if (!owner || !publicKey) throw new Error("Test account unavailable");
    const id = reference + "-capacity";
    const res = await request("/rest/v1/guest_bookings", publicKey, owner.token, "POST", {
      id,
      user_id: owner.id,
      details: { ...bookingDetails(id, owner.id), guests: 3 },
    });
    expect(res.ok).toBe(false);
  });
  it("rejects a forged total instead of the 17000 two-night amount", async () => {
    const owner = accounts[0];
    if (!owner || !publicKey) throw new Error("Test account unavailable");
    const id = reference + "-amount";
    const res = await request("/rest/v1/guest_bookings", publicKey, owner.token, "POST", {
      id,
      user_id: owner.id,
      details: { ...bookingDetails(id, owner.id), total: 1 },
    });
    expect(res.ok).toBe(false);
  });
  it("rejects checkout on or before check-in", async () => {
    const owner = accounts[0];
    if (!owner || !publicKey) throw new Error("Test account unavailable");
    const id = reference + "-dates";
    const res = await request("/rest/v1/guest_bookings", publicKey, owner.token, "POST", {
      id,
      user_id: owner.id,
      details: { ...bookingDetails(id, owner.id), checkOut: "2026-12-01", nights: 0, total: 0 },
    });
    expect(res.ok).toBe(false);
  });
  it("rejects malformed saved state instead of breaking Dashboard array rendering", async () => {
    const owner = accounts[0];
    if (!owner || !publicKey) throw new Error("Test account unavailable");
    const res = await request("/rest/v1/guest_state", publicKey, owner.token, "POST", {
      user_id: owner.id,
      plans: {},
      enquiries: [],
    });
    expect(res.ok).toBe(false);
  });
  it("rejects a guest marking a test booking as paid", async () => {
    const owner = accounts[0];
    if (!owner || !publicKey) throw new Error("Test account unavailable");
    const res = await request(
      `/rest/v1/guest_bookings?id=eq.${reference}`,
      publicKey,
      owner.token,
      "PATCH",
      { details: { id: reference, guestId: owner.id, payment: "Paid", status: "Pending" } },
    );
    expect(res.ok).toBe(false);
  });
  it("persists and retrieves a complete private enquiry and activity plan", async () => {
    const [owner, other] = accounts;
    if (!owner || !other || !publicKey) throw new Error("Test accounts unavailable");
    const enquiry = {
      id: reference,
      name: "Privacy Test Guest",
      email: "guest@example.com",
      phone: "+919876543210",
      checkIn: "2026-12-01",
      checkOut: "2026-12-03",
      guests: 2,
      topic: "Dining",
      language: "English",
      message: "Please confirm vegetarian options.",
      createdAt: "2026-11-13T00:00:00Z",
    };
    const plan = {
      id: reference,
      activityId: "waterfall-trail",
      date: "2026-12-02",
      slot: "8:00 AM",
      people: 2,
    };
    const save = await request("/rest/v1/guest_state", publicKey, owner.token, "POST", {
      user_id: owner.id,
      plans: [plan],
      enquiries: [enquiry],
    });
    expect(save.ok).toBe(true);
    const own = await request(
      `/rest/v1/guest_state?user_id=eq.${owner.id}&select=plans,enquiries`,
      publicKey,
      owner.token,
    );
    expect(await own.json()).toEqual([{ plans: [plan], enquiries: [enquiry] }]);
    const denied = await request(
      `/rest/v1/guest_state?user_id=eq.${owner.id}`,
      publicKey,
      other.token,
    );
    expect(await denied.json()).toEqual([]);
  });
  it("updates only the authenticated profile and keeps the account summary synchronized", async () => {
    const [owner, other] = accounts;
    if (!owner || !other || !publicKey) throw new Error("Test accounts unavailable");
    const update = await request(
      `/rest/v1/profiles?id=eq.${owner.id}`,
      publicKey,
      owner.token,
      "PATCH",
      { full_name: "Updated Test Guest", mobile: "+919999999999" },
    );
    expect(update.ok).toBe(true);
    const summary = await request(
      `/rest/v1/user?id=eq.${owner.id}&select=name,phone,role`,
      publicKey,
      owner.token,
    );
    expect(await summary.json()).toEqual([
      { name: "Updated Test Guest", phone: "+919999999999", role: "guest" },
    ]);
    const cross = await request(
      `/rest/v1/profiles?id=eq.${owner.id}`,
      publicKey,
      other.token,
      "PATCH",
      { full_name: "Wrong Guest" },
    );
    expect(await cross.json()).toEqual([]);
  });
});
