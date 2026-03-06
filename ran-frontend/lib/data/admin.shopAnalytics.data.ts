import { apiFetch } from "@/lib/apiFetch";

/* =====================================================
   Types
===================================================== */

export interface ShopOverview {
  totalPurchases: number;
  purchasesToday: number;
  activeItems: number;
  outOfStock: number;
}

export interface TopItem {
  productNum: number;
  itemMain: number;
  itemSub: number;
  itemName: string;
  purchaseCount: number;
  totalRevenue: number;
}

export interface RevenueSummary {
  shopType: number;
  totalPurchases: number;
  totalRevenue: number;
}

export interface DailySale {
  date: string;
  purchaseCount: number;
  revenue: number;
}

export interface RecentPurchase {
  idx: number;
  productNum: number;
  itemMain: number;
  itemSub: number;
  itemName: string;
  price: number;
  date: string;
  userId: string;
  shopType: number;
}

/* =====================================================
   API Functions
===================================================== */

export async function getShopOverview(): Promise<ShopOverview> {
  const res = await apiFetch<{ ok: boolean; data: ShopOverview }>(
    "/api/adminpanel/shop/analytics/overview",
  );
  return res.data;
}

export async function getTopItems(days?: number): Promise<TopItem[]> {
  const query = days ? `?days=${days}` : "";
  const res = await apiFetch<{ ok: boolean; data: TopItem[] }>(
    `/api/adminpanel/shop/analytics/top-items${query}`,
  );
  return res.data;
}

export async function getRevenueSummary(): Promise<RevenueSummary[]> {
  const res = await apiFetch<{ ok: boolean; data: RevenueSummary[] }>(
    "/api/adminpanel/shop/analytics/revenue",
  );
  return res.data;
}

export async function getDailySalesTrend(
  days = 30,
): Promise<DailySale[]> {
  const res = await apiFetch<{ ok: boolean; data: DailySale[] }>(
    `/api/adminpanel/shop/analytics/daily-trend?days=${days}`,
  );
  return res.data;
}

export async function getRecentPurchases(
  limit = 20,
): Promise<RecentPurchase[]> {
  const res = await apiFetch<{ ok: boolean; data: RecentPurchase[] }>(
    `/api/adminpanel/shop/analytics/recent?limit=${limit}`,
  );
  return res.data;
}
