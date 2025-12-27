"use client";

import { useEffect } from "react";

type Props = {
  playlists: Array<{ id: string; name: string }>;
};

export const AutoMonitorRunner = ({ playlists }: Props) => {
  useEffect(() => {
    if (!playlists.length) {
      return;
    }

    let canceled = false;

    const run = async () => {
      for (const playlist of playlists) {
        if (canceled) {
          return;
        }
        try {
          await fetch("/api/jobs/scan", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              mode: "playlist",
              playlistId: playlist.id,
              playlistName: playlist.name
            })
          });
        } catch {
          // ignore errors; manual scans remain available
        }
      }
    };

    run();
    return () => {
      canceled = true;
    };
  }, [playlists]);

  return null;
};

