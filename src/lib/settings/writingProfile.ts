import type { AnonymiseOthers, EmojiLevel, HashtagLevel, PostLength, SharingChoice, Spelling, UserSettings } from "./types";
import { POST_LENGTH_CHARS } from "./types";
import { getSettingsStore } from "./store";

/**
 * Everything Studio needs to write the way the person likes, in one object.
 * TODO(dev): Studio has no AI generation yet. When tightenDraft / openingLinesFrom / angles /
 * questions are built (src/app/api/draft/route.ts), build the system prompt from this:
 *   - never use any of `bannedPhrases`; never use an em dash if `noEmDashes`
 *   - `spelling` sets -ise/-ize and colour/color; `emoji` and `hashtags` set the rules
 *   - `maxChars` caps the draft; `signaturePhrases` are the person's own and may be reused
 *   - `sharing` topics marked "never" must not be suggested; "ask" means flag before suggesting
 *   - `anonymiseOthers` "always" means strip names of other people; "ask" means flag them
 * Until then it feeds the voice check in Studio (see voiceCheckWith).
 */
export interface WritingProfile {
  spelling: Spelling;
  bannedPhrases: string[];
  noEmDashes: boolean;
  signaturePhrases: string[];
  emoji: EmojiLevel;
  hashtags: HashtagLevel;
  defaultLength: PostLength;
  maxChars: number;
  sharing: Record<string, SharingChoice>;
  anonymiseOthers: AnonymiseOthers;
}

export function writingProfileFrom(settings: UserSettings): WritingProfile {
  return {
    spelling: settings.spelling,
    bannedPhrases: settings.bannedPhrases,
    noEmDashes: settings.noEmDashes,
    signaturePhrases: settings.signaturePhrases,
    emoji: settings.emojiLevel,
    hashtags: settings.hashtagLevel,
    defaultLength: settings.defaultPostLength,
    maxChars: POST_LENGTH_CHARS[settings.defaultPostLength],
    sharing: settings.sharing,
    anonymiseOthers: settings.anonymiseOthers,
  };
}

export async function getWritingProfile(userId: string): Promise<WritingProfile> {
  return writingProfileFrom(await getSettingsStore().get(userId));
}

/** Lines the person said they'd never write: their banned phrases, plus em dashes if they've ruled those out. */
export function bannedIn(draft: string, profile: Pick<WritingProfile, "bannedPhrases" | "noEmDashes">): string[] {
  const t = draft.toLowerCase();
  const hits = profile.bannedPhrases.filter((p) => p && t.includes(p.toLowerCase()));
  if (profile.noEmDashes && /—/.test(draft)) hits.push("—");
  return hits;
}
