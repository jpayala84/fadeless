"use client";

import { useEffect } from "react";
import { useFormState } from "react-dom";
import { toast } from "sonner";

import {
  sendTestDigest,
  type SendTestDigestState
} from "@/app/actions/send-test-digest";

const INITIAL_STATE: SendTestDigestState = { status: "idle" };

export const useDevEmailTestForm = () => {
  const [state, formAction] = useFormState(sendTestDigest, INITIAL_STATE);

  useEffect(() => {
    if (state.status === "sent") {
      toast.success(`Test digest sent to ${state.email}.`);
      return;
    }
    if (state.status === "empty") {
      toast.message("No removals in the last 7 days.");
      return;
    }
    if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state]);

  return { formAction };
};
