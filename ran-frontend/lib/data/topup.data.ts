/* =====================================================
   Config
===================================================== */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT_URL;

/* =====================================================
   UI CONTRACT TYPES
===================================================== */

export interface TopupHistoryItem {
  code: string;
  value: number;
  usedAt: string;
}

interface CheckTopupResponse {
  ok: boolean;
  message: string;
  value: number;
}

interface RedeemTopupResponse {
  ok: boolean;
  message: string;
}

interface TopupHistoryResponse {
  ok: boolean;
  history: TopupHistoryItem[];
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

  if (!res.ok || !json.ok) {
    throw new Error(json.message || "Request failed");
  }

  return json as T;
}

/* =====================================================
   Public Accessors
===================================================== */

/* -----------------------------------------------------
   Check Topup
----------------------------------------------------- */
export async function checkTopup(
  code: string,
  pin: string,
): Promise<{ value: number }> {
  const res = await apiFetch<CheckTopupResponse>(
    `/api/topup/check?code=${encodeURIComponent(code)}&pin=${encodeURIComponent(pin)}`,
  );

  return {
    value: res.value,
  };
}

/* -----------------------------------------------------
   Redeem Topup
----------------------------------------------------- */
export async function redeemTopup(
  code: string,
  pin: string,
): Promise<{ message: string }> {
  const res = await apiFetch<RedeemTopupResponse>("/api/topup/redeem", {
    method: "POST",
    body: JSON.stringify({ code, pin }),
  });

  return {
    message: res.message,
  };
}

/* -----------------------------------------------------
   Get Topup History
----------------------------------------------------- */
export async function getTopupHistory(): Promise<TopupHistoryItem[]> {
  const res = await apiFetch<TopupHistoryResponse>("/api/topup/history");

  return res.history;
}
