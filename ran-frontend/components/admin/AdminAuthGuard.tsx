"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

const STAFF_MIN_TYPE = 50;

export default function AdminAuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Don't guard the login page itself
  const isLoginPage = pathname === "/dashboard/login";

  useEffect(() => {
    if (loading || isLoginPage) return;

    if (!user) {
      router.replace("/dashboard/login");
      return;
    }

    if (user.type < STAFF_MIN_TYPE) {
      router.replace("/dashboard/login");
    }
  }, [user, loading, router, isLoginPage]);

  // Login page renders without auth checks
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Not authenticated or not staff — redirect is happening via useEffect
  if (!user || user.type < STAFF_MIN_TYPE) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return <>{children}</>;
}
