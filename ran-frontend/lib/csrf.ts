const API_BASE = process.env.NEXT_PUBLIC_API_ENDPOINT_URL ?? "";

let cachedToken: string | null = null;

export async function getCsrfToken(): Promise<string> {
  if (cachedToken) return cachedToken;
  const res = await fetch(`${API_BASE}/api/csrf-token`, { credentials: "include" });
  const data = await res.json();
  cachedToken = data.token as string;
  return cachedToken;
}

export function invalidateCsrfToken() {
  cachedToken = null;
}

export async function csrfHeaders(): Promise<Record<string, string>> {
  return { "x-csrf-token": await getCsrfToken() };
}
