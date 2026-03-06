"use client";

import { Wrench, WifiOff } from "lucide-react";

interface MaintenancePageProps {
  reason: "maintenance" | "unreachable";
}

export default function MaintenancePage({ reason }: MaintenancePageProps) {
  const isMaintenance = reason === "maintenance";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
      <div className="flex flex-col items-center text-center px-6 max-w-md space-y-6">
        {/* Icon */}
        <div className="rounded-full bg-muted p-6 animate-pulse">
          {isMaintenance ? (
            <Wrench className="h-16 w-16 text-primary" />
          ) : (
            <WifiOff className="h-16 w-16 text-destructive" />
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {isMaintenance ? "Under Maintenance" : "Server Unreachable"}
        </h1>

        {/* Description */}
        <p className="text-muted-foreground text-lg leading-relaxed">
          {isMaintenance
            ? "We're performing scheduled maintenance to improve your experience. Please check back shortly."
            : "We're unable to reach the server right now. This may be due to a network issue or the server being temporarily unavailable."}
        </p>

        {/* Auto-retry indicator */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          Checking automatically&hellip;
        </div>
      </div>
    </div>
  );
}
