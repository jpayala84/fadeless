"use client";

import { useTransition } from "react";

import { Button } from "@/ui/button";

export const SignInButton = () => (
  <Button asChild size="lg">
    <a href="/api/auth/login">Sign in with Spotify</a>
  </Button>
);

export const SignOutButton = () => {
  const [pending, startTransition] = useTransition();

  const handleSignOut = () => {
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

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSignOut}
      disabled={pending}
    >
      {pending ? "Signing out..." : "Sign out"}
    </Button>
  );
};
