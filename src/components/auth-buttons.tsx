"use client";

import { Button } from "@/ui/button";
import { useSignOut } from "@/lib/auth/use-sign-out";

export const SignInButton = () => (
  <Button asChild size="lg">
    <a href="/api/auth/login">Sign in with Spotify</a>
  </Button>
);

export const SignOutButton = () => {
  const { pending, signOut } = useSignOut();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={signOut}
      disabled={pending}
    >
      {pending ? "Signing out..." : "Sign out"}
    </Button>
  );
};
