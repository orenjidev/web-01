import fs from "fs";
import path from "path";
import {
  getSkills,
  getSkillById,
  getSkillsCacheInfo,
  initSkillsCache,
} from "../../services/skills.service.js";

const SKILLS_OUTPUT_PATH = path.resolve("generated/skills.web.json");

export function listPublicSkillsController(req, res) {
  const info = getSkillsCacheInfo();
  if (!info.loaded && fs.existsSync(SKILLS_OUTPUT_PATH)) {
    try {
      initSkillsCache(true);
    } catch {
      // ignore and return unloaded response below
    }
  }

  const freshInfo = getSkillsCacheInfo();
  if (!freshInfo.loaded) {
    return res.json({
      ok: true,
      info: freshInfo,
      skills: [],
      total: 0,
      page: 1,
      limit: 50,
    });
  }

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
  const search = (req.query.search || "").trim().toLowerCase();

  let all = getSkills();
  if (search) {
    all = all.filter(
      (skill) =>
        skill.skillId.toLowerCase().includes(search) ||
        skill.name.toLowerCase().includes(search) ||
        String(skill.mainId).includes(search) ||
        String(skill.subId).includes(search),
    );
  }

  const total = all.length;
  const start = (page - 1) * limit;
  const skills = all.slice(start, start + limit).map((skill) => ({
    skillId: skill.skillId,
    mainId: skill.mainId,
    subId: skill.subId,
    name: skill.name,
    description: skill.description ?? null,
    grade: skill.grade ?? null,
    maxLevel: skill.maxLevel ?? null,
    role: skill.role ?? null,
    apply: skill.apply ?? null,
    actionType: skill.actionType ?? null,
    classInfo: skill.classInfo ?? null,
    impact: skill.impact ?? null,
    addons: skill.addons ?? [],
    specAddons: skill.specAddons ?? [],
  }));

  return res.json({ ok: true, info: freshInfo, skills, total, page, limit });
}

export function getPublicSkillDetailController(req, res) {
  const skill = getSkillById(req.params.skillId);
  if (!skill) {
    return res.status(404).json({ ok: false, message: "Skill not found." });
  }

  return res.json({
    ok: true,
    skill: {
      skillId: skill.skillId,
      mainId: skill.mainId,
      subId: skill.subId,
      name: skill.name,
      description: skill.description ?? null,
      grade: skill.grade ?? null,
      maxLevel: skill.maxLevel ?? null,
      role: skill.role ?? null,
      apply: skill.apply ?? null,
      actionType: skill.actionType ?? null,
      classInfo: skill.classInfo ?? null,
      impact: skill.impact ?? null,
      applyMeta: skill.applyMeta ?? null,
      stateBlow: skill.stateBlow ?? null,
      addons: skill.addons ?? [],
      specAddons: skill.specAddons ?? [],
    },
  });
}
