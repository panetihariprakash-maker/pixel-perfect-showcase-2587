import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.SUPABASE_URL;
const admin = process.env.SUPABASE_SERVICE_ROLE_KEY;
const key = process.env.SUPABASE_PUBLISHABLE_KEY;
const ready = !!url && !!admin && !!key;
const accounts: { id: string; token: string }[] = [];
let property = "",
  room = "",
  reservation = "";
async function call(
  path: string,
  token: string,
  method = "GET",
  body?: unknown,
  privileged = false,
) {
  return fetch(`${url}${path}`, {
    method,
    headers: {
      apikey: (privileged ? admin : key) ?? "",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
describe.skipIf(!ready)("Owner reservation integrity", () => {
  beforeAll(async () => {
    if (!admin || !key) return;
    for (let i = 0; i < 2; i++) {
      const email = `azure-owner-qa-${crypto.randomUUID()}@example.com`,
        password = `Mountain8-${crypto.randomUUID()}`;
      const created = await call(
        "/auth/v1/admin/users",
        admin,
        "POST",
        { email, password, email_confirm: true },
        true,
      );
      expect(created.ok).toBe(true);
      const user = await created.json();
      const signed = await call("/auth/v1/token?grant_type=password", key, "POST", {
        email,
        password,
      });
      expect(signed.ok).toBe(true);
      const session = await signed.json();
      accounts.push({ id: user.id, token: session.access_token });
      const owner = await call(
        "/rest/v1/business_owners",
        admin,
        "POST",
        {
          user_id: user.id,
          business_name: "Temporary QA business",
          contact_name: "QA Owner",
          contact_email: email,
          contact_phone: "+919876543210",
          status: "Approved",
        },
        true,
      );
      expect(owner.ok).toBe(true);
    }
    const owner = accounts[0];
    if (!owner) throw new Error("Test owner missing");
    const p = await call("/rest/v1/owner_properties", owner.token, "POST", {
      owner_id: owner.id,
      name: "Temporary QA property",
      kind: "Hotel",
      location: "QA only",
      status: "Draft",
    });
    expect(p.ok).toBe(true);
    property = (await p.json())[0].id;
    const r = await call("/rest/v1/owner_rooms", owner.token, "POST", {
      owner_id: owner.id,
      property_id: property,
      name: "Temporary QA room",
      capacity: 2,
      price: 10000,
      seasonal_price: 15000,
      season_start: "2026-12-20",
      season_end: "2027-01-05",
      discount_pct: 10,
      units: 1,
    });
    expect(r.ok).toBe(true);
    room = (await r.json())[0].id;
  }, 30000);
  afterAll(async () => {
    if (!admin) return;
    for (const account of accounts) {
      await call(
        `/rest/v1/business_owners?user_id=eq.${account.id}`,
        admin,
        "DELETE",
        undefined,
        true,
      );
      await call(`/auth/v1/admin/users/${account.id}`, admin, "DELETE", undefined, true);
    }
  });
  const request = () => {
    const owner = accounts[0];
    if (!owner) throw new Error("Test owner missing");
    return {
      owner_id: owner.id,
      property_id: property,
      room_id: room,
      guest_name: "QA guest",
      check_in: "2026-12-19",
      check_out: "2026-12-21",
      guests: 2,
      amount: 1,
    };
  };
  it("calculates 22500 across the seasonal boundary on the database", async () => {
    const owner = accounts[0];
    if (!owner) throw new Error("Test owner missing");
    const res = await call("/rest/v1/owner_reservations", owner.token, "POST", request());
    expect(res.ok).toBe(true);
    const rows = await res.json();
    reservation = rows[0].id;
    expect(rows[0].amount).toBe(22500);
    expect(rows[0].status).toBe("Requested");
  });
  it("hides the property from another approved owner", async () => {
    const other = accounts[1];
    if (!other) throw new Error("Test owner missing");
    const res = await call(`/rest/v1/owner_properties?id=eq.${property}`, other.token);
    expect(await res.json()).toEqual([]);
  });
  it("rejects overcapacity reservations", async () => {
    const owner = accounts[0];
    if (!owner) throw new Error("Test owner missing");
    const res = await call("/rest/v1/owner_reservations", owner.token, "POST", {
      ...request(),
      guests: 3,
    });
    expect(res.ok).toBe(false);
  });
  it("does not publish a draft in the anonymous catalogue", async () => {
    const res = await fetch(`${url}/rest/v1/rpc/public_listings`, {
      method: "POST",
      headers: { apikey: key ?? "", "Content-Type": "application/json" },
      body: "{}",
    });
    expect(res.ok).toBe(true);
    expect((await res.json()).some((p: { id: string }) => p.id === property)).toBe(false);
  });
  it("prevents two confirmations from using the same single unit on overlapping nights", async () => {
    const owner = accounts[0];
    if (!owner) throw new Error("Test owner missing");
    const confirm = await call(
      `/rest/v1/owner_reservations?id=eq.${reservation}`,
      owner.token,
      "PATCH",
      { status: "Confirmed" },
    );
    expect(confirm.ok).toBe(true);
    const second = await call("/rest/v1/owner_reservations", owner.token, "POST", request());
    expect(second.ok).toBe(true);
    const rows = await second.json();
    const overbook = await call(
      `/rest/v1/owner_reservations?id=eq.${rows[0].id}`,
      owner.token,
      "PATCH",
      { status: "Confirmed" },
    );
    expect(overbook.ok).toBe(false);
  });
  it("keeps platform settings private while exposing only the applications boolean", async () => {
    const owner = accounts[0];
    if (!owner) throw new Error("Test owner missing");
    const settings = await call("/rest/v1/platform_settings", owner.token);
    expect(await settings.json()).toEqual([]);
    const flag = await call("/rest/v1/rpc/owner_applications_open", owner.token, "POST", {});
    expect(flag.ok).toBe(true);
    expect(typeof (await flag.json())).toBe("boolean");
  });
});
