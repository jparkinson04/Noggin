import { NextResponse } from "next/server";
import { RequestError } from "@/lib/linkedin/service";

/** Turns a thrown RequestError into a JSON response; anything else is a 500 with no detail. */
export function handle(error: unknown) {
  if (error instanceof RequestError) return NextResponse.json({ error: error.message }, { status: error.status });
  console.error(error instanceof Error ? error.message : error); // never log tokens; errors here carry none
  return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
}
