"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { usePublicConfig } from "@/context/PublicConfigContext";
import { useT } from "@/context/LanguageContext";

export const ServerInfoSection = () => {
  const { config } = usePublicConfig();
  const t = useT();

  const serverName = config?.serverName ?? "Server Information";
  const serverMotto = config?.serverMotto ?? "";
  const highlights = config?.highlights ?? [];

  return (
    <div className="pb-4">
      <Card>
        <CardHeader>
          <CardTitle>{serverName}</CardTitle>
          {serverMotto && <CardDescription>{serverMotto}</CardDescription>}
        </CardHeader>
        {highlights.length > 0 && (
          <CardContent>
            <span className="font-medium text-sm">{t.serverInfo.features}</span>
            <div className="text-xs mt-1">
              {highlights.map((h, i) => (
                <p key={i}>{h}</p>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};
