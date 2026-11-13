import { describe, expect, it } from "vitest";
import { isExpectedAbort } from "@/lib/error-capture";

describe("HTTP cancellation classification", () => {
  it("recognizes adapter-wrapped aborts", () => {
    expect(isExpectedAbort(new Error("HTTPError", { cause: new DOMException("Disconnected", "AbortError") }))).toBe(true);
  });
  it("does not hide genuine application or network errors", () => {
    expect(isExpectedAbort(new TypeError("Cannot read properties of null"))).toBe(false);
    expect(isExpectedAbort(new Error("HTTPError", { cause: new Error("Connection refused") }))).toBe(false);
  });
});