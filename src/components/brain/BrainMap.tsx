"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RegionKey } from "@/lib/brain/schema";
import { REGION_LABELS } from "@/lib/brain/schema";

/**
 * The hero. A side-view brain, facing left, drawn as a field of dots that fills the silhouette.
 * Every dot belongs to one of five regions. The lit share of a region's dots is its heat; the rest
 * sit as a faint ink field, which is how unmapped space shows. Engine and headline aren't drawn.
 * See docs/03-design-system.md → "The brain visual".
 */

/** The regions on the map. */
export type MapRegion = "whys" | "stories" | "opinions" | "personality" | "receipts";
const MAP_REGIONS: MapRegion[] = ["whys", "stories", "opinions", "personality", "receipts"];

export interface BrainMapProps {
  heat: Record<RegionKey, number>;
  /** Approved cards per region: each becomes an anchor dot near the region's centre. */
  anchors?: Partial<Record<RegionKey, number>>;
  selected?: RegionKey | null;
  onSelect?: (key: RegionKey) => void;
  /** The region under the cursor. Nothing is drawn for it here; the parent shows the name. */
  onHover?: (key: RegionKey | null) => void;
  /** Regions whose lit dots turn `signal` (studio detection). */
  highlight?: ReadonlySet<RegionKey>;
  /** Mini: no interaction, no labels, no ghost, same field. */
  compact?: boolean;
  /** Draw nothing at all for a region at heat 0. The deep dive uses this: only the regions touched so far. */
  onlyWarm?: boolean;
  className?: string;
}

// Trimmed to the field plus room for the labels, so the brain fills whatever box it is given.
const VIEW = { x: 100, y: 34, w: 485, h: 340 };

const SILHOUETTE =
  "M120 225 C112 140 190 70 305 62 C430 54 522 100 550 188 C568 258 512 316 452 326 C426 330 406 326 384 338 C350 356 300 352 255 340 C215 330 190 320 175 300 C168 290 182 284 172 272 C140 262 124 246 120 225 Z";

/** Weighted centroids. A dot belongs to the centroid nearest to it once distance is divided by weight. */
const CENTROIDS: Record<MapRegion, { x: number; y: number; w: number }> = {
  whys: { x: 205, y: 200, w: 1.0 },
  opinions: { x: 400, y: 140, w: 1.0 },
  personality: { x: 340, y: 240, w: 0.6 },
  receipts: { x: 495, y: 250, w: 0.95 },
  stories: { x: 300, y: 310, w: 1.05 },
};

const SPACING = 10;
const JITTER = 1.8;
const LIT_R: [number, number] = [3.2, 5.4];
const LIT_OPACITY: [number, number] = [0.55, 1];
const UNLIT_R = 2.6;
const UNLIT_OPACITY = 0.16;
const ANCHOR_R = 7.5;
const DIMMED = 0.35;
const LABEL_DIMMED = 0.4;

/** Hover pull, in viewBox units. */
const REACH = 110;
/** Share of the distance to the cursor a dot will travel at most. Over 0.5 the clouds collapse into blobs. */
const PULL = 0.42;
const SWELL = 0.6;
/** Share of the remaining gap closed each frame. Lower is lazier. */
const EASE = 0.12;

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The silhouette as a polygon, so the field can be laid without asking the DOM. */
const OUTLINE: [number, number][] = (() => {
  const n = SILHOUETTE.match(/-?\d+(\.\d+)?/g)!.map(Number);
  const points: [number, number][] = [];
  let [x0, y0] = [n[0], n[1]];
  for (let i = 2; i + 5 < n.length; i += 6) {
    const [x1, y1, x2, y2, x3, y3] = n.slice(i, i + 6);
    for (let s = 0; s < 16; s++) {
      const t = s / 16;
      const u = 1 - t;
      points.push([
        u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
        u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3,
      ]);
    }
    [x0, y0] = [x3, y3];
  }
  return points;
})();

function insideOutline(x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = OUTLINE.length - 1; i < OUTLINE.length; j = i++) {
    const [xi, yi] = OUTLINE[i];
    const [xj, yj] = OUTLINE[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function regionOf(x: number, y: number): MapRegion {
  let best: MapRegion = "whys";
  let nearest = Infinity;
  for (const key of MAP_REGIONS) {
    const c = CENTROIDS[key];
    const d = Math.sqrt((x - c.x) ** 2 + (y - c.y) ** 2) / c.w;
    if (d < nearest) {
      nearest = d;
      best = key;
    }
  }
  return best;
}

interface Dot {
  x: number;
  y: number;
  /** Radius when lit, before heat scales it. 0..1 of the range. */
  size: number;
  /** 0..1, where this dot sits in the opacity range when lit. */
  glow: number;
}

/**
 * The field: a jittered hex grid clipped to the silhouette, every dot assigned to one region.
 * Within a region the dots are ordered so that lighting the first n of them grows a cloud outward
 * from the centre with a soft edge. Arithmetic only, so server and browser agree to the digit.
 */
const FIELD: Record<MapRegion, Dot[]> = (() => {
  const random = mulberry32(7);
  const field = Object.fromEntries(MAP_REGIONS.map((k) => [k, [] as (Dot & { order: number })[]])) as Record<
    MapRegion,
    (Dot & { order: number })[]
  >;
  const rowStep = (SPACING * Math.sqrt(3)) / 2;
  for (let row = 0, y = 56; y < 345; row++, y += rowStep) {
    for (let x = 110 + (row % 2) * (SPACING / 2); x < 575; x += SPACING) {
      const jx = x + (random() * 2 - 1) * JITTER;
      const jy = y + (random() * 2 - 1) * JITTER;
      if (!insideOutline(jx, jy)) continue;
      const key = regionOf(jx, jy);
      const c = CENTROIDS[key];
      const distance = Math.sqrt((jx - c.x) ** 2 + (jy - c.y) ** 2);
      field[key].push({
        x: Math.round(jx * 10) / 10,
        y: Math.round(jy * 10) / 10,
        size: random(),
        glow: random(),
        order: distance * (0.55 + 0.9 * random()),
      });
    }
  }
  for (const key of MAP_REGIONS) field[key].sort((a, b) => a.order - b.order);
  return field;
})();

/** Where each anchor dot sits: a seeded ring around the region's centroid. */
function anchorSpots(key: MapRegion, count: number): [number, number][] {
  const random = mulberry32(101 + MAP_REGIONS.indexOf(key));
  const c = CENTROIDS[key];
  const spots: [number, number][] = [];
  for (let i = 0; i < count; i++) {
    // Arithmetic only: a point in a 12–34 unit ring, found by rejection.
    let x = c.x;
    let y = c.y;
    for (let tries = 0; tries < 50; tries++) {
      const dx = (random() * 2 - 1) * 34;
      const dy = (random() * 2 - 1) * 34;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 12 || d > 34) continue;
      if (spots.some(([sx, sy]) => (sx - c.x - dx) ** 2 + (sy - c.y - dy) ** 2 < 16 ** 2)) continue;
      x = c.x + dx;
      y = c.y + dy;
      break;
    }
    spots.push([Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
  }
  return spots;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** The lit share of a region's dots: a quarter at zero heat, all of them at full. */
const litCount = (key: MapRegion, heat: number) =>
  Math.round(FIELD[key].length * (0.25 + 0.75 * clamp01(heat)));

interface MovingDot {
  el: SVGCircleElement;
  baseX: number;
  baseY: number;
  baseR: number;
  x: number;
  y: number;
  r: number;
}

export function BrainMap({
  heat,
  anchors,
  selected,
  onSelect,
  onHover,
  highlight,
  compact = false,
  onlyWarm = false,
  className,
}: BrainMapProps) {
  const svg = useRef<SVGSVGElement>(null);
  const moving = useRef<MovingDot[]>([]);
  const cursor = useRef<{ x: number; y: number } | null>(null);
  const frame = useRef(0);
  const [hovered, setHovered] = useState<RegionKey | null>(null);
  const [stillness, setStillness] = useState(false);

  const lit = useMemo(
    () =>
      Object.fromEntries(
        MAP_REGIONS.map((key) => [key, onlyWarm && !(heat[key] > 0) ? 0 : litCount(key, heat[key] ?? 0)])
      ) as Record<MapRegion, number>,
    [heat, onlyWarm]
  );
  const litKey = MAP_REGIONS.map((k) => `${lit[k]}:${anchors?.[k] ?? 0}`).join(",");

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setStillness(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // The circles the pull moves: lit dots and anchors only. Rebuilt whenever heat changes which they are.
  useEffect(() => {
    if (compact || !svg.current) return;
    moving.current = Array.from(svg.current.querySelectorAll<SVGCircleElement>("circle[data-dot]")).map(
      (el) => {
        const [baseX, baseY, baseR] = el.dataset.dot!.split(" ").map(Number);
        return { el, baseX, baseY, baseR, x: baseX, y: baseY, r: baseR };
      }
    );
    return () => cancelAnimationFrame(frame.current);
  }, [compact, litKey]);

  function step() {
    const at = cursor.current;
    let settled = true;
    for (const dot of moving.current) {
      let toX = dot.baseX;
      let toY = dot.baseY;
      let toR = dot.baseR;
      if (at) {
        const dx = at.x - dot.baseX;
        const dy = at.y - dot.baseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < REACH) {
          const near = 1 - distance / REACH;
          const pull = near * near * (3 - 2 * near); // smoothstep
          toX += dx * PULL * pull;
          toY += dy * PULL * pull;
          toR *= 1 + SWELL * pull;
        }
      }
      dot.x += (toX - dot.x) * EASE;
      dot.y += (toY - dot.y) * EASE;
      dot.r += (toR - dot.r) * EASE;
      if (Math.abs(toX - dot.x) + Math.abs(toY - dot.y) + Math.abs(toR - dot.r) > 0.03) settled = false;
      dot.el.setAttribute("cx", dot.x.toFixed(2));
      dot.el.setAttribute("cy", dot.y.toFixed(2));
      dot.el.setAttribute("r", dot.r.toFixed(2));
    }
    // Keep going while the cursor is here or anything is still drifting home.
    frame.current = at || !settled ? requestAnimationFrame(step) : 0;
  }

  function wake() {
    if (!frame.current) frame.current = requestAnimationFrame(step);
  }

  function toViewBox(e: { clientX: number; clientY: number }) {
    const box = svg.current!.getBoundingClientRect();
    return {
      x: VIEW.x + ((e.clientX - box.left) / box.width) * VIEW.w,
      y: VIEW.y + ((e.clientY - box.top) / box.height) * VIEW.h,
    };
  }

  const regionAt = (x: number, y: number): MapRegion | null => (insideOutline(x, y) ? regionOf(x, y) : null);

  function hover(key: RegionKey | null) {
    if (key === hovered) return;
    setHovered(key);
    onHover?.(key);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (e.pointerType === "touch") return; // tap selects, no pull
    const at = toViewBox(e);
    hover(regionAt(at.x, at.y));
    if (stillness) return;
    cursor.current = at;
    wake();
  }

  function onPointerLeave() {
    cursor.current = null;
    hover(null);
  }

  function onClick(e: React.MouseEvent) {
    const at = toViewBox(e);
    const key = regionAt(at.x, at.y);
    if (key) onSelect?.(key);
  }

  // With a region selected the rest dim. With nothing selected, hovering does the same.
  // When regions are highlighted (the studio's mini brain), everything else dims instead.
  const focus = compact ? null : (selected ?? hovered);
  const dimmed = (key: RegionKey) =>
    focus ? focus !== key : !!highlight?.size && !highlight.has(key);

  // Labels sit just above the lit cloud (below it for stories), so they follow the colour, not the field.
  const labelAt = useMemo(() => {
    const out = {} as Record<MapRegion, [number, number]>;
    for (const key of MAP_REGIONS) {
      const ys = [
        ...FIELD[key].slice(0, Math.max(lit[key], 1)).map((d) => d.y),
        ...anchorSpots(key, anchors?.[key] ?? 0).map(([, y]) => y),
      ];
      const c = CENTROIDS[key];
      out[key] = key === "stories" ? [c.x, Math.max(...ys) + 20] : [c.x, Math.min(...ys) - 12];
    }
    return out;
  }, [lit, anchors]);

  return (
    <svg
      ref={svg}
      viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
      className={className}
      role="img"
      aria-label={compact ? "Your brain, regions lit by use" : "Your brain. Each cloud of dots is a region."}
      style={{
        width: "100%",
        height: "auto",
        display: "block",
        overflow: "visible",
        cursor: !compact && hovered ? "pointer" : "default",
        touchAction: "manipulation",
      }}
      onPointerMove={compact ? undefined : onPointerMove}
      onPointerLeave={compact ? undefined : onPointerLeave}
      onClick={compact ? undefined : onClick}
    >
      {/* The unlit field: the fixed shape of the whole brain. Never moves, never dims. */}
      <g style={{ fill: "var(--color-ink)", opacity: UNLIT_OPACITY }}>
        {MAP_REGIONS.map((key) =>
          FIELD[key].slice(lit[key]).map((dot, i) => <circle key={`${key}${i}`} cx={dot.x} cy={dot.y} r={UNLIT_R} />)
        )}
      </g>

      {MAP_REGIONS.map((key) => {
        const warmth = clamp01(heat[key] ?? 0);
        const isLit = highlight?.has(key) ?? false;
        const scale = 0.55 + 0.45 * warmth;
        return (
          <g
            key={key}
            style={{
              fill: isLit ? "var(--color-signal)" : `var(--color-lobe-${key})`,
              opacity: dimmed(key) ? DIMMED : 1,
              transition: stillness ? undefined : "opacity 200ms ease, fill 240ms ease",
            }}
          >
            {FIELD[key].slice(0, lit[key]).map((dot, i) => {
              const r = Math.round((LIT_R[0] + (LIT_R[1] - LIT_R[0]) * dot.size * scale) * 10) / 10;
              return (
                <circle
                  key={i}
                  data-dot={`${dot.x} ${dot.y} ${r}`}
                  cx={dot.x}
                  cy={dot.y}
                  r={r}
                  opacity={(LIT_OPACITY[0] + (LIT_OPACITY[1] - LIT_OPACITY[0]) * dot.glow).toFixed(2)}
                />
              );
            })}
            {anchorSpots(key, anchors?.[key] ?? 0).map(([x, y], i) => (
              <circle key={`a${i}`} data-dot={`${x} ${y} ${ANCHOR_R}`} cx={x} cy={y} r={ANCHOR_R} />
            ))}
          </g>
        );
      })}

      {!compact &&
        MAP_REGIONS.map((key) => (
          <text
            key={key}
            x={labelAt[key][0]}
            y={labelAt[key][1]}
            textAnchor="middle"
            pointerEvents="none"
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 500,
              fontSize: 13,
              fill: `var(--color-lobe-${key})`,
              opacity: dimmed(key) ? LABEL_DIMMED : 1,
              transition: stillness ? undefined : "opacity 200ms ease",
            }}
          >
            {REGION_LABELS[key]}
          </text>
        ))}
    </svg>
  );
}
