/* =====================================================
   Config
===================================================== */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT_URL;

/* =====================================================
   Download domain types (UI CONTRACT)
===================================================== */
export interface DownloadLink {
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
   Internal helper (same pattern as news)
===================================================== */
async function apiFetch<T>(path: string): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("API endpoint is not configured");
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Request failed");
  }

  return res.json() as Promise<T>;
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
    download_title: d.Title,
    download_address: d.DownloadLink,
    download_type: d.DownloadType,
    date: d.CreatedAt,
    visible: d.Visible, // backend already enforces visibility
  }));
}
