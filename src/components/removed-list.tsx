"use client";

import Image from "next/image";

import type { RemovalEventDTO } from "@/lib/db/removal-repository";

type Props = {
  title: string;
  events: RemovalEventDTO[];
  emptyMessage: string;
};

const formatDate = (value: Date) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric"
  }).format(value);

export const RemovedList = ({ title, events, emptyMessage }: Props) => (
  <section className="surface-card space-y-5 rounded-3xl border border-border/40 bg-card/50 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur">
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
      <p className="text-sm text-muted-foreground">{emptyMessage}</p>
    ) : (
      <div className="space-y-3">
        {events.map((event) => (
          <article
            key={event.id}
            className="rounded-2xl border border-border/40 bg-card/40 p-4 text-sm shadow-inner transition hover:border-primary/40"
          >
            <div className="flex items-center gap-4">
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
              <div className="flex flex-1 items-center justify-between gap-3">
                <div className="block">
                  <p className="text-base font-semibold text-foreground">
                    {event.trackName}
                  </p>
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
