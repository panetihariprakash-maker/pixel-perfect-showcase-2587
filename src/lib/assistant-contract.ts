import { z } from "zod";

export const assistantRequestSchema = z
  .object({
    language: z.string().min(1).max(40),
    messages: z
      .array(z.object({ role: z.enum(["user", "model"]), text: z.string().min(1).max(4000) }))
      .min(1)
      .max(20),
  })
  .superRefine((value, ctx) => {
    if (value.messages.at(-1)?.role !== "user")
      ctx.addIssue({ code: "custom", message: "The last message must be a question." });
  });
export type AssistantMessage = z.infer<typeof assistantRequestSchema>["messages"][number];

// Project only public facts. Never pass owner identifiers, photos or contact
// records to Gemini, even if the RPC acquires more columns in the future.
export const publicAssistantListingsSchema = z.array(
  z.object({
    name: z.string(),
    kind: z.string(),
    description: z.string(),
    location: z.string(),
    amenities: z.array(z.string()),
    check_in: z.string(),
    check_out: z.string(),
    rooms: z.array(
      z.object({
        name: z.string(),
        room_type: z.string(),
        description: z.string(),
        capacity: z.number(),
        price: z.number(),
        seasonal_price: z.number().nullable(),
        season_start: z.string().nullable(),
        season_end: z.string().nullable(),
        discount_pct: z.number(),
        facilities: z.array(z.string()),
      }),
    ),
  }),
);

export function geminiText(payload: {
  candidates?: {
    content?: { parts?: { text?: string; thought?: boolean }[] };
    finishReason?: string;
  }[];
  promptFeedback?: { blockReason?: string };
}) {
  if (
    payload.promptFeedback?.blockReason ||
    payload.candidates?.some(
      (c) => c.finishReason === "SAFETY" || c.finishReason === "PROHIBITED_CONTENT",
    )
  )
    throw new Error("Gemini could not answer this request.");
  return (
    payload.candidates
      ?.flatMap((c) => c.content?.parts ?? [])
      .filter((p) => !p.thought)
      .map((p) => p.text ?? "")
      .join("") ?? ""
  );
}
