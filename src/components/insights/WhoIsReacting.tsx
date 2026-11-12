import { Card } from "@/components/shell/Card";
import { breakdown } from "@/lib/audience/breakdown";
import { GROUP_BLURBS, GROUP_LABELS, type AudienceAudit, type AudienceGroup } from "@/lib/audience/types";

/** One fill per group, all from the tokens. The legend carries the names, so colour is never the only cue. */
const FILL: Record<AudienceGroup, string> = {
  ideal: "bg-brand",
  adjacent: "bg-signal",
  peer: "bg-lobe-engine",
  other: "bg-hairline",
};

/** The split: how many of the people reacting are the people they said they want. */
export function WhoIsReacting({ audit, hasTarget, className = "" }: { audit: AudienceAudit | null; hasTarget: boolean; className?: string }) {
  if (!audit) {
    return (
      <Card as="section" pad={6} className={className}>
        <h2 className="text-xs font-medium text-secondary">Who&apos;s reacting</h2>
        <p className="display mt-4 text-2xl">Nothing read yet.</p>
        <p className="mt-2 max-w-[52ch] text-sm text-secondary">
          {hasTarget
            ? "Add screenshots of who reacted to your last few posts below, and this shows how many of them are the people you want."
            : "Say who you want to reach first. Then add screenshots of who reacted to your last few posts, and this shows how many of them are the people you want."}
        </p>
      </Card>
    );
  }

  const shares = breakdown(audit.people);
  const ideal = shares[0];
  const total = audit.people.length;
  return (
    <Card as="section" pad={6} className={className}>
      <h2 className="text-xs font-medium text-secondary">Who&apos;s reacting</h2>
      <p className="mt-4">
        <span className="display text-5xl leading-none">{ideal.percent}%</span>
        <span className="mt-2 block text-sm text-secondary">
          {ideal.count} of the {total} {total === 1 ? "person" : "people"} who reacted {ideal.count === 1 ? "is" : "are"} who you want
        </span>
      </p>

      <div className="mt-5 flex h-3 overflow-hidden rounded-sm border border-hairline" aria-hidden>
        {shares.map((s) => s.count > 0 && <span key={s.group} className={FILL[s.group]} style={{ width: `${(s.count / total) * 100}%` }} />)}
      </div>
      <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {shares.map((s) => (
          <div key={s.group} className="grid grid-cols-[0.75rem_1fr_auto] items-baseline gap-x-2">
            <span className={`h-2.5 w-2.5 self-center rounded-full border border-secondary ${FILL[s.group]}`} aria-hidden />
            <dt className="text-sm">{GROUP_LABELS[s.group]}</dt>
            <dd className="text-sm tabular-nums">
              {s.count} <span className="text-secondary">· {s.percent}%</span>
            </dd>
            <p className="col-start-2 col-end-4 text-xs text-secondary">{GROUP_BLURBS[s.group]}</p>
          </div>
        ))}
      </dl>

      {audit.summary && <p className="mt-5 border-t border-hairline pt-4 text-sm">{audit.summary}</p>}
    </Card>
  );
}
