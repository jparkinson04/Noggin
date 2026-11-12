import { createClient } from "@/lib/supabase/server";

/**
 * One AI call into ai_calls: which job, which answers or cards it read and proposed. It's how we
 * find out which prompts need work (docs/04-ai-rules.md). Never fails the caller.
 */
export async function logAiCall(entry: {
  brainId: string;
  job: "extract" | "follow_up" | "draft_help";
  model: string;
  inputIds: string[];
  outputIds: string[];
  inputTokens?: number;
  outputTokens?: number;
  error?: string;
}): Promise<void> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("ai_calls").insert({
      brain_id: entry.brainId,
      job: entry.job,
      model: entry.model,
      input_ids: entry.inputIds,
      output_ids: entry.outputIds,
      input_tokens: entry.inputTokens ?? null,
      output_tokens: entry.outputTokens ?? null,
      error: entry.error ?? null,
    });
    if (error) console.error("ai log failed", error.message);
  } catch (e) {
    console.error("ai log failed", e instanceof Error ? e.message : e);
  }
}
