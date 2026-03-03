"use client";

import { useAuth } from "@/context/AuthContext";
import LoginCard from "@/components/auth/LoginCard";
import AccountSummaryCard from "@/components/auth/AccountSummaryCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuthSwitchPanel() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Skeleton className="w-full h-67.5 rounded-xl mb-4" />;
  }

  if (user) {
    return <AccountSummaryCard />;
  }

  return <LoginCard disableRouting={true} />;
}
