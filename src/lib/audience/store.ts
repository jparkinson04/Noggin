import { randomUUID } from "node:crypto";
import type { CurrentUser } from "@/lib/auth/currentUser";
import { brainFor } from "@/lib/brain/brainId";
import { supabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { sampleAudit, sampleTarget } from "./sampleAudit";
import type { AudienceAudit, AudiencePerson, AudienceTarget, AudienceTip } from "./types";

/**
 * Where the ideal client, the goal and the audits are read and written. Without Supabase it's
 * Maya's sample audit, held in memory; with it, the signed-in person's own, through row level
 * security. Server only.
 */

export type NewAudit = Omit<AudienceAudit, "id" | "createdAt"> & { model: string };

const EMPTY: AudienceTarget = { idealClient: "", goal: "" };

// ---- Without Supabase -------------------------------------------------------------------------

interface Memory {
  target: AudienceTarget;
  audit: AudienceAudit | null;
}
const g = globalThis as unknown as { __nogginAudience?: Memory };
function memory(): Memory {
  if (!g.__nogginAudience) {
    // SAMPLE_BRAIN=new is a brand-new person, who has said and uploaded nothing yet.
    g.__nogginAudience =
      process.env.SAMPLE_BRAIN === "new" ? { target: { ...EMPTY }, audit: null } : { target: { ...sampleTarget }, audit: sampleAudit };
  }
  return g.__nogginAudience;
}

// ---- With Supabase ----------------------------------------------------------------------------

interface AuditRow {
  id: string;
  created_at: string;
  ideal_client: string;
  audience_goal: string | null;
  people: AudiencePerson[];
  summary: string;
  tips: AudienceTip[];
  screenshots: number;
}
const AUDIT_COLUMNS = "id, created_at, ideal_client, audience_goal, people, summary, tips, screenshots";

const toAudit = (row: AuditRow): AudienceAudit => ({
  id: row.id,
  createdAt: row.created_at,
  target: { idealClient: row.ideal_client, goal: row.audience_goal ?? "" },
  people: row.people ?? [],
  summary: row.summary,
  tips: row.tips ?? [],
  screenshots: row.screenshots,
});

// ---- The store --------------------------------------------------------------------------------

export async function loadTarget(user: CurrentUser): Promise<AudienceTarget> {
  if (!supabaseConfigured) return memory().target;
  const id = await brainFor(user);
  const supabase = await createClient();
  const { data, error } = await supabase.from("brains").select("ideal_client, audience_goal").eq("id", id).single();
  if (error) throw new Error(error.message);
  const row = data as { ideal_client: string | null; audience_goal: string | null };
  return { idealClient: row.ideal_client ?? "", goal: row.audience_goal ?? "" };
}

export async function saveTarget(user: CurrentUser, target: AudienceTarget): Promise<AudienceTarget> {
  if (!supabaseConfigured) {
    memory().target = target;
    return target;
  }
  const id = await brainFor(user);
  const supabase = await createClient();
  const { error } = await supabase
    .from("brains")
    .update({ ideal_client: target.idealClient || null, audience_goal: target.goal || null })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return target;
}

export async function latestAudit(user: CurrentUser): Promise<AudienceAudit | null> {
  if (!supabaseConfigured) return memory().audit;
  const id = await brainFor(user);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audience_audits")
    .select(AUDIT_COLUMNS)
    .eq("brain_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toAudit(data as unknown as AuditRow) : null;
}

export async function saveAudit(user: CurrentUser, audit: NewAudit): Promise<{ audit: AudienceAudit; brainId: string }> {
  if (!supabaseConfigured) {
    const { model: _model, ...rest } = audit;
    const saved: AudienceAudit = { ...rest, id: randomUUID(), createdAt: new Date().toISOString() };
    memory().audit = saved;
    return { audit: saved, brainId: user.id };
  }
  const brainId = await brainFor(user);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audience_audits")
    .insert({
      brain_id: brainId,
      ideal_client: audit.target.idealClient,
      audience_goal: audit.target.goal || null,
      people: audit.people,
      summary: audit.summary,
      tips: audit.tips,
      screenshots: audit.screenshots,
      model: audit.model,
    })
    .select(AUDIT_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return { audit: toAudit(data as unknown as AuditRow), brainId };
}

/** Removes an audit and the names in it. Row level security keeps it to their own. */
export async function deleteAudit(user: CurrentUser, auditId: string): Promise<void> {
  if (!supabaseConfigured) {
    if (memory().audit?.id === auditId) memory().audit = null;
    return;
  }
  await brainFor(user);
  const supabase = await createClient();
  const { error } = await supabase.from("audience_audits").delete().eq("id", auditId);
  if (error) throw new Error(error.message);
}
