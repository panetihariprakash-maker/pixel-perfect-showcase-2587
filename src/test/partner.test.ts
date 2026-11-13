import { describe, expect, it } from "vitest";
import { inventorySummary, partnerRequestSchema, type PublicListing } from "@/lib/partner";

describe("Week 2 partner requests", () => {
  const input = {
    _room_id: "00000000-0000-4000-8000-000000000001",
    _check_in: "2099-01-01",
    _check_out: "2099-01-03",
    _guests: 2,
    _name: "Guest Name",
    _email: "guest@example.com",
    _phone: "9876543210",
    _requests: "",
  };
  it("requires valid guest contact details", () => {
    expect(partnerRequestSchema.safeParse({ ...input, _email: "invalid" }).success).toBe(false);
    expect(partnerRequestSchema.safeParse(input).success).toBe(true);
  });
  it("rejects checkout before check-in", () => {
    expect(partnerRequestSchema.safeParse({ ...input, _check_out: "2098-12-31" }).success).toBe(
      false,
    );
  });
  it("requires an integer guest count", () => {
    expect(partnerRequestSchema.safeParse({ ...input, _guests: 1.5 }).success).toBe(false);
  });
  it("counts only open physical units and subtracts occupied units", () => {
    const listings = [
      {
        rooms: [
          { available: true, units: 5, occupied_units: 2 },
          { available: false, units: 4, occupied_units: 0 },
        ],
      },
    ] as PublicListing[];
    expect(inventorySummary(listings)).toEqual({ available: 3, occupied: 2 });
  });
});
