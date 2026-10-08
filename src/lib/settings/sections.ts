/** The settings sections, in order. Plain data so both the server route and the client page can read it. */
export const SECTIONS = [
  { id: "profile", label: "Profile", title: "Profile" },
  { id: "voice", label: "Your voice", title: "How Studio writes for you" },
  { id: "sharing", label: "What you're happy to share", title: "What you're happy to share" },
  { id: "linkedin", label: "LinkedIn and publishing", title: "LinkedIn and publishing" },
  { id: "notifications", label: "Notifications", title: "Notifications" },
  { id: "billing", label: "Plan and billing", title: "Plan and billing" },
  { id: "data", label: "Data and privacy", title: "Data and privacy" },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];
