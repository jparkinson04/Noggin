import { PublishError, type PublishResult } from "./types";

/**
 * Everything that talks to LinkedIn goes through this interface, so the worker and the routes
 * never know which implementation they have. LINKEDIN_PUBLISHER=mock|live picks one (default mock).
 * Only the official API, ever: no scraping, cookies or browser automation.
 */
export interface LinkedInPublisher {
  /** Returns the URL to send the person to for OAuth. */
  getAuthUrl(state: string): string;
  publishTextPost(input: { memberUrn: string; accessToken: string; body: string }): Promise<PublishResult>;
  uploadImage(input: { memberUrn: string; accessToken: string; bytes: Uint8Array; mimeType: string }): Promise<{ imageUrn: string }>;
  publishImagePost(input: { memberUrn: string; accessToken: string; body: string; imageUrn: string; altText?: string }): Promise<PublishResult>;
}

export class NotImplementedError extends Error {
  constructor(what: string) {
    super(`${what} is not implemented yet. See docs/LINKEDIN_PUBLISHING.md.`);
    this.name = "NotImplementedError";
  }
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Pretends to be LinkedIn. A body containing "[fail]" fails, so the failed state can be tested. */
export class MockPublisher implements LinkedInPublisher {
  getAuthUrl(state: string): string {
    return `/api/linkedin/callback?code=mock&state=${encodeURIComponent(state)}`;
  }

  async publishTextPost({ body }: { memberUrn: string; accessToken: string; body: string }): Promise<PublishResult> {
    await wait(1000);
    // The body arrives escaped, so the marker reads \[fail\] by then.
    if (/\\?\[fail\\?\]/.test(body)) throw new PublishError("INVALID_CONTENT", "LinkedIn rejected the post (mock failure).");
    const id = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    return { postUrn: `urn:li:share:${id}`, postUrl: `https://www.linkedin.com/feed/update/urn:li:share:${id}/` };
  }

  async uploadImage(): Promise<{ imageUrn: string }> {
    await wait(300);
    return { imageUrn: `urn:li:image:mock${Date.now()}` };
  }

  async publishImagePost(input: { memberUrn: string; accessToken: string; body: string; imageUrn: string }): Promise<PublishResult> {
    return this.publishTextPost(input);
  }
}

/**
 * The real thing. Every method is a TODO(dev); the comments name the exact calls.
 * Required headers on every /rest call:
 *   Authorization: Bearer <token>
 *   LinkedIn-Version: 202509      (a YYYYMM version; check the current one in the docs)
 *   X-Restli-Protocol-Version: 2.0.0
 */
export class LinkedInApiPublisher implements LinkedInPublisher {
  constructor(
    private readonly clientId = process.env.LINKEDIN_CLIENT_ID ?? "",
    private readonly redirectUri = process.env.LINKEDIN_REDIRECT_URI ?? ""
  ) {}

  getAuthUrl(state: string): string {
    // TODO(dev): confirm scopes match the products enabled on the app (openid profile email w_member_social).
    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state,
      scope: "openid profile email w_member_social",
    });
    return `https://www.linkedin.com/oauth/v2/authorization?${params}`;
  }

  async publishTextPost(): Promise<PublishResult> {
    // TODO(dev): POST https://api.linkedin.com/rest/posts
    //   body: { author: memberUrn, commentary: escapeForLinkedIn(body), visibility: "PUBLIC",
    //           distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
    //           lifecycleState: "PUBLISHED", isReshareDisabledByAuthor: false }
    //   201 Created; the new post URN is in the `x-restli-id` response header (urn:li:share:…).
    //   Map 401 → TOKEN_EXPIRED, 429 → RATE_LIMITED, 422 → INVALID_CONTENT, else UNKNOWN.
    //   Post URL: https://www.linkedin.com/feed/update/<urn>/
    throw new NotImplementedError("LinkedInApiPublisher.publishTextPost");
  }

  async uploadImage(): Promise<{ imageUrn: string }> {
    // TODO(dev): two steps.
    //   1. POST https://api.linkedin.com/rest/images?action=initializeUpload
    //      body: { initializeUploadRequest: { owner: memberUrn } }
    //      → { value: { uploadUrl, image } }  (image is the urn:li:image:… to attach later)
    //   2. PUT the raw bytes to uploadUrl with the same Authorization header and the image's Content-Type.
    //   Failures → MEDIA_UPLOAD_FAILED.
    throw new NotImplementedError("LinkedInApiPublisher.uploadImage");
  }

  async publishImagePost(): Promise<PublishResult> {
    // TODO(dev): as publishTextPost, plus in the body:
    //   content: { media: { id: imageUrn, altText } }
    throw new NotImplementedError("LinkedInApiPublisher.publishImagePost");
  }
}

export function getPublisher(): LinkedInPublisher {
  return process.env.LINKEDIN_PUBLISHER === "live" ? new LinkedInApiPublisher() : new MockPublisher();
}

export const isMockMode = () => process.env.LINKEDIN_PUBLISHER !== "live";
