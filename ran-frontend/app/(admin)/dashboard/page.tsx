"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Sword,
  Wifi,
  Coins,
  Zap,
  RefreshCw,
  Clock,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import { AppSidebar, type AdminSection } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  getDashboardStats,
  getDashboardTrend,
  getStatsPerSchool,
  getStatsPerClass,
  type DashboardStats,
  type DashboardTrendItem,
  type SchoolStatItem,
  type ClassStatItem,
} from "@/lib/data/admin.dashboard.data";

import { AccountSection } from "@/components/admin/sections/AccountSection";
import { CharacterSection } from "@/components/admin/sections/CharacterSection";
import { TicketSection } from "@/components/admin/sections/TicketSection";
import { ShopSection } from "@/components/admin/sections/ShopSection";
import { NewsSection } from "@/components/admin/sections/NewsSection";
import { DownloadSection } from "@/components/admin/sections/DownloadSection";
import { ConfigSection } from "@/components/admin/sections/ConfigSection";
import { ActionLogSection } from "@/components/admin/sections/ActionLogSection";

/* =====================================================
   Constants
===================================================== */

const SCHOOL_NAMES: Record<number, string> = {
  0: "Sacred Gate",
  1: "Mystic Peak",
  2: "Phoenix",
};

const CLASS_NAMES: Record<number, string> = {
  0: "Brawler M", 1: "Swordsman M", 2: "Archer F", 3: "Shaman F",
  4: "Extreme M", 5: "Extreme F", 6: "Brawler F", 7: "Swordsman F",
  8: "Archer M", 9: "Shaman M", 10: "Gunner M", 11: "Gunner F",
  12: "Assassin M", 13: "Assassin F", 14: "Magician M", 15: "Magician F",
  16: "Etc M", 17: "Etc F", 18: "Shaper M", 19: "Shaper F",
};

const SECTION_LABELS: Record<AdminSection, string> = {
  dashboard: "Dashboard",
  "account.manage": "Manage Accounts",
  "account.create": "Manage Accounts",
  "character.manage": "Manage Characters",
  "ticket.list": "Support Tickets",
  "shop.categories": "Shop Categories",
  "shop.items": "Shop Items",
  news: "Manage News",
  downloads: "Manage Downloads",
  "server.config": "Server Configuration",
  "logs.user": "User Action Log",
  "logs.gm": "GM Action Log",
};

/* =====================================================
   Chart theme colors
===================================================== */

const CHART_COLORS = {
  accounts: "#3b82f6",
  characters: "#8b5cf6",
  gold: "#f59e0b",
  active: "#22c55e",
  total: "#64748b",
  ep: "#06b6d4",
};

/* =====================================================
   Helpers
===================================================== */

function formatNumber(num: number): string {
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + "B";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toLocaleString();
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* =====================================================
   Custom Tooltip for Charts
===================================================== */

function ChartTooltip({ active, payload, label }: {
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
          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: p.color }} />
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
   Enhanced StatCard
===================================================== */

function StatCard({
  title,
  value,
  delta,
  deltaLabel,
  subLabel,
  icon: Icon,
  iconColor,
  loading,
}: {
  title: string;
  value: string | number;
  delta?: number;
  deltaLabel?: string;
  subLabel?: string;
  icon?: React.ElementType;
  iconColor?: string;
  loading?: boolean;
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
          <Skeleton className="h-3 w-36 mt-1" />
        </CardHeader>
      </Card>
    );
  }

  const isPositiveDelta = delta !== undefined && delta >= 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardDescription className="text-xs font-semibold uppercase tracking-wider">
            {title}
          </CardDescription>
          {Icon && (
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: iconColor ? `${iconColor}20` : undefined }}
            >
              <Icon className="h-4 w-4" style={{ color: iconColor }} />
            </div>
          )}
        </div>
        <CardTitle className="text-2xl font-bold tabular-nums">{value}</CardTitle>
        <div className="flex items-center gap-2 flex-wrap">
          {delta !== undefined && (
            <Badge
              variant="secondary"
              className={`text-xs gap-1 px-1.5 py-0 ${
                isPositiveDelta
                  ? "text-emerald-500 bg-emerald-500/10"
                  : "text-red-500 bg-red-500/10"
              }`}
            >
              {isPositiveDelta ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {delta >= 0 ? "+" : ""}{formatNumber(delta)} today
            </Badge>
          )}
          {deltaLabel && (
            <span className="text-xs text-muted-foreground">{deltaLabel}</span>
          )}
        </div>
        {subLabel && (
          <p className="text-xs text-muted-foreground mt-0.5">{subLabel}</p>
        )}
      </CardHeader>
    </Card>
  );
}

/* =====================================================
   Dashboard Overview Section
===================================================== */

function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trend, setTrend] = useState<DashboardTrendItem[]>([]);
  const [schoolStats, setSchoolStats] = useState<SchoolStatItem[]>([]);
  const [classStats, setClassStats] = useState<ClassStatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchData(isRefresh = false) {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const [statsData, trendData, schoolData, classData] = await Promise.all([
        getDashboardStats(),
        getDashboardTrend(),
        getStatsPerSchool(),
        getStatsPerClass(),
      ]);
      setStats(statsData);
      setTrend(trendData);
      setSchoolStats(schoolData);
      setClassStats(classData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  /* ---- Derived Chart Data ---- */

  const trendChartData = trend.map((item) => ({
    date: formatDate(item.date),
    "New Accounts": item.dailyNewAccounts,
    "New Characters": item.dailyNewCharacters,
    "Gold Delta": item.dailyGoldDelta,
  }));

  const schoolChartData = schoolStats.map((item) => ({
    name: SCHOOL_NAMES[item.school] ?? `School ${item.school}`,
    Total: item.total,
    Online: item.active,
  }));

  const classChartData = [...classStats]
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
    .map((item) => ({
      name: CLASS_NAMES[item.class] ?? `Class ${item.class}`,
      Total: item.total,
      Online: item.active,
    }));

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Server Overview</h2>
          {stats && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Clock className="h-3 w-3" />
              Last updated: {new Date(stats.updatedAt).toLocaleString()}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => fetchData(true)}
          disabled={refreshing || loading}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive text-sm">Error loading dashboard</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Primary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Accounts"
          value={stats ? formatNumber(stats.totalAccounts) : "-"}
          delta={stats?.dailyNewAccounts}
          deltaLabel={stats ? `avg ${stats.averageAccountCreation7d}/day (7d)` : undefined}
          icon={Users}
          iconColor={CHART_COLORS.accounts}
          loading={loading}
        />
        <StatCard
          title="Total Characters"
          value={stats ? formatNumber(stats.totalCharacters) : "-"}
          delta={stats?.dailyNewCharacters}
          deltaLabel={stats ? `avg ${stats.averageCharacterCreation7d}/day (7d)` : undefined}
          icon={Sword}
          iconColor={CHART_COLORS.characters}
          loading={loading}
        />
        <StatCard
          title="Active Players"
          value={stats ? formatNumber(stats.activePlayers) : "-"}
          subLabel={stats ? `Peak today: ${stats.peakPlayersToday.toLocaleString()}` : undefined}
          icon={Wifi}
          iconColor={CHART_COLORS.active}
          loading={loading}
        />
        <StatCard
          title="Server Gold"
          value={stats ? formatNumber(stats.totalGold) : "-"}
          delta={stats?.dailyGoldDelta}
          icon={Coins}
          iconColor={CHART_COLORS.gold}
          loading={loading}
        />
      </div>

      {/* Secondary KPI */}
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          title="Total Server EP"
          value={stats ? formatNumber(stats.totalEP) : "-"}
          icon={Zap}
          iconColor={CHART_COLORS.ep}
          loading={loading}
        />
        {/* Active vs Peak mini comparison */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">
                Online / Peak Ratio
              </CardDescription>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                <Wifi className="h-4 w-4 text-emerald-500" />
              </div>
            </div>
            {loading ? (
              <>
                <Skeleton className="h-8 w-20 mt-2" />
                <Skeleton className="h-2 w-full mt-3" />
              </>
            ) : (
              <>
                <div className="flex items-end gap-2 mt-2">
                  <span className="text-2xl font-bold tabular-nums">
                    {stats ? stats.activePlayers.toLocaleString() : "-"}
                  </span>
                  <span className="text-muted-foreground text-sm mb-0.5">
                    / {stats ? stats.peakPlayersToday.toLocaleString() : "-"} peak
                  </span>
                </div>
                {stats && stats.peakPlayersToday > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Online now</span>
                      <span>
                        {Math.round((stats.activePlayers / stats.peakPlayersToday) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round((stats.activePlayers / stats.peakPlayersToday) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </CardHeader>
        </Card>
      </div>

      {/* 7-Day Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">7-Day Growth Trend</CardTitle>
          <CardDescription>Daily new accounts, characters, and gold economy change</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={trendChartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                  tickFormatter={(v) => formatNumber(v)}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="New Accounts"
                  fill={CHART_COLORS.accounts}
                  radius={[3, 3, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  yAxisId="left"
                  dataKey="New Characters"
                  fill={CHART_COLORS.characters}
                  radius={[3, 3, 0, 0]}
                  maxBarSize={32}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="Gold Delta"
                  stroke={CHART_COLORS.gold}
                  strokeWidth={2}
                  dot={{ fill: CHART_COLORS.gold, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* School & Class Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* School Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Characters per School</CardTitle>
            <CardDescription>Total registered vs currently online</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  layout="vertical"
                  data={schoolChartData}
                  margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => formatNumber(v)}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    width={88}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "4px" }} />
                  <Bar dataKey="Total" fill={CHART_COLORS.total} radius={[0, 3, 3, 0]} maxBarSize={20} />
                  <Bar dataKey="Online" fill={CHART_COLORS.active} radius={[0, 3, 3, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Classes Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Top 10 Classes</CardTitle>
            <CardDescription>Most popular classes by character count</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  layout="vertical"
                  data={classChartData}
                  margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => formatNumber(v)}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    width={76}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "4px" }} />
                  <Bar dataKey="Total" fill={CHART_COLORS.characters} radius={[0, 3, 3, 0]} maxBarSize={16} />
                  <Bar dataKey="Online" fill={CHART_COLORS.active} radius={[0, 3, 3, 0]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* =====================================================
   Main Page Component
===================================================== */

export default function DashboardPage() {
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");

  function handleNavigate(section: AdminSection) {
    setActiveSection(section);
  }

  const breadcrumbLabel = SECTION_LABELS[activeSection];

  return (
    <SidebarProvider>
      <AppSidebar activeSection={activeSection} onNavigate={handleNavigate} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>{breadcrumbLabel}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {activeSection === "dashboard" && <DashboardOverview />}
          {(activeSection === "account.manage" || activeSection === "account.create") && (
            <AccountSection defaultOpenCreate={activeSection === "account.create"} />
          )}
          {activeSection === "character.manage" && <CharacterSection />}
          {activeSection === "ticket.list" && <TicketSection />}
          {activeSection === "shop.categories" && <ShopSection tab="categories" />}
          {activeSection === "shop.items" && <ShopSection tab="items" />}
          {activeSection === "news" && <NewsSection />}
          {activeSection === "downloads" && <DownloadSection />}
          {activeSection === "server.config" && <ConfigSection />}
          {activeSection === "logs.user" && <ActionLogSection defaultTab="user" />}
          {activeSection === "logs.gm" && <ActionLogSection defaultTab="gm" />}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
