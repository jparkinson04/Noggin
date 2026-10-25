import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, supabaseConfigured } from "@/lib/supabase/config";
import type { SessionCookie } from "@/lib/supabase/server";

/** Open without a session: signing in itself, and the publishing worker, which checks CRON_SECRET. */
const PUBLIC = ["/sign-in", "/auth/", "/api/linkedin/worker"];

/**
 * Keeps the Supabase session fresh on every request and sends anyone signed out to /sign-in.
 * API routes answer 401 instead. Does nothing when Supabase isn't configured.
 */
export async function middleware(request: NextRequest) {
  if (!supabaseConfigured) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet: SessionCookie[]) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  // getUser, not getSession: it checks the token with Supabase instead of trusting the cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  if (user || PUBLIC.some((p) => path.startsWith(p))) return response;

  if (path.startsWith("/api/")) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const signIn = request.nextUrl.clone();
  signIn.pathname = "/sign-in";
  signIn.search = "";
  if (path !== "/") signIn.searchParams.set("next", path + request.nextUrl.search);
  return NextResponse.redirect(signIn);
}

export const config = {
  // Everything except Next's own files and static assets: icons, logos, the manifest.
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|txt)$).*)"],
};
