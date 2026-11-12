import type { AudienceAudit, AudiencePerson, AudienceTarget } from "./types";

/** What Maya's audit looks like, for running without Supabase. Invented people, like the rest of her brain. */
export const sampleTarget: AudienceTarget = {
  idealClient: "Nurses with ten or more years in, burnt out, who want a second career and think it means starting from zero.",
  goal: "Two discovery calls a week from posts.",
};

const p = (name: string, headline: string, group: AudiencePerson["group"], why: string): AudiencePerson => ({ name, headline, group, why });

export const sampleAudit: AudienceAudit = {
  id: "sample-audit",
  createdAt: "2026-11-09T09:30:00.000Z",
  target: sampleTarget,
  screenshots: 5,
  summary:
    "Of the 24 people who reacted, 5 are the nurses you want and 11 are other coaches. Your posts are landing with people who do your job more than with people who need it.",
  tips: [
    {
      title: "Name the nurse in your headline",
      body: "Your headline does say nurses, which is why the five found you. It doesn't say ten years in or burnt out, and those are the words the ideal line turns on.",
    },
    {
      title: "Lead with the ward, not the coaching",
      body: "Coaches react to coaching language. The night shift I didn't finish and Twelve years in ICU are told from inside the job, so they are the cards most likely to stop a nurse scrolling.",
    },
    {
      title: "Talk to the five",
      body: "Ruth, Kemi and Dan reacted more than once. A real message about what they reacted to is worth more than another post this week. Write it yourself.",
    },
  ],
  people: [
    p("Ruth Adeyemi", "Senior staff nurse, critical care · 14 years NHS", "ideal", "Senior nurse, fourteen years in"),
    p("Kemi Lawal", "Ward sister | thinking about what's next", "ideal", "Ward sister openly weighing a change"),
    p("Dan Whitcombe", "Charge nurse, emergency department", "ideal", "Experienced nurse in a high-pressure unit"),
    p("Priya Nair", "ICU nurse, 11 years. Tired.", "ideal", "Eleven years in and says she is tired"),
    p("Louise Carr", "Community nurse team lead", "ideal", "Long-serving nurse in a lead role"),
    p("Helen Marsh", "Matron, surgical division", "adjacent", "Manages the nurses you want to reach"),
    p("Tom Osei", "Clinical educator, nursing workforce", "adjacent", "Trains nurses, could pass posts on"),
    p("Anita Roy", "Occupational health lead, NHS trust", "adjacent", "Sees burnt-out staff first"),
    p("Becky Lunn", "Career coach for teachers", "peer", "Career coach, different profession"),
    p("James Pell", "Executive coach | ICF PCC", "peer", "Coach"),
    p("Sara Whitfield", "Helping women pivot careers with confidence", "peer", "Career-change coach"),
    p("Mo Farouk", "Career change coach | ex-lawyer", "peer", "Career-change coach"),
    p("Gemma Hart", "Burnout coach and speaker", "peer", "Coach in the same subject"),
    p("Niall Byrne", "Coach. Podcast host.", "peer", "Coach"),
    p("Olivia Trent", "I help midlife professionals find work they love", "peer", "Career coach"),
    p("Rachel Stone", "Leadership coach for healthcare managers", "peer", "Coach, healthcare managers not nurses"),
    p("Chris Amadi", "Career strategist", "peer", "Career coach"),
    p("Fay Linton", "Coach | writer | recovering perfectionist", "peer", "Coach"),
    p("Dee Okafor", "Certified life and career coach", "peer", "Coach"),
    p("Mark Hollis", "Healthcare recruiter, permanent nursing roles", "other", "Recruiter"),
    p("Zara Kent", "LinkedIn ghostwriter for founders", "other", "Selling an unrelated service"),
    p("Ian Brooks", "Operations manager", "other", "Headline doesn't say enough to place"),
    p("Jo Marsh", "Programme coordinator", "other", "Headline doesn't say enough to place"),
    p("Sam Reyes", "Founder", "other", "Headline doesn't say enough to place"),
  ],
};
