import type { ReactNode } from "react";

/** Page shape a: the one big thing on the left, what explains it in a 460px column. Brain and Studio. */
export function StageColumn({ stage, column }: { stage: ReactNode; column: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_460px]">
      <section className="min-w-0 px-4 py-6 md:px-6">{stage}</section>
      <aside className="min-w-0 border-t border-hairline px-4 py-6 lg:border-t-0 lg:border-l lg:px-10 lg:pt-9 lg:pb-10">
        {column}
      </aside>
    </div>
  );
}
