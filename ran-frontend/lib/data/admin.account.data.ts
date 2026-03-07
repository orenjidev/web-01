import { apiFetch } from "@/lib/apiFetch";

/* =====================================================
   Types
===================================================== */

export type UserSearchBy =
  | "userNum"
  | "userId"
  | "email"
  | "pcid"
  | "type"
  | "all";

export interface UserRow {
  UserNum: number;
  UserID: string;
  UserEmail: string;
  UserType: number;
  UserLoginState: number;
  UserAvailable: number;
  UserBlock: number;
  UserPCID: string;
}

export interface UserDetail extends UserRow {
  UserPass: string;
  UserPass2: string;
  UserPoint: number;
  UserBlockDate: string | null;
  ChatBlockDate: string | null;
  PremiumDate: string | null;
  LastLoginDate: string | null;
  ChaRemain: number;
}

export interface CreateUserPayload {
  userId: string;
  pass: string;
  pass2: string;
  email: string;
  userType?: number;
  chaRemain?: number;
  userPoint?: number;
}

export interface UpdateUserPayload {
  userPass?: string;
  userPass2?: string;
  userEmail?: string;
  userType?: number;
  userLoginState?: number;
  userAvailable?: number;
  chaRemain?: number;
  userPoint?: number;
  userBlock?: number;
  userBlockDate?: string | null;
  chatBlockDate?: string | null;
  premiumDate?: string | null;
}

/* =====================================================
   Public Accessors
===================================================== */

export async function searchUsers(
  by: UserSearchBy = "all",
  q?: string,
  limit = 50,
): Promise<UserRow[]> {
  const params = new URLSearchParams({ by, limit: String(limit) });
  if (q) params.set("q", q);
  const res = await apiFetch<{ ok: boolean; rows: UserRow[] }>(
    `/api/gmtool/users?${params}`,
  );
  return res.rows ?? [];
}

export async function createUser(
  payload: CreateUserPayload,
): Promise<{ ok: boolean; message: string }> {
  return apiFetch("/api/gmtool/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getUser(userNum: number): Promise<UserDetail> {
  const res = await apiFetch<{ ok: boolean; user: UserDetail }>(
    `/api/gmtool/users/${userNum}`,
  );
  return res.user;
}

export async function updateUser(
  userNum: number,
  payload: UpdateUserPayload,
): Promise<{ ok: boolean; message: string }> {
  return apiFetch(`/api/gmtool/users/${userNum}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function blockUser(
  userNum: number,
  until: string,
): Promise<{ ok: boolean }> {
  return apiFetch(`/api/gmtool/users/${userNum}/block`, {
    method: "POST",
    body: JSON.stringify({ until }),
  });
}

export async function forceOffline(userNum: number): Promise<{ ok: boolean }> {
  return apiFetch(`/api/gmtool/users/${userNum}/force-offline`, {
    method: "POST",
  });
}

/* =====================================================
   Bank (Shop Purchase)
===================================================== */

export interface BankItem {
  PurKey: string;
  ProductNum: number;
}

export async function getUserBank(userId: string): Promise<BankItem[]> {
  const res = await apiFetch<{ ok: boolean; rows: BankItem[] }>(
    `/api/gmtool/users/${userId}/bank`,
  );
  return res.rows ?? [];
}

export async function getTakenBankItems(userId: string): Promise<BankItem[]> {
  const res = await apiFetch<{ ok: boolean; rows: BankItem[] }>(
    `/api/gmtool/users/${userId}/bank?taken=1`,
  );
  return res.rows ?? [];
}

export async function insertUserBank(
  userId: string,
  payload: { productNum: number; itemMain: number; itemSub: number },
): Promise<{ ok: boolean }> {
  return apiFetch(`/api/gmtool/users/${userId}/bank`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function clearUserBank(userId: string): Promise<{ ok: boolean }> {
  return apiFetch(`/api/gmtool/users/${userId}/bank/clear`, { method: "POST" });
}

export async function setBankItemTaken(
  userId: string,
  purKey: string,
): Promise<{ ok: boolean }> {
  return apiFetch(`/api/gmtool/users/${userId}/bank/${purKey}/taken`, {
    method: "POST",
  });
}
