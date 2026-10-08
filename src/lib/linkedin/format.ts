/**
 * The Posts API "little text" format treats these as reserved; each must be backslash-escaped
 * or LinkedIn rejects the post or renders it wrong.
 */
const RESERVED = new Set(["\\", "|", "{", "}", "@", "[", "]", "(", ")", "<", ">", "#", "*", "_", "~"]);

export function escapeForLinkedIn(text: string): string {
  let out = "";
  for (const ch of text) out += RESERVED.has(ch) ? `\\${ch}` : ch;
  return out;
}

/** The first line of a post, trimmed, for queue rows. */
export function firstLine(body: string, max = 90): string {
  const line = body.split(/\r?\n/).find((l) => l.trim())?.trim() ?? "";
  return line.length > max ? `${line.slice(0, max - 1).trimEnd()}…` : line;
}
