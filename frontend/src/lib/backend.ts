import "server-only";

const DEFAULT_BACKEND_URL = "http://127.0.0.1:8000";

export const AUTH_COOKIE_NAME = "sarvam_auth_token";
export const AUTH_COOKIE_MAX_AGE = 72 * 7 * 3600;

export function getBackendUrl() {
  return (process.env.BACKEND_URL ?? DEFAULT_BACKEND_URL).replace(/\/$/, "");
}

export function buildBackendUrl(path: string) {
  return `${getBackendUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

type BackendFetchOptions = RequestInit & {
  token?: string;
};

export async function backendFetch(
  path: string,
  { token, headers, ...init }: BackendFetchOptions = {},
) {
  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has("Accept")) {
    requestHeaders.set("Accept", "application/json");
  }

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  return fetch(buildBackendUrl(path), {
    ...init,
    headers: requestHeaders,
    cache: "no-store",
  });
}

export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE,
  };
}
