import { csrfHeaders } from "@/lib/csrf";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT_URL;

/**
 * Shared API fetch utility.
 * - Attaches credentials + JSON headers
 * - Auto-sends CSRF token on mutations (POST/PUT/PATCH/DELETE)
 * - Fires "auth:expired" event on 401 so AuthContext can redirect
 */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("API endpoint is not configured");
  }

  const method = (init?.method ?? "GET").toUpperCase();
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  const csrf = isMutation ? await csrfHeaders() : {};

  const isFormData = init?.body instanceof FormData;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: isFormData
      ? { ...csrf }
      : { "Content-Type": "application/json", ...csrf },
    ...init,
  });

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("auth:expired"));
    }
    throw new Error("Session expired");
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Request failed");
  }

  return res.json() as Promise<T>;
}
