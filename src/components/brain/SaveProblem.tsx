/** Shown while a change to the brain hasn't reached the database. It never blocks anything. */
export function SaveProblem({ onRetry }: { onRetry: () => void }) {
  return (
    <p
      role="alert"
      className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-btn border border-hairline bg-ground px-4 py-2 text-sm"
    >
      Couldn&apos;t save your last change.{" "}
      <button type="button" className="underline underline-offset-2 hover:text-ink" onClick={onRetry}>
        Try again
      </button>
    </p>
  );
}
