"use client";

import { useState } from "react";
import { Card } from "@/components/shell/Card";
import type { AudienceAudit, AudienceTarget } from "@/lib/audience/types";
import { WhoYouWant } from "./WhoYouWant";
import { WhoIsReacting } from "./WhoIsReacting";
import { WorthAConversation } from "./WorthAConversation";
import { ReadMyScreenshots } from "./ReadMyScreenshots";

/** The whole Insights page: who they want, who they're getting, what to change, and a new audit. */
export function AudienceInsights({
  initialTarget,
  initialAudit,
  canRun,
}: {
  initialTarget: AudienceTarget;
  initialAudit: AudienceAudit | null;
  canRun: boolean;
}) {
  const [target, setTarget] = useState(initialTarget);
  const [audit, setAudit] = useState(initialAudit);
  const hasTarget = Boolean(target.idealClient.trim());

  async function removeAudit() {
    if (!audit) return;
    const res = await fetch(`/api/audience/audit/${audit.id}`, { method: "DELETE" });
    if (res.ok) setAudit(null);
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-4xl">Insights</h1>
        <p className="mt-2 text-secondary">Who your posts are reaching, against who you want them to reach.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-12">
        <WhoYouWant target={target} onSaved={setTarget} className="lg:col-span-5" />
        <WhoIsReacting audit={audit} hasTarget={hasTarget} className="lg:col-span-7" />

        {audit && (
          <>
            <Card as="section" pad={6} className="lg:col-span-7">
              <h2 className="text-xs font-medium text-secondary">What to change</h2>
              <ol className="mt-4 space-y-5">
                {audit.tips.map((tip, i) => (
                  <li key={i} className="grid grid-cols-[2rem_1fr] gap-x-3">
                    <span className="display text-xl text-muted" aria-hidden>
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="text-lg">{tip.title}</h3>
                      <p className="mt-1 text-sm text-secondary">{tip.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
            <WorthAConversation people={audit.people} className="lg:col-span-5" />
          </>
        )}

        <ReadMyScreenshots hasTarget={hasTarget} hasAudit={Boolean(audit)} canRun={canRun} onRead={setAudit} className="lg:col-span-12" />
      </div>

      {audit && (
        <p className="mt-4 text-xs text-secondary">
          Read on {new Date(audit.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" })}
          {audit.screenshots > 0 ? ` from ${audit.screenshots} screenshot${audit.screenshots === 1 ? "" : "s"}` : " from a pasted list"}. The screenshots
          weren&apos;t kept.{" "}
          <button type="button" onClick={removeAudit} className="underline underline-offset-2 hover:text-ink">
            Delete this audit and the names in it
          </button>
        </p>
      )}
    </div>
  );
}
