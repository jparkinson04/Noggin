"use client";

import { useState } from "react";
import { useBrain } from "@/components/brain/BrainStore";
import { BrainTabs } from "@/components/brain/BrainTabs";
import { EngineBars } from "@/components/engine/EngineBars";
import { WeekSection } from "@/components/plan/WeekSection";
import { Button, ButtonLink } from "@/components/shell/Button";
import type { Card, Engine, Goal, RegionKey, SourceAnswer } from "@/lib/brain/schema";
import { ENGINES, ENGINE_LABELS, OUTCOME_LABELS, REGION_BLURBS, REGION_LABELS } from "@/lib/brain/schema";
import { ENGINE_COPY } from "@/lib/engine/quiz";
import { MIX_RULES, SITUATION_LABELS, mixFor } from "@/lib/engine/mix";
import { QUESTIONS } from "@/lib/brain/questions";

const REGIONS: RegionKey[] = ["whys", "stories", "opinions", "personality", "receipts"];
const LINK = "text-sm text-secondary underline underline-offset-2 hover:text-ink";
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** "Your words · from sitting 1, question 1 · 2 Aug 2026" */
function provenance(card: Card, source?: SourceAnswer): string {
  const who = card.constructed ? "Constructed" : "Your words";
  const question = QUESTIONS.find((q) => q.id === source?.questionId);
  const from = question
    ? question.topUp
      ? "from a top-up question"
      : `from sitting ${question.sitting}, question ${question.position}`
    : null;
  const when = source?.date ?? card.approvedAt;
  return [who, from, when ? longDate(when) : null].filter(Boolean).join(" · ");
}

/** The brain as an editorial page. The only place constructed text gets approved. */
export default function Board() {
  const { brain, updateCard, removeCard, addCard, setHeadline, setEngineOverride, setSituation, approve } = useBrain();
  const unapproved = brain.deepDiveStatus !== "approved";
  const constructedCount = brain.cards.filter((c) => c.constructed).length;
  const countFor = (region: RegionKey) => brain.cards.filter((c) => c.regionKey === region).length;
  const sourceOf = (id?: string) => brain.answers.find((a) => a.id === id);

  const index: { id: string; label: string; tint?: string; count?: number }[] = [
    { id: "headline", label: "Headline", tint: "var(--color-lobe-headline)" },
    ...REGIONS.map((r) => ({ id: r, label: REGION_LABELS[r], tint: `var(--color-lobe-${r})`, count: countFor(r) })),
    { id: "engine", label: "Engine", tint: "var(--color-lobe-engine)" },
    { id: "week", label: "Your week", tint: "var(--color-signal)" },
    { id: "mix", label: "Mix and cadence", tint: "var(--color-muted)" },
  ];

  return (
    <div className="grid gap-10 px-4 py-6 md:px-6 lg:grid-cols-[220px_760px] lg:gap-16 lg:pt-8">
      {/* Index */}
      <aside className="lg:sticky lg:top-8 lg:self-start">
        <BrainTabs />
        <nav className="mt-8" aria-label="Board sections">
          <ul className="flex flex-wrap gap-x-4 gap-y-1 lg:flex-col lg:gap-0">
            {index.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="flex items-center gap-3 py-1.5 text-sm text-secondary hover:text-ink">
                  <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.tint }} />
                  <span className="flex-1">{item.label}</span>
                  {item.count !== undefined && <span className="text-xs text-muted">{item.count}</span>}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-8 border-t border-hairline pt-5">
          <p className="text-xs text-secondary">
            {constructedCount === 0 ? "Everything here is in your words." : `${constructedCount} card${constructedCount === 1 ? "" : "s"} still constructed`}
          </p>
          {unapproved && (
            <Button variant="primary" className="mt-4 w-full" onClick={approve}>
              Approve my board
            </Button>
          )}
        </div>
      </aside>

      {/* Content */}
      <div className="min-w-0">
        <HeadlineSection headline={brain.headline} options={brain.headlineOptions} onChoose={setHeadline} />

        {REGIONS.map((region) => {
          const cards = brain.cards.filter((c) => c.regionKey === region);
          return (
            <Section key={region} id={region} title={REGION_LABELS[region]} tint={`var(--color-lobe-${region})`} count={cards.length} blurb={REGION_BLURBS[region]}>
              <ul>
                {cards.map((card) => (
                  <CardRow
                    key={card.id}
                    card={card}
                    tint={`var(--color-lobe-${region})`}
                    source={sourceOf(card.sourceAnswerId)}
                    onSave={(patch) => updateCard(card.id, patch)}
                    onRemove={() => removeCard(card.id)}
                  />
                ))}
              </ul>
              <AddCard region={region} onAdd={(title, body) => addCard(region, title, body)} />
            </Section>
          );
        })}

        <Section id="engine" title="Engine" tint="var(--color-lobe-engine)" blurb={REGION_BLURBS.engine}>
          <EngineBars
            quiz={brain.quiz}
            observed={brain.observed}
            primary={brain.enginePrimary}
            secondary={brain.engineSecondary}
            onLeadWith={(engine) => setEngineOverride(engine, secondaryFor(engine, brain.observed?.blend ?? brain.quiz?.blend))}
          />
          {brain.engineOverride && <p className="mt-4 text-xs text-secondary">Your choice, {brain.engineOverride.at}.</p>}
          <div className="mt-8 max-w-[68ch] space-y-4">
            {ENGINE_COPY[brain.enginePrimary].map((para) => (
              <p key={para}>{para}</p>
            ))}
          </div>
        </Section>

        <Section id="week" title="Your week" tint="var(--color-signal)" blurb="What each posting day should serve, dealt from your mix and your blend.">
          <WeekSection brain={brain} />
        </Section>

        <Section id="mix" title="Mix and cadence" tint="var(--color-muted)" blurb="Which of the three outcomes your posts serve, and how often you post.">
          <label className="block text-sm text-secondary">
            Your situation
            <select
              value={brain.goal}
              onChange={(e) => setSituation(e.target.value as Goal)}
              className="mt-2 block w-full max-w-sm rounded-sm border border-hairline bg-ground px-3 py-2 text-base text-ink"
            >
              {(Object.keys(MIX_RULES) as Goal[]).map((g) => (
                <option key={g} value={g}>
                  {SITUATION_LABELS[g]}
                </option>
              ))}
            </select>
          </label>
          <ul className="mt-6 border-b border-hairline">
            {(["top", "middle", "bottom"] as const).map((level) => (
              <li key={level} className="flex items-baseline gap-6 border-t border-hairline py-4">
                <span className="w-32 shrink-0">
                  {cap(OUTCOME_LABELS[level])} <span className="text-secondary">{brain.mix[level]}%</span>
                </span>
                <span className="text-sm text-secondary">{mixFor(brain.goal).reasons[level]}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4">{brain.cadencePerWeek} posts a week</p>
        </Section>
      </div>
    </div>
  );
}

function secondaryFor(primary: Engine, blend?: Record<Engine, number>): Engine | undefined {
  if (!blend) return undefined;
  const rest = ENGINES.filter((e) => e !== primary).sort((a, b) => blend[b] - blend[a]);
  return blend[rest[0]] >= blend[primary] * 0.6 ? rest[0] : undefined;
}

function Section({
  id,
  title,
  tint,
  count,
  blurb,
  children,
}: {
  id: string;
  title: string;
  tint: string;
  count?: number;
  blurb: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-8 border-t border-hairline pt-6 [&+&]:mt-14">
      <div className="flex items-center gap-3">
        <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: tint }} />
        <h2 className="text-2xl">{title}</h2>
        {count !== undefined && (
          <span className="text-sm text-secondary">
            {count} card{count === 1 ? "" : "s"}
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-secondary">{blurb}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function HeadlineSection({
  headline,
  options,
  onChoose,
}: {
  headline: string;
  options: string[];
  onChoose: (line: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(headline);
  const others = options.filter((o) => o !== headline);

  return (
    <Section id="headline" title="Headline" tint="var(--color-lobe-headline)" blurb={REGION_BLURBS.headline}>
      <div className="rounded-md border border-hairline bg-raised p-6">
        {editing ? (
          <div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              aria-label="Your headline"
              className="w-full rounded-sm border border-signal bg-ground p-3 text-base leading-relaxed focus-visible:outline-none"
            />
            <div className="mt-3 flex items-center gap-4">
              <Button variant="primary" size="small" disabled={!draft.trim()} onClick={() => { onChoose(draft.trim()); setEditing(false); }}>
                Save
              </Button>
              <Button size="small" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-6">
            <p className="display text-[1.375rem] leading-snug">{headline}</p>
            <Button size="small" onClick={() => { setDraft(headline); setEditing(true); }}>
              Edit
            </Button>
          </div>
        )}
      </div>
      {others.length > 0 && (
        <>
          <h3 className="mt-8 text-sm text-secondary">Other options, built from your answers</h3>
          <ul className="mt-2 border-b border-hairline">
            {others.map((option) => (
              <li key={option} className="flex items-center justify-between gap-6 border-t border-hairline py-3">
                <span className="text-sm">{option}</span>
                <Button size="small" onClick={() => onChoose(option)}>
                  Use this
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}
    </Section>
  );
}

function CardRow({
  card,
  tint,
  source,
  onSave,
  onRemove,
}: {
  card: Card;
  tint: string;
  source?: SourceAnswer;
  onSave: (patch: Partial<Card>) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [body, setBody] = useState(card.body);
  const off = card.privacy === "off_board";

  if (editing) {
    return (
      <li className="border-t border-hairline py-5">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Card title"
          className="w-full rounded-sm border border-hairline bg-ground px-3 py-2 text-base font-medium focus-visible:outline-none"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          aria-label="Card body"
          rows={5}
          className="mt-3 w-full rounded-sm border border-signal bg-ground p-3 text-base leading-[1.6] focus-visible:outline-none"
        />
        <div className="mt-3 flex items-center gap-4">
          <Button variant="primary" size="small" disabled={!title.trim() || !body.trim()} onClick={() => { onSave({ title: title.trim(), body: body.trim() }); setEditing(false); }}>
            Save
          </Button>
          <Button size="small" onClick={() => { setTitle(card.title); setBody(card.body); setEditing(false); }}>
            Cancel
          </Button>
          <button type="button" className={`${LINK} ml-auto`} onClick={onRemove}>
            Remove this card
          </button>
        </div>
        <p className="mt-3 text-xs text-secondary">Editing marks this as your words. The original answer stays attached.</p>
      </li>
    );
  }

  return (
    <li className={`grid gap-4 border-t border-hairline py-5 md:grid-cols-[1fr_auto] ${off ? "opacity-60" : ""}`}>
      <div className="min-w-0">
        <h3 className="text-base font-medium">{card.title}</h3>
        <p
          className="mt-2 text-base leading-[1.6]"
          style={card.constructed ? undefined : { borderLeft: `2px solid ${tint}`, paddingLeft: 12 }}
        >
          {card.body}
        </p>
        {card.constructed && <span className="mt-2 inline-block text-xs text-signal">constructed, not yet approved</span>}
        <p className="mt-2 text-xs text-secondary">{provenance(card, source)}</p>
      </div>
      <div className="flex flex-col items-start gap-2 md:items-end">
        <div className="flex gap-2">
          <Button size="small" onClick={() => setEditing(true)}>
            Edit
          </Button>
          <ButtonLink size="small" href={source ? `/deep-dive?q=${source.questionId}` : "/deep-dive"}>
            Re-record
          </ButtonLink>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={!off}
          onClick={() => onSave({ privacy: off ? "on_board" : "off_board" })}
          className="flex items-center gap-2 text-xs text-secondary hover:text-ink"
        >
          <span aria-hidden className={`h-2 w-2 rounded-full ${off ? "bg-muted" : "bg-signal"}`} />
          {off ? "Off the board" : "On the board"}
        </button>
      </div>
    </li>
  );
}

function AddCard({ region, onAdd }: { region: RegionKey; onAdd: (title: string, body: string) => void }) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  if (!open) {
    return (
      <Button size="small" className="mt-4" onClick={() => setOpen(true)}>
        Add a card to {REGION_LABELS[region].toLowerCase()}
      </Button>
    );
  }
  return (
    <div className="mt-4 border-t border-hairline pt-4">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        autoFocus
        rows={4}
        placeholder="In your words. The first six become the title."
        className="w-full rounded-sm border border-signal bg-ground p-3 text-base leading-[1.6] placeholder:text-muted focus-visible:outline-none"
      />
      <div className="mt-3 flex gap-3">
        <Button
          variant="primary"
          size="small"
          disabled={!body.trim()}
          onClick={() => {
            const text = body.trim();
            onAdd(text.split(/\s+/).slice(0, 6).join(" ").replace(/[.,;:!?]$/, ""), text);
            setBody("");
            setOpen(false);
          }}
        >
          Save
        </Button>
        <Button size="small" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

