import type { ServerEnv } from "@/lib/env";

const REQUIRED_SCOPES = [
  "user-read-email",
  "user-library-read",
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-follow-read"
];

export const getSpotifyScopes = (env: ServerEnv) => {
  const configured = (env.SPOTIFY_SCOPES ?? "")
    .split(/\s+/)
    .map((scope) => scope.trim())
    .filter(Boolean);

  const scopes = new Set<string>([...REQUIRED_SCOPES, ...configured]);
  return Array.from(scopes).join(" ");
};

