"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type BaselinePayload =
  | { completed: boolean; indexedCount: number; throttled?: false }
  | { throttled: true; retryAfterSeconds: number }
  | { error: string };

export const useLikedBaselineBanner = (
  totalCount: number,
  initialIndexedCount: number,
  initiallyCompleted: boolean
) => {
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

  const start = useCallback(() => setStarted(true), []);

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
        const payload = (await response.json()) as BaselinePayload;

        if (canceled) {
          return;
        }

        if ("throttled" in payload && payload.throttled) {
          setMessage(
            `Spotify rate-limited us. Retrying in ${payload.retryAfterSeconds}s…`
          );
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

  return {
    completed,
    indexedCount,
    message,
    percent,
    started,
    start,
    totalCount
  };
};
