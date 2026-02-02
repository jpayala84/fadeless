type EnvWithSpotifyScopes = {
  SPOTIFY_SCOPES: string;
};

const REQUIRED_SPOTIFY_SCOPES = [
  "user-read-email",
  "user-library-read",
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-follow-read"
] as const;

const splitScopes = (scopes: string): string[] =>
  scopes
    .split(/\s+/)
    .map((scope) => scope.trim())
    .filter(Boolean);

export const getSpotifyScopes = (env: EnvWithSpotifyScopes): string => {
  const configured = splitScopes(env.SPOTIFY_SCOPES);
  const all = new Set<string>([...REQUIRED_SPOTIFY_SCOPES, ...configured]);
  return Array.from(all).join(" ");
};
