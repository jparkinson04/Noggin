import { sampleBrain } from "@/lib/brain/sampleBrain";

/**
 * Who is making this request. There is no auth yet, so it is always Maya.
 * TODO(dev): replace with the Supabase session user (createServerClient(...).auth.getUser()).
 */
export async function currentUser(): Promise<{ id: string; name: string }> {
  return { id: sampleBrain.id, name: sampleBrain.ownerName };
}
