import Link from "next/link";

import { SignInButton } from "@/components/auth-buttons";
import { getAccessRequestUrl, type LandingAuthError } from "@/lib/marketing/access-request";

type LandingHeroProps = {
  authError?: LandingAuthError | null;
  errorId?: string;
};

export const LandingHero = ({ authError, errorId }: LandingHeroProps) => (
  <section className="min-h-screen bg-background text-foreground">
    <div className="grid gap-10 px-6 py-16 md:px-12 lg:grid-cols-[1fr_420px] lg:px-24">
      <div className="flex flex-col justify-center space-y-4">
        <p className="text-sm uppercase tracking-[0.4em] text-emerald-400">
          Fadeless
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Track songs that disappear.
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Connect your Spotify account and get a clear record of what went missing.
        </p>
        <div className="max-w-xl rounded-2xl border border-border/40 bg-card/40 p-4 text-sm text-muted-foreground backdrop-blur">
          <p className="font-medium text-foreground">Limited beta access</p>
          <p className="mt-1">
            Spotify requires apps in development mode to be allowlisted. If you can’t sign in, request access and I’ll add you.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link
              href={getAccessRequestUrl()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center rounded-full bg-emerald-500 px-4 text-sm font-medium text-emerald-950 transition hover:bg-emerald-400"
            >
              Request access
            </Link>
            <Link
              href="/api/auth/login"
              className="inline-flex h-10 items-center justify-center rounded-full border border-border/50 bg-transparent px-4 text-sm font-medium text-foreground transition hover:bg-secondary/60"
            >
              Try sign in again
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <Link
            href="/privacy"
            className="underline-offset-4 transition hover:text-foreground hover:underline"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="underline-offset-4 transition hover:text-foreground hover:underline"
          >
            Terms of Service
          </Link>
        </div>
      </div>

      <div className="surface-card rounded-3xl border border-border/40 bg-card/60 p-8 shadow-[0_40px_80px_rgba(0,0,0,0.35)] backdrop-blur">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.35em] text-emerald-300">
            Sign in
          </p>
          <h2 className="text-2xl font-semibold">Continue with Spotify</h2>
          {authError ? (
            <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm">
              <p className="font-medium text-foreground">{authError.title}</p>
              <p className="mt-1 text-muted-foreground">{authError.description}</p>
              {errorId ? (
                <p className="mt-2 font-mono text-xs text-muted-foreground">Error ID: {errorId}</p>
              ) : null}
              {authError.ctaLabel ? (
                <Link
                  href={getAccessRequestUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex text-sm font-medium text-foreground underline underline-offset-4 hover:text-foreground/80"
                >
                  {authError.ctaLabel}
                </Link>
              ) : null}
            </div>
          ) : null}
          <SignInButton />
        </div>
      </div>
    </div>
  </section>
);
