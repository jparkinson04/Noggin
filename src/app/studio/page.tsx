import { StudioEditor } from "@/components/studio/StudioEditor";

/** `/studio?card=<id>` opens with that card's words in the editor. */
export default async function Studio({ searchParams }: { searchParams: Promise<{ card?: string }> }) {
  const { card } = await searchParams;
  return <StudioEditor cardId={card} />;
}
