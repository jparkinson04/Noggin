import type { ReactNode } from "react";

/** One setting as a hairline row: label and help on the left, the control on the right. */
export function Field({ label, help, children, stack = false }: { label: string; help?: string; children: ReactNode; stack?: boolean }) {
  return (
    <div className={`border-t border-hairline py-5 ${stack ? "" : "md:grid md:grid-cols-[220px_1fr] md:gap-8"}`}>
      <div className={stack ? "mb-3" : ""}>
        <p className="text-sm">{label}</p>
        {help && <p className="mt-1 text-xs text-secondary">{help}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export const INPUT = "w-full max-w-md rounded-sm border border-hairline bg-ground px-3 py-2 text-sm text-ink placeholder:text-muted focus-visible:outline-none focus-visible:border-secondary";
export const SELECT = "rounded-sm border border-hairline bg-ground px-3 py-2 text-sm text-ink";
