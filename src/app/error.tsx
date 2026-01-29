"use client";

import { useEffect } from "react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

const ErrorPage = ({ error, reset }: Props) => {
  useEffect(() => {
    console.error("[app-error]", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-xl space-y-4 px-6 py-20 text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">
          Something went wrong
        </p>
        <h1 className="text-3xl font-semibold">We hit a snag</h1>
        <p className="text-sm text-muted-foreground">
          Please try again. If the issue keeps happening, reconnect to Spotify or
          refresh the page.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
          >
            Try again
          </button>
          <a
            href="/api/auth/login"
            className="rounded-full border border-border/40 px-5 py-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            Reconnect Spotify
          </a>
        </div>
      </section>
    </main>
  );
};

export default ErrorPage;
