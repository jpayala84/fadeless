"use server";

import { Resend } from "resend";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/client";
import { renderWeeklyDigest } from "@/lib/email/weekly-digest";
import { getEnv } from "@/lib/env";

export type SendTestDigestState =
  | { status: "idle" }
  | { status: "sent"; email: string }
  | { status: "empty" }
  | { status: "error"; message: string };

const schema = z.object({
  email: z.string().email().optional().or(z.literal(""))
});

export const sendTestDigest = async (
  _prevState: SendTestDigestState,
  formData: FormData
): Promise<SendTestDigestState> => {
  const user = await getCurrentUser();
  if (!user) {
    return { status: "error", message: "You must sign in first." };
  }

  const parsed = schema.safeParse({
    email: formData.get("email")
  });
  if (!parsed.success) {
    return { status: "error", message: "Enter a valid email address." };
  }

  const env = getEnv();
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    return {
      status: "error",
      message: "Email delivery is not configured."
    };
  }

  const targetEmail = parsed.data.email?.trim() || user.email || "";
  if (!targetEmail) {
    return {
      status: "error",
      message: "No email on file. Enter a test email address."
    };
  }

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const events = await prisma.removalEvent.findMany({
    where: { userId: user.id, removedAt: { gte: since } },
    orderBy: { removedAt: "desc" },
    take: 50
  });

  if (!events.length) {
    return { status: "empty" };
  }

  try {
    const resend = new Resend(env.RESEND_API_KEY);
    await resend.emails.send({
      from: env.EMAIL_FROM,
      to: targetEmail,
      subject: `Fadeless weekly summary (${events.length} tracks removed)`,
      html: renderWeeklyDigest(user.displayName ?? user.email, events)
    });
    return { status: "sent", email: targetEmail };
  } catch {
    return { status: "error", message: "Failed to send test email." };
  }
};
