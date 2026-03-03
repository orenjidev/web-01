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

/* =====================================================
   Component
===================================================== */
const RankingSection = () => {
  const [players, setPlayers] = useState<RankingPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { config: publicConfig } = usePublicConfig();

  const rankingLimit = publicConfig?.gameoptions?.uihelper?.max_toprank ?? 10;

  useEffect(() => {
    let isCancelled = false;

    async function loadRanking() {
      setLoading(true);
      setError("");

      try {
        const data = await getRankingPlayers(rankingLimit); // default category = all
        if (!isCancelled) {
          setPlayers(data);
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
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Player Ranking</CardTitle>
        <CardDescription>
          Top players based on recent performance
        </CardDescription>
      </CardHeader>

      <CardContent>
        {loading && <p>Loading rankings...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && players.length === 0 && <p>No players found.</p>}

        {!loading &&
          !error &&
          players.map((p, i) => (
            <RankingCard
              key={`${p.playerName}-${i}`}
              avatarSrc={p.avatarSrc}
              fallback={p.fallback}
              playerName={p.playerName}
              level={p.level}
              kills={p.kills}
              deaths={p.deaths}
              money={p.money}
              rank={i + 1}
              school={p.school}
            />
          ))}
      </CardContent>

      <CardFooter>
        <span className="text-xs text-muted-foreground">
          Ranking cached every 30 minutes
        </span>
      </CardFooter>
    </Card>
  );
};

export default RankingSection;
