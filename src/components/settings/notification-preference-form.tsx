"use client";

import { useFormStatus } from "react-dom";
import { Check } from "lucide-react";
import { Button } from "@/ui/button";
import { useNotificationPreferenceForm } from "@/lib/notifications/use-notification-preference";

type Props = {
  enabled: boolean;
};

export const NotificationPreferenceForm = ({
  enabled
}: Props) => {
  const { formAction } = useNotificationPreferenceForm();

  return (
    <form className="settings-pref-form space-y-3.5" action={formAction}>
      <div className="settings-pref-box flex flex-col gap-3 text-sm text-muted-foreground">
        <label className="flex items-center gap-2.5 text-[1.02rem] text-foreground">
          <input type="checkbox" name="enabled" defaultChecked={enabled} className="peer sr-only" />
          <span className="settings-checkbox-indicator flex h-[2rem] w-[2.6rem] items-center justify-center rounded-lg border border-border/45 bg-card/40 text-transparent transition peer-checked:border-emerald-200/70 peer-checked:bg-emerald-200/45 peer-checked:text-white">
            <Check className="h-[1.12rem] w-[1.12rem]" />
          </span>
          Enable weekly email digest
        </label>
        <p className="pl-[3.45rem] text-[0.97rem] leading-relaxed text-muted-foreground/90">
          We’ll email you a summary of songs removed that week.
        </p>
      </div>

      <SavePreferenceButton />
    </form>
  );
};

const SavePreferenceButton = () => {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="sm"
      disabled={pending}
      className="settings-pill-btn h-10 rounded-full border border-emerald-300/55 bg-transparent px-6 text-[1rem] font-medium text-foreground"
    >
      {pending ? "Saving..." : "Save preference"}
    </Button>
  );
};
