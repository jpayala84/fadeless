import type { SpotifyTrack } from "@/lib/spotify/client";

export type DashboardView = "weekly" | "archive" | "playlists" | "settings";

export type CollectionType = "playlist" | "liked" | "album";

export type PageSearchParams = {
  playlist?: string;
  playlistPage?: string;
  view?: DashboardView;
  mobileSection?: "library" | "removals";
  collection?: string;
  collectionId?: string;
  collectionName?: string;
  collectionPage?: string;
  error?: string;
  reason?: string;
  errorId?: string;
  preview?: string;
  devtools?: string;
  loggedOut?: string;
};

export type DashboardParams = {
  view: DashboardView;
  playlistPage: number;
  collectionType?: CollectionType;
  collectionId?: string;
  collectionName?: string;
  collectionPage: number;
  collectionPageSize: number;
};

export type TrackTableData = {
  title: string;
  subtitle?: string;
  externalHref?: string;
  footerCta?: { href: string; label: string };
  tracks: Array<{
    id: string;
    name: string;
    artists: string[];
    imageUrl?: string;
    durationMs?: number;
    externalUrl?: string;
  }>;
  pagination?: {
    currentPage: number;
    totalPages: number;
    prevHref?: string;
    nextHref?: string;
  };
};

export type TrackTableSource = {
  title: string;
  subtitle?: string;
  externalHref?: string;
  footerCta?: { href: string; label: string };
  tracks: SpotifyTrack[];
  total: number;
};
