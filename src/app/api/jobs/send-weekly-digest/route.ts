import { NextResponse } from "next/server";
import { Resend } from "resend";

import { prisma } from "@/lib/db/client";
import { getEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

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

const renderDigest = (
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
      <p>Here are the tracks Spotify removed from your monitored library this week.</p>
      <ul style="padding-left:18px">${rows}</ul>
      <p style="color:#94a3b8;font-size:12px;">Keep scans running to stay up to date. — The Lostrack team</p>
    </div>
  `;
};

export async function POST() {
  const env = getEnv();
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    console.warn("[weekly-digest] Email delivery disabled (missing env vars)");
    return NextResponse.json({ ok: true, skipped: "email_disabled" });
  }

  const resend = new Resend(env.RESEND_API_KEY);
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const users = await prisma.user.findMany({
    where: {
      reauthRequired: false,
      notification: {
        enabled: true,
        channel: "EMAIL"
      },
      email: { not: null }
    },
    include: {
      notification: true
    }
  });

  let sent = 0;
  for (const user of users) {
    const events = await prisma.removalEvent.findMany({
      where: { userId: user.id, removedAt: { gte: since } },
      orderBy: { removedAt: "desc" },
      take: 50
    });

    if (!events.length) {
      continue;
    }

    try {
      await resend.emails.send({
        from: env.EMAIL_FROM,
        to: user.email!,
        subject: `Lostrack weekly summary (${events.length} tracks removed)`,
        html: renderDigest(user.displayName ?? user.email, events)
      });
      sent += 1;
      await prisma.notificationPreference.update({
        where: { userId: user.id },
        data: { lastNotifiedAt: new Date() }
      });
    } catch (error) {
      console.error("[weekly-digest] Failed to send", user.id, error);
    }
  }

  return NextResponse.json({ ok: true, sent });
}
