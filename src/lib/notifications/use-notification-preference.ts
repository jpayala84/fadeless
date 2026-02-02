"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import {
  updateNotificationPreference,
  type NotificationPreferenceState
} from "@/app/actions/notification-preferences";

const INITIAL_STATE: NotificationPreferenceState = { status: "idle" };

export const useNotificationPreferenceForm = () => {
  const [state, formAction] = useActionState(
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

  return { state, formAction };
};
