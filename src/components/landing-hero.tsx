import Link from "next/link";
import { Check } from "lucide-react";

import { SignInButton } from "@/components/auth-buttons";
import { getAccessRequestUrl, type LandingAuthError } from "@/lib/marketing/access-request";

type LandingHeroProps = {
  authError?: LandingAuthError | null;
  errorId?: string;
};

export const LandingHero = ({ authError, errorId }: LandingHeroProps) => {
  const showLimitedAccess = authError?.title === "Limited beta access";
  const showInlineAuthError = Boolean(authError) && !showLimitedAccess;

  return (
    <section className="landing-home min-h-screen bg-background text-foreground">
      <div className="landing-shell mx-auto flex w-full max-w-6xl flex-col gap-9 px-6 pb-6 pt-6 md:px-12 md:pb-16 md:pt-8 xl:gap-12 xl:px-24 xl:pt-28">
        <div className="landing-main-stack flex w-full flex-col gap-8 xl:flex-row xl:items-stretch xl:justify-between xl:gap-16">
          <div className="landing-left-stack flex max-w-[640px] flex-1 flex-col xl:justify-between">
            <div className="landing-hero-copy-group space-y-5">
              <p className="landing-brand text-sm font-medium uppercase tracking-[0.48em] text-emerald-300/85">
                FADELESS
              </p>
              <h1 className="landing-title text-5xl font-semibold tracking-tight sm:text-6xl">
                Track songs that disappear.
              </h1>
              <p className="landing-copy max-w-xl text-lg text-muted-foreground">
                Connect your Spotify account and get a clear record of what went missing.
              </p>
            </div>

            {showLimitedAccess && authError ? (
              <div className="landing-panel landing-signin-card landing-access-card w-full max-w-[560px] rounded-3xl border">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <p className="landing-beta-copy landing-beta-copy--compact text-muted-foreground">
                    {authError.description}
                  </p>
                  {errorId ? (
                    <p className="font-mono text-xs text-muted-foreground">
                      Error ID: {errorId}
                    </p>
                  ) : null}
                  {authError.ctaLabel ? (
                    <Link
                      href={getAccessRequestUrl()}
                      target="_blank"
                      rel="noreferrer"
                      className="landing-cta landing-signin-cta inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-medium text-foreground transition sm:ml-auto sm:shrink-0"
                    >
                      {authError.ctaLabel}
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className="landing-right-stack flex w-full max-w-[540px] flex-col gap-6">
            <div className="landing-panel landing-signin-card w-full rounded-3xl border p-8">
              <div className="space-y-5">
                <p className="text-sm uppercase tracking-[0.48em] text-emerald-300/80">
                  Sign in
                </p>
                <div>
                  <h2 className="landing-signin-title font-semibold leading-tight">Continue with Spotify</h2>
                </div>
                <ul className="landing-checklist space-y-3 text-muted-foreground">
                  {[
                    "View missing songs in your playlists",
                    "Get alerts for changed tracks",
                    "Keep your music collection complete"
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-300" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                {showInlineAuthError && authError ? (
                  <div className="rounded-2xl border border-border/40 bg-card/35 p-4 text-sm">
                    <p className="font-medium text-foreground">{authError.title}</p>
                    <p className="mt-1 text-muted-foreground">{authError.description}</p>
                    {errorId ? (
                      <p className="mt-2 font-mono text-xs text-muted-foreground">
                        Error ID: {errorId}
                      </p>
                    ) : null}
                    {authError.ctaLabel ? (
                      <Link
                        href={getAccessRequestUrl()}
                        target="_blank"
                        rel="noreferrer"
                        className="landing-cta landing-signin-cta mt-3 inline-flex h-12 items-center justify-center rounded-full px-7 text-base font-medium text-foreground transition"
                      >
                        {authError.ctaLabel}
                      </Link>
                    ) : null}
                  </div>
                ) : null}
                <SignInButton className="landing-cta landing-signin-cta h-14 w-full max-w-none justify-center text-lg sm:h-[4.2rem]" />
              </div>
            </div>
          </div>
        </div>
        <div className="landing-links flex flex-wrap gap-4 text-xs text-muted-foreground">
          <Link
            href="/privacy"
            className="underline-offset-4 transition hover:text-foreground hover:underline"
          >
            Privacy Policy
          </Link>
          <span aria-hidden="true" className="text-muted-foreground">•</span>
          <Link
            href="/terms"
            className="underline-offset-4 transition hover:text-foreground hover:underline"
          >
            Terms of Service
          </Link>
        </div>
      </div>
    </section>
  );
};
