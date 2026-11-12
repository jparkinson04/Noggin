import { cache } from "react";
import { redirect } from "next/navigation";
import { sampleBrain } from "@/lib/brain/sampleBrain";
import { supabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
}

/**
 * Who is signed in, or null. Without Supabase configured it is always Maya, the sample brain.
 * Cached per request, so the layout and the page share one check.
 */
export const signedInUser = cache(async (): Promise<CurrentUser | null> => {
  if (!supabaseConfigured) return { id: sampleBrain.id, name: sampleBrain.ownerName, email: "maya@example.com" };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  // Email-link sign-in gives us no name, so the address stands in until the profile has one.
  return { id: user.id, name: user.email ?? "", email: user.email ?? "" };
});

/** Who is making this request. The middleware keeps signed-out people away, so there always is someone. */
export async function currentUser(): Promise<CurrentUser> {
  const user = await signedInUser();
  if (!user) redirect("/sign-in");
  return user;
}
