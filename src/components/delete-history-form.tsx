"use client";

import { useFormStatus } from "react-dom";

import { useDeleteHistoryForm } from "@/lib/settings/use-delete-history-form";

type Props = {
  action: () => void;
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

  return (
    <form action={action} onSubmit={confirmDelete}>
      <DeleteButton />
    </form>
  );
};
