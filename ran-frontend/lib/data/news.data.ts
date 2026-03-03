/* =====================================================
   Config
===================================================== */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT_URL;

/* =====================================================
   News domain types (UI CONTRACT)
===================================================== */
export interface NewsItem {
  id: number;
  title: string;
  category: string;
  author: string;
  published: string;
  content: string;
}

/* =====================================================
   Backend types (SOURCE OF TRUTH)
===================================================== */

interface BackendNewsListItem {
  ID: number;
  Type: string;
  Title: string;
  Author: string | null;
  ShortDescription: string;
  CreatedAt: string;
}

interface BackendNewsDetailItem {
  ID: number;
  Type: string;
  Title: string;
  Author: string | null;
  LongDescriptionBase64: string;
  CreatedAt: string;
}

interface BackendResponse<T> {
  ok: boolean;
  data: T;
}

/* =====================================================
   Internal helper (LIST ONLY)
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
 * List news (homepage / list page)
 */
export async function getNews(): Promise<NewsItem[]> {
  const res =
    await apiFetch<BackendResponse<BackendNewsListItem[]>>("/api/news");

  if (!res.ok || !Array.isArray(res.data)) {
    console.error("[NEWS LIST] Invalid response", res);
    return [];
  }

  return res.data.map((n) => ({
    id: n.ID,
    title: n.Title,
    category: n.Type,
    author: n.Author ?? "Admin",
    published: n.CreatedAt,
    content: n.ShortDescription,
  }));
}

/**
 * Get single news (DETAIL PAGE)
 * IMPORTANT:
 * - 404 returns undefined
 * - Other errors throw
 */
export async function getSingleNews(id: number): Promise<NewsItem | undefined> {
  if (!API_BASE_URL) {
    throw new Error("API endpoint is not configured");
  }

  const res = await fetch(`${API_BASE_URL}/api/news/${id}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (res.status === 404) {
    return undefined;
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Request failed");
  }

  const json = (await res.json()) as BackendResponse<BackendNewsDetailItem>;

  return {
    id: json.data.ID,
    title: json.data.Title,
    category: json.data.Type,
    author: json.data.Author ?? "Admin",
    published: json.data.CreatedAt,
    content: (() => {
      try {
        return decodeURIComponent(escape(atob(json.data.LongDescriptionBase64)));
      } catch {
        return atob(json.data.LongDescriptionBase64);
      }
    })(),
  };
}

/**
 * Get available categories
 */
export async function getNewsCategories(): Promise<string[]> {
  const res = await apiFetch<BackendResponse<string[]>>("/api/news/categories");

  if (!res.ok || !Array.isArray(res.data)) {
    return [];
  }

  return res.data;
}
