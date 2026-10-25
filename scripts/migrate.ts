/**
 * `npm run db:migrate`: applies supabase/migrations/*.sql in order, each in its own transaction,
 * skipping any that have run. Records them where the Supabase CLI does, so the dashboard and
 * `supabase db push` agree on what's applied. Needs DATABASE_URL in .env.local.
 */
import { readdirSync, readFileSync } from "node:fs";
import postgres from "postgres";

const DIR = "supabase/migrations";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL in .env.local (Supabase → Connect → Session pooler).");
  const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1, onnotice: () => {} });
  try {
    await sql.unsafe(`
      create schema if not exists supabase_migrations;
      create table if not exists supabase_migrations.schema_migrations (version text not null primary key);
      alter table supabase_migrations.schema_migrations add column if not exists statements text[];
      alter table supabase_migrations.schema_migrations add column if not exists name text;
    `);
    const applied = new Set((await sql`select version from supabase_migrations.schema_migrations`).map((r) => r.version as string));

    for (const file of readdirSync(DIR).filter((f) => /^\d+_.+\.sql$/.test(f)).sort()) {
      const [, version, name] = file.match(/^(\d+)_(.+)\.sql$/)!;
      if (applied.has(version)) continue;
      const body = readFileSync(`${DIR}/${file}`, "utf8");
      await sql.begin(async (tx) => {
        await tx.unsafe(body);
        await tx`insert into supabase_migrations.schema_migrations (version, name, statements) values (${version}, ${name}, ${sql.array([body])})`;
      });
      console.log(`applied ${file}`);
    }
    console.log("migrations up to date");
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
