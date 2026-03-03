"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ComboboxDemo } from "@/components/reusable/combobox";

import {
  RankingPlayer,
  rankingCategories,
  getRankingPlayers,
  getSchoolImage,
  getSchoolName,
  formatKDR,
} from "@/lib/data/ranking.data";
import { usePublicConfig } from "@/context/PublicConfigContext";
import { useT } from "@/context/LanguageContext";

/* =====================================================
   Component
===================================================== */
const RankingPage = () => {
  const [players, setPlayers] = useState<RankingPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { config: publicConfig } = usePublicConfig();
  const t = useT();

  const enabledRankingCategories = rankingCategories.filter((cat) => {
    // Always allow these base categories
    if (["all", "sg", "mp", "pnx", "rich", "exp"].includes(cat.value)) {
      return true;
    }

    // Class-based categories → check config
    return publicConfig?.gameoptions?.classes?.[
      cat.value as keyof typeof publicConfig.gameoptions.classes
    ];
  });

  const rankingLimit = publicConfig?.gameoptions?.uihelper?.max_toprank ?? 10;

  useEffect(() => {
    let cancelled = false;

    const loadRanking = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getRankingPlayers(rankingLimit, selectedCategory);
        if (!cancelled) {
          setPlayers(data);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadRanking();

    return () => {
      cancelled = true;
    };
  }, [selectedCategory]);

  return (
    <div className="container mx-auto gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t.rankings.title}</CardTitle>
          <CardDescription>{t.rankings.subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4">
            <ComboboxDemo
              options={enabledRankingCategories}
              value={selectedCategory}
              onChange={setSelectedCategory}
            />
          </div>

          {loading ? (
            <p className="text-center py-4">{t.rankings.loading}</p>
          ) : error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : (
            <Table>
              <TableCaption className="text-xs">{t.rankings.cachedNotice}</TableCaption>

              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">{t.rankings.columns.rank}</TableHead>
                  <TableHead className="text-center">{t.rankings.columns.player}</TableHead>
                  <TableHead className="text-center">{t.rankings.columns.level}</TableHead>
                  <TableHead className="text-center">{t.rankings.columns.class}</TableHead>
                  <TableHead className="text-center">{t.rankings.columns.school}</TableHead>
                  <TableHead className="text-center">{t.rankings.columns.guild}</TableHead>

                  {selectedCategory === "all" && (
                    <TableHead className="text-center">{t.rankings.columns.kdr}</TableHead>
                  )}

                  {selectedCategory === "rich" && (
                    <TableHead className="text-center">{t.rankings.columns.money}</TableHead>
                  )}
                </TableRow>
              </TableHeader>

              <TableBody>
                {players.map((p, i) => (
                  <TableRow key={`${p.playerName}-${i}`}>
                    <TableCell className="text-center">{i + 1}</TableCell>

                    <TableCell className="text-center">
                      {p.playerName}
                    </TableCell>

                    <TableCell className="text-center">{p.level}</TableCell>

                    <TableCell className="text-center">
                      <Avatar className="w-6 h-6 mx-auto">
                        <AvatarImage src={p.avatarSrc} />
                        <AvatarFallback>{p.fallback}</AvatarFallback>
                      </Avatar>
                    </TableCell>

                    <TableCell className="text-center">
                      <Image
                        src={getSchoolImage(p.school)}
                        alt={getSchoolName(p.school)}
                        width={16}
                        height={16}
                        className="mx-auto"
                      />
                    </TableCell>

                    <TableCell className="text-center">
                      {p.guild || "-"}
                    </TableCell>

                    {selectedCategory === "all" && (
                      <TableCell className="text-center">
                        <span className="text-green-700">{p.kills}</span> /{" "}
                        <span className="text-red-500">{p.deaths}</span>{" "}
                        <span className="text-muted-foreground">
                          ({formatKDR(p.kills, p.deaths)})
                        </span>
                        {" : "}
                        <span className="text-orange-400">{p.resu}</span>
                      </TableCell>
                    )}

                    {selectedCategory === "rich" && (
                      <TableCell className="text-center">
                        {p.money.toLocaleString()}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RankingPage;
