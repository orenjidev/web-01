import { apiFetch } from "@/lib/apiFetch";

interface BuildResult {
  ok: boolean;
  skillCount: number;
  message: string;
}

interface StringsBuildResult {
  ok: boolean;
  stringsCount: number;
  skillCount: number | null;
  message: string;
}

export interface SkillPreviewEntry {
  skillId: string;
  mainId: number;
  subId: number;
  name: string;
  grade: number | null;
  maxLevel: number | null;
  role: number | null;
  apply: number | null;
  actionType: number | null;
  description?: string | null;
  classInfo?: {
    emSkillClass: number;
    group: string;
    glccValue: number;
    glccHex: string;
    glccBits: string[];
  } | null;
  impact?: {
    target: { id: number; label: string } | null;
    realm: { id: number; label: string } | null;
    side: { id: number; label: string } | null;
    tarRange: number | null;
    tarRangeCheck: number | null;
  };
  addons?: {
    slot: number;
    id: number;
    label: string;
    scale: number;
    description?: string;
    levels: { level: number; value: number | null; rate: number | null }[];
  }[];
  specAddons?: {
    slot: number;
    id: number;
    label: string;
    var1Label: string;
    var2Label: string;
    var1Scale: number;
    var2Scale: number;
    description?: string;
    levels: {
      level: number;
      var1: number | null;
      var2: number | null;
      rate: number | null;
      rate2: number | null;
    }[];
  }[];
  [key: string]: unknown;
}

export interface SkillsPreviewResult {
  ok: boolean;
  info: { loaded: boolean; count: number; loadedAt: string | null; version: string };
  skills: SkillPreviewEntry[];
  total: number;
  page: number;
  limit: number;
}

export async function getSkillsPreview(
  page = 1,
  limit = 50,
  search = "",
): Promise<SkillsPreviewResult> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set("search", search);
  return apiFetch<SkillsPreviewResult>(
    `/api/adminpanel/build-skills/preview?${params}`,
  );
}

export interface SkillDetailResult {
  ok: boolean;
  skill: SkillPreviewEntry;
}

export async function getSkillDetail(skillId: string): Promise<SkillDetailResult> {
  return apiFetch<SkillDetailResult>(
    `/api/adminpanel/build-skills/skill/${encodeURIComponent(skillId)}`,
  );
}

export async function uploadAndBuildSkills(file: File): Promise<BuildResult> {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch<BuildResult>("/api/adminpanel/build-skills/upload", {
    method: "POST",
    body: formData,
  });
}

export async function uploadSkillStrings(file: File): Promise<StringsBuildResult> {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch<StringsBuildResult>("/api/adminpanel/build-skills/upload-strings", {
    method: "POST",
    body: formData,
  });
}

export async function triggerBuildSkills(): Promise<BuildResult> {
  return apiFetch<BuildResult>("/api/adminpanel/build-skills/build", {
    method: "POST",
  });
}
