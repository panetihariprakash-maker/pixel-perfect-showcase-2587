import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { activities, diningVenues, facilities, resort, rooms } from "@/data/resort";

const Input = z.object({
  language: z.string().max(30),
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) })).min(1).max(30),
  // Only the active demo guest's bookings are sent by the client.
  myBookings: z.array(z.object({
    id: z.string(), room: z.string(), checkIn: z.string(), checkOut: z.string(), guests: z.number(),
    nights: z.number(), total: z.number(), status: z.string(), payment: z.string(),
  })).max(50),
});

function resortContext() {
  const strip = <T extends object>(o: T) => Object.fromEntries(Object.entries(o).filter(([k]) => k !== "image"));
  return JSON.stringify({
    resort,
    rooms: rooms.map(strip),
    activities: activities.map(strip),
    facilities,
    dining: diningVenues,
  });
}

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data }): Promise<{ ok: true; text: string } | { ok: false; error: string }> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { ok: false, error: "The AI assistant isn't configured right now." };
    const { createOpenAI } = await import("@ai-sdk/openai");
    const { streamText } = await import("ai");

    const instructions = `You are the AI Guest Assistant for ${resort.name}. Be warm, concise (under 150 words), use short bullet lists when listing.
Answer ONLY from the RESORT DATA and GUEST BOOKINGS below. Prices are INR per night (format like ₹8,500). Never invent rooms, prices, activities, facilities, policies or bookings. If something isn't in the data, say it is currently unavailable and suggest contacting guest support (${resort.phone}, ${resort.email}).
Never mention staff operations, housekeeping, maintenance or other guests. Payments are test-only in this demo; never claim a payment succeeded unless the data says Paid.
For planning a stay, recommend suitable rooms/activities from the data and mention the AI Travel Concierge in My Dashboard.
Reply in ${data.language}. If you cannot write that language well, reply in English.

RESORT DATA: ${resortContext()}

GUEST BOOKINGS (current guest only): ${data.myBookings.length ? JSON.stringify(data.myBookings) : "The guest has no bookings."}`;

    try {
      const provider = createOpenAI({
        baseURL: "https://ai.gateway.lovable.dev/v1",
        apiKey,
        headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      });
      const result = streamText({
        model: provider.responses("openai/gpt-6-astra"),
        instructions,
        messages: data.messages,
        maxRetries: 0,
        providerOptions: {
          openai: { store: false, forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", include: ["reasoning.encrypted_content"] },
        },
      });
      const text = (await result.text).trim();
      if (!text) return { ok: false, error: "The assistant couldn't answer that. Please try rephrasing or contact guest support." };
      return { ok: true, text };
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      console.error("assistant error", status, e);
      if (status === 429) return { ok: false, error: "The assistant is busy. Please try again in a moment." };
      if (status === 402) return { ok: false, error: "The AI assistant is temporarily unavailable (usage limit reached)." };
      return { ok: false, error: "The AI assistant is unavailable right now." };
    }
  });
