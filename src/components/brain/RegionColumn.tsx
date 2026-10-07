import type { Brain, Card, LaneUsage, RegionKey } from "@/lib/brain/schema";
import { REGION_BLURBS, REGION_KEYS, REGION_LABELS } from "@/lib/brain/schema";
import { daysSinceLabel } from "@/lib/brain/heat";
import { ButtonLink } from "@/components/shell/Button";

interface Props {
  brain: Brain;
  region: RegionKey;
  usage: LaneUsage[];
  heat: Record<RegionKey, number>;
  onPick: (key: RegionKey) => void;
}

/** "8 weeks" rather than "8 weeks ago": the row already says what the number is. */
const since = (iso?: string) => (iso ? daysSinceLabel(iso).replace(/ ago$/, "") : "never posted");

/** One line about the region as a whole, from its lanes. Regions without lanes (engine, headline) get none. */
function regionStatus(lanes: LaneUsage[], heat: number): string | null {
  if (!lanes.length) return null;
  const last = lanes
    .map((l) => l.lastPostedAt)
    .filter((d): d is string => !!d)
    .sort()
    .at(-1);
  if (!last) return "Never posted";
  const when = `last posted ${daysSinceLabel(last)}`;
  if (lanes.some((l) => l.status === "overworked")) return `Overworked · ${when}`;
  if (heat === 0) return `Gone quiet · ${when}`;
  if (heat < 0.4) return `Fading · ${when}`;
  return `Fresh · ${when}`;
}

/** The right-hand column on the Brain page: one region, its cards, and what to do next. */
export function RegionColumn({ brain, region, usage, heat, onPick }: Props) {
  const cards = brain.cards.filter((c) => c.regionKey === region && c.privacy === "on_board");
  const byCard = new Map(usage.map((u) => [u.cardId, u]));
  const lanes = cards.map((c) => byCard.get(c.id)).filter((u): u is LaneUsage => !!u);
  const status = regionStatus(lanes, heat[region] ?? 0);
  const tint = `var(--color-lobe-${region})`;

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex items-center gap-3" role="tablist" aria-label="Regions">
        {REGION_KEYS.map((key) => {
          const active = key === region;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={REGION_LABELS[key]}
              onClick={() => onPick(key)}
              className={`rounded-full ${active ? "h-3.5 w-3.5" : "h-2.5 w-2.5 opacity-45 hover:opacity-100"}`}
              style={{ background: `var(--color-lobe-${key})` }}
            />
          );
        })}
      </div>

      <h2 className="mt-6 text-3xl">{REGION_LABELS[region]}</h2>
      <p className="mt-2 text-sm text-secondary">{REGION_BLURBS[region]}</p>
      {status && (
        <p className="mt-3 text-sm" style={{ color: tint }}>
          {status}
        </p>
      )}

      <div className="mt-8 flex-1">
        {region === "headline" ? (
          <Row title="Your line" body={brain.headline} />
        ) : region === "engine" ? (
          <EngineRows brain={brain} card={cards[0]} />
        ) : cards.length === 0 ? (
          <p className="border-t border-hairline pt-4 text-sm text-secondary">
            Nothing here yet. Finish this part of the deep dive and your cards will appear.
          </p>
        ) : (
          cards.map((card) => {
            const u = byCard.get(card.id);
            return (
              <Row
                key={card.id}
                title={card.title}
                meta={u ? since(u.lastPostedAt) : undefined}
                body={card.body}
                constructed={card.constructed}
              />
            );
          })
        )}
      </div>

      <footer className="mt-10 flex gap-3">
        <ButtonLink href="/studio" variant="primary">
          Draft from here
        </ButtonLink>
        <ButtonLink href="/brain/board">Open the board</ButtonLink>
      </footer>
    </div>
  );
}

function Row({
  title,
  meta,
  body,
  constructed,
}: {
  title: string;
  meta?: string;
  body: string;
  constructed?: boolean;
}) {
  return (
    <article className="border-t border-hairline py-4">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-base font-medium">{title}</h3>
        {meta && <span className="shrink-0 text-xs text-secondary">{meta}</span>}
      </div>
      <p className={`mt-1 text-sm text-secondary ${constructed ? "constructed" : ""}`}>{body}</p>
    </article>
  );
}

function EngineRows({ brain, card }: { brain: Brain; card?: Card }) {
  const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
  return (
    <>
      <Row
        title="How you talk"
        body={`${cap(brain.enginePrimary)}${brain.engineSecondary ? `, ${brain.engineSecondary} second` : ""}`}
      />
      <Row
        title="Your mix"
        body={`${brain.mix.top} visible, ${brain.mix.middle} trustworthy, ${brain.mix.bottom} credible`}
      />
      <Row title="Cadence" body={`${brain.cadencePerWeek} a week`} />
      {card && <Row title={card.title} body={card.body} constructed={card.constructed} />}
    </>
  );
}
