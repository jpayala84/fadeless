import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { listRemovalEvents } from "@/lib/db/removal-repository";

const MAX_EXPORT_ROWS = 5000;

const toIso = (value: Date) => value.toISOString();

const buildCsv = (rows: ReturnType<typeof toExportRows>) => {
  const header = [
    "removed_at",
    "track_name",
    "artists",
    "album_name",
    "playlist_names",
    "playlist_ids",
    "track_id",
    "replacement_track_id",
    "replacement_track_name"
  ];
  const escape = (value: string) =>
    `"${value.replace(/"/g, '""')}"`;

  const lines = rows.map((row) => [
    row.removedAt,
    row.trackName,
    row.artists,
    row.albumName,
    row.playlistNames,
    row.playlistIds,
    row.trackId,
    row.replacementTrackId ?? "",
    row.replacementTrackName ?? ""
  ]);

  return [header, ...lines]
    .map((line) => line.map((value) => escape(String(value))).join(","))
    .join("\n");
};

const toExportRows = (events: Awaited<ReturnType<typeof listRemovalEvents>>) =>
  events.map((event) => ({
    removedAt: toIso(event.removedAt),
    trackName: event.trackName,
    artists: event.artists.join(", "),
    albumName: event.albumName,
    playlistNames: event.playlistNames.join(" | "),
    playlistIds: event.playlistIds.join(" | "),
    trackId: event.trackId,
    replacementTrackId: event.replacementTrackId ?? null,
    replacementTrackName: event.replacementTrackName ?? null
  }));

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "json";

  const events = await listRemovalEvents({
    userId: user.id,
    limit: MAX_EXPORT_ROWS
  });
  const rows = toExportRows(events);

  if (format === "csv") {
    const csv = buildCsv(rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="removal-archive.csv"'
      }
    });
  }

  return NextResponse.json(
    {
      ok: true,
      count: rows.length,
      items: rows
    },
    {
      headers: {
        "Content-Disposition": 'attachment; filename="removal-archive.json"'
      }
    }
  );
}
