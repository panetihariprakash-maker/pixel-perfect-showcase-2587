import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Route } from "@/routes/api/public/assistant";

const handlers = Route.options.server?.handlers;
const handler = handlers && typeof handlers !== "function" ? handlers.POST : undefined;
const request = (signal?: AbortSignal) =>
  new Request("http://localhost:8080/api/public/assistant", {
    method: "POST",
    signal,
    headers: { Origin: "http://localhost:8080", "Content-Type": "application/json" },
    body: JSON.stringify({
      language: "English",
      messages: [{ role: "user", text: "Tell me about rooms" }],
    }),
  });
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("Assistant cancellation", () => {
  beforeEach(() => {
    vi.stubEnv("SUPABASE_URL", "https://test.invalid");
    vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "test-public-key");
  });
  it("returns 499 without contacting Gemini for an already cancelled request", async () => {
    const controller = new AbortController();
    controller.abort();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    if (typeof handler !== "function") throw new Error("Assistant handler missing");
    const response = await handler({ request: request(controller.signal) } as Parameters<
      typeof handler
    >[0]);
    if (!(response instanceof Response)) throw new Error("Expected HTTP response");
    expect(response.status).toBe(499);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("handles cancellation before upstream headers as 499, not 500", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-only-key");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(Response.json([]))
        .mockRejectedValueOnce(new DOMException("Aborted", "AbortError")),
    );
    if (typeof handler !== "function") throw new Error("Assistant handler missing");
    const response = await handler({ request: request() } as Parameters<typeof handler>[0]);
    if (!(response instanceof Response)) throw new Error("Expected HTTP response");
    expect(response.status).toBe(499);
  });
  it("cancels the locked upstream reader safely when the response is closed", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-only-key");
    const cancel = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(Response.json([]))
        .mockResolvedValueOnce(new Response(new ReadableStream({ cancel }))),
    );
    if (typeof handler !== "function") throw new Error("Assistant handler missing");
    const response = await handler({ request: request() } as Parameters<typeof handler>[0]);
    if (!(response instanceof Response)) throw new Error("Expected HTTP response");
    expect(response.status).toBe(200);
    await response.body?.cancel();
    expect(cancel).toHaveBeenCalledOnce();
  });
  it("does not call Gemini when the public database query fails", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-only-key");
    const fetchMock = vi.fn().mockResolvedValue(Response.json({}, { status: 403 }));
    vi.stubGlobal("fetch", fetchMock);
    if (typeof handler !== "function") throw new Error("Assistant handler missing");
    const response = await handler({ request: request() } as Parameters<typeof handler>[0]);
    if (!(response instanceof Response)) throw new Error("Expected HTTP response");
    expect(response.status).toBe(200);
    expect(JSON.parse(await response.text()).error).toContain("Unable to read");
    expect(fetchMock).toHaveBeenCalledOnce();
  });
  it.each([503, 429])(
    "delivers provider %s as an explicit chat failure, not a page failure",
    async (status) => {
      vi.stubEnv("GEMINI_API_KEY", "test-only-key");
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockResolvedValueOnce(Response.json([]))
          .mockResolvedValueOnce(new Response(null, { status })),
      );
      if (typeof handler !== "function") throw new Error("Assistant handler missing");
      const response = await handler({ request: request() } as Parameters<typeof handler>[0]);
      if (!(response instanceof Response)) throw new Error("Expected HTTP response");
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/x-ndjson");
      const event = JSON.parse(await response.text());
      expect(event.providerStatus).toBe(status);
      expect(event.error.length).toBeGreaterThan(0);
      expect(event).not.toHaveProperty("text");
    },
  );
});
