import { apiFetch } from "@/lib/apiFetch";

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
  try {
    const json = await apiFetch<BackendResponse<BackendNewsDetailItem>>(
      `/api/news/${id}`,
    );

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
  } catch {
    return undefined;
  }
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
