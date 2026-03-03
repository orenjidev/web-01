/* =====================================================
   Config
===================================================== */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT_URL;

/* =====================================================
   Types
===================================================== */

export interface DownloadRow {
  ID: number;
  Title: string;
  DownloadLink: string;
  DownloadType: string;
  Visible: boolean;
  CreatedAt: string;
}

export interface CreateDownloadPayload {
  title: string;
  downloadLink: string;
  descriptionBase64?: string;
  downloadType?: string;
  visible?: boolean;
}

export interface UpdateDownloadPayload extends Partial<CreateDownloadPayload> {
  id: number;
}

/* =====================================================
   Internal API Helper
===================================================== */

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  if (!API_BASE_URL) throw new Error("API endpoint is not configured");

  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Request failed");
  return json as T;
}

/* =====================================================
   Public Accessors
===================================================== */

export async function listDownloads(): Promise<DownloadRow[]> {
  const res = await apiFetch<{ ok: boolean; data: DownloadRow[] }>(
    "/api/download",
  );
  return res.data ?? [];
}

export async function createDownload(
  payload: CreateDownloadPayload,
): Promise<{ ok: boolean; id: number; message: string }> {
  return apiFetch("/api/admin/download", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateDownload(
  payload: UpdateDownloadPayload,
): Promise<{ ok: boolean; message: string }> {
  return apiFetch("/api/admin/edit-download", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
