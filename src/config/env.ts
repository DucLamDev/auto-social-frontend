const rawApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:3001";
export const env = {
  appName: process.env.NEXT_PUBLIC_APP_NAME?.trim() || "Social Publisher",
  apiUrl: rawApiUrl.replace(/\/$/, ""),
  pollIntervalMs: Number(process.env.NEXT_PUBLIC_POLL_INTERVAL_MS || 10_000),
} as const;
export const API_V1_URL = `${env.apiUrl}/api/v1`;
