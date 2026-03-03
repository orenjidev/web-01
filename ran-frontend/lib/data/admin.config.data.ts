const BASE = (process.env.NEXT_PUBLIC_API_ENDPOINT_URL ?? "").replace(/\/$/, "");

export async function getServerConfig(): Promise<Record<string, any>> {
  const res = await fetch(`${BASE}/api/adminpanel/server-config`, {
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to load config");
  return json.config ?? {};
}

export async function saveConfigSection(
  section: string,
  value: unknown,
): Promise<void> {
  const res = await fetch(`${BASE}/api/adminpanel/server-config/${section}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(value),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to save");
}
