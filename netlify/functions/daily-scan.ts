import type { Handler } from "@netlify/functions";

const getSiteUrl = (headers: Record<string, string | undefined>): string => {
  // Prefer Netlify-provided env vars.
  const envUrl = process.env.URL ?? process.env.DEPLOY_PRIME_URL;
  if (envUrl) {
    return envUrl;
  }

  const proto =
    headers["x-forwarded-proto"] ??
    (headers.host?.includes("localhost") ? "http" : "https");
  const host = headers.host ?? "localhost";
  return `${proto}://${host}`;
};

export const handler = (async (event) => {
  // Keep this lightweight: trigger the background function and return.
  const baseUrl = getSiteUrl(event.headers ?? {});
  const target = new URL("/.netlify/functions/daily-scan-background", baseUrl);

  try {
    // Fire-and-forget; the background function returns quickly (202) and continues running.
    const response = await fetch(target.toString(), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-triggered-by": "daily-scan"
      }
    });

    const text = await response.text().catch(() => "");
    if (!response.ok) {
      return {
        statusCode: response.status,
        body: text || `Failed to trigger background scan (${response.status})`
      };
    }

    return {
      statusCode: 202,
      body: text || "scheduled"
    };
  } catch {
    console.error("[daily-scan] failed to trigger background scan");
    return {
      statusCode: 500,
      body: "Failed to trigger background scan"
    };
  }
}) satisfies Handler;
