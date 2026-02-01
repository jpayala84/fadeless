const DEFAULT_ACCESS_REQUEST_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLScnRnPjkua9dpWbsgsK13yVXw0oJTzjlmOJdIXuztCu8FtM0g/viewform?usp=publish-editor";

export const getAccessRequestUrl = () => DEFAULT_ACCESS_REQUEST_URL;

export type LandingAuthError = {
  title: string;
  description: string;
  ctaLabel?: string;
};

export const getLandingAuthError = (
  searchParams?: { error?: string; reason?: string }
): LandingAuthError | null => {
  const error = searchParams?.error;
  const reason = searchParams?.reason;

  if (!error) {
    return null;
  }

  if (error === "not_allowlisted" || (error === "auth_failed" && reason === "spotify_profile")) {
    return {
      title: "Limited beta access",
      description:
        "This Spotify app is currently in development mode. Your Spotify account needs to be added as a test user before you can sign in.",
      ctaLabel: "Request access"
    };
  }

  if (error === "state_mismatch") {
    return {
      title: "Sign-in expired",
      description: "Please try signing in again."
    };
  }

  return {
    title: "Sign-in failed",
    description: "Please try again. If this keeps happening, request access and include the error ID."
  };
};

