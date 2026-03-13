"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { formatDate } from "@/lib/dashboard/formatters";

type PlaylistAffectedItem = {
  id: string;
  name: string;
  spotifyHref: string;
  dashboardHref: string;
  imageUrl?: string | null;
  lastRemovedAt: string;
};

type Props = {
  total: number;
  items: PlaylistAffectedItem[];
  emptyMessage: string;
};

export const PlaylistsAffected = ({ total, items, emptyMessage }: Props) => {
  const router = useRouter();

  const handleNavigate = (href: string) => {
    router.push(href);
  };

  return (
    <section className="surface-card playlist-affected-shell space-y-4 rounded-3xl border border-emerald-200/20 bg-card/50 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-400/80">
            Playlists
          </p>
          <h2 className="text-2xl font-semibold">Playlists affected</h2>
        </div>
        <span className="text-sm text-muted-foreground">{total} total</span>
      </div>
      {items.length ? (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleNavigate(item.dashboardHref)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleNavigate(item.dashboardHref);
                  }
                }}
                className="neon-row-card playlist-affected-card relative rounded-2xl border border-emerald-200/20 bg-card/40 px-4 py-3 text-left text-sm transition hover:border-emerald-200/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <div className="flex items-center gap-3">
                  {item.imageUrl ? (
                    <a
                      href={item.spotifyHref}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        width={44}
                        height={44}
                        className="h-11 w-11 rounded-xl object-cover"
                      />
                    </a>
                  ) : (
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-400/20 to-transparent" />
                  )}
                  <div className="flex-1">
                    <a
                      href={item.spotifyHref}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => event.stopPropagation()}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {item.name}
                    </a>
                    <p className="text-xs text-muted-foreground">
                      Last removal: {formatDate(new Date(item.lastRemovedAt))}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">Open →</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      )}
    </section>
  );
};
