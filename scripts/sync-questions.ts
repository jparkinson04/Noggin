/**
 * `npm run db:questions`: copies the question bank from src/lib/brain/questions.ts into the
 * questions table, which answers point at. Rows match on `key`, so run it again after any edit
 * to the bank. Needs DATABASE_URL in .env.local.
 */
import postgres from "postgres";
import { QUESTIONS } from "../src/lib/brain/questions";

/** The bank's version, from the header of questions.ts. */
const VERSION = 3;

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL in .env.local (Supabase → Connect → Session pooler).");
  const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1, onnotice: () => {} });
  try {
    await sql.begin(async (tx) => {
      for (const q of QUESTIONS) {
        await tx`
          insert into questions (key, version, part, position, text, listening_for, follow_up_hint, safety_line, region)
          values (${q.id}, ${VERSION}, ${q.sitting}, ${q.position}, ${q.text}, ${q.whyWeAsk ?? null},
                  ${q.secondBeat ?? null}, ${q.safetyLine ?? null}, ${q.region})
          on conflict (key) do update set
            version = excluded.version, part = excluded.part, position = excluded.position, text = excluded.text,
            listening_for = excluded.listening_for, follow_up_hint = excluded.follow_up_hint,
            safety_line = excluded.safety_line, region = excluded.region`;
      }
    });
    console.log(`${QUESTIONS.length} questions in the database`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
