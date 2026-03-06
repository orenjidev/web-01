import { apiFetch } from "@/lib/apiFetch";

const USE_MOCK_DATA = false;

/* =====================================================
   Backend Types (EXACT MATCH)
===================================================== */

export interface BackendRankingRow {
  num: number;
  kills: string; // numeric string
  deaths: string; // numeric string
  name: string;
  lvl: number;
  class: number;
  money: number;
  school: number;
  isOnline: number; // 0 | 1
}

export interface BackendRankingResponse {
  ok: boolean;
  data: BackendRankingRow[];
}

/* =====================================================
   UI Types (UNCHANGED)
===================================================== */

export interface RankingPlayer {
  avatarSrc: string;
  fallback: string;
  playerName: string;
  level: string;
  kills: number;
  deaths: number;
  resu: number;
  money: number;
  guild: string;
  school: number;
}

/* =====================================================
   Dummy Ranking Data (UI ONLY)
===================================================== */

export const DUMMY_RANKING_PLAYERS: RankingPlayer[] = [
  {
    avatarSrc: "/images/class/1.jpg",
    fallback: "AX",
    playerName: "Axel",
    level: "125",
    kills: 342,
    deaths: 120,
    resu: 0,
    money: 1540000,
    guild: "-",
    school: 0,
  },
];

/* =====================================================
   Categories
===================================================== */

export const rankingCategories = [
  { value: "all", label: "All" },
  { value: "sg", label: "Sacred Gate" },
  { value: "mp", label: "Mystic Peak" },
  { value: "pnx", label: "Phoenix" },
  { value: "rich", label: "Richest" },
  { value: "exp", label: "Experience" },
  { value: "brawler", label: "Brawler" },
  { value: "swordsman", label: "Swordsman" },
  { value: "archer", label: "Archer" },
  { value: "shaman", label: "Shaman" },
  { value: "extreme", label: "Extreme" },
  { value: "gunner", label: "Gunner" },
  { value: "assassin", label: "Assassin" },
  { value: "magician", label: "Magician" },
  { value: "shaper", label: "Shaper" },
] as const;

export type RankingCategoryValue = (typeof rankingCategories)[number]["value"];

/* =====================================================
   Public Data Access
===================================================== */

export async function getRankingPlayers(
  quantity = 100,
  category?: string,
): Promise<RankingPlayer[]> {
  if (USE_MOCK_DATA) {
    return DUMMY_RANKING_PLAYERS;
  }

  const params = new URLSearchParams();
  params.set("quantity", String(quantity));

  if (category && category !== "all") {
    params.set("ctg", category);
  }
  console.log(params);

  const res = await apiFetch<BackendRankingResponse>(
    `/api/character/rankings?${params.toString()}`,
  );

  if (!res.ok || !Array.isArray(res.data)) {
    console.error("[RANKING] Invalid ranking response:", res);
    return [];
  }

  return res.data.map((p) => ({
    avatarSrc: `/images/class/${p.class}.jpg`,
    fallback: p.name.slice(0, 2).toUpperCase(),
    playerName: p.name,
    level: String(p.lvl),
    kills: Number(p.kills),
    deaths: Number(p.deaths),
    resu: 0, // backend does not provide resu
    money: p.money,
    guild: "-", // backend does not provide guild
    school: p.school,
  }));
}

/* =====================================================
   Utils
===================================================== */

export const getSchoolName = (code: number): string =>
  ["Sacred Gate", "Mystic Peak", "Phoenix"][code] || "Unknown";

export const getSchoolImage = (code: number): string =>
  `/images/school/${code}.png`;

export const formatKDR = (kills: number, deaths: number): string => {
  if (deaths === 0) return String(kills);
  return (kills / deaths).toFixed(2);
};
