import { answerWords, durationLabel, keepLines, type Answer } from "@/lib/brain/answers";

/** What they said, played back to them with its transcript, and the lines we'd keep from it. */
export function GivenAnswer({ answer }: { answer: Answer }) {
  const words = answerWords(answer);
  const kept = keepLines(words);
  const waiting = answer.clips.some((c) => !c.transcript);

  return (
    <div>
      {answer.clips.map((clip, i) => (
        <div key={clip.url} className="py-2">
          <div className="flex items-center gap-4">
            <audio controls src={clip.url} className="h-9 max-w-full" />
            <span className="text-sm text-secondary tabular-nums whitespace-nowrap">
              Voice note{answer.clips.length > 1 ? ` ${i + 1}` : ""}, {durationLabel(clip.seconds)}
            </span>
          </div>
          {clip.transcript && <p className="mt-2 whitespace-pre-wrap">{clip.transcript}</p>}
        </div>
      ))}
      {answer.text && <p className="whitespace-pre-wrap">{answer.text}</p>}

      <h3 className="mt-6 text-base">We&apos;d keep this</h3>
      {words ? (
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
      ) : null}
      {waiting && (
        <p className="mt-1 text-sm text-secondary">
          {words
            ? "A voice note isn't written out yet. When it is, its lines will join these."
            : "The transcript isn't here yet. When it is, the lines worth keeping will show up here."}
        </p>
      )}
    </div>
  );
}
