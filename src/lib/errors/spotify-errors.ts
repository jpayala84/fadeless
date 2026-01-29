export type MappedSpotifyError = {
  code:
    | "reauth_required"
    | "rate_limited"
    | "spotify_down"
    | "network_error"
    | "unknown_error";
  message: string;
  status?: number;
  retryAfter?: number;
  isRetryable: boolean;
  rawMessage: string;
};

const extractJsonPayload = (message: string) => {
  const jsonMatch = message.match(/\{[\s\S]*\}$/);
  if (!jsonMatch) {
    return null;
  }
  try {
    return JSON.parse(jsonMatch[0]) as {
      error?: { status?: number; message?: string };
    };
  } catch {
    return null;
  }
};

const extractStatus = (message: string) => {
  const payload = extractJsonPayload(message);
  if (payload?.error?.status) {
    return payload.error.status;
  }
  const statusMatch = message.match(/\b(4\d{2}|5\d{2})\b/);
  if (statusMatch) {
    return Number(statusMatch[1]);
  }
  return undefined;
};

const looksLikeNetworkError = (message: string) =>
  /fetch failed|network|ECONN|ENOTFOUND|ETIMEDOUT/i.test(message);

export const mapSpotifyError = (error: unknown): MappedSpotifyError => {
  const rawMessage =
    error instanceof Error ? error.message : String(error ?? "Unknown error");
  const status = extractStatus(rawMessage);

  if (/invalid[_\s-]?grant/i.test(rawMessage) || status === 401 || status === 403) {
    return {
      code: "reauth_required",
      message: "Reconnect your Spotify account to continue.",
      status,
      isRetryable: false,
      rawMessage
    };
  }

  if (status === 429) {
    return {
      code: "rate_limited",
      message: "Rate limited by Spotify. Try again in a few minutes.",
      status,
      isRetryable: true,
      rawMessage
    };
  }

  if (status && status >= 500) {
    return {
      code: "spotify_down",
      message: "Spotify is having issues right now. Try again later.",
      status,
      isRetryable: true,
      rawMessage
    };
  }

  if (looksLikeNetworkError(rawMessage)) {
    return {
      code: "network_error",
      message: "Network error. Check your connection and try again.",
      status,
      isRetryable: true,
      rawMessage
    };
  }

  return {
    code: "unknown_error",
    message: "Scan failed. Please try again.",
    status,
    isRetryable: false,
    rawMessage
  };
};
