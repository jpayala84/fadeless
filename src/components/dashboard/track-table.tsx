import Image from "next/image";
import Link from "next/link";

import { formatDuration } from "@/lib/dashboard/track-format";

type TrackRow = {
  id: string;
  name: string;
  artists: string[];
  album?: string;
  imageUrl?: string;
  durationMs?: number;
  externalUrl?: string;
};

type Props = {
  title: string;
  subtitle?: string;
  tracks: TrackRow[];
  backHref?: string;
  externalHref?: string;
  footerCta?: { href: string; label: string };
  pagination?: {
    currentPage: number;
    totalPages: number;
    startIndex?: number;
    prevHref?: string;
    nextHref?: string;
  };
};

export const TrackTable = ({
  title,
  subtitle,
  tracks,
  backHref,
  externalHref,
  footerCta,
  pagination
}: Props) => (
  <section className="surface-card space-y-4 rounded-3xl border border-border/40 bg-card/50 p-6 shadow-[0_30px_60px_rgba(0,0,0,0.35)] backdrop-blur">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">
          Collection
        </p>
        {externalHref ? (
          <a
            href={externalHref}
            target="_blank"
            rel="noreferrer"
            className="text-3xl font-semibold underline-offset-4 hover:underline"
          >
            {title}
          </a>
        ) : (
          <h2 className="text-3xl font-semibold">{title}</h2>
        )}
        {subtitle ? (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {backHref ? (
        <Link
          href={backHref}
          className="neon-soft-hover rounded-full border border-border/40 bg-card/30 px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          ← Back to dashboard
        </Link>
      ) : null}
    </div>

    <div className="overflow-hidden rounded-2xl border border-border/40 bg-card/30">
      <div className="grid grid-cols-[40px_minmax(0,1fr)_80px] border-b border-border/30 px-4 py-2 text-xs uppercase tracking-[0.4em] text-muted-foreground">
        <span>#</span>
        <span>Title</span>
        <span className="text-right">Time</span>
      </div>
      <div className="divide-y divide-border/30">
        {tracks.map((track, index) => {
          const rowIndex =
            (pagination?.startIndex ?? 0) + index + 1;
          return (
            <div
              key={track.id ?? `${track.name}-${index}`}
              className="min-h-[68px] grid grid-cols-[40px_minmax(0,1fr)_80px] items-center gap-3 px-4 py-3 text-sm text-foreground transition hover:bg-card/50"
            >
              <span className="text-xs text-muted-foreground">{rowIndex}</span>
              <div className="flex items-center gap-3">
                {track.externalUrl ? (
                  <a
                    href={track.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3"
                  >
                    {track.imageUrl ? (
                      <Image
                        src={track.imageUrl}
                        alt={track.name}
                        width={44}
                        height={44}
                        className="h-11 w-11 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-11 w-11 rounded-md bg-gradient-to-b from-emerald-400/20 to-transparent" />
                    )}
                    <div>
                      <p className="font-medium underline-offset-4 hover:underline">
                        {track.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {track.artists.join(", ")}
                      </p>
                    </div>
                  </a>
                ) : (
                  <>
                    {track.imageUrl ? (
                      <Image
                        src={track.imageUrl}
                        alt={track.name}
                        width={44}
                        height={44}
                        className="h-11 w-11 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-11 w-11 rounded-md bg-gradient-to-b from-emerald-400/20 to-transparent" />
                    )}
                    <div>
                      <p className="font-medium">{track.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {track.artists.join(", ")}
                      </p>
                    </div>
                  </>
                )}
              </div>
              <span className="text-right text-xs text-muted-foreground">
                {formatDuration(track.durationMs)}
              </span>
            </div>
          );
        })}
        {tracks.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            <p className="text-base font-semibold text-foreground">
              Nothing to show yet
            </p>
            <p className="mt-1">
              Switch collections to see tracks here.
            </p>
          </div>
        ) : null}
      </div>
    </div>

    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {pagination ? (
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground sm:justify-start">
          <a
            href={pagination.prevHref ?? "#"}
            className={`neon-soft-hover rounded-full border border-border/40 px-3 py-1 ${
              pagination.prevHref
                ? "hover:text-foreground"
                : "pointer-events-none opacity-30"
            }`}
          >
            Previous
          </a>
          <span>
            Page {pagination.currentPage + 1} of {pagination.totalPages}
          </span>
          <a
            href={pagination.nextHref ?? "#"}
            className={`neon-soft-hover rounded-full border border-border/40 px-3 py-1 ${
              pagination.nextHref
                ? "hover:text-foreground"
                : "pointer-events-none opacity-30"
            }`}
          >
            Next
          </a>
        </div>
      ) : (
        <div />
      )}
      {footerCta ? (
        <a
          href={footerCta.href}
          target="_blank"
          rel="noreferrer"
          className="neon-soft-hover inline-flex items-center justify-center rounded-full border border-border/40 bg-card/40 px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          {footerCta.label}
        </a>
      ) : null}
    </div>
  </section>
);
