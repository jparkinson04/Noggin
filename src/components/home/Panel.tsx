import Link from "next/link";
import type { ReactNode } from "react";

/** A Home panel: raised, hairline, 12px radius, label top-left, optional link top-right. Home only. */
export function Panel({
  label,
  link,
  span,
  children,
  className = "",
}: {
  label: string;
  link?: { href: string; text: string };
  /** Columns of twelve. */
  span: 4 | 6 | 8 | 12;
  children: ReactNode;
  className?: string;
}) {
  const cols = { 4: "lg:col-span-4", 6: "lg:col-span-6", 8: "lg:col-span-8", 12: "lg:col-span-12" }[span];
  return (
    <section className={`flex flex-col rounded-[12px] border border-hairline bg-raised px-6 pt-[22px] pb-6 ${cols} ${className}`}>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-xs font-medium text-secondary">{label}</h2>
        {link && (
          <Link href={link.href} className="text-xs text-secondary underline underline-offset-2 hover:text-ink">
            {link.text}
          </Link>
        )}
      </div>
      <div className="mt-4 flex-1">{children}</div>
    </section>
  );
}
