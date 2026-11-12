import type { Brain, Card, LaneUsage, RegionKey } from "@/lib/brain/schema";
import { REGION_BLURBS, REGION_KEYS, REGION_LABELS } from "@/lib/brain/schema";
import { daysSinceLabel } from "@/lib/brain/heat";
import { ButtonLink } from "@/components/shell/Button";
import { Card as CardBox } from "@/components/shell/Card";

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

/** The right-hand column on the Brain page: three cards. The region, its cards, and what to do next. */
export function RegionColumn({ brain, region, usage, heat, onPick }: Props) {
  const cards = brain.cards.filter((c) => c.regionKey === region && c.privacy === "on_board");
  const byCard = new Map(usage.map((u) => [u.cardId, u]));
  const lanes = cards.map((c) => byCard.get(c.id)).filter((u): u is LaneUsage => !!u);
  const status = regionStatus(lanes, heat[region] ?? 0);

  return (
    <>
      <CardBox pad={5}>
        <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Regions">
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
                className={`rounded-full border px-2.5 py-0.5 text-xs ${active ? "border-ink bg-highlight text-ink" : "border-hairline text-secondary hover:text-ink"}`}
              >
                {REGION_LABELS[key]}
              </button>
            );
          })}
        </div>
        <h2 className="mt-4 text-2xl">{REGION_LABELS[region]}</h2>
        <p className="mt-1 text-sm text-secondary">{REGION_BLURBS[region]}</p>
        {status && <span className="mt-3 inline-flex items-center rounded-full bg-highlight px-2.5 py-0.5 text-xs font-medium text-ink">{status}</span>}
      </CardBox>

      <CardBox pad={4} className="flex-1">
        {region === "headline" ? (
          <Row title="Your line" body={brain.headline} />
        ) : region === "engine" ? (
          <EngineRows brain={brain} card={cards[0]} />
        ) : cards.length === 0 ? (
          <p className="p-2 text-sm text-secondary">Nothing here yet. Finish this part of the deep dive and your cards will appear.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {cards.map((card) => {
              const u = byCard.get(card.id);
              return <Row key={card.id} title={card.title} meta={u ? since(u.lastPostedAt) : undefined} body={card.body} constructed={card.constructed} />;
            })}
          </ul>
        )}
      </CardBox>

      <CardBox pad={4} className="flex gap-3">
        <ButtonLink href="/studio" variant="primary">
          Draft from here
        </ButtonLink>
        <ButtonLink href="/brain/board">Open the board</ButtonLink>
      </CardBox>
    </>
  );
}

/** One item: its own small bordered row with the title and when it was last posted. */
function Row({ title, meta, body, constructed }: { title: string; meta?: string; body: string; constructed?: boolean }) {
  return (
    <li className="list-none rounded-card border border-hairline px-4 py-3">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-base font-medium">{title}</h3>
        {meta && <span className="shrink-0 text-xs text-secondary">{meta}</span>}
      </div>
      <p className={`mt-1 line-clamp-2 text-sm text-secondary ${constructed ? "constructed" : ""}`}>{body}</p>
    </li>
  );
}

function EngineRows({ brain, card }: { brain: Brain; card?: Card }) {
  const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
  return (
    <ul className="flex flex-col gap-2">
      <Row title="How you talk" body={`${cap(brain.enginePrimary)}${brain.engineSecondary ? `, ${brain.engineSecondary} second` : ""}`} />
      <Row title="Your mix" body={`${brain.mix.top} visible, ${brain.mix.middle} trustworthy, ${brain.mix.bottom} credible`} />
      <Row title="Cadence" body={`${brain.cadencePerWeek} a week`} />
      {card && <Row title={card.title} body={card.body} constructed={card.constructed} />}
    </ul>
  );
}
