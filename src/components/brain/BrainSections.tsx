"use client";

import type { RegionKey } from "@/lib/brain/schema";
import { REGION_LABELS } from "@/lib/brain/schema";

/**
 * The brain as five sections that fill from the bottom. One silhouette, split into Whys, Opinions,
 * Receipts, Stories and Personality with clear gaps; each section fills in the brand green over the
 * card-border colour by how mapped it is, with its name and percentage inside.
 */
export type MapRegion = "whys" | "opinions" | "receipts" | "stories" | "personality";
export const MAP_REGIONS: MapRegion[] = ["whys", "opinions", "receipts", "stories", "personality"];

export interface BrainSectionsProps {
  /** 0..1 per region: how much of it is mapped. */
  filled: Record<RegionKey, number>;
  selected?: RegionKey | null;
  onSelect?: (key: RegionKey) => void;
  onHover?: (key: RegionKey | null) => void;
  /** Small: no labels, no interaction. */
  compact?: boolean;
  className?: string;
}

const VIEW = { x: 96, y: 40, w: 490, h: 330 };

const SILHOUETTE =
  "M120 225 C112 140 190 70 305 62 C430 54 522 100 550 188 C568 258 512 316 452 326 C426 330 406 326 384 338 C350 356 300 352 255 340 C215 330 190 320 175 300 C168 290 182 284 172 272 C140 262 124 246 120 225 Z";

/**
 * Each section is a generous polygon in silhouette coordinates, clipped to the silhouette.
 * They overlap a little and are drawn with a ground-coloured stroke, which is what makes the gaps.
 * Drawn in this order so the centre sits on top.
 */
const SECTIONS: Record<MapRegion, { points: string; label: [number, number] }> = {
  whys: { points: "90,30 292,30 318,205 262,370 90,370", label: [196, 205] },
  opinions: { points: "292,30 600,30 600,200 440,222 318,205", label: [420, 125] },
  receipts: { points: "440,222 600,200 600,370 420,370 445,262", label: [500, 262] },
  stories: { points: "262,370 318,205 262,262 445,262 420,370", label: [340, 318] },
  personality: { points: "300,196 448,210 452,268 258,268", label: [355, 236] },
};

/** The y-range of a section, from its polygon, so the fill can rise from its own bottom. */
function range(points: string): [number, number] {
  const ys = points.split(" ").map((p) => Number(p.split(",")[1]));
  return [Math.min(...ys), Math.max(...ys)];
}

export function BrainSections({ filled, selected, onSelect, onHover, compact = false, className }: BrainSectionsProps) {
  const interactive = !compact && !!onSelect;
  return (
    <svg
      viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
      className={className}
      role={interactive ? "group" : "img"}
      aria-label="Your brain, by region"
      style={{ width: "100%", height: "auto", display: "block" }}
      onMouseLeave={interactive ? () => onHover?.(null) : undefined}
    >
      <defs>
        <clipPath id="brain-outline">
          <path d={SILHOUETTE} />
        </clipPath>
        {MAP_REGIONS.map((key) => {
          const [top, bottom] = range(SECTIONS[key].points);
          const level = Math.max(0, Math.min(1, filled[key] ?? 0));
          const h = (bottom - top) * level;
          return (
            <clipPath key={key} id={`fill-${key}`}>
              <rect x={0} y={bottom - h} width={700} height={h} />
            </clipPath>
          );
        })}
      </defs>

      <g clipPath="url(#brain-outline)">
        {MAP_REGIONS.map((key) => {
          const { points, label } = SECTIONS[key];
          const dim = !compact && selected && selected !== key;
          const pct = Math.round(Math.max(0, Math.min(1, filled[key] ?? 0)) * 100);
          // Sections overlap under the gaps, so dimming is done with colour rather than opacity.
          const empty = dim ? "color-mix(in srgb, var(--color-hairline) 60%, var(--color-card))" : "var(--color-hairline)";
          const full = dim ? "color-mix(in srgb, var(--color-brand) 60%, var(--color-card))" : "var(--color-brand)";
          return (
            <g
              key={key}
              style={{ cursor: interactive ? "pointer" : "default" }}
              role={interactive ? "button" : undefined}
              tabIndex={interactive ? 0 : undefined}
              aria-label={interactive ? `${REGION_LABELS[key]}, ${pct}% mapped` : undefined}
              onClick={interactive ? () => onSelect?.(key) : undefined}
              onMouseEnter={interactive ? () => onHover?.(key) : undefined}
              onKeyDown={interactive ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect?.(key); } } : undefined}
            >
              {/* The empty section, then the filled part rising from its bottom. */}
              <polygon points={points} style={{ fill: empty, stroke: "var(--color-card)", strokeWidth: 7, strokeLinejoin: "round", transition: "fill 200ms ease" }} />
              <polygon points={points} clipPath={`url(#fill-${key})`} style={{ fill: full, stroke: "var(--color-card)", strokeWidth: 7, strokeLinejoin: "round", transition: "fill 200ms ease" }} />
              {!compact && (
                <text x={label[0]} y={label[1]} textAnchor="middle" pointerEvents="none" style={{ fontFamily: "var(--font-body)", fill: "var(--color-ink)", opacity: dim ? 0.6 : 1, transition: "opacity 200ms ease" }}>
                  <tspan x={label[0]} style={{ fontWeight: 500, fontSize: 15 }}>{REGION_LABELS[key]}</tspan>
                  <tspan x={label[0]} dy={18} style={{ fontSize: 13, fill: "var(--color-secondary)" }}>{pct}%</tspan>
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
