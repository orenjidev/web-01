import { apiFetch } from "@/lib/apiFetch";

export async function getServerConfig(): Promise<Record<string, any>> {
  const json = await apiFetch<{ config: Record<string, any> }>(
    "/api/adminpanel/server-config",
  );
  return json.config ?? {};
}

export async function saveConfigSection(
  section: string,
  value: unknown,
): Promise<void> {
  await apiFetch(`/api/adminpanel/server-config/${section}`, {
    method: "PUT",
    body: JSON.stringify(value),
  });
}

export async function uploadSliderImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const json = await apiFetch<{ url: string }>(
    "/api/adminpanel/server-config/upload-image",
    { method: "POST", body: formData },
  );
  return json.url;
}
