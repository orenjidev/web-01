import { apiFetch } from "@/lib/apiFetch";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT_URL;

/* =====================================================
   Download domain types (UI CONTRACT)
===================================================== */
export interface DownloadLink {
  id: number;
  download_title: string;
  download_address: string;
  download_type: string;
  date: string;
  visible: boolean;
}

/* =====================================================
   Backend types (SOURCE OF TRUTH)
===================================================== */

interface BackendDownloadItem {
  ID: number;
  Title: string;
  DownloadType: string;
  DownloadLink: string;
  CreatedAt: string;
  Visible: boolean;
}

interface BackendResponse<T> {
  ok: boolean;
  data: T;
}

/* =====================================================
   Public Accessors
===================================================== */

/**
 * Get download links
 */
export async function getDownloadLinks(): Promise<DownloadLink[]> {
  const res =
    await apiFetch<BackendResponse<BackendDownloadItem[]>>("/api/download");

  if (!res.ok || !Array.isArray(res.data)) {
    console.error("[DOWNLOAD] Invalid response", res);
    return [];
  }

  return res.data.map((d) => ({
    id: d.ID,
    download_title: d.Title,
    download_address: d.DownloadLink,
    download_type: d.DownloadType,
    date: d.CreatedAt,
    visible: d.Visible,
  }));
}

/**
 * Track a download click (fire-and-forget)
 */
export async function trackDownloadClick(id: number): Promise<void> {
  if (!API_BASE_URL) return;

  try {
    await fetch(`${API_BASE_URL}/api/download/${id}/click`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // fire-and-forget — don't block user
  }
}
