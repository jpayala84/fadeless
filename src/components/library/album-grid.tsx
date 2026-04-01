import type { KeyboardEvent as ReactKeyboardEvent } from "react";

import Image from "next/image";

import type { AlbumSummary } from "@/lib/spotify/client";
import { cn } from "@/lib/utils";

type AlbumGridProps = {
  savedAlbums: AlbumSummary[];
  savedAlbumsCount: number;
  activeCollectionId?: string;
  onViewAlbum: (album: AlbumSummary) => void;
  onKeyActivate: (event: ReactKeyboardEvent, action: () => void) => void;
};

export const AlbumGrid = ({
  savedAlbums,
  savedAlbumsCount,
  activeCollectionId,
  onViewAlbum,
  onKeyActivate
}: AlbumGridProps) => (
  <div className="space-y-3">
    <p className="text-xs text-muted-foreground">
      {savedAlbumsCount.toLocaleString()} albums
    </p>
    <div className="grid grid-cols-2 gap-3">
      {savedAlbums.map((album) => {
        const isActive = activeCollectionId === album.id;
        const albumHref = `https://open.spotify.com/album/${album.id}`;
        const artistHref = album.artistId
          ? `https://open.spotify.com/artist/${album.artistId}`
          : `https://open.spotify.com/search/${encodeURIComponent(album.artist)}`;

        return (
          <div
            key={album.id}
            role="button"
            tabIndex={0}
            onClick={() => onViewAlbum(album)}
            onKeyDown={(event) => onKeyActivate(event, () => onViewAlbum(album))}
            className={cn(
              "neon-row-card flex min-h-[92px] items-center gap-3 rounded-2xl border p-3 text-sm shadow-inner transition",
              isActive
                ? "border-emerald-400/70 bg-emerald-400/10"
                : "border-emerald-200/20 bg-card/30 hover:border-emerald-200/30"
            )}
          >
            <div className="flex items-center gap-3">
              {album.imageUrl ? (
                <a
                  href={albumHref}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => event.stopPropagation()}
                >
                  <Image
                    src={album.imageUrl}
                    alt={album.name}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-xl object-cover"
                  />
                </a>
              ) : (
                <div className="h-12 w-12 rounded-xl bg-gradient-to-b from-emerald-400/20 to-transparent" />
              )}
              <div>
                <a
                  href={albumHref}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {album.name}
                </a>
                <div className="text-xs text-muted-foreground">
                  <a
                    href={artistHref}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => event.stopPropagation()}
                    className="underline-offset-4 hover:underline"
                  >
                    {album.artist}
                  </a>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      {savedAlbums.length === 0 ? (
        <p className="col-span-2 text-xs text-muted-foreground">
          Albums populate after your next sync.
        </p>
      ) : null}
    </div>
  </div>
);
