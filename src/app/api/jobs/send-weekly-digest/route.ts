import { NextResponse } from "next/server";
import { Resend } from "resend";

import { prisma } from "@/lib/db/client";
import { getEnv } from "@/lib/env";
import { renderWeeklyDigest, renderWeeklyDigestEmpty } from "@/lib/email/weekly-digest";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST() {
  const rate = checkRateLimit("weekly-digest", 1, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

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

    try {
      const hasEvents = events.length > 0;
      await resend.emails.send({
        from: env.EMAIL_FROM,
        to: user.email!,
        subject: hasEvents
          ? `Fadeless weekly summary (${events.length} track${events.length === 1 ? "" : "s"} removed)`
          : "Fadeless weekly recap — all quiet this week",
        html: hasEvents
          ? renderWeeklyDigest(user.displayName ?? user.email, events)
          : renderWeeklyDigestEmpty(user.displayName ?? user.email)
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
