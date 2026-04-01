"use client";

import Image from "next/image";

import { Button } from "@/ui/button";
import { cn } from "@/lib/utils";

export const SpotifyMarkIcon = ({
  className
}: {
  className?: string;
}) => (
  <Image
    src="/brand/Primary_Logo_Green_RGB.svg"
    alt=""
    aria-hidden="true"
    width={24}
    height={24}
    className={cn("h-5 w-5 object-contain md:h-[1.35rem] md:w-[1.35rem]", className)}
  />
);

type SignInButtonProps = {
  className?: string;
};

export const SignInButton = ({ className }: SignInButtonProps) => (
  <Button
    asChild
    size="lg"
    variant="outline"
    className={cn(
      "landing-cta h-14 w-full max-w-[360px] gap-3 text-foreground",
      className
    )}
  >
    <a href="/api/auth/login">
      <span className="spotify-icon-wrap flex h-9 w-9 items-center justify-center md:h-10 md:w-10">
        <SpotifyMarkIcon className="spotify-icon-art h-7 w-7 md:h-8 md:w-8" />
      </span>
      <span>Sign in with Spotify</span>
    </a>
  </Button>
);
