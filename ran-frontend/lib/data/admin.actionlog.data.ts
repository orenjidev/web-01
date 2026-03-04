/* =====================================================
   Config
===================================================== */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT_URL;

/* =====================================================
   Types
===================================================== */

export interface ActionLogRow {
  LogID: number;
  UserID: number | null;
  ActionType: string;
  EntityType: string | null;
  EntityID: string | null;
  Description: string | null;
  MetadataJson: string | null;
  IPAddress: string | null;
  UserAgent: string | null;
  Success: boolean;
  CreatedAt: string;
}

export interface ActionLogPagination {
  page: number;
  limit: number;
  total: number;
}

export interface ActionLogFilters {
  userId?: string;
  actionType?: string;
  entityType?: string;
  entityId?: string;
  success?: "true" | "false" | "";
  ipAddress?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page: number;
  limit: number;
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

export async function getActionLogs(
  filters: ActionLogFilters,
): Promise<{ rows: ActionLogRow[]; pagination: ActionLogPagination }> {
  const params = new URLSearchParams();

  if (filters.userId) params.append("userId", filters.userId);
  if (filters.actionType) params.append("actionType", filters.actionType);
  if (filters.entityType) params.append("entityType", filters.entityType);
  if (filters.entityId) params.append("entityId", filters.entityId);
  if (filters.success) params.append("success", filters.success);
  if (filters.ipAddress) params.append("ipAddress", filters.ipAddress);
  if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.append("dateTo", filters.dateTo);
  if (filters.search) params.append("search", filters.search);
  params.append("page", String(filters.page));
  params.append("limit", String(filters.limit));

  const res = await apiFetch<{
    ok: boolean;
    rows: ActionLogRow[];
    pagination: ActionLogPagination;
  }>(`/api/adminpanel/actionlog?${params}`);

  return { rows: res.rows ?? [], pagination: res.pagination };
}

export async function getActionTypes(): Promise<string[]> {
  const res = await apiFetch<{ ok: boolean; actionTypes: string[] }>(
    "/api/adminpanel/actionlog/action-types",
  );
  return res.actionTypes ?? [];
}

/* =====================================================
   GM Action Log
===================================================== */

export interface GmActionLogRow {
  LogID: number;
  GmUserNum: number | null;
  GmUserID: string | null;
  GmUserType: number | null;
  ActionType: string;
  HttpMethod: string | null;
  HttpPath: string | null;
  EntityType: string | null;
  EntityID: string | null;
  Description: string | null;
  RequestBody: string | null;
  MetadataJson: string | null;
  IPAddress: string | null;
  UserAgent: string | null;
  Success: boolean;
  ResponseStatus: number | null;
  CreatedAt: string;
}

export interface GmActionLogFilters {
  gmUserNum?: string;
  actionType?: string;
  entityType?: string;
  entityId?: string;
  httpMethod?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page: number;
  limit: number;
}

export async function getGmActionLogs(
  filters: GmActionLogFilters,
): Promise<{ rows: GmActionLogRow[]; pagination: ActionLogPagination }> {
  const params = new URLSearchParams();

  if (filters.gmUserNum) params.append("gmUserNum", filters.gmUserNum);
  if (filters.actionType) params.append("actionType", filters.actionType);
  if (filters.entityType) params.append("entityType", filters.entityType);
  if (filters.entityId) params.append("entityId", filters.entityId);
  if (filters.httpMethod) params.append("httpMethod", filters.httpMethod);
  if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.append("dateTo", filters.dateTo);
  if (filters.search) params.append("search", filters.search);
  params.append("page", String(filters.page));
  params.append("limit", String(filters.limit));

  const res = await apiFetch<{
    ok: boolean;
    rows: GmActionLogRow[];
    pagination: ActionLogPagination;
  }>(`/api/gmtool/actionlog?${params}`);

  return { rows: res.rows ?? [], pagination: res.pagination };
}

export async function getGmActionTypes(): Promise<string[]> {
  const res = await apiFetch<{ ok: boolean; actionTypes: string[] }>(
    "/api/gmtool/actionlog/action-types",
  );
  return res.actionTypes ?? [];
}
