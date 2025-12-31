"use client";

import { useTransition } from "react";

import { acknowledgeInAppDigest } from "@/app/actions/acknowledge-in-app-digest";
import { Button } from "@/ui/button";

type DigestEvent = {
  id: string;
  trackName: string;
  artists: string;
  playlistNames: string[];
  removedAt: string;
};

type Props = {
  events: DigestEvent[];
  totalCount: number;
};

export const InAppDigestBanner = ({ events, totalCount }: Props) => {
  const [pending, startTransition] = useTransition();

  return (
    <div className="surface-card rounded-3xl border border-emerald-400/40 bg-emerald-500/5 p-6 text-sm shadow-inner">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">
            Weekly summary
          </p>
          <h2 className="text-xl font-semibold text-emerald-100">
            {totalCount} removal{totalCount === 1 ? "" : "s"} awaiting review
          </h2>
          <p className="text-emerald-100/80">
            You chose in-app notifications, so new removals appear here until you mark them as read.
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={() => startTransition(() => acknowledgeInAppDigest())}
        >
          {pending ? "Clearing…" : "Mark as read"}
        </Button>
      </div>
      <ul className="mt-4 space-y-2 text-emerald-50">
        {events.map((event) => (
          <li
            key={event.id}
            className="rounded-2xl border border-emerald-400/30 bg-emerald-500/5 px-4 py-3"
          >
            <p className="font-semibold">{event.trackName}</p>
            <p className="text-xs text-emerald-200">{event.artists}</p>
            <p className="text-xs text-emerald-200">
              Removed from {event.playlistNames.join(", ")} · {event.removedAt}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};
