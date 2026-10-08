import { NextResponse } from "next/server";
import { runWorker } from "@/lib/linkedin/service";

/**
 * The every-minute job. Claims due posts and publishes them.
 *
 * TODO(dev): register the cron and protect this route.
 *  - Vercel: add to vercel.json  { "crons": [{ "path": "/api/linkedin/worker", "schedule": "* * * * *" }] }
 *    and set CRON_SECRET; Vercel sends it as `Authorization: Bearer <CRON_SECRET>`.
 *  - Or a Supabase Edge Function on pg_cron calling the same runWorker() logic.
 * In mock mode the queue page also calls this while it's open, so due posts go out without a cron.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (process.env.LINKEDIN_PUBLISHER === "live") {
    if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }
  }
  return NextResponse.json(await runWorker());
}
