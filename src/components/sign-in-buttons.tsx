"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/cn";

const PROVIDERS = {
  google: {
    label: "Continue with Google",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
        <path
          fill="#EA4335"
          d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.2 12 2.2 6.6 2.2 2.3 6.6 2.3 12s4.3 9.8 9.7 9.8c5.6 0 9.3-3.9 9.3-9.5 0-.6-.1-1.1-.2-1.6H12z"
        />
      </svg>
    ),
  },
  microsoft: {
    label: "Continue with Microsoft",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
        <path fill="#F25022" d="M2 2h9.5v9.5H2z" />
        <path fill="#7FBA00" d="M12.5 2H22v9.5h-9.5z" />
        <path fill="#00A4EF" d="M2 12.5h9.5V22H2z" />
        <path fill="#FFB900" d="M12.5 12.5H22V22h-9.5z" />
      </svg>
    ),
  },
} as const;

export function SignInButtons({ providers, next }: { providers: (keyof typeof PROVIDERS)[]; next: string }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signIn(provider: keyof typeof PROVIDERS) {
    setBusy(provider);
    setError(null);
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: next,
    });
    if (error) {
      setError(error.message ?? "Sign-in didn't work. Try again.");
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      {providers.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => signIn(p)}
          disabled={busy !== null}
          className={cn(
            "flex min-h-13 w-full items-center justify-center gap-3 rounded-xl border-2 border-ink bg-white px-4 font-semibold text-ink shadow-stamp transition-transform",
            "hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-stamp-sm disabled:opacity-60",
          )}
        >
          {PROVIDERS[p].icon}
          {busy === p ? "Opening…" : PROVIDERS[p].label}
        </button>
      ))}
      {providers.length === 0 && (
        <p className="rounded-xl bg-red/10 p-3 text-sm text-red">
          No sign-in providers are set up yet. Add Google or Microsoft keys to the environment.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm font-medium text-red">
          {error}
        </p>
      )}
    </div>
  );
}

export function DevSignIn({ next }: { next: string }) {
  const [error, setError] = useState<string | null>(null);
  async function signIn(formData: FormData) {
    const email = String(formData.get("email"));
    const { error } = await authClient.signIn.email({
      email,
      password: "bulldogs-dev",
      callbackURL: next,
    });
    if (error) setError(error.message ?? "Run pnpm db:seed first");
    else window.location.href = next;
  }
  return (
    <form action={signIn} className="mt-6 rounded-2xl border-2 border-dashed border-navy/25 p-4">
      <p className="mb-2 text-sm font-semibold text-navy">Local dev login</p>
      <div className="flex gap-2">
        <select name="email" className="min-h-11 flex-1 rounded-xl border-2 border-navy/15 bg-white px-3 text-sm">
          <option value="coach@bulldogs.test">Coach (admin)</option>
          <option value="captain@bulldogs.test">Captain</option>
          <option value="player@bulldogs.test">Player</option>
          <option value="newbie@bulldogs.test">New sign-up (pending)</option>
        </select>
        <button type="submit" className="min-h-11 rounded-xl bg-navy px-4 text-sm font-semibold text-white">
          Go
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red">{error}</p>}
    </form>
  );
}

export function SignOutButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        await authClient.signOut();
        window.location.href = "/login";
      }}
    >
      Sign out
    </button>
  );
}
