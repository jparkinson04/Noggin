import type { ReactNode } from "react";

/** Page shape b: one 680px column. Home. */
export function Narrow({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-[680px] px-4 pt-10 pb-16 md:px-6 md:pt-[72px]">{children}</div>;
}
