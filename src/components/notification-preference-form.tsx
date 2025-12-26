"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { toast } from "sonner";

import {
  updateNotificationPreference,
  type NotificationPreferenceState
} from "@/app/actions/notification-preferences";
import type { NotificationChannel } from "@/lib/notifications/channels";
import { Button } from "@/ui/button";

type Props = {
  channel: NotificationChannel | null;
  enabled: boolean;
};

const channelOptions: Array<{ label: string; value: NotificationChannel }> = [
  { label: "Email summary", value: "EMAIL" },
  { label: "In-app summary", value: "IN_APP" }
];

const INITIAL_STATE: NotificationPreferenceState = { status: "idle" };

export const NotificationPreferenceForm = ({
  channel,
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
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Weekly summaries</p>
        <select
          name="channel"
          defaultValue={channel ?? "EMAIL"}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          {channelOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-border p-3 text-sm text-muted-foreground">
        <input type="hidden" value="false" name="enabled" />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="enabled"
            value="true"
            defaultChecked={enabled}
          />
          Enable weekly summary
        </label>
        <p className="text-xs">
          Summaries include Removed This Week and potential replacements.
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
