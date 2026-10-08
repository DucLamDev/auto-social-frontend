const rawApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:3001";

export function normalizeDefaultDiscourseUrl(value?: string) {
  const candidate = value?.trim();
  if (!candidate) return undefined;

  try {
    const url = new URL(candidate);
    if (
      url.protocol !== "https:"
      || url.username
      || url.password
      || url.search
      || url.hash
    ) return undefined;
    return url.toString().replace(/\/$/, "");
  } catch {
    return undefined;
  }
}

export function normalizeDefaultDiscourseUsername(value?: string) {
  const candidate = value?.trim();
  if (!candidate || !/^[A-Za-z0-9_.-]{1,100}$/.test(candidate)) return undefined;
  return candidate;
}

export function normalizeDefaultDiscourseCategoryId(value?: string) {
  const candidate = value?.trim();
  if (!candidate || !/^[1-9]\d*$/.test(candidate)) return undefined;
  const categoryId = Number(candidate);
  if (!Number.isSafeInteger(categoryId)) return undefined;
  return String(categoryId);
}

export const env = {
  appName: process.env.NEXT_PUBLIC_APP_NAME?.trim() || "Social Publisher",
  apiUrl: rawApiUrl.replace(/\/$/, ""),
  defaultDiscourseUrl: normalizeDefaultDiscourseUrl(process.env.NEXT_PUBLIC_DEFAULT_DISCOURSE_URL),
  defaultDiscourseUsername: normalizeDefaultDiscourseUsername(process.env.NEXT_PUBLIC_DEFAULT_DISCOURSE_USERNAME),
  defaultDiscourseCategoryId: normalizeDefaultDiscourseCategoryId(process.env.NEXT_PUBLIC_DEFAULT_DISCOURSE_CATEGORY_ID),
  pollIntervalMs: Number(process.env.NEXT_PUBLIC_POLL_INTERVAL_MS || 10_000),
} as const;
export const API_V1_URL = `${env.apiUrl}/api/v1`;
