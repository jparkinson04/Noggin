import { NextResponse } from "next/server";

/**
 * GET /api/linkedin/callback?code=…&state=… — LinkedIn sends the person back here.
 *
 * TODO(dev):
 *  1. Check `state` matches the li_oauth_state cookie; reject otherwise.
 *  2. POST https://www.linkedin.com/oauth/v2/accessToken (form-encoded):
 *       grant_type=authorization_code, code, redirect_uri=LINKEDIN_REDIRECT_URI,
 *       client_id=LINKEDIN_CLIENT_ID, client_secret=LINKEDIN_CLIENT_SECRET
 *     → { access_token, expires_in (seconds, ~60 days), scope }
 *  3. GET https://api.linkedin.com/v2/userinfo with Authorization: Bearer <token>
 *     → { sub, name, picture } ; member URN is `urn:li:person:${sub}`.
 *  4. Encrypt access_token with TOKEN_ENCRYPTION_KEY (AES-256-GCM, random IV, store iv:tag:ciphertext).
 *  5. Upsert linkedin_connections for the current user with the service role:
 *       linkedin_member_urn, display_name, avatar_url, scopes, access_token_encrypted,
 *       token_expires_at = now() + expires_in.
 *  6. Redirect to /settings?connected=1. On any failure redirect to /settings?error=linkedin.
 * Never log the code or the token.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("code") === "mock") {
    return NextResponse.redirect(new URL("/settings?connected=1", req.url));
  }
  return NextResponse.json({ error: "LinkedIn OAuth callback is not implemented yet." }, { status: 501 });
}
