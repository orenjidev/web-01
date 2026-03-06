"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import MaintenancePage from "@/components/MaintenancePage";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT_URL;
const POLL_INTERVAL = 30_000; // 30 seconds

interface HealthResponse {
  status: string;
  maintenance: boolean;
}

interface MaintenanceContextType {
  isMaintenance: boolean;
  isUnreachable: boolean;
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(
  undefined,
);

export function MaintenanceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/dashboard");

  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isUnreachable, setIsUnreachable] = useState(false);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function checkHealth() {
    try {
      const res = await fetch(`${API_BASE_URL}/health`, {
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        setIsUnreachable(true);
        setIsMaintenance(false);
        return;
      }

      const data: HealthResponse = await res.json();
      setIsMaintenance(data.maintenance === true);
      setIsUnreachable(false);
    } catch {
      setIsUnreachable(true);
      setIsMaintenance(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkHealth();

    timerRef.current = setInterval(checkHealth, POLL_INTERVAL);

    function handleVisibility() {
      if (document.hidden) {
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        checkHealth();
        timerRef.current = setInterval(checkHealth, POLL_INTERVAL);
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  // Show nothing while doing the initial health check (skip for admin routes)
  if (loading && !isAdminRoute) {
    return null;
  }

  // Show maintenance page when backend is in maintenance or unreachable
  // Admin routes (dashboard) are always exempt so admins can toggle maintenance off
  if ((isMaintenance || isUnreachable) && !isAdminRoute) {
    return (
      <MaintenancePage
        reason={isMaintenance ? "maintenance" : "unreachable"}
      />
    );
  }

  return (
    <MaintenanceContext.Provider value={{ isMaintenance, isUnreachable }}>
      {children}
    </MaintenanceContext.Provider>
  );
}

export function useMaintenance() {
  const context = useContext(MaintenanceContext);
  if (!context) {
    throw new Error("useMaintenance must be used within MaintenanceProvider");
  }
  return context;
}
