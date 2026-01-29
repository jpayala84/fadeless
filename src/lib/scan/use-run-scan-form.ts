"use client";

import { useEffect } from "react";
import { useFormState } from "react-dom";
import { toast } from "sonner";

import {
  runScanAction,
  type RunScanState
} from "@/app/actions/run-scan";

const INITIAL_STATE: RunScanState = { status: "idle" };

export const useRunScanForm = () => {
  const [state, formAction] = useFormState(runScanAction, INITIAL_STATE);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(`Scan started for ${state.scope}`);
    } else if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state]);

  return { state, formAction };
};
