"use client";

import { useFormState, useFormStatus } from "react-dom";

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
      className="w-full rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500/80 disabled:opacity-60"
    >
      {pending ? "Deleting…" : "Delete my data"}
    </button>
  );
};

export const DeleteHistoryForm = ({ action }: Props) => {
  const { confirmDelete } = useDeleteHistoryForm();
  const [state, formAction] = useFormState(action, { status: "idle" } as const);

  return (
    <div className="space-y-2">
      <form action={formAction} onSubmit={confirmDelete}>
        <DeleteButton />
      </form>
      {state.status === "success" ? (
        <p className="text-xs text-emerald-300">
          Deleted. Refreshing your dashboard…
        </p>
      ) : null}
      {state.status === "error" ? (
        <p className="text-xs text-destructive">{state.message}</p>
      ) : null}
    </div>
  );
};
