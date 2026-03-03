"use client";

import { useEffect, useState } from "react";
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

/* =====================================================
   Constants
===================================================== */

const SCHOOL_NAMES: Record<number, string> = {
  0: "Sacred Gate",
  1: "Mystic Peak",
  2: "Phoenix",
};

const CLASS_NAMES: Record<number, string> = {
  0: "Brawler Male", 1: "Swordsman Male", 2: "Archer Female", 3: "Shaman Female",
  4: "Extreme Male", 5: "Extreme Female", 6: "Brawler Female", 7: "Swordsman Female",
  8: "Archer Male", 9: "Shaman Male", 10: "Gunner Male", 11: "Gunner Female",
  12: "Assassin Male", 13: "Assassin Female", 14: "Magician Male", 15: "Magician Female",
  16: "Etc Male", 17: "Etc Female", 18: "Shaper Male", 19: "Shaper Female",
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
};

/* =====================================================
   Helper: Number Formatter
===================================================== */

function formatNumber(num: number): string {
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + "B";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(2) + "K";
  return num.toLocaleString();
}

/* =====================================================
   StatCard Component
===================================================== */

function StatCard({
  title,
  value,
  description,
  loading,
}: {
  title: string;
  value: string | number;
  description?: string;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2 bg-card">
          <CardDescription>{title}</CardDescription>
          <Skeleton className="h-8 w-24" />
        </CardHeader>
        {description && (
          <CardContent>
            <Skeleton className="h-4 w-32" />
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      {description && (
        <CardContent>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      )}
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
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
      }
    }
    fetchData();
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Accounts"
          value={stats ? formatNumber(stats.totalAccounts) : "-"}
          description={stats ? `+${stats.dailyNewAccounts} today (avg ${stats.averageAccountCreation7d}/day)` : undefined}
          loading={loading}
        />
        <StatCard
          title="Total Characters"
          value={stats ? formatNumber(stats.totalCharacters) : "-"}
          description={stats ? `+${stats.dailyNewCharacters} today (avg ${stats.averageCharacterCreation7d}/day)` : undefined}
          loading={loading}
        />
        <StatCard
          title="Active Players"
          value={stats ? formatNumber(stats.activePlayers) : "-"}
          description={stats ? `Peak today: ${stats.peakPlayersToday}` : undefined}
          loading={loading}
        />
        <StatCard
          title="Total Server Gold"
          value={stats ? formatNumber(stats.totalGold) : "-"}
          description={stats ? `${stats.dailyGoldDelta >= 0 ? "+" : ""}${formatNumber(stats.dailyGoldDelta)} today` : undefined}
          loading={loading}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard
          title="Total Server EP"
          value={stats ? formatNumber(stats.totalEP) : "-"}
          loading={loading}
        />
        <StatCard
          title="Last Updated"
          value={stats ? new Date(stats.updatedAt).toLocaleString() : "-"}
          loading={loading}
        />
      </div>

      {/* School & Class Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Characters per School</CardTitle>
            <CardDescription>Distribution of characters across schools</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {schoolStats.map((item) => (
                  <div key={item.school} className="flex items-center justify-between">
                    <span className="font-medium">
                      {SCHOOL_NAMES[item.school] ?? `School ${item.school}`}
                    </span>
                    <div className="text-right">
                      <span className="font-semibold">{item.total.toLocaleString()}</span>
                      <span className="ml-2 text-sm text-muted-foreground">({item.active} online)</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Characters per Class</CardTitle>
            <CardDescription>Distribution of characters across classes</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {classStats.map((item) => (
                  <div key={item.class} className="flex items-center justify-between">
                    <span className="font-medium">
                      {CLASS_NAMES[item.class] ?? `Class ${item.class}`}
                    </span>
                    <div className="text-right">
                      <span className="font-semibold">{item.total.toLocaleString()}</span>
                      <span className="ml-2 text-sm text-muted-foreground">({item.active} online)</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 7-Day Trend */}
      <Card>
        <CardHeader>
          <CardTitle>7-Day Trend</CardTitle>
          <CardDescription>Daily account and character creation over the past week</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-2 text-left font-medium">Date</th>
                    <th className="px-2 py-2 text-right font-medium">New Accounts</th>
                    <th className="px-2 py-2 text-right font-medium">New Characters</th>
                    <th className="px-2 py-2 text-right font-medium">Gold Delta</th>
                  </tr>
                </thead>
                <tbody>
                  {trend.map((item, idx) => (
                    <tr key={idx} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-2 py-2">{new Date(item.date).toLocaleDateString()}</td>
                      <td className="px-2 py-2 text-right">+{item.dailyNewAccounts}</td>
                      <td className="px-2 py-2 text-right">+{item.dailyNewCharacters}</td>
                      <td className="px-2 py-2 text-right">
                        <span className={item.dailyGoldDelta >= 0 ? "text-emerald-500" : "text-red-500"}>
                          {item.dailyGoldDelta >= 0 ? "+" : ""}{formatNumber(item.dailyGoldDelta)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
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
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
