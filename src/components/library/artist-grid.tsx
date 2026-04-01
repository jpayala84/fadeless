import Image from "next/image";

import type { ArtistSummary } from "@/lib/spotify/client";

type ArtistGridProps = {
  followedArtists: ArtistSummary[];
  followedArtistsAvailable: boolean;
};

export const ArtistGrid = ({
  followedArtists,
  followedArtistsAvailable
}: ArtistGridProps) => (
  <div className="grid gap-3">
    {followedArtists.map((artist) => (
      <a
        key={artist.id}
        href={`https://open.spotify.com/artist/${artist.id}`}
        target="_blank"
        rel="noreferrer"
        className="neon-row-card flex items-center gap-3 rounded-2xl border border-emerald-200/20 bg-card/30 p-3 text-sm transition hover:border-emerald-200/30"
      >
        {artist.imageUrl ? (
          <Image
            src={artist.imageUrl}
            alt={artist.name}
            width={44}
            height={44}
            className="h-11 w-11 rounded-full object-cover"
          />
        ) : (
          <div className="h-11 w-11 rounded-full bg-gradient-to-br from-emerald-400/30 to-transparent" />
        )}
        <div className="flex flex-1 flex-col">
          <p className="font-medium">{artist.name}</p>
          <p className="text-xs text-muted-foreground">
            {artist.genres.slice(0, 2).join(" · ") || "Artist"}
          </p>
        </div>
        <span className="text-[0.65rem] text-muted-foreground">
          {Intl.NumberFormat("en", { notation: "compact" }).format(artist.followers)} followers
        </span>
      </a>
    ))}
    {followedArtists.length === 0 ? (
      <div className="rounded-2xl border border-emerald-200/20 bg-card/30 px-4 py-6 text-sm text-muted-foreground">
        {followedArtistsAvailable ? (
          "You are not following any artists on Spotify yet."
        ) : (
          <>
            <p className="text-base font-semibold text-foreground">
              Unable to load followed artists
            </p>
            <p className="mt-1">
              This requires Spotify’s follow permission. Sign out and back in to grant access.
            </p>
          </>
        )}
      </div>
    ) : null}
  </div>
);
