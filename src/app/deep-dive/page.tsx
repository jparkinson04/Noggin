import { DeepDiveQuestions } from "@/components/deepdive/DeepDiveQuestions";
import { currentUser } from "@/lib/auth/currentUser";
import { loadResponses } from "@/lib/brain/answerStore";
import { DEEP_DIVE_QUESTIONS, QUESTIONS } from "@/lib/brain/questions";
import { supabaseConfigured } from "@/lib/supabase/config";

/**
 * `/deep-dive?q=s1_2` opens on that question; a top-up id works too. Without it, the first one
 * they haven't answered, so coming back picks up where they left off.
 */
export default async function DeepDive({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const user = await currentUser();
  const saved = supabaseConfigured ? await loadResponses(user.id) : {};
  const startAt =
    QUESTIONS.find((question) => question.id === q) ??
    DEEP_DIVE_QUESTIONS.find((question) => !saved[question.id]) ??
    DEEP_DIVE_QUESTIONS[DEEP_DIVE_QUESTIONS.length - 1];
  return <DeepDiveQuestions startAt={startAt.id} saved={saved} userId={user.id} />;
}
