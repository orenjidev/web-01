import { apiFetch } from "@/lib/apiFetch";

export interface PublicSkill {
  skillId: string;
  mainId: number;
  subId: number;
  name: string;
  description?: string | null;
  grade: number | null;
  maxLevel: number | null;
  classInfo?: {
    emSkillClass: number;
    group: string;
    glccValue: number;
    glccHex: string;
    glccBits: string[];
  } | null;
  addons?: Array<{
    slot: number;
    id: number;
    label: string;
    description?: string;
  }>;
  specAddons?: Array<{
    slot: number;
    id: number;
    label: string;
    description?: string;
  }>;
}

interface PublicSkillsPage {
  ok: boolean;
  skills: PublicSkill[];
  total: number;
  page: number;
  limit: number;
}

export async function fetchAllPublicSkills(): Promise<PublicSkill[]> {
  const limit = 100;
  let page = 1;
  let total = 0;
  const all: PublicSkill[] = [];

  do {
    const res = await apiFetch<PublicSkillsPage>(
      `/api/public/skills?page=${page}&limit=${limit}`,
    );
    total = res.total ?? 0;
    all.push(...(res.skills ?? []));
    page += 1;
  } while (all.length < total);

  return all;
}
