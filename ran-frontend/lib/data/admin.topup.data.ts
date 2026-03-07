import { apiFetch } from "@/lib/apiFetch";

/* =====================================================
   Types
===================================================== */

export interface TopupCode {
  idx: number;
  ECode: string;
  EPin: string;
  EValue: number;
  GenDate: string;
  Used: number;
  UseDate: string | null;
  resellerLoad: number | null;
}

export type TopupFilter = "all" | "unused" | "used";

/* =====================================================
   Accessors
===================================================== */

export async function listTopups(filter: TopupFilter = "all"): Promise<TopupCode[]> {
  const params = new URLSearchParams();
  if (filter === "unused") params.set("used", "0");
  if (filter === "used") params.set("used", "1");
  const res = await apiFetch<{ success: boolean; cards: TopupCode[] }>(
    `/api/topup/admin/list?${params}`,
  );
  return res.cards ?? [];
}

export async function markTopupUsed(idx: number): Promise<{ ok: boolean }> {
  return apiFetch(`/api/gmtool/topups/${idx}/use`, { method: "POST" });
}

export async function generateTopups(
  count: number,
  value: number,
): Promise<{ success: boolean; message: string }> {
  return apiFetch("/api/topup/admin/generate", {
    method: "POST",
    body: JSON.stringify({ count, value }),
  });
}
