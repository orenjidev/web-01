/* =====================================================
   Config
===================================================== */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT_URL;

/* =====================================================
   Types
===================================================== */

export interface NewsRow {
  ID: number;
  Type: string;
  Title: string;
  Author: string | null;
  ShortDescription: string | null;
  BannerImg: string | null;
  BannerImg2: string | null;
  IsPinned: boolean;
  PinPriority: number;
  Visible: boolean;
  CreatedAt: string;
  LongDescriptionBase64?: string;
}

export interface CreateNewsPayload {
  type: string;
  title: string;
  longDescriptionBase64: string;
  author?: string;
  bannerImg?: string;
  bannerImg2?: string;
  shortDescription?: string;
  isPinned?: number;
  pinPriority?: number;
  visible?: number;
}

export interface UpdateNewsPayload extends Partial<CreateNewsPayload> {
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

export async function listNews(): Promise<NewsRow[]> {
  const res = await apiFetch<{ ok: boolean; data: NewsRow[] }>("/api/news");
  return res.data ?? [];
}

export async function getNewsById(id: number): Promise<NewsRow> {
  const res = await apiFetch<{ ok: boolean; data: NewsRow }>(
    `/api/news/${id}`,
  );
  return res.data;
}

export async function createNews(
  payload: CreateNewsPayload,
): Promise<{ ok: boolean; id: number; message: string }> {
  return apiFetch("/api/admin/news", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateNews(
  payload: UpdateNewsPayload,
): Promise<{ ok: boolean; message: string }> {
  return apiFetch("/api/admin/edit-news", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
