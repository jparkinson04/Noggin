import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/currentUser";
import { getPublisher, isMockMode } from "@/lib/linkedin/publisher";
import { connections } from "@/lib/linkedin/service";
import { handle } from "../_shared";

/**
 * GET /api/linkedin/connect — start OAuth.
 * Mock mode: creates a pretend connection and sends them back to settings.
 */
export async function GET(req: Request) {
  const user = await currentUser();
  const back = new URL("/settings?connected=1", req.url);
  try {
    if (isMockMode()) {
      await connections.connectMock(user.id, user.name);
      return NextResponse.redirect(back);
    }
    // TODO(dev): generate a random `state`, store it in an httpOnly cookie, and redirect to
    // getPublisher().getAuthUrl(state). The callback checks the cookie against the returned state.
    const state = crypto.randomUUID();
    const res = NextResponse.redirect(getPublisher().getAuthUrl(state));
    res.cookies.set("li_oauth_state", state, { httpOnly: true, sameSite: "lax", secure: true, maxAge: 600, path: "/" });
    return res;
  } catch (e) {
    return handle(e);
  }
}
