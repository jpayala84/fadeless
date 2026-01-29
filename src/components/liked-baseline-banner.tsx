"use client";

import { useLikedBaselineBanner } from "@/lib/scan/use-liked-baseline-banner";
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
  const {
    completed,
    indexedCount,
    message,
    percent,
    started,
    start
  } = useLikedBaselineBanner(totalCount, initialIndexedCount, initiallyCompleted);

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
            onClick={start}
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
