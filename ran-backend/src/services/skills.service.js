import fs from "fs";
import path from "path";

const DATA_PATH = path.resolve("generated/skills.web.json");

let skillsArray = null;
let skillsById = null;
let loadedAt = null;

export const SKILLS_CACHE_VERSION = "maintenance-2026-03-06";

export function initSkillsCache(force = false) {
  if (skillsArray && skillsById && !force) return;

  const start = process.hrtime.bigint();

  const raw = fs.readFileSync(DATA_PATH, "utf8");
  const parsed = JSON.parse(raw);

  skillsArray = parsed;
  skillsById = new Map(parsed.map((skill) => [skill.skillId, skill]));
  loadedAt = new Date();

  const end = process.hrtime.bigint();
  const ms = Number(end - start) / 1_000_000;

  console.log(
    `[skills] cache loaded (${skillsArray.length} skills) in ${ms.toFixed(2)} ms`,
  );
}

export function getSkills() {
  if (!skillsArray) initSkillsCache();
  return skillsArray;
}

export function getSkillById(skillId) {
  if (!skillsById) initSkillsCache();
  return skillsById.get(skillId) || null;
}

export function getSkillsCacheInfo() {
  return {
    loaded: !!skillsArray,
    count: skillsArray?.length ?? 0,
    loadedAt,
    version: SKILLS_CACHE_VERSION,
  };
}
