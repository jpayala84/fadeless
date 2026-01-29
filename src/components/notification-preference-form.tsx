"use client";

import { useFormStatus } from "react-dom";
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
    <form className="space-y-4" action={formAction}>
      <div className="flex flex-col gap-2 rounded-lg border border-border p-3 text-sm text-muted-foreground">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="enabled" defaultChecked={enabled} />
          Enable weekly email digest
        </label>
        <p className="text-xs">
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
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Saving..." : "Save preference"}
    </Button>
  );
};
