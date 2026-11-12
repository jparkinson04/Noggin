import type { CurrentUser } from "@/lib/auth/currentUser";
import { createClient } from "@/lib/supabase/server";

/** Which brain is theirs. Server only, as the signed-in person. */

export async function findBrainId(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("brains").select("id").eq("owner_id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as { id: string } | null)?.id ?? null;
}

/** Their brain's id, made the first time it's needed. The name stays empty until the profile has one. */
export async function brainFor(user: CurrentUser): Promise<string> {
  const existing = await findBrainId(user.id);
  if (existing) return existing;
  const supabase = await createClient();
  const { error } = await supabase
    .from("brains")
    .upsert({ owner_id: user.id, owner_name: "" }, { onConflict: "owner_id", ignoreDuplicates: true });
  if (error) throw new Error(error.message);
  const made = await findBrainId(user.id);
  if (!made) throw new Error("Couldn't make a brain.");
  return made;
}
