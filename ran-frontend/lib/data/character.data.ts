import { apiFetch } from "@/lib/apiFetch";

/* =====================================================
   UI CONTRACT TYPES
===================================================== */

export const classMap = {
  brawler: [1, 64],
  swordsman: [2, 128],
  archer: [256, 4],
  shaman: [512, 8],
  extreme: [16, 32],
  gunner: [1024, 2048],
  assassin: [4096, 8192],
  magician: [16384, 32768],
  shaper: [262144, 524288],
};

export interface Character {
  id: number;
  name: string;
  level: number;
  class: number;
  school: number;
  reborn: number;
  money: number;
  isOnline: number;
}

interface BasicResponse {
  ok?: boolean | number;
  success?: boolean;
  message: string;
}

/* =====================================================
   Public Accessors
===================================================== */

/* -----------------------------------------------------
   Get My Characters
----------------------------------------------------- */
export async function getMyCharacters(): Promise<Character[]> {
  const res = await apiFetch<any>("/api/character/my-character");

  if (!res.ok || !Array.isArray(res.characters)) {
    return [];
  }

  return res.characters.map((c: any) => ({
    id: c.characterId,
    name: c.name,
    level: c.level,
    class: c.class,
    school: c.school,
    money: c.money ?? 0,
    reborn: c.reborn ?? 0,
    isOnline: c.isOnline ?? 0,
  }));
}

/* -----------------------------------------------------
   Change School
----------------------------------------------------- */
export async function changeSchool(characterId: number, school: string) {
  const res = await apiFetch<BasicResponse>("/api/character/change-school", {
    method: "POST",
    body: JSON.stringify({ characterId, school }),
  });

  if (res.ok !== true) {
    throw new Error(res.message);
  }

  return res.message;
}

/* -----------------------------------------------------
   Reset Stats
----------------------------------------------------- */
export async function resetStats(characterId: number) {
  const res = await apiFetch<BasicResponse>("/api/character/reset-stats", {
    method: "POST",
    body: JSON.stringify({ characterId }),
  });

  if (!res.success) {
    throw new Error(res.message);
  }

  return res.message;
}

/* -----------------------------------------------------
   Reborn Character
----------------------------------------------------- */
export async function rebornCharacter(characterId: number) {
  const res = await apiFetch<any>("/api/character/reborn", {
    method: "POST",
    body: JSON.stringify({ characterId }),
  });

  if (res.ok !== 1) {
    throw new Error(res.message);
  }

  return {
    message: res.message,
    data: res.data,
  };
}
export interface RebornPreviewResponse {
  canReborn: boolean;
  currentReborn?: number;
  nextReborn?: number;
  requiredLevel?: number;
  requiredFee?: number;
  currency?: string;
  statRewardForNext?: number;
  totalStatAfter?: number;
  reason?: string;
}

export async function getRebornPreview(characterId: number) {
  return apiFetch<{
    ok: boolean;
    data: RebornPreviewResponse;
  }>(`/api/character/reborn-preview?characterId=${characterId}`);
}

/* -----------------------------------------------------
   Change Class
----------------------------------------------------- */
export async function changeClass(characterId: number, targetClass: string) {
  const res = await apiFetch<BasicResponse>("/api/character/change-class", {
    method: "POST",
    body: JSON.stringify({
      characterId,
      class: targetClass,
    }),
  });

  if (res.ok !== true) {
    throw new Error(res.message);
  }

  return res.message;
}

/* -----------------------------------------------------
   Delete Character
----------------------------------------------------- */
export async function deleteCharacter(characterId: number) {
  const res = await apiFetch<BasicResponse>("/api/character/delete", {
    method: "POST",
    body: JSON.stringify({ characterId }),
  });

  if (!res.success) {
    throw new Error(res.message);
  }

  return res.message;
}
