"use client";

import { useEffect, useMemo, useState } from "react";
import { BrainMap } from "@/components/brain/BrainMap";
import { BrainTabs } from "@/components/brain/BrainTabs";
import { useBrain } from "@/components/brain/BrainStore";
import { RegionColumn } from "@/components/brain/RegionColumn";
import { StageColumn } from "@/components/shell/StageColumn";
import { cardCounts, laneUsage, mappedShare, regionHeat } from "@/lib/brain/heat";
import type { RegionKey } from "@/lib/brain/schema";

export default function BrainHome() {
  const { brain, flyIns, consumeFlyIns } = useBrain();
  // A capture since the last visit lands as a dot, once.
  const [landing, setLanding] = useState(0);
  useEffect(() => {
    if (!flyIns) return;
    setLanding(flyIns);
    consumeFlyIns();
    const t = setTimeout(() => setLanding(0), 1000);
    return () => clearTimeout(t);
  }, [flyIns, consumeFlyIns]);
  const [selected, setSelected] = useState<RegionKey>("whys");
  const [hovered, setHovered] = useState<RegionKey | null>(null);

  const usage = useMemo(() => laneUsage(brain), [brain]);
  const heat = useMemo(() => regionHeat(brain, usage), [brain, usage]);
  const mapped = Math.round(mappedShare(brain) * 100);
  // One anchor dot per card on the board; the cloud grows with the count.
  const anchors = useMemo(() => cardCounts(brain), [brain]);

  const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

  return (
    <StageColumn
      stage={
        <div className="relative mx-auto max-w-[1040px]">
          <BrainTabs />
          <div className="mt-4" />
          {landing > 0 && (
            <span
              aria-hidden
              className="fly-in pointer-events-none absolute left-1/2 top-1/2 h-2.5 w-2.5 rounded-full bg-signal"
            />
          )}
          <BrainMap
            heat={heat}
            selected={selected}
            onSelect={setSelected}
            onHover={setHovered}
            anchors={anchors}
          />
          <p className="mt-4 text-center text-sm text-secondary">
            {cap(brain.enginePrimary)}
            {brain.engineSecondary ? `, ${brain.engineSecondary} second` : ""} · {brain.cadencePerWeek} a week ·{" "}
            {mapped}% mapped
          </p>
          <p className="display mx-auto mt-3 max-w-[60ch] text-center text-lg">{brain.headline}</p>
        </div>
      }
      column={
        // While the cursor is over a region the column shows that one; a click keeps it.
        <RegionColumn
          brain={brain}
          region={hovered ?? selected}
          usage={usage}
          heat={heat}
          onPick={setSelected}
        />
      }
    />
  );
}
