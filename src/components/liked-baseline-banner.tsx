"use client";

import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

type Props = {
  totalCount: number;
  initialIndexedCount: number;
  initiallyCompleted: boolean;
};

export const LikedBaselineBanner = ({
  totalCount,
  initialIndexedCount,
  initiallyCompleted
}: Props) => {
  const [indexedCount, setIndexedCount] = useState(initialIndexedCount);
  const [completed, setCompleted] = useState(initiallyCompleted);
  const [started, setStarted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const percent = useMemo(() => {
    if (!totalCount) {
      return 0;
    }
    return Math.min(100, Math.round((indexedCount / totalCount) * 100));
  }, [indexedCount, totalCount]);

  useEffect(() => {
    if (completed || !started) {
      return;
    }

    let canceled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const tick = async () => {
      try {
        const response = await fetch("/api/jobs/baseline-liked", {
          method: "POST"
        });
        const payload = (await response.json()) as
          | {
              completed: boolean;
              indexedCount: number;
              throttled?: false;
            }
          | { throttled: true; retryAfterSeconds: number }
          | { error: string };

        if (canceled) {
          return;
        }

        if ("throttled" in payload && payload.throttled) {
          setMessage(`Spotify rate-limited us. Retrying in ${payload.retryAfterSeconds}s…`);
          timeout = setTimeout(tick, payload.retryAfterSeconds * 1000);
          return;
        }

        if ("error" in payload) {
          setMessage("Spotify is temporarily unavailable. Retrying soon…");
          timeout = setTimeout(tick, 3000);
          return;
        }

        setIndexedCount(payload.indexedCount);
        setCompleted(payload.completed);
        setMessage(null);

        if (!payload.completed) {
          timeout = setTimeout(tick, 900);
        }
      } catch {
        if (!canceled) {
          setMessage("Spotify is temporarily unavailable. Retrying soon…");
          timeout = setTimeout(tick, 3000);
        }
      }
    };

    tick();

    return () => {
      canceled = true;
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [completed, started]);

  if (completed) {
    return null;
  }

  return (
    <div className="surface-card rounded-3xl border border-border/40 bg-card/50 p-6 shadow-inner">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">
            Getting started
          </p>
          <h2 className="text-xl font-semibold">Create your first Liked Songs snapshot</h2>
          <p className="text-sm text-muted-foreground">
            This baseline lets us detect removals later.
          </p>
        </div>
        {!started ? (
          <button
            type="button"
            onClick={() => setStarted(true)}
            className="rounded-full border border-border/40 bg-card/40 px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            Start
          </button>
        ) : (
          <div className="text-right text-xs text-muted-foreground">
            {indexedCount.toLocaleString()} / {totalCount.toLocaleString()}
          </div>
        )}
      </div>
      {started ? (
        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-muted/60">
            <div
              className={cn(
                "h-full bg-emerald-400 transition-all",
                percent ? "" : "w-2"
              )}
              style={{ width: `${Math.max(percent, 2)}%` }}
            />
          </div>
          <div
            className="mt-2 flex items-center justify-between text-xs text-muted-foreground"
          >
            <span>{message ?? "Indexing…"}</span>
            <span>{percent}%</span>
          </div>
        </div>
      ) : null}
    </div>
  );
};
