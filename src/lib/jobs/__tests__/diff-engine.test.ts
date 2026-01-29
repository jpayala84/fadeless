import { describe, expect, it } from "vitest";

import { buildSnapshot, diffSnapshots } from "@/lib/jobs/diff-engine";

describe("diffSnapshots", () => {
  it("detects removed tracks", () => {
    const previous = [
      {
        trackId: "track-1",
        trackName: "One",
        artists: ["Artist"],
        albumName: "Album",
        playlistIds: [],
        playlistNames: [],
        likedSource: true,
        capturedAt: new Date("2024-01-01T00:00:00Z")
      },
      {
        trackId: "track-2",
        trackName: "Two",
        artists: ["Artist"],
        albumName: "Album",
        playlistIds: [],
        playlistNames: [],
        likedSource: true,
        capturedAt: new Date("2024-01-01T00:00:00Z")
      }
    ];
    const current = [
      {
        trackId: "track-1",
        trackName: "One",
        artists: ["Artist"],
        albumName: "Album",
        playlistIds: [],
        playlistNames: [],
        likedSource: true,
        capturedAt: new Date("2024-01-02T00:00:00Z")
      }
    ];

    const result = diffSnapshots(previous, current);
    expect(result.removed).toHaveLength(1);
    expect(result.removed[0].trackId).toBe("track-2");
  });
});

describe("buildSnapshot", () => {
  it("merges liked and playlist sources for the same track", () => {
    const capturedAt = new Date("2024-01-01T00:00:00Z");
    const likedTracks = [
      {
        id: "track-1",
        name: "Song",
        artists: ["Artist"],
        album: "Album"
      }
    ];
    const playlistTracks = [
      {
        id: "track-1",
        name: "Song",
        artists: ["Artist"],
        album: "Album",
        playlistId: "playlist-1",
        playlistName: "Playlist One",
        addedAt: "2024-01-01T00:00:00Z"
      }
    ];

    const snapshot = buildSnapshot({
      likedTracks,
      playlistTracks,
      capturedAt
    });

    expect(snapshot).toHaveLength(1);
    expect(snapshot[0].likedSource).toBe(true);
    expect(snapshot[0].playlistIds).toEqual(["playlist-1"]);
  });

  it("aggregates playlist sources for multiple playlists", () => {
    const capturedAt = new Date("2024-01-01T00:00:00Z");
    const playlistTracks = [
      {
        id: "track-1",
        name: "Song",
        artists: ["Artist"],
        album: "Album",
        playlistId: "playlist-1",
        playlistName: "Playlist One",
        addedAt: "2024-01-01T00:00:00Z"
      },
      {
        id: "track-1",
        name: "Song",
        artists: ["Artist"],
        album: "Album",
        playlistId: "playlist-2",
        playlistName: "Playlist Two",
        addedAt: "2024-01-01T00:00:00Z"
      }
    ];

    const snapshot = buildSnapshot({
      likedTracks: [],
      playlistTracks,
      capturedAt
    });

    expect(snapshot).toHaveLength(1);
    expect(snapshot[0].playlistIds.sort()).toEqual([
      "playlist-1",
      "playlist-2"
    ]);
  });
});
