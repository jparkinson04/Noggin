import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth/SignInForm";
import { signedInUser } from "@/lib/auth/currentUser";
import { safeNext } from "@/lib/auth/safeNext";

/** What went wrong when a link from the email didn't sign them in. Set by /auth/callback. */
const PROBLEMS: Record<string, string> = {
  expired: "That link has expired or was already used. Ask for a new one.",
  link: "That link didn't sign you in. Open it in the browser you asked for it from, or ask for a new one.",
};

/** `/sign-in?next=/deep-dive`: email-link sign-in, then on to where they were going. */
export default async function SignIn({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; problem?: string }>;
}) {
  const { next, problem } = await searchParams;
  const to = safeNext(next);
  // Already signed in, or no Supabase (everyone is the sample brain): nothing to do here.
  if (await signedInUser()) redirect(to);
  return <SignInForm next={to} problem={problem ? (PROBLEMS[problem] ?? PROBLEMS.link) : null} />;
}
