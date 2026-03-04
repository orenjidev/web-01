/* =====================================================
   Config
===================================================== */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT_URL;

/* =====================================================
   UI CONTRACT TYPES
===================================================== */

export type AccountAction =
  | "account"
  | "characters"
  | "changeSchool"
  | "resetStats"
  | "reborn"
  | "changeClass"
  | "topUp"
  | "topUpHistory"
  | "convertPoints";

export interface AccountInfo {
  userid: string;
  type: number;
  available: number;
  blocked: number;
  chaRemain: number;
  email: string;
  epoint: number;
  vpoint: number;
}

export interface AccountResponse {
  ok: boolean;
  message: string;
  account: AccountInfo;
}

interface BasicResponse {
  ok: boolean;
  message: string;
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
   Get Account Info
----------------------------------------------------- */
export async function fetchUserDetails(): Promise<AccountInfo> {
  const res = await apiFetch<AccountResponse>("/api/account/me");

  return res.account;
}

/* -----------------------------------------------------
   Change Password
----------------------------------------------------- */
export async function changePassword(
  oldPassword: string,
  confirmOldPassword: string,
  pincode: string,
  confirmPincode: string,
  newPassword: string,
  confirmNewPassword: string,
) {
  return apiFetch<BasicResponse>("/api/account/change-password", {
    method: "POST",
    body: JSON.stringify({
      oldPassword,
      confirmOldPassword,
      pincode,
      confirmPincode,
      newPassword,
      confirmNewPassword,
    }),
  });
}

/* -----------------------------------------------------
   Change Email
----------------------------------------------------- */
export async function changeEmail(
  email: string,
  confirmEmail: string,
  pincode: string,
) {
  return apiFetch<BasicResponse>("/api/account/change-email", {
    method: "POST",
    body: JSON.stringify({
      email,
      confirmEmail,
      pincode,
    }),
  });
}

/* -----------------------------------------------------
   Change Pincode
----------------------------------------------------- */
export async function changePincode(
  pincode: string,
  confirmPincode: string,
  newPincode: string,
  confirmNewPincode: string,
  email: string,
  confirmEmail: string,
) {
  return apiFetch<BasicResponse>("/api/account/change-pincode", {
    method: "POST",
    body: JSON.stringify({
      pincode,
      confirmPincode,
      newPincode,
      confirmNewPincode,
      email,
      confirmEmail,
    }),
  });
}

/* -----------------------------------------------------
   Convert Points
----------------------------------------------------- */
export async function convertPoints(
  direction: "vp2ep" | "ep2vp",
  amount: number,
  pincode: string,
) {
  return apiFetch<BasicResponse>("/api/account/convert-points", {
    method: "POST",
    body: JSON.stringify({ direction, amount, pincode }),
  });
}
