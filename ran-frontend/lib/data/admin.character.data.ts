import { apiFetch } from "@/lib/apiFetch";

/* =====================================================
   Types
===================================================== */

export interface CharacterSearchRow {
  UserNum: number;
  ChaNum: number;
  ChaName: string;
  ChaClass: number;
  ChaSchool: number;
  ChaLevel: number;
  ChaOnline: boolean;
  ChaDeleted: boolean;
}

export interface CharacterBase {
  UserNum: number;
  ChaName: string;
  ChaClass: number;
  ChaLevel: number;
  ChaMoney: number;
  ChaHP: number;
  ChaMP: number;
  ChaSP: number;
  ChaCP: number;
  ChaPower: number;
  ChaDex: number;
  ChaStrong: number;
  ChaSpirit: number;
  ChaStrength: number;
  ChaIntel: number;
  ChaStRemain: number;
  ChaSkillPoint: number;
  ChaSchool: number;
  ChaHair: number;
  ChaFace: number;
  ChaHairColor: number;
  ChaSex: number;
  ChaLiving: number;
  ChaReborn: number;
  ChaOnline: boolean;
  ChaDeleted: boolean;
}

export interface CharacterDetail {
  base: CharacterBase;
  currency: Record<string, unknown> | null;
  battleStats: Record<string, unknown> | null;
  pkCombo: { counts: number[] } | null;
  putOnItems: CharacterItem[] | null;
  inventory: CharacterItem[] | null;
}

export interface CharacterSkillEntry {
  mainId: number;
  subId: number;
  level: number;
  skillName: string | null;
  [key: string]: unknown;
}

export interface CharacterSkills {
  version: number;
  skills: CharacterSkillEntry[];
}

export interface CharacterItem {
  guid: string;
  slot: number;
  posY: number;
  nativeId: { mainId: number; subId: number };
  itemName: string | null;
  makeType: number;
  remain: number;
  durability: number;
  basicStat: { attackDamage: number; defence: number };
  grade: {
    damage: number;
    defense: number;
    resistFire: number;
    resistIce: number;
    resistElec: number;
    resistPoison: number;
    resistSpirit: number;
  };
  randomOptions: { type: number; value: number }[];
  addons: { type: number; value: number }[];
  gems: { count: number; stones: { mainId: number; subId: number }[] };
  [key: string]: unknown;
}

export interface CharacterEditPayload {
  level?: number;
  money?: number;
  hp?: number;
  mp?: number;
  sp?: number;
  cp?: number;
  skillPoint?: number;
  statsRemain?: number;
  pow?: number;
  dex?: number;
  str?: number;
  spi?: number;
  sta?: number;
  intel?: number;
  school?: number;
  hair?: number;
  face?: number;
  hairColor?: number;
  sex?: number;
  living?: number;
  isOnline?: number;
  isDeleted?: number;
}

/* =====================================================
   Public Accessors
===================================================== */

export async function searchCharacters(
  type: "name" | "chanum" | "usernum",
  q: string,
  limit = 50,
): Promise<CharacterSearchRow[]> {
  const params = new URLSearchParams({ type, q, limit: String(limit) });
  const res = await apiFetch<{ ok: boolean; rows: CharacterSearchRow[] }>(
    `/api/adminpanel/character/search?${params}`,
  );
  return res.rows ?? [];
}

export async function getCharacterDetail(chaNum: number): Promise<CharacterDetail> {
  const res = await apiFetch<{ ok: boolean; character: CharacterDetail }>(
    `/api/adminpanel/character/${chaNum}`,
  );
  return res.character;
}

export async function updateCharacter(
  chaNum: number,
  payload: CharacterEditPayload,
): Promise<void> {
  await apiFetch(`/api/adminpanel/character/${chaNum}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getCharacterSkills(
  chaNum: number,
): Promise<CharacterSkills> {
  // Backend returns { version, skills } directly (not wrapped in { ok, skills })
  return apiFetch<CharacterSkills>(`/api/gmtool/character/${chaNum}/skills`);
}

export async function getCharacterPutonItems(
  chaNum: number,
): Promise<CharacterItem[]> {
  const res = await apiFetch<{ ok: boolean; count: number; items: CharacterItem[] }>(
    `/api/gmtool/character/${chaNum}/puton`,
  );
  return res.items ?? [];
}

export async function getCharacterInventory(
  chaNum: number,
  invenType = 0,
): Promise<CharacterItem[]> {
  const res = await apiFetch<{ ok: boolean; items: CharacterItem[] }>(
    `/api/gmItem/character/${chaNum}?invenType=${invenType}`,
  );
  return res.items ?? [];
}
