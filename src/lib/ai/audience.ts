import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import * as z from "zod/v4";
import type { AudiencePerson, AudienceTarget, AudienceTip, ScreenshotType } from "@/lib/audience/types";
import { AUDIENCE_SYSTEM, audienceInput } from "./prompts/audience";

/**
 * Reading names off screenshots and sorting them is a small job, so it runs on the small model to
 * keep an audit to pennies. Set AUDIENCE_MODEL to change it.
 */
export const AUDIENCE_MODEL = process.env.AUDIENCE_MODEL || "claude-haiku-5-5";

const Output = z.object({
  people: z.array(
    z.object({
      name: z.string(),
      headline: z.string(),
      group: z.enum(["ideal", "adjacent", "peer", "other"]),
      why: z.string(),
    })
  ),
  unreadable: z.number(),
  summary: z.string(),
  tips: z.array(z.object({ title: z.string(), body: z.string() })),
});

export interface Screenshot {
  type: ScreenshotType;
  /** base64, no data: prefix */
  data: string;
}

export interface AudienceReading {
  people: AudiencePerson[];
  unreadable: number;
  summary: string;
  tips: AudienceTip[];
}

/** Claude reads the reactions lists and sorts each person against the ideal client. Server only. */
export async function readAudience(input: {
  target: AudienceTarget;
  headline: string;
  cardTitles: Record<string, string[]>;
  screenshots: Screenshot[];
  pasted: string;
}): Promise<{ output: AudienceReading; model: string; usage: Anthropic.Beta.BetaUsage }> {
  const client = new Anthropic();
  const response = await client.beta.messages.parse({
    model: AUDIENCE_MODEL,
    max_tokens: 16000,
    output_config: { format: betaZodOutputFormat(Output) },
    system: AUDIENCE_SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          ...input.screenshots.map((shot) => ({
            type: "image" as const,
            source: { type: "base64" as const, media_type: shot.type, data: shot.data },
          })),
          {
            type: "text" as const,
            text: audienceInput({
              target: input.target,
              headline: input.headline,
              cardTitles: input.cardTitles,
              pasted: input.pasted,
              screenshots: input.screenshots.length,
            }),
          },
        ],
      },
    ],
  });
  if (response.stop_reason === "refusal") throw new Error("The request was declined.");
  if (response.stop_reason === "max_tokens") throw new Error("Ran out of room before the list was finished.");
  if (!response.parsed_output) throw new Error("The audit didn't come back in the expected shape.");
  return { output: response.parsed_output, model: response.model, usage: response.usage };
}
