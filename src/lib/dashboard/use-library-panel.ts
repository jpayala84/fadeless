"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { togglePlaylistMonitoring } from "@/app/actions/playlist-monitoring";
import type {
  AlbumSummary,
  ArtistSummary,
  PlaylistSummary
} from "@/lib/spotify/client";
import { makeBuildHref } from "@/lib/dashboard/navigation";
import type { LibraryPanelTabId } from "@/lib/dashboard/library-tabs";

const PLAYLISTS_PER_PAGE = 5;

type Options = {
  playlists: PlaylistSummary[];
  followedArtists: ArtistSummary[];
  savedAlbums: AlbumSummary[];
  monitoredPlaylists: Record<string, boolean>;
  playlistBadgeCounts: Record<string, number>;
  likedBadgeCount: number;
  badgePollingEnabled: boolean;
  page: number;
  preferredPanel?: LibraryPanelTabId;
};

export const useLibraryPanelState = ({
  playlists,
  followedArtists,
  savedAlbums,
  monitoredPlaylists,
  playlistBadgeCounts,
  likedBadgeCount,
  badgePollingEnabled,
  page,
  preferredPanel
}: Options) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [badgeCountsState, setBadgeCountsState] = useState(playlistBadgeCounts);
  const [likedBadgeCountState, setLikedBadgeCountState] = useState(likedBadgeCount);
  const [monitorState, setMonitorState] = useState(monitoredPlaylists);
  const [activePanel, setActivePanel] = useState<LibraryPanelTabId>(
    preferredPanel ?? "playlists"
  );
  const [pendingMonitor, startMonitorTransition] = useTransition();
  const [isNavigating, startNavigation] = useTransition();

  const buildHref = useMemo(() => {
    const current: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      current[key] = value;
    });
    return makeBuildHref(current);
  }, [searchParams]);

  const didApplyPreferred = useRef(false);
  useEffect(() => {
    if (preferredPanel && !didApplyPreferred.current) {
      setActivePanel(preferredPanel);
      didApplyPreferred.current = true;
    }
  }, [preferredPanel]);

  useEffect(() => {
    setMonitorState(monitoredPlaylists);
  }, [monitoredPlaylists]);

  const enabledMonitorCount = useMemo(
    () => Object.values(monitorState).filter(Boolean).length,
    [monitorState]
  );

  const orderedPlaylists = useMemo(() => {
    return playlists
      .map((playlist, index) => ({
        playlist,
        index,
        tracked: monitorState[playlist.id] ?? false
      }))
      .sort((a, b) => {
        if (a.tracked !== b.tracked) {
          return a.tracked ? -1 : 1;
        }
        return a.index - b.index;
      })
      .map((item) => item.playlist);
  }, [playlists, monitorState]);

  const totalPages = Math.max(
    1,
    Math.ceil(orderedPlaylists.length / PLAYLISTS_PER_PAGE)
  );
  const currentPage = Math.min(page, totalPages - 1);
  const visiblePlaylists = orderedPlaylists.slice(
    currentPage * PLAYLISTS_PER_PAGE,
    currentPage * PLAYLISTS_PER_PAGE + PLAYLISTS_PER_PAGE
  );

  const changePage = useCallback(
    (nextPage: number) => {
      const safePage = Math.max(0, Math.min(nextPage, totalPages - 1));
      startNavigation(() => {
        router.push(buildHref({ playlistPage: String(safePage) }));
      });
    },
    [buildHref, router, totalPages]
  );

  const viewCollection = useCallback(
    (
      type: "playlist" | "liked" | "album",
      payload?: { id?: string; name?: string }
    ) => {
      const overrides: Record<string, string | undefined> = {
        collection: type,
        collectionId: payload?.id,
        collectionName: payload?.name,
        collectionPage: "0"
      };
      startNavigation(() => {
        router.push(buildHref(overrides));
      });
    },
    [buildHref, router]
  );

  const handlePlaylistFocus = useCallback(
    (playlistId: string, playlistName: string) => {
      viewCollection("playlist", { id: playlistId, name: playlistName });
    },
    [viewCollection]
  );

  const handleKeyActivate = useCallback(
    (event: React.KeyboardEvent, action: () => void) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        action();
      }
    },
    []
  );

  const toggleMonitor = useCallback(
    (playlist: PlaylistSummary, nextEnabled: boolean) => {
      setMonitorState((current) => ({
        ...current,
        [playlist.id]: nextEnabled
      }));

      startMonitorTransition(async () => {
        const result = await togglePlaylistMonitoring({
          playlistId: playlist.id,
          playlistName: playlist.name,
          enabled: nextEnabled
        });
        if (result.status === "error") {
          setMonitorState((current) => ({
            ...current,
            [playlist.id]: !nextEnabled
          }));
          toast.error(result.message);
          return;
        }
        setMonitorState((current) => ({
          ...current,
          [playlist.id]: result.enabled
        }));
        toast.success(
          result.enabled ? `Tracking ${playlist.name}` : `Stopped tracking ${playlist.name}`
        );
      });
    },
    []
  );

  useEffect(() => {
    if (!badgePollingEnabled) {
      return;
    }

    let cancelled = false;

    const pollBadges = async () => {
      try {
        const response = await fetch("/api/notifications/badges");
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as {
          ok: boolean;
          likedBadgeCount: number;
          playlistBadgeCounts: Record<string, number>;
        };
        if (cancelled || !payload.ok) {
          return;
        }
        setBadgeCountsState(payload.playlistBadgeCounts ?? {});
        setLikedBadgeCountState(payload.likedBadgeCount ?? 0);
      } catch {
        // silently ignore badge polling errors
      }
    };

    pollBadges();
    const interval = setInterval(pollBadges, 15000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [badgePollingEnabled]);

  const clearLikedBadgeNow = useCallback(() => {
    setLikedBadgeCountState(0);
  }, []);

  const clearPlaylistBadgeNow = useCallback((playlistId: string) => {
    setBadgeCountsState((current) => ({
      ...current,
      [playlistId]: 0
    }));
  }, []);

  return {
    badgeCountsState,
    likedBadgeCountState,
    currentPage,
    totalPages,
    activePanel,
    pendingMonitor,
    enabledMonitorCount,
    visiblePlaylists,
    monitorState,
    setActivePanel,
    changePage,
    viewCollection,
    handlePlaylistFocus,
    toggleMonitor,
    handleKeyActivate,
    isNavigating,
    followedArtists,
    savedAlbums,
    clearLikedBadgeNow,
    clearPlaylistBadgeNow
  };
};
