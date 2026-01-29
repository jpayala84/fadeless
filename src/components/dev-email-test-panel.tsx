"use client";

import { useFormStatus } from "react-dom";

import { useDevEmailTestForm } from "@/lib/email/use-dev-email-test-form";
import { Button } from "@/ui/button";

export const DevEmailTestPanel = () => {
  const { formAction } = useDevEmailTestForm();

  return (
    <form className="space-y-4" action={formAction}>
      <div className="space-y-2 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Email test (local only)</p>
        <p>
          Sends the weekly digest to the address below (or your account email).
        </p>
      </div>
      <input
        type="email"
        name="email"
        placeholder="you@example.com"
        className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground outline-none transition focus-visible:border-emerald-400/60"
      />
      <SendTestButton />
    </form>
  );
};

const SendTestButton = () => {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Sending..." : "Send test digest"}
    </Button>
  );
};
