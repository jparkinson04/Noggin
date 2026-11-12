"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/shell/Button";
import { Card } from "@/components/shell/Card";
import { MAX_SCREENSHOTS, MAX_SCREENSHOT_BYTES, SCREENSHOT_TYPES, type AudienceAudit } from "@/lib/audience/types";

const STEPS = [
  "On LinkedIn, open one of your posts from the last six weeks.",
  "Tap the reactions count under it to open the list of who reacted.",
  "Screenshot the list, scrolling if it's long. Or select the list and copy it.",
  "Do the same for your best four or five posts, then add them here.",
];

/** A new audit: the person brings the reactions lists themselves, as screenshots or pasted text. */
export function ReadMyScreenshots({
  hasTarget,
  hasAudit,
  canRun,
  onRead,
  className = "",
}: {
  hasTarget: boolean;
  hasAudit: boolean;
  canRun: boolean;
  onRead: (audit: AudienceAudit) => void;
  className?: string;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [pasted, setPasted] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const picker = useRef<HTMLInputElement>(null);

  function choose(list: FileList | null) {
    const chosen = [...(list ?? [])];
    const tooBig = chosen.find((f) => f.size > MAX_SCREENSHOT_BYTES);
    if (tooBig) return setNote(`${tooBig.name} is over 5 MB. Crop it to the list and try again.`);
    if (chosen.length > MAX_SCREENSHOTS) return setNote(`Up to ${MAX_SCREENSHOTS} screenshots at a time.`);
    setNote("");
    setFiles(chosen);
  }

  async function read() {
    setBusy(true);
    setNote("");
    const form = new FormData();
    files.forEach((f) => form.append("screenshots", f));
    form.append("pasted", pasted);
    try {
      const res = await fetch("/api/audience/audit", { method: "POST", body: form });
      const body = (await res.json()) as { audit?: AudienceAudit; unreadable?: number; error?: string };
      if (!res.ok || !body.audit) return setNote(body.error ?? "Couldn't read those. Nothing was saved.");
      onRead(body.audit);
      setFiles([]);
      setPasted("");
      if (picker.current) picker.current.value = "";
      setNote(body.unreadable ? `Done. ${body.unreadable} row${body.unreadable === 1 ? " was" : "s were"} too blurred to read and left out.` : "Done.");
      window.scrollTo({ top: 0 });
    } catch {
      setNote("Couldn't read those. Nothing was saved.");
    } finally {
      setBusy(false);
    }
  }

  const ready = hasTarget && canRun && (files.length > 0 || pasted.trim().length > 0);
  return (
    <Card as="section" pad={6} className={className}>
      <h2 className="text-xs font-medium text-secondary">{hasAudit ? "Run it again" : "See who's reacting"}</h2>
      <div className="mt-4 grid gap-8 lg:grid-cols-2">
        <div>
          <p className="display text-xl">Bring the lists, Noggin reads them.</p>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-secondary">
            {STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-secondary">
            Noggin never logs in to LinkedIn or collects anything from it for you. It only reads what you add here, and the screenshots are thrown away once
            they&apos;re read.
          </p>
        </div>

        <div>
          <label className="block">
            <span className="text-sm">Screenshots</span>
            <input
              ref={picker}
              type="file"
              multiple
              accept={SCREENSHOT_TYPES.join(",")}
              onChange={(e) => choose(e.target.files)}
              className="mt-2 block w-full text-sm text-secondary file:mr-3 file:h-10 file:rounded-btn file:border file:border-hairline file:bg-card file:px-4 file:text-sm file:text-ink hover:file:border-secondary"
            />
          </label>
          {files.length > 0 && (
            <p className="mt-2 text-xs text-secondary">
              {files.length} screenshot{files.length === 1 ? "" : "s"} ready
            </p>
          )}
          <label className="mt-4 block">
            <span className="text-sm">Or paste a list</span>
            <textarea
              rows={4}
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              placeholder="Names and headlines, copied from the reactions list."
              className="mt-2 w-full resize-y rounded-sm border border-hairline bg-ground px-3 py-2 text-sm text-ink placeholder:text-muted focus-visible:border-secondary focus-visible:outline-none"
            />
          </label>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button variant="primary" onClick={read} disabled={!ready || busy}>
              {busy ? "Reading" : "Read who's reacting"}
            </Button>
            <span className="text-xs text-secondary" role="status">
              {note ||
                (!hasTarget
                  ? "Save who you want to reach first."
                  : !canRun
                    ? "Reading isn't switched on here yet. It needs the Anthropic key."
                    : "")}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
