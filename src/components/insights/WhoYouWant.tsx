"use client";

import { useState } from "react";
import { Button } from "@/components/shell/Button";
import { Card } from "@/components/shell/Card";
import { MAX_TARGET_CHARS, type AudienceTarget } from "@/lib/audience/types";

const AREA =
  "w-full resize-none rounded-sm border border-hairline bg-ground px-3 py-2 text-sm text-ink placeholder:text-muted focus-visible:border-secondary focus-visible:outline-none";

/** The two lines every audit is read against: who they want to reach, and what they want from them. */
export function WhoYouWant({ target, onSaved, className = "" }: { target: AudienceTarget; onSaved: (t: AudienceTarget) => void; className?: string }) {
  const [idealClient, setIdealClient] = useState(target.idealClient);
  const [goal, setGoal] = useState(target.goal);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const changed = idealClient.trim() !== target.idealClient || goal.trim() !== target.goal;

  async function save() {
    setState("saving");
    try {
      const res = await fetch("/api/audience/target", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idealClient, goal }),
      });
      if (!res.ok) throw new Error();
      const body = (await res.json()) as { target: AudienceTarget };
      onSaved(body.target);
      setIdealClient(body.target.idealClient);
      setGoal(body.target.goal);
      setState("saved");
    } catch {
      setState("failed");
    }
  }

  return (
    <Card as="section" pad={6} className={className}>
      <h2 className="text-xs font-medium text-secondary">Who you want to reach</h2>
      <label className="mt-4 block">
        <span className="text-sm">Your ideal client</span>
        <span className="mt-1 block text-xs text-secondary">Be specific enough that you could tell from a headline. Job, stage, the problem they have.</span>
        <textarea
          className={`${AREA} mt-2`}
          rows={3}
          maxLength={MAX_TARGET_CHARS}
          value={idealClient}
          onChange={(e) => (setIdealClient(e.target.value), setState("idle"))}
          placeholder="Founders of 10 to 50 person agencies who still do all the selling themselves."
        />
      </label>
      <label className="mt-4 block">
        <span className="text-sm">What you want from them</span>
        <textarea
          className={`${AREA} mt-2`}
          rows={2}
          maxLength={MAX_TARGET_CHARS}
          value={goal}
          onChange={(e) => (setGoal(e.target.value), setState("idle"))}
          placeholder="Two enquiries a month. A speaking slot. A new job by spring."
        />
      </label>
      <div className="mt-4 flex items-center gap-3">
        <Button variant="primary" onClick={save} disabled={!changed || !idealClient.trim() || state === "saving"}>
          Save who I want
        </Button>
        <span className="text-xs text-secondary" role="status">
          {state === "saved" && "Saved. Your next audit is read against this."}
          {state === "failed" && "Couldn't save that. Try again."}
        </span>
      </div>
    </Card>
  );
}
