import type { ReactNode } from "react";

/**
 * Page shape a: the one big thing on the left, what explains it in a column on the right.
 * Both sides are stacks of cards on the ground, with the same gap between them.
 */
export function StageColumn({ stage, column }: { stage: ReactNode; column: ReactNode }) {
  return (
    <div className="grid gap-3 p-3 lg:min-h-screen lg:grid-cols-[1fr_400px] lg:gap-4 lg:p-4 lg:pl-0 xl:grid-cols-[1fr_440px]">
      <section className="flex min-w-0 flex-col gap-3 lg:gap-4">{stage}</section>
      <aside className="flex min-w-0 flex-col gap-3 lg:gap-4">{column}</aside>
    </div>
  );
}
