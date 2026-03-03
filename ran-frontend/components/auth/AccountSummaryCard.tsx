"use client";

import Link from "next/link";
import { LogOut, ChevronRight, Zap, Star } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { usePublicConfig } from "@/context/PublicConfigContext";

export default function AccountSummaryCard() {
  const { user, logout } = useAuth();

  const { config: publicConfig, loadingConfig } = usePublicConfig();

  if (!user) return null;

  const initials = user.userid.slice(0, 2).toUpperCase();

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden mb-4">
      {/* Header */}
      <div className="bg-linear-to-br from-amber-900/40 to-stone-900/80 px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 border border-amber-500/25 text-amber-400 font-bold text-sm shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate leading-tight">
              {user.userid}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {user.chaRemain} char slot{user.chaRemain !== 1 ? "s" : ""} left
            </p>
          </div>
        </div>
      </div>

      {/* Points stats */}
      <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
        <div className="flex flex-col items-center py-3 px-2 bg-muted/20">
          <div className="flex items-center gap-1 mb-1">
            <Zap className="h-3 w-3 text-amber-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {publicConfig?.ePointsName}
            </span>
          </div>
          <span className="font-bold text-sm tabular-nums">
            {user.epoint.toLocaleString()}
          </span>
        </div>
        <div className="flex flex-col items-center py-3 px-2 bg-muted/20">
          <div className="flex items-center gap-1 mb-1">
            <Star className="h-3 w-3 text-amber-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              vPoints
            </span>
          </div>
          <span className="font-bold text-sm tabular-nums">
            {user.vpoint.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 flex flex-col gap-2">
        <Link href="/account" className="w-full">
          <Button className="w-full h-9 justify-between gap-2">
            My Account
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
        <Button variant="outline" className="w-full h-9 gap-2" onClick={logout}>
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
