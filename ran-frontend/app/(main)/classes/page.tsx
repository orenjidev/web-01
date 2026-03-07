"use client";

import { useEffect, useMemo, useState } from "react";
import { classOptions, type ClassValue } from "@/constants/character.constant";
import { usePublicConfig } from "@/context/PublicConfigContext";
import { useT } from "@/context/LanguageContext";
import { fetchAllPublicSkills, type PublicSkill } from "@/lib/data/publicSkills.data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

const GROUP_TO_CLASS: Record<string, ClassValue> = {
  brawler: "brawler",
  swordsman: "swordsman",
  archer: "archer",
  shaman: "shaman",
  extreme: "extreme",
  gunner: "gunner",
  assassin: "assassin",
  magician: "magician",
  shaper: "shaper",
};

export default function ClassesPage() {
  const { config } = usePublicConfig();
  const t = useT();
  const [skills, setSkills] = useState<PublicSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const enabledClasses = useMemo(() => {
    const classes = config?.gameoptions?.classes;
    return classOptions.filter((c) => classes?.[c.value] !== false);
  }, [config?.gameoptions?.classes]);

  const [activeClass, setActiveClass] = useState<ClassValue>("brawler");
  const currentClass = enabledClasses.some((c) => c.value === activeClass)
    ? activeClass
    : (enabledClasses[0]?.value ?? "brawler");

  useEffect(() => {
    let cancelled = false;
    fetchAllPublicSkills()
      .then((rows) => {
        if (!cancelled) setSkills(rows);
      })
      .catch(() => {
        if (!cancelled) setSkills([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return skills.filter((s) => {
      const key = GROUP_TO_CLASS[(s.classInfo?.group ?? "").toLowerCase()];
      if (key !== currentClass) return false;
      if (!q) return true;
      return (
        s.skillId.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        String(s.mainId).includes(q) ||
        String(s.subId).includes(q)
      );
    });
  }, [skills, currentClass, query]);

  return (
    <div className="container mx-auto gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t.nav.classes}</CardTitle>
          <CardDescription>
            Browse class skill trees and core effects from Brawler to Shaper.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {enabledClasses.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.common.featureUnavailableDesc}</p>
          ) : (
            <Tabs value={currentClass} onValueChange={(v) => setActiveClass(v as ClassValue)}>
              <TabsList className="flex flex-wrap h-auto">
                {enabledClasses.map((c) => (
                  <TabsTrigger key={c.value} value={c.value}>
                    {c.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}

          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search skill ID or name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.common.noData}</p>
          ) : (
            <div className="rounded-md border overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 text-left">Skill</th>
                    <th className="px-3 py-2 text-right">MID</th>
                    <th className="px-3 py-2 text-right">SID</th>
                    <th className="px-3 py-2 text-right">Grade</th>
                    <th className="px-3 py-2 text-right">Max Lv</th>
                    <th className="px-3 py-2 text-left">Impact Addon</th>
                    <th className="px-3 py-2 text-left">EMSPECA</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.skillId} className="border-b last:border-0">
                      <td className="px-3 py-2">
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{s.skillId}</div>
                        {s.description && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{s.mainId}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{s.subId}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{s.grade ?? "-"}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{s.maxLevel ?? "-"}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1.5">
                          {(s.addons ?? []).slice(0, 3).map((a) => (
                            <Badge key={`${s.skillId}-a-${a.slot}`} variant="secondary" title={a.description ?? a.label}>
                              #{a.slot} {a.label}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1.5">
                          {(s.specAddons ?? []).slice(0, 3).map((a) => (
                            <Badge key={`${s.skillId}-s-${a.slot}`} variant="outline" title={a.description ?? a.label}>
                              #{a.slot} {a.label}
                            </Badge>
                          ))}
                        </div>
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
