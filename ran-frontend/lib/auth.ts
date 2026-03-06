/* =====================================================
   Auth API boundary
   Single source of truth for auth-related calls
===================================================== */

import { csrfHeaders, invalidateCsrfToken } from "@/lib/csrf";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT_URL;

/* =====================================================
   Helpers
===================================================== */
function assertApiBaseUrl() {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_ENDPOINT_URL is not configured");
  }
}

/* =====================================================
   Register
===================================================== */
export interface RegisterPayload {
  username: string;
  password: string;
  confirm_password: string;
  email: string;
  pincode: string;
  confirm_pincode: string;
  token: string;
  referrer?: string;
}

export interface RegisterResponse {
  success: boolean;
  message?: string;
}

export async function registerUser(
  payload: RegisterPayload,
  onFinally?: () => void,
): Promise<RegisterResponse> {
  try {
    assertApiBaseUrl();

    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await csrfHeaders()),
      },
      credentials: "include",
      body: JSON.stringify({
        userid: payload.username,
        password: payload.password,
        confirmPassword: payload.confirm_password,
        pincode: payload.pincode,
        confirmPincode: payload.confirm_pincode,
        email: payload.email,
        referrer: payload.referrer ?? "",
        //"g-recaptcha-response": payload.token,
      }),
    });

    const rawText = await res.text();

    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      return {
        success: false,
        message: "Server returned invalid response format",
      };
    }

    return {
      success: Boolean(data.ok),
      message: data.message,
    };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error
          ? err.message
          : "Registration failed due to network error",
    };
  } finally {
    onFinally?.();
  }
}

/* =====================================================
   Login
===================================================== */
export interface LoginPayload {
  userid: string;
  password: string;
}

export async function loginUser(payload: LoginPayload): Promise<void> {
  assertApiBaseUrl();

  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await csrfHeaders()),
    },
    credentials: "include",
    body: JSON.stringify({
      userid: payload.userid,
      password: payload.password,
    }),
  });

  const rawText = await res.text();

  let data: any;
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error("Invalid server response");
  }

  if (!res.ok || !data.ok) {
    throw new Error(data.message || "Invalid username or password");
  }

  // Session is regenerated on login — cached CSRF token is now stale
  invalidateCsrfToken();
}

/* =====================================================
   Session / Current user
===================================================== */
export interface Account {
  userid: string;
  type: number;
  available: number;
  blocked: number;
  chaRemain: number;
  email: string;
  epoint: number;
  vpoint: number;
}

interface MeResponse {
  ok: boolean;
  message?: string;
  account?: Account;
}

export async function fetchUserDetails(): Promise<Account> {
  assertApiBaseUrl();

  const res = await fetch(`${API_BASE_URL}/api/account/me`, {
    method: "GET",
    credentials: "include",
  });

  const rawText = await res.text();

  let data: MeResponse;
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error("Invalid server response");
  }

  if (!res.ok || !data.ok || !data.account) {
    throw new Error(data.message || "Not authenticated");
  }

  return data.account;
}

/* =====================================================
   Logout
===================================================== */
export async function logoutUser(): Promise<void> {
  if (!API_BASE_URL) {
    throw new Error("API endpoint is not configured");
  }

  const res = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
    headers: await csrfHeaders(),
  });

  if (!res.ok) {
    throw new Error("Logout failed");
  }

  invalidateCsrfToken();
}
