import { useEffect, useRef, useState, useCallback } from "react";

interface UsePollingOptions {
  /** Polling interval in ms (default 30000) */
  interval?: number;
  /** Whether polling is active (default true) */
  enabled?: boolean;
  /** Pause polling when browser tab is hidden (default true) */
  pauseOnHidden?: boolean;
}

interface UsePollingResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  /** Force an immediate refresh */
  refresh: () => Promise<void>;
}

/**
 * Reusable polling hook for real-time admin panel data.
 * Automatically fetches at a set interval and pauses when the tab is hidden.
 */
export function usePolling<T>(
  fetchFn: () => Promise<T>,
  options?: UsePollingOptions,
): UsePollingResult<T> {
  const {
    interval = 30_000,
    enabled = true,
    pauseOnHidden = true,
  } = options ?? {};

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  const isMounted = useRef(true);

  const doFetch = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const result = await fetchRef.current();
      if (isMounted.current) {
        setData(result);
        setError(null);
        setLastUpdated(new Date());
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (isMounted.current && showLoading) setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if (!enabled) return;
    doFetch(true);
  }, [enabled, doFetch]);

  // Polling interval
  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      if (pauseOnHidden && document.hidden) return;
      doFetch(false);
    };

    const id = setInterval(tick, interval);
    return () => clearInterval(id);
  }, [enabled, interval, pauseOnHidden, doFetch]);

  // Cleanup
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const refresh = useCallback(() => doFetch(true), [doFetch]);

  return { data, loading, error, lastUpdated, refresh };
}
