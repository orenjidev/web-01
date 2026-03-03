"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { fetchPublicConfig, PublicConfig } from "@/lib/data/publicConfig.data";

interface PublicConfigContextType {
  config: PublicConfig | null;
  loadingConfig: boolean;
  refresh: () => Promise<void>;
}

const PublicConfigContext = createContext<PublicConfigContextType | undefined>(
  undefined,
);

export function PublicConfigProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [loadingConfig, setLoading] = useState(true);

  async function loadConfig() {
    try {
      setLoading(true);
      const data = await fetchPublicConfig();
      setConfig(data);
    } catch (err) {
      console.error("Failed to load public config", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConfig();
  }, []);

  return (
    <PublicConfigContext.Provider
      value={{
        config,
        loadingConfig,
        refresh: loadConfig,
      }}
    >
      {children}
    </PublicConfigContext.Provider>
  );
}

export function usePublicConfig() {
  const context = useContext(PublicConfigContext);

  if (!context) {
    throw new Error("usePublicConfig must be used within PublicConfigProvider");
  }

  return context;
}
