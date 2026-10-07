import { DeepDiveQuestions } from "@/components/deepdive/DeepDiveQuestions";
import { DEEP_DIVE_QUESTIONS, QUESTIONS } from "@/lib/brain/questions";

/** `/deep-dive?q=s1_2` opens on that question; a top-up id works too. Without it, the first one. */
export default async function DeepDive({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const startAt = QUESTIONS.some((question) => question.id === q) ? q! : DEEP_DIVE_QUESTIONS[0].id;
  return <DeepDiveQuestions startAt={startAt} />;
}
