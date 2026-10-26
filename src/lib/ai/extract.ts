import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import * as z from "zod/v4";
import { CARD_KINDS } from "@/lib/brain/savedBrain";
import type { SourceAnswer } from "@/lib/brain/schema";
import { EXTRACT_SYSTEM, extractInput } from "./prompts/extract";
import type { ExtractOutput } from "./proposedCards";

/** Building the board is the moment the product has to get right, so it gets the strongest model. */
export const EXTRACT_MODEL = "claude-opus-5-5";

const Output = z.object({
  cards: z.array(
    z.object({
      answerId: z.string(),
      region: z.enum(["whys", "stories", "opinions", "personality", "receipts"]),
      kind: z.enum(CARD_KINDS),
      title: z.string(),
      body: z.string(),
      angles: z.array(z.string()),
      keywords: z.array(z.string()),
      outcome: z.enum(["visible", "trustworthy", "credible"]),
      involvesOthers: z.boolean(),
    })
  ),
  headlines: z.array(z.string()),
});

export function aiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** Claude reads every answer and proposes cards and three headlines. Server only. */
export async function extractBoard(answers: SourceAnswer[]): Promise<{ output: ExtractOutput; model: string; usage: Anthropic.Beta.BetaUsage }> {
  const client = new Anthropic();
  const response = await client.beta.messages.parse({
    model: EXTRACT_MODEL,
    max_tokens: 16000,
    // These answers can be about hard things. If a safety classifier declines, Anthropic re-runs
    // the request on its recommended fallback model instead of failing.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: betaZodOutputFormat(Output) },
    system: EXTRACT_SYSTEM,
    messages: [{ role: "user", content: extractInput(answers) }],
  });
  if (response.stop_reason === "refusal") throw new Error("The request was declined.");
  if (response.stop_reason === "max_tokens") throw new Error("Ran out of room before the board was finished.");
  if (!response.parsed_output) throw new Error("The board didn't come back in the expected shape.");
  return { output: response.parsed_output, model: response.model, usage: response.usage };
}
