import { Card } from "@/components/shell/Card";
import type { AudiencePerson } from "@/lib/audience/types";

/** The people who match, by name, so the person can go and talk to them. Noggin never messages anyone. */
export function WorthAConversation({ people, className = "" }: { people: AudiencePerson[]; className?: string }) {
  const ideal = people.filter((p) => p.group === "ideal");
  const adjacent = people.filter((p) => p.group === "adjacent");
  const shown = [...ideal, ...adjacent].slice(0, 10);
  return (
    <Card as="section" pad={6} className={className}>
      <h2 className="text-xs font-medium text-secondary">Worth a conversation</h2>
      {shown.length === 0 ? (
        <p className="mt-4 text-sm text-secondary">Nobody who reacted matches who you want yet. That is the thing to change first.</p>
      ) : (
        <>
          <ul className="mt-4 divide-y divide-hairline">
            {shown.map((p, i) => (
              <li key={`${p.name}-${i}`} className="py-3 first:pt-0 last:pb-0">
                <p className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium">{p.name}</span>
                  <span className="shrink-0 text-xs text-secondary">{p.group === "ideal" ? "Who you want" : "Close to them"}</span>
                </p>
                <p className="text-sm text-secondary">{p.headline}</p>
                {p.why && <p className="mt-1 text-xs text-secondary">{p.why}</p>}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-secondary">Message them yourself, about what they reacted to. Noggin never contacts anyone for you.</p>
        </>
      )}
    </Card>
  );
}
