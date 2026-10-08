"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** "Write | Scheduled" at the top of Studio. */
export function StudioTabs() {
  const pathname = usePathname();
  const tab = (href: string, label: string) => (
    <Link href={href} className={pathname === href ? "text-ink" : "text-secondary hover:text-ink"} aria-current={pathname === href ? "page" : undefined}>
      {label}
    </Link>
  );
  return (
    <nav className="flex gap-5 text-sm" aria-label="Studio views">
      {tab("/studio", "Write")}
      {tab("/studio/scheduled", "Scheduled")}
    </nav>
  );
}
