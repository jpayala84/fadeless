"use client";

import { useCallback, type FormEvent } from "react";

export const useDeleteHistoryForm = () => {
  const confirmDelete = useCallback((event: FormEvent<HTMLFormElement>) => {
    const confirmed = window.confirm(
      "Delete all scans and removal history? This cannot be undone."
    );
    if (!confirmed) {
      event.preventDefault();
    }
  }, []);

  return { confirmDelete };
};
