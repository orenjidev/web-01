"use client";

import { useEffect, useState } from "react";
import RankingCard from "./rankingcard";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { RankingPlayer, getRankingPlayers } from "@/lib/data/ranking.data";
import { usePublicConfig } from "@/context/PublicConfigContext";
import { useT } from "@/context/LanguageContext";

/* =====================================================
   Component
===================================================== */
const RankingSection = () => {
  const [players, setPlayers] = useState<RankingPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { config: publicConfig } = usePublicConfig();
  const t = useT();

  const rankingLimit = publicConfig?.gameoptions?.uihelper?.max_toprank ?? 10;

  useEffect(() => {
    let isCancelled = false;

    async function loadRanking() {
      setLoading(true);
      setError("");

      try {
        const data = await getRankingPlayers(500); // fetch max, slice on UI
        if (!isCancelled) {
          setPlayers(data.slice(0, rankingLimit));
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadRanking();

    return () => {
      isCancelled = true;
    };
  }, [rankingLimit]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.rankings.sidebarTitle}</CardTitle>
        <CardDescription>{t.rankings.sidebarSubtitle}</CardDescription>
      </CardHeader>

      <CardContent>
        {loading && <p>{t.rankings.loadingRankings}</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && players.length === 0 && <p>{t.rankings.noPlayers}</p>}

        {!loading &&
          !error &&
          players.map((p, i) => {
            const classImages = publicConfig?.siteImages?.classImages ?? {};
            const avatarSrc = classImages[String(p.classId)] || p.avatarSrc;
            return (
              <RankingCard
                key={`${p.playerName}-${i}`}
                avatarSrc={avatarSrc}
                fallback={p.fallback}
                playerName={p.playerName}
                level={p.level}
                kills={p.kills}
                deaths={p.deaths}
                money={p.money}
                rank={i + 1}
                school={p.school}
              />
            );
          })}
      </CardContent>

      <CardFooter>
        <span className="text-xs text-muted-foreground">
          {t.rankings.cachedNotice}
        </span>
      </CardFooter>
    </Card>
  );
};

export default RankingSection;
