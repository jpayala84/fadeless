import type { DashboardParams, DashboardView, PageSearchParams } from "@/lib/dashboard/types";

export const parseDashboardParams = (
  searchParams?: PageSearchParams
): DashboardParams => {
  const playlistPage = Number(searchParams?.playlistPage ?? "0") || 0;
  const viewParam = searchParams?.view;
  const view: DashboardView =
    viewParam === "archive" ||
    viewParam === "settings" ||
    viewParam === "playlists"
      ? viewParam
      : "weekly";

  const collectionParam = searchParams?.collection;
  const collectionType =
    collectionParam === "playlist" ||
    collectionParam === "liked" ||
    collectionParam === "album"
      ? collectionParam
      : undefined;

  const collectionId = searchParams?.collectionId;
  const collectionName = searchParams?.collectionName;
  const collectionPageParam = Number(searchParams?.collectionPage ?? "0") || 0;
  const collectionPage = Math.max(0, collectionPageParam);

  return {
    view,
    playlistPage,
    collectionType,
    collectionId,
    collectionName,
    collectionPage,
    collectionPageSize: 50
  };
};
