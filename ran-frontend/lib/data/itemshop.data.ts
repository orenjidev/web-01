/* =====================================================
   Config
===================================================== */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT_URL;

/**
 * UI DEVELOPMENT FLAG
 * true  → dummy data
 * false → real backend
 */
const USE_MOCK_DATA = false;

/* =====================================================
   Backend Types (SOURCE OF TRUTH)
===================================================== */

export interface BackendShopCategory {
  categoryNum: string;
  name: string;
}

export interface BackendBoxItem {
  itemId: string;
  name: string;
  atkgrade: number;
  amount: number;
}

export interface BackendShopItem {
  productNum: number;
  name: string;
  itemMainID: number;
  itemSubID: number;
  price: number;
  currency: string;
  iconName?: string;
  isBox: boolean;
  boxContent?: BackendBoxItem[];
  stock: number;
}

export interface BackendShopResponse {
  ok: boolean;
  data: {
    categories: BackendShopCategory[];
    items: Record<string, BackendShopItem[]>;
  };
}

/* =====================================================
   UI Types (PROJECTION)
===================================================== */

export enum PriceType {
  None = 0,
  Premium = 1,
  Vote = 2,
}

export interface ShopCategory {
  categorynum: number;
  categoryname: string;
  isuse: boolean;
}

export interface ShopItem {
  id: number; // productNum
  itemName: string;
  category: number; // categoryNum
  price: number;
  priceType: PriceType;
  stock: number;
  isBox: boolean;

  iconUrl: string;
  iconType: "atlas" | "direct";
  iconMain: number;
  iconSub: number;

  boxContent?: BackendBoxItem[];
}

/* =====================================================
   Mock Data (TYPE CORRECT)
===================================================== */

const MOCK_CATEGORIES: ShopCategory[] = [
  { categorynum: 1000, categoryname: "Category Sample", isuse: true },
  { categorynum: 1001, categoryname: "Category 2", isuse: true },
];

const MOCK_ITEMS: ShopItem[] = [
  {
    id: 1,
    itemName: "Fine Burr",
    category: 1000,
    price: 1000,
    priceType: PriceType.Premium,
    stock: 999,
    isBox: false,

    iconUrl: `${API_BASE_URL}/images/shop/Supplies_Set.webp`,
    iconType: "atlas",
    iconMain: 5,
    iconSub: 4,
  },
];

/* =====================================================
   Internal API helper
===================================================== */

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("API endpoint is not configured");
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store", // ← THIS IS THE FIX
    ...init,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Request failed");
  }

  return res.json() as Promise<T>;
}

/* =====================================================
   Public Data Access (USED BY UI)
===================================================== */

export async function getCategory(): Promise<ShopCategory[]> {
  if (USE_MOCK_DATA) {
    return MOCK_CATEGORIES;
  }

  const res = await apiFetch<BackendShopResponse>("/api/shop");

  if (!Array.isArray(res.data?.categories)) {
    console.error("[SHOP] Invalid categories payload:", res);
    return [];
  }

  const seen = new Map<number, ShopCategory>();

  for (const c of res.data.categories) {
    const num = Number(c.categoryNum);
    if (!seen.has(num)) {
      seen.set(num, {
        categorynum: num,
        categoryname: c.name,
        isuse: true,
      });
    }
  }

  return Array.from(seen.values());
}

export async function getShopItemMap(): Promise<Record<number, ShopItem[]>> {
  if (USE_MOCK_DATA) {
    const map: Record<number, ShopItem[]> = {};
    for (const item of MOCK_ITEMS) {
      if (!map[item.category]) {
        map[item.category] = [];
      }
      map[item.category].push(item);
    }
    return map;
  }

  const res = await apiFetch<BackendShopResponse>("/api/shop");

  if (!res?.data || typeof res.data !== "object") {
    console.error("[SHOP] Invalid /api/shop response:", res);
    return {};
  }

  const { items } = res.data;

  if (!items || typeof items !== "object") {
    console.error("[SHOP] Missing items map:", res.data);
    return {};
  }

  const map: Record<number, ShopItem[]> = {};

  for (const [categoryNum, rawItems] of Object.entries(items)) {
    if (!Array.isArray(rawItems)) continue;

    map[Number(categoryNum)] = rawItems.map((item: any) => {
      const isPng = item.iconName?.toLowerCase().endsWith(".png");

      const iconUrl = isPng
        ? `${API_BASE_URL}/images/shop/${item.iconName}`
        : `${API_BASE_URL}/images/shop/${item.iconName?.replace(
            /\.dds$/i,
            ".webp",
          )}`;

      return {
        id: item.productNum,
        itemName: item.name,
        category: Number(categoryNum),

        iconUrl,
        iconType: isPng ? "direct" : "atlas",
        iconMain: Number(item.iconMain),
        iconSub: Number(item.iconSub),

        price: item.price,
        priceType:
          item.currency === "UserPoint" ? PriceType.Premium : PriceType.Vote,

        stock: item.stock,
        isBox: item.isBox,
        boxContent: item.boxContent,
      };
    });
  }

  return map;
}

export async function purchaseShopItem(
  productNum: number,
): Promise<{ ok: boolean; message: string }> {
  if (USE_MOCK_DATA) {
    return {
      ok: true,
      message: "PURCHASE_SUCCESS (mock)",
    };
  }

  return apiFetch<{ ok: boolean; message: string }>("/api/shop/purchase", {
    method: "POST",
    body: JSON.stringify({ productNum }),
  });
}

// History
export interface PurchaseHistoryItem {
  idx: string;
  itemName: string; // NEW
  ItemMoney: number;
  Date: string;
  IsGift: number;
  ReceiverUserID: string;
}

export interface PurchaseHistoryResponse {
  ok: boolean;
  data: {
    items: PurchaseHistoryItem[];
    total: number;
    page: number;
    pageSize: number;
  };
}

export async function getPurchaseHistory(params: {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
}): Promise<PurchaseHistoryResponse> {
  const query = new URLSearchParams();

  if (params.page) query.append("page", String(params.page));
  if (params.pageSize) query.append("pageSize", String(params.pageSize));
  if (params.startDate) query.append("startDate", params.startDate);
  if (params.endDate) query.append("endDate", params.endDate);

  return apiFetch<PurchaseHistoryResponse>(
    `/api/shop/purchase-history?${query.toString()}`,
  );
}
