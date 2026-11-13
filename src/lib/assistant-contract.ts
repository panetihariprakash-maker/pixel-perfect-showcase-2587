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
