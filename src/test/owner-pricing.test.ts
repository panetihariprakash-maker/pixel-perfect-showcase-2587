import { describe, expect, it } from "vitest";
import { effectivePrice, occupancyPercent } from "@/lib/owner";

const room = { price: 10000, seasonal_price: 15000, season_start: "2026-12-20", season_end: "2027-01-05", discount_pct: 10 };

describe("owner pricing", () => {
  it("applies the discount to the nightly price outside the season", () => {
    expect(effectivePrice(room, "2026-11-01")).toBe(9000);
  });
  it("uses the seasonal price inside the season", () => {
    expect(effectivePrice(room, "2026-12-25")).toBe(13500);
  });
  it("counts only confirmed stays toward occupancy", () => {
    const rooms = [{ id: "a", units: 1, available: true }];
    const from = new Date("2026-11-01T00:00:00Z");
    const res = [
      { room_id: "a", check_in: "2026-11-01", check_out: "2026-11-16", status: "Confirmed" },
      { room_id: "a", check_in: "2026-11-16", check_out: "2026-11-30", status: "Requested" },
    ];
    expect(occupancyPercent(rooms, res, from)).toBe(50);
  });
});
