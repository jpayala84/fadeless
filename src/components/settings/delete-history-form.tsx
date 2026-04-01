"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

import { useDeleteHistoryForm } from "@/lib/settings/use-delete-history-form";

type Props = {
  action: (
    prevState: { status: "idle" } | { status: "success" } | { status: "error"; message: string },
    formData: FormData
  ) => Promise<
    | { status: "idle" }
    | { status: "success" }
    | { status: "error"; message: string }
  >;
};

const DeleteButton = () => {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="settings-danger-btn w-auto rounded-full border border-rose-300/60 bg-transparent px-6 py-2 text-[1rem] font-medium text-rose-100 transition disabled:opacity-60"
    >
      {pending ? "Deleting…" : "Delete my data"}
    </button>
  );
};

export const DeleteHistoryForm = ({ action }: Props) => {
  const { confirmDelete } = useDeleteHistoryForm();
  const [state, formAction] = useActionState(action, { status: "idle" } as const);
  const errorMessage = state.status === "error" ? state.message : null;

  useEffect(() => {
    if (state.status === "success") {
      toast.success("Deleted your scans and history.");
    } else if (errorMessage) {
      toast.error(errorMessage);
    }
  }, [state.status, errorMessage]);

  return (
    <div className="space-y-2">
      <form action={formAction} onSubmit={confirmDelete}>
        <DeleteButton />
      </form>
    </div>
  );
};
