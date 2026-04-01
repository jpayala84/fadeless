"use client";

import Image from "next/image";

import type { RemovalEventDTO } from "@/lib/db/removal-repository";

type Props = {
  title: string;
  events: RemovalEventDTO[];
  emptyMessage: string;
};

const formatDate = (value: Date | string) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric"
  }).format(typeof value === "string" ? new Date(value) : value);

const toDateKey = (value: Date | string) => {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().split("T")[0];
};

const formatTimelineLabel = (value: Date | string) => {
  const date = typeof value === "string" ? new Date(value) : value;
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) {
    return `Today • ${formatDate(date)}`;
  }
  if (diffDays === 1) {
    return `Yesterday • ${formatDate(date)}`;
  }
  return formatDate(date);
};

export const RemovedList = ({ title, events, emptyMessage }: Props) => {
  const groupedEvents = events.reduce(
    (acc, event) => {
      const key = toDateKey(event.removedAt);
      const existing = acc.find((group) => group.key === key);
      if (existing) {
        existing.items.push(event);
      } else {
        acc.push({ key, label: formatTimelineLabel(event.removedAt), items: [event] });
      }
      return acc;
    },
    [] as Array<{ key: string; label: string; items: RemovalEventDTO[] }>
  );

  return (
    <section className="mobile-history-shell removed-history-shell space-y-6 rounded-3xl border border-white/35 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-green-500">
          History
        </p>
        <h2 className="text-2xl font-semibold">{title}</h2>
      </div>
      <span className="text-sm text-muted-foreground">{events.length} items</span>
    </div>
    {events.length === 0 ? (
      <div className="removed-empty-state rounded-2xl border border-dashed border-emerald-200/20 bg-card/30 px-4 py-6 text-sm text-muted-foreground">
        <p className="removed-empty-state-title text-base font-semibold text-foreground">All clear</p>
        <p className="mt-1">{emptyMessage}</p>
      </div>
    ) : (
      <div className="space-y-6">
        {groupedEvents.map((group) => (
          <div key={group.key} className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-emerald-300/70 shadow-[0_0_12px_rgba(52,211,153,0.5)]" />
              <span>{group.label}</span>
              <div className="h-px flex-1 rounded-full bg-gradient-to-r from-emerald-300/60 via-emerald-300/55 to-emerald-300/35 shadow-[0_0_0_1px_rgba(72,240,178,0.22),0_0_14px_rgba(72,240,178,0.38),0_0_28px_rgba(72,240,178,0.22)]" />
            </div>
            {group.items.map((event) => (
              <article
                key={event.id}
                className="mobile-history-card group min-h-[104px] rounded-3xl border border-emerald-200/20 bg-black p-4 text-sm shadow-[0_16px_30px_rgba(0,0,0,0.28)] transition hover:border-emerald-200/30"
              >
                <div className="flex items-center gap-4">
                  {event.trackId ? (
                    <a
                      href={`https://open.spotify.com/track/${event.trackId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex"
                    >
                      {event.albumImageUrl ? (
                        <Image
                          src={event.albumImageUrl}
                          alt={event.albumName}
                          width={56}
                          height={56}
                          className="h-14 w-14 rounded-xl object-cover shadow-lg"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/30 to-primary/5" />
                      )}
                    </a>
                  ) : event.albumImageUrl ? (
                    <Image
                      src={event.albumImageUrl}
                      alt={event.albumName}
                      width={56}
                      height={56}
                      className="h-14 w-14 rounded-xl object-cover shadow-lg"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/30 to-primary/5" />
                  )}
                  <div className="flex flex-1 items-center justify-between gap-3">
                    <div className="block">
                      {event.trackId ? (
                        <a
                          href={`https://open.spotify.com/track/${event.trackId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-base font-semibold text-foreground underline-offset-4 hover:underline"
                        >
                          {event.trackName}
                        </a>
                      ) : (
                        <p className="text-base font-semibold text-foreground">
                          {event.trackName}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {event.artists.join(", ")} ·{" "}
                        <span className="text-muted-foreground">{event.albumName}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Removed from{" "}
                        <span className="text-foreground">
                          {event.playlistNames.join(", ") || "Liked Songs"}
                        </span>
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(event.removedAt)}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ))}
      </div>
    )}
    </section>
  );
};
