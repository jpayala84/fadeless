"use client";

import { useFormStatus } from "react-dom";

import { useDevEmailTestForm } from "@/lib/email/use-dev-email-test-form";
import { Button } from "@/ui/button";

export const DevEmailTestPanel = () => {
  const { formAction } = useDevEmailTestForm();

  return (
    <form className="space-y-3.5" action={formAction}>
      <div className="space-y-2 text-sm text-muted-foreground">
        <p className="settings-card-title text-[1.2rem] font-medium text-foreground">Email Test (local only)</p>
        <p>
          Sends the weekly digest to the address below (or your account email).
        </p>
      </div>
      <input
        type="email"
        name="email"
        placeholder="you@example.com"
        className="w-full rounded-full border border-border/55 bg-background/40 px-4 py-2.5 text-[0.99rem] text-foreground outline-none transition focus-visible:border-emerald-400/70"
      />
      <SendTestButton />
    </form>
  );
};

const SendTestButton = () => {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="sm"
      disabled={pending}
      className="settings-pill-btn h-11 rounded-full border border-emerald-300/55 bg-transparent px-7 text-[0.99rem] font-medium text-foreground hover:bg-emerald-400/10"
    >
      {pending ? "Sending..." : "Send test digest"}
    </Button>
  );
};
