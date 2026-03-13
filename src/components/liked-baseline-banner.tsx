"use client";

import { Sparkles } from "lucide-react";

import { useLikedBaselineBanner } from "@/lib/scan/use-liked-baseline-banner";
import { Button } from "@/ui/button";
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
          <Button
            type="button"
            onClick={start}
            className="gap-2 bg-emerald-400 text-slate-900 hover:bg-emerald-300"
          >
            <Sparkles className="h-4 w-4" />
            Start
          </Button>
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
            <span>{message ?? "Scanning your library…"}</span>
            <span>{percent}%</span>
          </div>
          <p className="mt-2 text-xs text-yellow-400">
            Keep this page open until the first scan finishes to avoid sync issues.
          </p>
        </div>
      ) : null}
    </div>
  );
};
