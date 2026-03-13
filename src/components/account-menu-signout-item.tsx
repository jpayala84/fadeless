"use client";

import { LogOut } from "lucide-react";

import { useSignOut } from "@/lib/auth/use-sign-out";

type AccountMenuSignOutItemProps = {
  className?: string;
  onSelect?: () => void;
};

export const AccountMenuSignOutItem = ({
  className = "",
  onSelect
}: AccountMenuSignOutItemProps) => {
  const { pending, signOut } = useSignOut();

  return (
    <button
      type="button"
      onClick={() => {
        onSelect?.();
        signOut();
      }}
      disabled={pending}
      aria-label={pending ? "Signing out" : "Log out"}
      className={className}
    >
      <LogOut className="h-4 w-4 text-muted-foreground" />
      {pending ? "Signing out..." : "Log out"}
    </button>
  );
};
