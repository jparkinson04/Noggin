import type { ReactNode } from "react";

/**
 * Every group of content sits in its own card: the card colour, a hairline border, 12px radius,
 * no shadow, on the ground. `pad` is the inner padding in Tailwind steps (default 4 = 16px).
 */
export function Card({ children, className = "", pad = 4, as: Tag = "div" }: { children: ReactNode; className?: string; pad?: 0 | 3 | 4 | 5 | 6; as?: "div" | "section" | "nav" | "header" | "footer" }) {
  const padding = { 0: "", 3: "p-3", 4: "p-4", 5: "p-5", 6: "p-6" }[pad];
  return <Tag className={`rounded-card border border-hairline bg-card ${padding} ${className}`}>{children}</Tag>;
}
