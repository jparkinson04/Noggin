import { durationLabel, keepLines, type Answer } from "@/lib/brain/answers";

/** What they said, played back to them, and the lines we'd keep from it. */
export function GivenAnswer({ answer }: { answer: Answer }) {
  const kept = keepLines(answer.text);

  return (
    <div>
      {answer.clips.map((clip, i) => (
        <div key={clip.url} className="flex items-center gap-4 py-2">
          <audio controls src={clip.url} className="h-9 max-w-full" />
          <span className="text-sm text-secondary tabular-nums whitespace-nowrap">
            Voice note{answer.clips.length > 1 ? ` ${i + 1}` : ""}, {durationLabel(clip.seconds)}
          </span>
        </div>
      ))}
      {answer.text && <p className="whitespace-pre-wrap">{answer.text}</p>}

      <h3 className="mt-6 text-base">We&apos;d keep this</h3>
      {answer.text ? (
        kept.length > 0 ? (
          <ul className="mt-2 border-b border-hairline">
            {kept.map((line) => (
              <li key={line} className="border-t border-hairline py-2.5 display text-lg">
                {line}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-secondary">
            Nothing specific yet. We keep names, places, numbers and what people actually said.
          </p>
        )
      ) : (
        <p className="mt-1 text-sm text-secondary">
          The transcript isn&apos;t here yet. When it is, the lines worth keeping will show up here.
        </p>
      )}
    </div>
  );
}
