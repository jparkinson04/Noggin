"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/shell/Button";
import { INPUT } from "@/components/settings/Field";

const LINK = "underline underline-offset-2 hover:text-ink";
const CANT_SEND = "Couldn't send the link. Try again in a moment.";

/** Ask for an email, send the link, then say where it went. No passwords anywhere. */
export function SignInForm({ next, problem }: { next: string; problem: string | null }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(problem);

  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setError(null);
    let message: string | null = null;
    try {
      const r = await fetch("/auth/email-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, next }),
      });
      if (r.ok) setSentTo(email.trim());
      else message = ((await r.json().catch(() => ({}))) as { error?: string }).error ?? CANT_SEND;
    } catch {
      message = CANT_SEND;
    }
    setError(message);
    setSending(false);
  }

  return (
    <div className="min-h-screen px-4 pt-16 pb-16 md:px-6 md:pt-24">
      <div className="mx-auto w-full max-w-[440px]">
        <img src="/logo-dark.svg" alt="Noggin" className="h-[26px] w-auto" />

        {sentTo ? (
          <section className="mt-14">
            <h1 className="text-3xl md:text-4xl">Check your inbox</h1>
            <p className="mt-4">
              We&apos;ve sent a link to <strong className="font-medium">{sentTo}</strong>. Open it in this browser
              to sign in. It works once.
            </p>
            <p className="mt-6 text-sm text-secondary">
              Nothing after a few minutes? Check your spam folder, or{" "}
              <button type="button" className={LINK} onClick={() => setSentTo(null)}>
                try again
              </button>
              .
            </p>
          </section>
        ) : (
          <form onSubmit={send} className="mt-14">
            <h1 className="text-3xl md:text-4xl">Sign in</h1>
            <p className="mt-4 text-secondary">We&apos;ll email you a link. No password to remember.</p>

            <label htmlFor="email" className="mt-10 block text-sm">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoFocus
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${INPUT} mt-2`}
            />
            {error && (
              <p role="alert" className="mt-4 text-sm">
                {error}
              </p>
            )}
            <Button type="submit" variant="primary" disabled={sending} className="mt-6">
              {sending ? "Sending" : "Email me a link"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
