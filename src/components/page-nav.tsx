"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home } from "lucide-react";

type Props = {
  homeHref?: string;
  backLabel?: string;
};

export const PageNav = ({ homeHref = "/", backLabel = "Back" }: Props) => {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-emerald-300 transition hover:bg-emerald-400/10"
        aria-label={backLabel}
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <Link
        href={homeHref}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-emerald-300 transition hover:bg-emerald-400/10"
        aria-label="Home"
      >
        <Home className="h-4 w-4" />
      </Link>
    </div>
  );
};
