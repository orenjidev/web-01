import { apiFetch } from "@/lib/apiFetch";

interface BuildResult {
  ok: boolean;
  itemCount: number;
  message: string;
}

export interface ItemPreviewEntry {
  itemId: string;
  name: string;
  level: number;
  type: { id: number; label: string };
  grade: { attack: number; defense: number };
  icon: { main: number; sub: number };
  [key: string]: unknown;
}

export interface ItemsPreviewResult {
  ok: boolean;
  info: { loaded: boolean; count: number; loadedAt: string | null; version: string };
  items: ItemPreviewEntry[];
  total: number;
  page: number;
  limit: number;
}

export async function getItemsPreview(
  page = 1,
  limit = 50,
  search = "",
): Promise<ItemsPreviewResult> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set("search", search);
  return apiFetch<ItemsPreviewResult>(
    `/api/adminpanel/build-items/preview?${params}`,
  );
}

export interface ItemFlags {
  canSellToNPC: boolean;
  canTrade: boolean;
  canDrop: boolean;
  isEventItem: boolean;
  isCostume: boolean;
  isTimeLimited: boolean;
  canWrap: boolean;
  canDismantle: boolean;
  restricted: boolean;
  canSendPost: boolean;
}

export interface BoxItemEntry {
  itemId: string;
  amount?: number;
  rate?: number;
  name: string;
  icon: { main: number; sub: number } | null;
  type: { id: number; label: string } | null;
}

export interface ItemDetailResult {
  ok: boolean;
  item: ItemPreviewEntry & {
    flags?: ItemFlags;
    effects?: { selfBody: string; targBody: string; target: string; general: string };
    files?: { field: string; inventory: string };
    box?: { showContents: boolean; items: BoxItemEntry[] };
    randomBox?: BoxItemEntry[];
  };
}

export async function getItemDetail(itemId: string): Promise<ItemDetailResult> {
  return apiFetch<ItemDetailResult>(`/api/adminpanel/build-items/item/${itemId}`);
}

export async function uploadAndBuildItems(file: File): Promise<BuildResult> {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch<BuildResult>("/api/adminpanel/build-items/upload", {
    method: "POST",
    body: formData,
  });
}

export async function triggerBuildItems(): Promise<BuildResult> {
  return apiFetch<BuildResult>("/api/adminpanel/build-items/build", {
    method: "POST",
  });
}
