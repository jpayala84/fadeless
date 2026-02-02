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

export const RemovedList = ({ title, events, emptyMessage }: Props) => (
  <section className="surface-card space-y-5 rounded-3xl border border-border/40 bg-card/50 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-emerald-400/80">
          History
        </p>
        <h2 className="text-2xl font-semibold">{title}</h2>
      </div>
      <span className="text-sm text-muted-foreground">{events.length} items</span>
    </div>
    {events.length === 0 ? (
      <div className="rounded-2xl border border-dashed border-border/50 bg-card/30 px-4 py-6 text-sm text-muted-foreground">
        <p className="text-base font-semibold text-foreground">All clear</p>
        <p className="mt-1">{emptyMessage}</p>
      </div>
    ) : (
      <div className="space-y-3">
        {events.map((event) => (
          <article
            key={event.id}
            className="min-h-[96px] rounded-2xl border border-border/40 bg-card/40 p-4 text-sm shadow-inner transition hover:border-primary/40"
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
    )}
  </section>
);
