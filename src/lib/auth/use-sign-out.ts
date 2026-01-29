"use client";

import { useTransition } from "react";

export const useSignOut = () => {
  const [pending, startTransition] = useTransition();

  const signOut = () => {
    startTransition(async () => {
      try {
        await fetch("/api/auth/logout", {
          method: "POST"
        });
      } finally {
        window.location.href = "/";
      }
    });
  };

  return { pending, signOut };
};
