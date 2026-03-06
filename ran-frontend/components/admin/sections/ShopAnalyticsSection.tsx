"use client";

import { useState } from "react";
import {
  ShoppingCart,
  TrendingUp,
  Package,
  AlertTriangle,
  Clock,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePolling } from "@/hooks/usePolling";
import { usePublicConfig } from "@/context/PublicConfigContext";

import {
  getShopOverview,
  getTopItems,
  getRevenueSummary,
  getDailySalesTrend,
  getRecentPurchases,
  type ShopOverview,
  type TopItem,
  type RevenueSummary,
  type DailySale,
  type RecentPurchase,
} from "@/lib/data/admin.shopAnalytics.data";

/* =====================================================
   Helpers
===================================================== */

function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toLocaleString();
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString();
}

/* =====================================================
   Bundle fetcher
===================================================== */

interface AnalyticsBundle {
  overview: ShopOverview;
  revenue: RevenueSummary[];
  trend: DailySale[];
  recentPurchases: RecentPurchase[];
  topAllTime: TopItem[];
  top30d: TopItem[];
  top7d: TopItem[];
}

async function fetchAnalyticsBundle(): Promise<AnalyticsBundle> {
  const [overview, revenue, trend, recentPurchases, topAllTime, top30d, top7d] =
    await Promise.all([
      getShopOverview(),
      getRevenueSummary(),
      getDailySalesTrend(30),
      getRecentPurchases(20),
      getTopItems(),
      getTopItems(30),
      getTopItems(7),
    ]);
  return { overview, revenue, trend, recentPurchases, topAllTime, top30d, top7d };
}

/* =====================================================
   Chart Tooltip
===================================================== */

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-lg text-xs">
      <p className="font-semibold mb-2 text-foreground">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ background: p.color }}
          />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium text-foreground ml-auto pl-4">
            {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* =====================================================
   Main Component
===================================================== */

export function ShopAnalyticsSection() {
  const { data, loading, lastUpdated, refresh } = usePolling(fetchAnalyticsBundle, {
    interval: 30_000,
  });

  const { config } = usePublicConfig();
  const eLabel = config?.ePointsName ?? "E-Points";
  const vLabel = config?.vPointsName ?? "V-Points";

  const [topTab, setTopTab] = useState<"all" | "30d" | "7d">("all");

  const overview = data?.overview;
  const revenue = data?.revenue ?? [];
  const trend = data?.trend ?? [];
  const recent = data?.recentPurchases ?? [];

  const topItems =
    topTab === "7d"
      ? data?.top7d
      : topTab === "30d"
        ? data?.top30d
        : data?.topAllTime;

  // Revenue by type
  const eRevenue = revenue.find((r) => r.shopType === 1);
  const vRevenue = revenue.find((r) => r.shopType === 2);

  const trendChartData = trend.map((d) => ({
    date: formatDate(d.date),
    Purchases: d.purchaseCount,
    Revenue: d.revenue,
  }));

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Shop Analytics</h2>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Clock className="h-3 w-3" />
              Auto-refreshes every 30s &middot; Last:{" "}
              {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={refresh}
          disabled={loading}
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Purchases"
          value={overview ? formatNumber(overview.totalPurchases) : "-"}
          icon={ShoppingCart}
          iconColor="#3b82f6"
          loading={loading && !overview}
        />
        <KpiCard
          title="Purchases Today"
          value={overview ? formatNumber(overview.purchasesToday) : "-"}
          icon={TrendingUp}
          iconColor="#22c55e"
          loading={loading && !overview}
        />
        <KpiCard
          title="Active Items"
          value={overview ? formatNumber(overview.activeItems) : "-"}
          icon={Package}
          iconColor="#8b5cf6"
          loading={loading && !overview}
        />
        <KpiCard
          title="Out of Stock"
          value={overview ? formatNumber(overview.outOfStock) : "-"}
          icon={AlertTriangle}
          iconColor={overview && overview.outOfStock > 0 ? "#ef4444" : "#64748b"}
          loading={loading && !overview}
        />
      </div>

      {/* Revenue Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider">
              {eLabel} Revenue
            </CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums text-amber-500">
              {eRevenue ? formatNumber(eRevenue.totalRevenue) : "0"}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {eRevenue ? eRevenue.totalPurchases.toLocaleString() : "0"} purchases
            </p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider">
              {vLabel} Revenue
            </CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums text-sky-500">
              {vRevenue ? formatNumber(vRevenue.totalRevenue) : "0"}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {vRevenue ? vRevenue.totalPurchases.toLocaleString() : "0"} purchases
            </p>
          </CardHeader>
        </Card>
      </div>

      {/* Daily Sales Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Daily Sales (Last 30 Days)
          </CardTitle>
          <CardDescription>Purchase count per day</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && trendChartData.length === 0 ? (
            <Skeleton className="h-64 w-full" />
          ) : trendChartData.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No sales data yet
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={trendChartData}
                margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="date"
                  tick={{
                    fontSize: 11,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{
                    fontSize: 11,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar
                  dataKey="Purchases"
                  fill="#3b82f6"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Bottom row: Top Items + Recent Feed */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">
                  Top Purchased Items
                </CardTitle>
                <CardDescription>By purchase count</CardDescription>
              </div>
              <div className="flex gap-1">
                {(["all", "30d", "7d"] as const).map((tab) => (
                  <Button
                    key={tab}
                    variant={topTab === tab ? "default" : "ghost"}
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={() => setTopTab(tab)}
                  >
                    {tab === "all" ? "All Time" : tab === "30d" ? "30 Days" : "7 Days"}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading && !topItems ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : !topItems || topItems.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No purchase data yet
              </p>
            ) : (
              <div className="space-y-2">
                {topItems.map((item, i) => (
                  <div
                    key={item.productNum}
                    className="flex items-center gap-3 text-sm"
                  >
                    <span className="text-muted-foreground w-5 text-right font-mono text-xs">
                      #{i + 1}
                    </span>
                    <span className="flex-1 truncate font-medium">
                      {item.itemName}
                    </span>
                    <Badge variant="secondary" className="text-xs tabular-nums">
                      {item.purchaseCount.toLocaleString()} sold
                    </Badge>
                    <span className="text-xs text-muted-foreground tabular-nums w-20 text-right">
                      {formatNumber(item.totalRevenue)} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Purchases Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Recent Purchases
            </CardTitle>
            <CardDescription>Live activity feed</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && recent.length === 0 ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No purchases yet
              </p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {recent.map((p) => (
                  <div
                    key={p.idx}
                    className="flex items-center gap-2 text-sm border-b border-border/50 pb-2 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{p.itemName}</p>
                      <p className="text-xs text-muted-foreground">
                        by {p.userId}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs shrink-0 ${
                        p.shopType === 1
                          ? "border-amber-500/50 text-amber-500"
                          : "border-sky-500/50 text-sky-500"
                      }`}
                    >
                      {p.price.toLocaleString()}
                    </Badge>
                    <span className="text-xs text-muted-foreground shrink-0 w-28 text-right">
                      {formatDateTime(p.date)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* =====================================================
   KPI Card (local)
===================================================== */

function KpiCard({
  title,
  value,
  icon: Icon,
  iconColor,
  loading,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  iconColor: string;
  loading: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-20 mt-2" />
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardDescription className="text-xs font-semibold uppercase tracking-wider">
            {title}
          </CardDescription>
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: `${iconColor}20` }}
          >
            <Icon className="h-4 w-4" style={{ color: iconColor }} />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold tabular-nums">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
