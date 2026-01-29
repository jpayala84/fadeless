const toDateString = (date: Date) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });

const escapeHtml = (input: string) =>
  input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const renderWeeklyDigest = (
  userName: string | null,
  events: Array<{
    trackName: string;
    artists: string;
    albumName: string;
    playlistNames: string[];
    removedAt: Date;
  }>
) => {
  const greeting = userName ? `Hi ${escapeHtml(userName)},` : "Hi there,";
  const summaryCount = events.length;
  const rows = events
    .map((event) => {
      const playlists = event.playlistNames.length
        ? event.playlistNames.join(", ")
        : "Liked Songs";
      const albumSuffix = event.albumName
        ? ` &middot; <em>${escapeHtml(event.albumName)}</em>`
        : "";
      return `
        <li style="margin-bottom:12px">
          <strong>${escapeHtml(event.trackName)}</strong> &ndash; ${escapeHtml(
            event.artists
          )}${albumSuffix}<br />
          <span style="color:#94a3b8">Removed from ${escapeHtml(playlists)} on ${toDateString(
            event.removedAt
          )}</span>
        </li>
      `;
    })
    .join("");

  return `
    <div style="font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,sans-serif;background-color:#0f172a;padding:24px;color:#f8fafc;">
      <p>${greeting}</p>
      <p>Quick check-in from Fadeless.</p>
      <p>We found <strong>${summaryCount} track${summaryCount === 1 ? "" : "s"}</strong> that slipped out of your library in the last 7 days.</p>
      <p style="margin-top:16px;margin-bottom:8px;"><strong>Removed tracks</strong></p>
      <ul style="padding-left:18px">${rows}</ul>
      <p>If anything surprises you, your archive has the full history.</p>
      <p style="color:#94a3b8;font-size:12px;">Fadeless is read-only. We never change your Spotify library.</p>
      <p style="color:#94a3b8;font-size:12px;">— The Fadeless team</p>
    </div>
  `;
};

export const renderWeeklyDigestEmpty = (userName: string | null) => {
  const greeting = userName ? `Hi ${escapeHtml(userName)},` : "Hi there,";

  return `
    <div style="font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,sans-serif;background-color:#0f172a;padding:24px;color:#f8fafc;">
      <p>${greeting}</p>
      <p>All quiet this week — no tracks went missing.</p>
      <p>We will keep watching so you don't have to.</p>
      <p style="color:#94a3b8;font-size:12px;">Fadeless is read-only. We never change your Spotify library.</p>
      <p style="color:#94a3b8;font-size:12px;">— The Fadeless team</p>
    </div>
  `;
};
