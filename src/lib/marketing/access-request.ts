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

  if (!error) {
    return null;
  }

  if (error === "not_allowlisted") {
    return {
      title: "Limited beta access",
      description: "This Spotify app is currently in development mode.",
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
    description: "Please try again. If this keeps happening, include the error ID when you contact support."
  };
};
