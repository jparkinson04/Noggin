"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** "Map | Board" at the top of the Brain stage. */
export function BrainTabs() {
  const pathname = usePathname();
  const tab = (href: string, label: string) => (
    <Link href={href} className={pathname === href ? "text-ink" : "text-secondary hover:text-ink"} aria-current={pathname === href ? "page" : undefined}>
      {label}
    </Link>
  );
  return (
    <nav className="flex gap-5 text-sm" aria-label="Brain views">
      {tab("/brain", "Map")}
      {tab("/brain/board", "Board")}
    </nav>
  );
}
