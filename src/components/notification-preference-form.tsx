"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { toast } from "sonner";

import {
  updateNotificationPreference,
  type NotificationPreferenceState
} from "@/app/actions/notification-preferences";
import { Button } from "@/ui/button";

type Props = {
  enabled: boolean;
};

const INITIAL_STATE: NotificationPreferenceState = { status: "idle" };

export const NotificationPreferenceForm = ({
  enabled
}: Props) => {
  const [state, formAction] = useFormState(
    updateNotificationPreference,
    INITIAL_STATE
  );

  useEffect(() => {
    if (state.status === "success") {
      toast.success("Notification preference saved.");
    } else if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state]);

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
