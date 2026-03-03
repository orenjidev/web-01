/* =====================================================
   Config
===================================================== */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT_URL;

/* =====================================================
   Types
===================================================== */

export interface ShopCategory {
  idx: number;
  CategoryNum: number;
  CategoryName: string;
  CategoryUse: boolean;
}

export interface ShopItem {
  ProductNum: number;
  ItemMain: number;
  ItemSub: number;
  ItemName: string;
  ItemCategory: number;
  ItemStock: number;
  ItemMoney: number;
  ShopType: string;
}

export interface MysteryShopItem {
  ProductId: number;
  ItemMain: number;
  ItemSub: number;
  ItemName: string;
  Price: number;
  Enabled: boolean;
}

export interface CreateCategoryPayload {
  categoryNum: number;
  name: string;
}

export interface UpdateCategoryPayload {
  name?: string;
  enabled?: boolean;
}

export interface CreateItemPayload {
  itemMain: number;
  itemSub: number;
  itemName: string;
  category?: number;
  stock?: number;
  price: number;
  enabled?: boolean;
}

export interface UpdateItemPayload {
  itemMain?: number;
  itemSub?: number;
  itemName?: string;
  category?: number;
  stock?: number;
  price?: number;
  enabled?: boolean;
}

export interface CreateMysteryItemPayload {
  itemMain: number;
  itemSub: number;
  itemName: string;
  price: number;
}

export interface UpdateMysteryItemPayload {
  itemMain?: number;
  itemSub?: number;
  itemName?: string;
  price?: number;
  enabled?: boolean;
}

/* =====================================================
   Internal API Helper
===================================================== */

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("API endpoint is not configured");
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message || "Request failed");
  }

  return json as T;
}

/* =====================================================
   Shop Categories
===================================================== */

export async function getShopCategories(): Promise<ShopCategory[]> {
  const res = await apiFetch<{ ok: boolean; rows: ShopCategory[] }>(
    "/api/adminpanel/shop/categories",
  );
  return res.rows ?? [];
}

export async function createShopCategory(
  payload: CreateCategoryPayload,
): Promise<void> {
  await apiFetch("/api/adminpanel/shop/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateShopCategory(
  idx: number,
  payload: UpdateCategoryPayload,
): Promise<void> {
  await apiFetch(`/api/adminpanel/shop/categories/${idx}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteShopCategory(idx: number): Promise<void> {
  await apiFetch(`/api/adminpanel/shop/categories/${idx}`, {
    method: "DELETE",
  });
}

/* =====================================================
   Shop Items
===================================================== */

export async function getShopItems(): Promise<ShopItem[]> {
  const res = await apiFetch<{ ok: boolean; rows: ShopItem[] }>(
    "/api/adminpanel/shop/items",
  );
  return res.rows ?? [];
}

export async function createShopItem(
  payload: CreateItemPayload,
): Promise<{ productNum: number }> {
  const res = await apiFetch<{ ok: boolean; productNum: number }>(
    "/api/adminpanel/shop/items",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
  return { productNum: res.productNum };
}

export async function updateShopItem(
  productNum: number,
  payload: UpdateItemPayload,
): Promise<void> {
  await apiFetch(`/api/adminpanel/shop/items/${productNum}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteShopItem(productNum: number): Promise<void> {
  await apiFetch(`/api/adminpanel/shop/items/${productNum}`, {
    method: "DELETE",
  });
}

/* =====================================================
   Mystery Shop Items
===================================================== */

export async function getMysteryShopItems(): Promise<MysteryShopItem[]> {
  const res = await apiFetch<{ ok: boolean; items: MysteryShopItem[] }>(
    "/api/adminpanel/shop/mystery/items",
  );
  return res.items ?? [];
}

export async function createMysteryShopItem(
  payload: CreateMysteryItemPayload,
): Promise<{ productId: number }> {
  const res = await apiFetch<{ ok: boolean; productId: number }>(
    "/api/adminpanel/shop/mystery/items",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
  return { productId: res.productId };
}

export async function updateMysteryShopItem(
  productId: number,
  payload: UpdateMysteryItemPayload,
): Promise<void> {
  await apiFetch(`/api/adminpanel/shop/mystery/items/${productId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteMysteryShopItem(productId: number): Promise<void> {
  await apiFetch(`/api/adminpanel/shop/mystery/items/${productId}`, {
    method: "DELETE",
  });
}

/* =====================================================
   Mystery Shop User Data
===================================================== */

export async function getMysteryUserData(
  userNum: number,
): Promise<Record<string, unknown>> {
  const res = await apiFetch<{ ok: boolean; data: Record<string, unknown> }>(
    `/api/adminpanel/shop/mystery/user/${userNum}`,
  );
  return res.data ?? {};
}

export async function saveMysteryUserData(
  userNum: number,
  data: Record<string, unknown>,
): Promise<void> {
  await apiFetch(`/api/adminpanel/shop/mystery/user/${userNum}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
