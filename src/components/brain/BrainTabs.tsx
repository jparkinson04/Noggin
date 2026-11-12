"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Card } from "@/components/shell/Card";

/** "Map | Board": a slim card at the top of the Brain page. */
export function BrainTabs() {
  const pathname = usePathname();
  const tab = (href: string, label: string) => {
    const on = pathname === href;
    return (
      <Link
        href={href}
        aria-current={on ? "page" : undefined}
        className={`rounded-btn px-3 py-1.5 text-sm ${on ? "bg-highlight font-medium text-ink" : "text-secondary hover:text-ink"}`}
      >
        {label}
      </Link>
    );
  };
  return (
    <Card as="nav" pad={3} className="flex items-center gap-1">
      {tab("/brain", "Map")}
      {tab("/brain/board", "Board")}
    </Card>
  );
}
