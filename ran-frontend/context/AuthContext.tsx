"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

import { fetchUserDetails, logoutUser, type Account } from "@/lib/auth";

/* =====================================================
   Types
===================================================== */
interface AuthContextValue {
  user: Account | null;
  loading: boolean;
  refresh: () => Promise<void>;
  clear: () => void;
  logout: () => Promise<void>;
}

/* =====================================================
   Context
===================================================== */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/* =====================================================
   Provider
===================================================== */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Account | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  /* -----------------------------------------------------
     Refresh session from backend
  ----------------------------------------------------- */
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const account = await fetchUserDetails();
      setUser(account);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /* -----------------------------------------------------
     Clear session locally (no API call)
  ----------------------------------------------------- */
  const clear = useCallback(() => {
    setUser(null);
  }, []);

  /* -----------------------------------------------------
     Logout (API + local clear)
  ----------------------------------------------------- */
  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // Even if backend fails, never keep stale auth state
    } finally {
      clear();
    }
  }, [clear]);

  /* -----------------------------------------------------
     Initial session check on app load
  ----------------------------------------------------- */
  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        refresh,
        clear,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* =====================================================
   Hook
===================================================== */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
