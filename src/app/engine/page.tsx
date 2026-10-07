import { EngineQuiz } from "@/components/engine/EngineQuiz";

/** `/engine` for someone signed in (Maya, for now); `/engine?visitor=1` for the signed-out version. */
export default async function EnginePage({
  searchParams,
}: {
  searchParams: Promise<{ visitor?: string }>;
}) {
  const { visitor } = await searchParams;
  return <EngineQuiz signedIn={!visitor} />;
}
