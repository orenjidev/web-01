/* =====================================================
   Config
===================================================== */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT_URL;

/* =====================================================
   Types
===================================================== */

export interface DashboardStats {
  date: string;

  totalAccounts: number;
  dailyNewAccounts: number;
  averageAccountCreation7d: number;

  totalCharacters: number;
  dailyNewCharacters: number;
  averageCharacterCreation7d: number;

  totalGold: number;
  dailyGoldDelta: number;

  totalEP: number;

  activePlayers: number;
  peakPlayersToday: number;

  updatedAt: string;
}

export interface DashboardTrendItem {
  date: string;
  totalAccounts: number;
  dailyNewAccounts: number;
  totalCharacters: number;
  dailyNewCharacters: number;
  totalGold: number;
  dailyGoldDelta: number;
}

export interface SchoolStatItem {
  school: number;
  total: number;
  active: number;
}

export interface ClassStatItem {
  class: number;
  total: number;
  active: number;
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
   Public Accessors
===================================================== */

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await apiFetch<{ ok: boolean; data: DashboardStats }>(
    "/api/adminpanel/dashboard",
  );
  return res.data;
}

export async function getDashboardTrend(): Promise<DashboardTrendItem[]> {
  const res = await apiFetch<{ ok: boolean; data: DashboardTrendItem[] }>(
    "/api/adminpanel/dashboard/trend",
  );
  return res.data ?? [];
}

export async function getStatsPerSchool(): Promise<SchoolStatItem[]> {
  const res = await apiFetch<{ ok: boolean; data: SchoolStatItem[] }>(
    "/api/adminpanel/dashboard/stat-per-school",
  );
  return res.data ?? [];
}

export async function getStatsPerClass(): Promise<ClassStatItem[]> {
  const res = await apiFetch<{ ok: boolean; data: ClassStatItem[] }>(
    "/api/adminpanel/dashboard/stat-per-class",
  );
  return res.data ?? [];
}
