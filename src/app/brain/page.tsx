"use client";

import { useMemo, useState } from "react";
import { BrainSections } from "@/components/brain/BrainSections";
import { BrainTabs } from "@/components/brain/BrainTabs";
import { useBrain } from "@/components/brain/BrainStore";
import { RegionColumn } from "@/components/brain/RegionColumn";
import { Card } from "@/components/shell/Card";
import { StageColumn } from "@/components/shell/StageColumn";
import { laneUsage, mappedShare, regionFill, regionHeat } from "@/lib/brain/heat";
import type { RegionKey } from "@/lib/brain/schema";

export default function BrainHome() {
  const { brain } = useBrain();
  const [selected, setSelected] = useState<RegionKey>("whys");
  const [hovered, setHovered] = useState<RegionKey | null>(null);

  const usage = useMemo(() => laneUsage(brain), [brain]);
  const heat = useMemo(() => regionHeat(brain, usage), [brain, usage]);
  const filled = useMemo(() => regionFill(brain), [brain]);
  const mapped = Math.round(mappedShare(brain) * 100);
  const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

  return (
    <StageColumn
      stage={
        <>
          <BrainTabs />
          <Card pad={6} className="flex items-center justify-center">
            <BrainSections
              filled={filled}
              selected={hovered ?? selected}
              onSelect={setSelected}
              onHover={setHovered}
              className="w-full max-w-[720px]"
            />
          </Card>
          <Card pad={5}>
            <p className="text-sm text-secondary">
              {cap(brain.enginePrimary)}
              {brain.engineSecondary ? `, ${brain.engineSecondary} second` : ""} · {brain.cadencePerWeek} a week ·{" "}
              {mapped}% mapped
            </p>
            <p className="display mt-2 max-w-[60ch] text-lg leading-snug">{brain.headline}</p>
          </Card>
        </>
      }
      column={
        // While the cursor is over a region the column shows that one; a click keeps it.
        <RegionColumn brain={brain} region={hovered ?? selected} usage={usage} heat={heat} onPick={setSelected} />
      }
    />
  );
}
