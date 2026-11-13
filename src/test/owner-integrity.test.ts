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
  it("rejects guest requests to an unapproved property", async () => {
    const guest = accounts[1];
    if (!guest) throw new Error("Test guest missing");
    const res = await call("/rest/v1/rpc/request_partner_stay", guest.token, "POST", {
      _room_id: room,
      _check_in: "2026-12-25",
      _check_out: "2026-12-27",
      _guests: 2,
      _name: "QA Guest",
      _email: "qa@example.com",
      _phone: "9876543210",
      _requests: "",
    });
    expect(res.ok).toBe(false);
  });
  it("saves a guest-linked request with authoritative seasonal total and private readback", async () => {
    const guest = accounts[1];
    const owner = accounts[0];
    if (!guest || !owner || !admin) throw new Error("Test configuration missing");
    const approve = await call(
      `/rest/v1/owner_properties?id=eq.${property}`,
      admin,
      "PATCH",
      { status: "Approved" },
      true,
    );
    expect(approve.ok).toBe(true);
    const res = await call("/rest/v1/rpc/request_partner_stay", guest.token, "POST", {
      _room_id: room,
      _check_in: "2026-12-25",
      _check_out: "2026-12-27",
      _guests: 2,
      _name: "QA Guest",
      _email: "qa@example.com",
      _phone: "9876543210",
      _requests: "Guest request",
    });
    expect(res.ok).toBe(true);
    const id = await res.json();
    const duplicate = await call("/rest/v1/rpc/request_partner_stay", guest.token, "POST", {
      _room_id: room,
      _check_in: "2026-12-25",
      _check_out: "2026-12-27",
      _guests: 2,
      _name: "QA Guest",
      _email: "qa@example.com",
      _phone: "9876543210",
      _requests: "Guest request",
    });
    expect(duplicate.ok).toBe(false);
    const read = await call("/rest/v1/rpc/my_partner_stays", guest.token, "POST", {});
    const rows = await read.json();
    const saved = rows.find((r: { id: string }) => r.id === id);
    expect(saved.amount).toBe(27000);
    expect(saved.status).toBe("Requested");
    expect(saved).not.toHaveProperty("notes");
    expect(saved).not.toHaveProperty("owner_id");
    const otherRead = await call("/rest/v1/rpc/my_partner_stays", owner.token, "POST", {});
    expect(await otherRead.json()).toEqual([]);
    const otherCancel = await call("/rest/v1/rpc/cancel_partner_stay", owner.token, "POST", {
      _id: id,
    });
    expect(otherCancel.ok).toBe(false);
    const cancel = await call("/rest/v1/rpc/cancel_partner_stay", guest.token, "POST", { _id: id });
    expect(cancel.ok).toBe(true);
    const reread = await call("/rest/v1/rpc/my_partner_stays", guest.token, "POST", {});
    expect((await reread.json()).find((r: { id: string }) => r.id === id).status).toBe("Cancelled");
  });
  it("blocks owner-forged guest account linkage", async () => {
    const owner = accounts[0],
      guest = accounts[1];
    if (!owner || !guest) throw new Error("Test accounts missing");
    const res = await call("/rest/v1/owner_reservations", owner.token, "POST", {
      ...request(),
      guest_user_id: guest.id,
    });
    expect(res.ok).toBe(false);
  });
  it("returns real anonymous availability and seasonal prices without guest data", async () => {
    const response = await fetch(`${url}/rest/v1/rpc/partner_room_quote`, {
      method: "POST",
      headers: { apikey: key ?? "", "Content-Type": "application/json" },
      body: JSON.stringify({ _room_id: room, _check_in: "2026-12-19", _check_out: "2026-12-21" }),
    });
    expect(response.ok).toBe(true);
    const quote = await response.json();
    expect(quote.amount).toBe(22500);
    expect(quote.remaining_units).toBe(0);
    expect(quote.available).toBe(false);
    expect(quote.nightly_rates).toEqual([
      { date: "2026-12-19", amount: 9000 },
      { date: "2026-12-20", amount: 13500 },
    ]);
    expect(quote).not.toHaveProperty("guest_name");
    expect(quote).not.toHaveProperty("owner_id");
  });
  it("rejects room capacity below active bookings", async () => {
    const owner = accounts[0];
    if (!owner) throw new Error("Test owner missing");
    const res = await call(`/rest/v1/owner_rooms?id=eq.${room}`, owner.token, "PATCH", {
      capacity: 1,
    });
    expect(res.ok).toBe(false);
  });
  it("rejects reducing units below accepted overlapping stays", async () => {
    const owner = accounts[0];
    if (!owner) throw new Error("Test owner missing");
    const res = await call(`/rest/v1/owner_rooms?id=eq.${room}`, owner.token, "PATCH", {
      units: 0,
    });
    expect(res.ok).toBe(false);
  });
  it("denies room changes and deletion under a suspended property", async () => {
    const owner = accounts[0];
    if (!owner || !admin) throw new Error("Test owner missing");
    const suspend = await call(
      `/rest/v1/owner_properties?id=eq.${property}`,
      admin,
      "PATCH",
      { status: "Suspended" },
      true,
    );
    expect(suspend.ok).toBe(true);
    const update = await call(`/rest/v1/owner_rooms?id=eq.${room}`, owner.token, "PATCH", {
      name: "Forbidden change",
    });
    expect(await update.json()).toEqual([]);
    const remove = await call(`/rest/v1/owner_rooms?id=eq.${room}`, owner.token, "DELETE");
    expect(await remove.json()).toEqual([]);
    const restore = await call(
      `/rest/v1/owner_properties?id=eq.${property}`,
      admin,
      "PATCH",
      { status: "Approved" },
      true,
    );
    expect(restore.ok).toBe(true);
  });
});
