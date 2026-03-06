import { apiFetch } from "@/lib/apiFetch";

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
  ClickCount: number;
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
