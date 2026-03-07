import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { fileURLToPath } from "url";

const INPUT = path.resolve("data/skills/Skill.csv");
const OUTPUT = path.resolve("generated/skills.web.json");
const STRINGS_PATH = path.resolve("generated/skills.strings.json");
const ENCODING = "latin1";

export const SKILL_COLUMN_MAP = {
  mainId: ["sNATIVEID wMainID", "mainId", "main id", "wMainID"],
  subId: ["sNATIVEID wSubID", "subId", "sub id", "wSubID"],
  name: ["szNAME", "name", "skillName"],
  grade: ["dwGRADE", "grade"],
  maxLevel: ["dwMAXLEVEL", "maxLevel", "max level"],
  role: ["emROLE", "role"],
  apply: ["emAPPLY", "apply"],
  actionType: ["emACTION_TYPE", "actionType"],
  impactTar: ["emIMPACT_TAR"],
  impactRealm: ["emIMPACT_REALM"],
  impactSide: ["emIMPACT_SIDE"],
  tarRange: ["wTARRANGE"],
  tarRangeCheck: ["wTarRangeCheck"],
  basicType: ["emBASIC_TYPE"],
  element: ["emELEMENT"],
  cureFlag: ["dwCUREFLAG"],
  stateBlow: ["emSTATE_BLOW"],
  classMask: ["dwCLASS", "classMask", "class mask"],
};

const REQUIRED_FIELDS = ["mainId", "subId", "name"];

const IMPACT_ADDON_LABELS = [
  "None",
  "Hit Rate",
  "Avoid Rate",
  "Attack",
  "Defense",
  "HP Recover",
  "MP Recover",
  "SP Recover",
  "HP+MP+SP Recover",
  "Attack Percentage",
  "Defense Percentage",
  "Melee",
  "Missile",
  "Energy",
  "Maximum HP",
  "Maximum MP",
  "Maximum SP",
  "Resistance",
  "Change Stats",
  "HP recovery amount +-",
  "MP recovery amount +-",
  "SP recovery amount +-",
  "CP recovery amount +-",
  "CP Auto +-",
];

const IMPACT_ADDON_SCALE = [
  1, 1, 1, 1, 1, 100, 100, 100, 100, 100, 100, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
];

const IMPACT_TAR = [
  "Self",
  "Target",
  "From Self To Target",
  "Specific Location",
  "Ground Position",
];

const IMPACT_REALM = [
  "Target Self",
  "Target Area",
  "Keep Target Area",
  "Around Target",
];

const IMPACT_SIDE = [
  "Target MySide",
  "Target Enemy",
  "Target Everyone",
];

const SPEC_ADDON = [
  "None",
  "Push/Pull",
  "Return Damage",
  "Revive",
  "Steal HP",
  "Steal MP",
  "Steal SP",
  "Share HP",
  "Share MP",
  "Share SP",
  "Prevent Abnormal Condition",
  "Avoid Abnormal Condition",
  "Pierce",
  "Target Range",
  "Movement Speed",
  "Dash",
  "Hiding",
  "Detect Hiding",
  "Attack Speed",
  "Skill Delay",
  "Crushing Blow",
  "Physical Damage Absorb",
  "Magic Damage Absorb",
  "Return Physical Damage",
  "Return Magic Damage",
  "Remove Skill Effect",
  "Stun",
  "Active Type Skill",
  "Pull",
  "Push",
  "Sustained Attack",
  "Curse",
  "Attack Range",
  "Skill Scope",
  "Prohibit Use of Pots",
  "Prohibit Use of Skills",
  "Damage Absorption(Ignored)",
  "Item Drop Rate",
  "Money Drop Rate",
  "Get Exp Rate",
  "Talk to Specific NPC",
  "Specific Item Drop",
  "Teleportation",
  "Position Shift",
  "Fortification",
  "Illusion",
  "Release Vehicle",
  "Duration Change",
  "Stigma",
  "Transform",
  "Effect Release",
  "Link HP",
  "Release Pet",
  "Immune",
  "Battle Status",
  "Battle Status Release",
  "Taunt",
  "Domination",
  "Random Exp Rate",
  "Skill Link",
  "Attack Power",
  "Attack Power(Ratio)",
  "Defense",
  "Defense(Ratio)",
  "Accuracy",
  "Accuracy(Ratio)",
  "Evasion Rate",
  "Evasion Rate(Ratio)",
  "HP Increase",
  "MP Increase",
  "SP Increase",
  "CP Increase",
  "HP Recovery Rate",
  "MP Recovery Rate",
  "SP Recovery Rate",
  "HP, MP, SP Recovery Rate",
  "Attack Range",
  "SP Consumption",
  "Resistance",
  "Power",
  "Vitality",
  "Intelligence",
  "Dexterity",
  "Stamina",
  "Melee Value",
  "Missile Value",
  "Energy Value",
  "Potion HP Increase",
  "Potion MP Increase",
  "Potion SP Increase",
  "CP Increase",
  "Movement Speed",
  "Damage(Ratio)",
  "View Range(Ratio)",
  "Airborne",
  "Summon(Switch Skill)",
  "Summon(Skill)",
  "Summon(Targeting)",
  "Summon(Retreat)",
  "Delay Action",
  "Replication Effect",
  "Movement Limit",
  "Counter",
  "Screen Toss",
  "Summon (Gate)",
  "Play Dead",
  "Hit the Camera",
  "Disguise",
  "Provoke",
  "Special Immune Effect",
  "Damage Activated",
  "Remove Special Skill Effect",
];

const SPEC_ADDON_VAR1 = [
  "None",
  "Distance",
  "None",
  "Evasion Rate",
  "Absorb Rate",
  "Absorb Rate",
  "Absorb Rate",
  "None",
  "None",
  "None",
  "None",
  "None",
  "Pierce",
  "Weapon Reach",
  "Movement Speed",
  "Distance",
  "Hiding Lv",
  "Detect Lv",
  "Attack Speed",
  "Skill Delay",
  "Distance",
  "Absorb Rate",
  "Absorb Rate",
  "Return Rate",
  "Return Rate",
  "None",
  "None",
  "Rate",
  "Rate",
  "Rate",
  "Time",
  "Bounce rate",
  "Distance",
  "Distance",
  "None",
  "None",
  "Ignore Count",
  "Increase Rate",
  "Increase Rate",
  "Increase Rate",
  "None",
  "None",
  "Rate",
  "Rate",
  "Critical R. Inc.",
  "Distance",
  "Success Rate",
  "Change Ratio1",
  "Effective Distance",
  "Transformation ID",
  "Rate",
  "None",
  "Success Rate",
  "Apply Type",
  "Rate",
  "None",
  "Rate",
  "Rate",
  "Index",
  "Rate",
  "Value",
  "Ratio",
  "Value",
  "Ratio",
  "Value",
  "Ratio",
  "Value",
  "Ratio",
  "Value",
  "Value",
  "Value",
  "Value",
  "Ratio",
  "Ratio",
  "Ratio",
  "Ratio",
  "Value",
  "Value",
  "Value",
  "Value",
  "Value",
  "Value",
  "Value",
  "Value",
  "Value",
  "Value",
  "Value",
  "Value",
  "Value",
  "Value",
  "Value",
  "Ratio",
  "Ratio",
  "Floating Time",
  "Basic Slot",
  "Basic Slot",
  "None",
  "None",
  "Skill MID",
  "Count",
  "Min Speed",
  "Skill Mid",
  "Effect",
  "Mob MID",
  "None",
  "Effect",
  "ChangeSkill",
  "Effective Range",
  "EffectID",
  "Hit Damage",
  "EffectID",
];

const SPEC_ADDON_VAR1_SCALE = [
  1, 1, 1, 100, 100, 100, 100, 1, 1, 1, 1, 1, 1, 1, 100, 1, 1, 1, 100, 1, 1, 100,
  100, 100, 100, 1, 1, 100, 100, 100, 1, 100, 1, 1, 1, 1, 1, 100, 100, 100, 1, 1, 1,
  100, 100, 1, 100, 1, 1, 0, 100, 0, 100, 1, 100, 0, 1, 100, 1, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 10, 10, 0, 0, 0, 1, 100, 0, 0, 1, 0, 1, 1, 1, 1, 0,
];

const SPEC_ADDON_VAR2 = [
  "None",
  "Chance",
  "None",
  "None",
  "None",
  "None",
  "None",
  "None",
  "None",
  "None",
  "None",
  "None",
  "None",
  "None",
  "None",
  "None",
  "Animation",
  "Range",
  "None",
  "Chance",
  "Rate",
  "None",
  "None",
  "Chance",
  "Chance",
  "None",
  "None",
  "None",
  "Moving Speed",
  "Distance",
  "Damage",
  "None",
  "None",
  "None",
  "None",
  "None",
  "Ignore Damage",
  "None",
  "None",
  "None",
  "None",
  "None",
  "None",
  "Speed",
  "Damage Inc.",
  "Number",
  "Duration",
  "Change Ratio2",
  "Value Ratio",
  "Emoticon ID",
  "Release Condition",
  "None",
  "None",
  "Behavior Type",
  "Duration",
  "None",
  "Effective Distance",
  "Range",
  "Overlaps",
  "None",
  "None",
  "None",
  "None",
  "None",
  "None",
  "None",
  "None",
  "None",
  "None",
  "None",
  "None",
  "None",
  "None",
  "None",
  "None",
  "None",
  "None",
  "None",
  "None",
  "None",
  "None",
  "None",
  "None",
  "None",
  "None",
  "None",
  "None",
  "None",
  "None",
  "None",
  "None",
  "None",
  "None",
  "Height",
  "None",
  "None",
  "None",
  "None",
  "Skill SID",
  "Attack Power",
  "Max Speed",
  "Skill SID",
  "None",
  "Mob SID",
  "None",
  "None",
  "ShapeShiftID",
  "None",
  "None",
  "Attack Damage",
  "None",
];

const SPEC_ADDON_VAR2_SCALE = [
  1, 100, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 100, 1, 1, 100, 100,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 100, 1, 1, 1, 100, 0, 0, 0,
  0, 1, 1, 0, 1, 1, 1, 0,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1, 10, 0, 0, 0, 0, 0, 10, 100, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0,
];

const SPEC_ADDON_LABEL_OVERRIDES = {
  95: "Summon(Switch Skill)",
  96: "Summon(Skill)",
  97: "Summon(Targeting)",
  98: "Summon(Retreat)",
  99: "Delay Action",
  100: "Replication Effect",
  101: "Movement Limit",
  102: "Counter",
  103: "Screen Toss",
  104: "Summon (Gate)",
  105: "Play Dead",
  106: "Hit the Camera",
  107: "Disguise",
  108: "Provoke",
  109: "Special Immune Effect",
  110: "Damage Activated",
  111: "Remove Special Skill Effect",
};

const SPEC_ADDON_VAR1_OVERRIDES = {
  95: "Basic Slot",
  96: "Basic Slot",
  97: "None",
  98: "None",
  99: "Skill MID",
  100: "Count",
  101: "Min Speed",
  102: "Skill Mid",
  103: "Effect",
  104: "Mob MID",
  105: "None",
  106: "Effect",
  107: "ChangeSkill",
  108: "Effective Range",
  109: "EffectID",
  110: "Hit Damage",
  111: "EffectID",
};

const SPEC_ADDON_VAR2_OVERRIDES = {
  95: "None",
  96: "None",
  97: "None",
  98: "None",
  99: "Skill SID",
  100: "Attack Power",
  101: "Max Speed",
  102: "Skill SID",
  103: "None",
  104: "Mob SID",
  105: "None",
  106: "None",
  107: "ShapeShiftID",
  108: "None",
  109: "None",
  110: "Attack Damage",
  111: "None",
};

const SPEC_ADDON_VAR1_SCALE_OVERRIDES = {
  95: 10, 96: 10, 97: 0, 98: 0, 99: 0, 100: 1, 101: 100, 102: 0, 103: 0,
  104: 1, 105: 0, 106: 1, 107: 1, 108: 1, 109: 1, 110: 1, 111: 0,
};

const SPEC_ADDON_VAR2_SCALE_OVERRIDES = {
  95: 0, 96: 0, 97: 0, 98: 0, 99: 0, 100: 10, 101: 100, 102: 0, 103: 0,
  104: 1, 105: 0, 106: 1, 107: 0, 108: 0, 109: 0, 110: 1, 111: 0,
};

const normalizeHeader = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();

const toInt = (value) => {
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
};

const toFloat = (value) => {
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
};

const toString = (value) => (value === undefined || value === null ? "" : String(value).trim());

const makeSkillId = (mainId, subId) =>
  `SN_${String(Number(mainId)).padStart(3, "0")}_${String(Number(subId)).padStart(3, "0")}`;

const enumLabel = (index, labels) => labels[index] ?? `Unknown(${index})`;
const inSet = (value, set) => set.includes(value);
const getSpecLabel = (id) => SPEC_ADDON_LABEL_OVERRIDES[id] ?? enumLabel(id, SPEC_ADDON);
const getSpecVar1Label = (id) => SPEC_ADDON_VAR1_OVERRIDES[id] ?? enumLabel(id, SPEC_ADDON_VAR1);
const getSpecVar2Label = (id) => SPEC_ADDON_VAR2_OVERRIDES[id] ?? enumLabel(id, SPEC_ADDON_VAR2);
const getSpecVar1Scale = (id) => SPEC_ADDON_VAR1_SCALE_OVERRIDES[id] ?? (SPEC_ADDON_VAR1_SCALE[id] ?? 1);
const getSpecVar2Scale = (id) => SPEC_ADDON_VAR2_SCALE_OVERRIDES[id] ?? (SPEC_ADDON_VAR2_SCALE[id] ?? 1);

const GLCC = {
  NONE: 0x00000000,
  BRAWLER_M: 0x00000001,
  SWORDSMAN_M: 0x00000002,
  ARCHER_W: 0x00000004,
  SHAMAN_W: 0x00000008,
  EXTREME_M: 0x00000010,
  EXTREME_W: 0x00000020,
  BRAWLER_W: 0x00000040,
  SWORDSMAN_W: 0x00000080,
  ARCHER_M: 0x00000100,
  SHAMAN_M: 0x00000200,
  GUNNER_M: 0x00000400,
  GUNNER_W: 0x00000800,
  ASSASSIN_M: 0x00001000,
  ASSASSIN_W: 0x00002000,
  MAGICIAN_M: 0x00004000,
  MAGICIAN_W: 0x00008000,
  ETC_M: 0x00010000,
  ETC_W: 0x00020000,
  SHAPER_M: 0x00040000,
  SHAPER_W: 0x00080000,
};

const KNOWN_GROUPS = [
  { name: "Brawler", mask: GLCC.BRAWLER_M | GLCC.BRAWLER_W },
  { name: "Swordsman", mask: GLCC.SWORDSMAN_M | GLCC.SWORDSMAN_W },
  { name: "Archer", mask: GLCC.ARCHER_M | GLCC.ARCHER_W },
  { name: "Shaman", mask: GLCC.SHAMAN_M | GLCC.SHAMAN_W },
  { name: "Extreme", mask: GLCC.EXTREME_M | GLCC.EXTREME_W },
  { name: "Gunner", mask: GLCC.GUNNER_M | GLCC.GUNNER_W },
  { name: "Assassin", mask: GLCC.ASSASSIN_M | GLCC.ASSASSIN_W },
  { name: "Magician", mask: GLCC.MAGICIAN_M | GLCC.MAGICIAN_W },
  { name: "Etc", mask: GLCC.ETC_M | GLCC.ETC_W },
  { name: "Shaper", mask: GLCC.SHAPER_M | GLCC.SHAPER_W },
];

function toHex32(value) {
  const safe = Number(value) >>> 0;
  return `0x${safe.toString(16).toUpperCase().padStart(8, "0")}`;
}

function decodeClassBits(mask) {
  if (!mask) return [];
  const bits = [];
  if (mask & GLCC.BRAWLER_M) bits.push("GLCC_BRAWLER_M");
  if (mask & GLCC.BRAWLER_W) bits.push("GLCC_BRAWLER_W");
  if (mask & GLCC.SWORDSMAN_M) bits.push("GLCC_SWORDSMAN_M");
  if (mask & GLCC.SWORDSMAN_W) bits.push("GLCC_SWORDSMAN_W");
  if (mask & GLCC.ARCHER_M) bits.push("GLCC_ARCHER_M");
  if (mask & GLCC.ARCHER_W) bits.push("GLCC_ARCHER_W");
  if (mask & GLCC.SHAMAN_M) bits.push("GLCC_SHAMAN_M");
  if (mask & GLCC.SHAMAN_W) bits.push("GLCC_SHAMAN_W");
  if (mask & GLCC.EXTREME_M) bits.push("GLCC_EXTREME_M");
  if (mask & GLCC.EXTREME_W) bits.push("GLCC_EXTREME_W");
  if (mask & GLCC.GUNNER_M) bits.push("GLCC_GUNNER_M");
  if (mask & GLCC.GUNNER_W) bits.push("GLCC_GUNNER_W");
  if (mask & GLCC.ASSASSIN_M) bits.push("GLCC_ASSASSIN_M");
  if (mask & GLCC.ASSASSIN_W) bits.push("GLCC_ASSASSIN_W");
  if (mask & GLCC.MAGICIAN_M) bits.push("GLCC_MAGICIAN_M");
  if (mask & GLCC.MAGICIAN_W) bits.push("GLCC_MAGICIAN_W");
  if (mask & GLCC.ETC_M) bits.push("GLCC_ETC_M");
  if (mask & GLCC.ETC_W) bits.push("GLCC_ETC_W");
  if (mask & GLCC.SHAPER_M) bits.push("GLCC_SHAPER_M");
  if (mask & GLCC.SHAPER_W) bits.push("GLCC_SHAPER_W");
  return bits;
}

function resolveClassInfo(mainId) {
  const value = Number(mainId);
  let mask = GLCC.NONE;
  let group = "None";

  if (inSet(value, [0, 1, 2, 3, 100, 101, 102])) {
    group = "Brawler";
    mask = GLCC.BRAWLER_M | GLCC.BRAWLER_W;
  }
  if (inSet(value, [4, 5, 6, 7, 103, 104, 105])) {
    group = "Swordsman";
    mask = GLCC.SWORDSMAN_M | GLCC.SWORDSMAN_W;
  }
  if (inSet(value, [8, 9, 10, 11, 106, 107, 108])) {
    group = "Archer";
    mask = GLCC.ARCHER_M | GLCC.ARCHER_W;
  }
  if (inSet(value, [12, 13, 14, 15, 109, 110, 111])) {
    group = "Shaman";
    mask = GLCC.SHAMAN_M | GLCC.SHAMAN_W;
  }
  if (inSet(value, [30, 31, 32, 33, 112, 113, 114])) {
    group = "Extreme";
    mask = GLCC.EXTREME_M | GLCC.EXTREME_W;
  }
  if (inSet(value, [36, 37, 38, 39, 115, 116, 117])) {
    group = "Gunner";
    mask = GLCC.GUNNER_M | GLCC.GUNNER_W;
  }
  if (inSet(value, [43, 44, 45, 46, 118, 119, 120])) {
    group = "Assassin";
    mask = GLCC.ASSASSIN_M | GLCC.ASSASSIN_W;
  }
  if (inSet(value, [56, 57, 58, 59, 121, 122, 123])) {
    group = "Magician";
    mask = GLCC.MAGICIAN_M | GLCC.MAGICIAN_W;
  }
  if (inSet(value, [47, 48, 49, 50])) {
    group = "Etc";
    mask = GLCC.ETC_M | GLCC.ETC_W;
  }
  if (inSet(value, [61, 62, 63, 64, 65, 66, 67, 68, 124, 125, 126])) {
    group = "Shaper";
    mask = GLCC.SHAPER_M | GLCC.SHAPER_W;
  }

  return {
    emSkillClass: value,
    group,
    glccValue: mask >>> 0,
    glccHex: toHex32(mask),
    glccBits: decodeClassBits(mask),
  };
}

function resolveClassInfoFromMask(mask, emSkillClass) {
  const normalized = (Number(mask) >>> 0);
  const known = KNOWN_GROUPS.find((g) => g.mask === normalized);
  return {
    emSkillClass,
    group: known?.name ?? "Custom",
    glccValue: normalized,
    glccHex: toHex32(normalized),
    glccBits: decodeClassBits(normalized),
  };
}

function resolveColumns(headers, columnMap = SKILL_COLUMN_MAP) {
  const byNormalized = new Map(
    headers.map((header) => [normalizeHeader(header), header]),
  );

  const resolved = {};
  for (const [field, aliases] of Object.entries(columnMap)) {
    const found = aliases
      .map((alias) => byNormalized.get(normalizeHeader(alias)))
      .find(Boolean);

    if (found) resolved[field] = found;
  }

  const missing = REQUIRED_FIELDS.filter((field) => !resolved[field]);
  if (missing.length) {
    throw new Error(
      `[build-skills] Missing required columns: ${missing.join(", ")}. ` +
      `Available headers: ${headers.join(", ")}`,
    );
  }

  return resolved;
}

function detectHeaderMeta(headers) {
  let maxAddonSlot = 0;
  let maxAddonLevel = 0;
  let maxSpecSlot = 0;
  let maxSpecLevel = 0;
  let maxDataLevel = 0;
  let maxStateBlowLevel = 0;

  for (const header of headers) {
    let match = header.match(/^emADDON(\d+)$/i);
    if (match) {
      maxAddonSlot = Math.max(maxAddonSlot, Number(match[1]));
      continue;
    }

    match = header.match(/^fADDON_VAR(\d+)_(\d+)$/i);
    if (match) {
      maxAddonSlot = Math.max(maxAddonSlot, Number(match[1]));
      maxAddonLevel = Math.max(maxAddonLevel, Number(match[2]));
      continue;
    }

    match = header.match(/^emSPEC(\d+)$/i);
    if (match) {
      maxSpecSlot = Math.max(maxSpecSlot, Number(match[1]));
      continue;
    }

    match = header.match(/^sSPEC(\d+)_(\d+) fVAR1$/i);
    if (match) {
      maxSpecSlot = Math.max(maxSpecSlot, Number(match[1]));
      maxSpecLevel = Math.max(maxSpecLevel, Number(match[2]));
      continue;
    }

    match = header.match(/^sDATA_LVL (\d+) /i);
    if (match) {
      maxDataLevel = Math.max(maxDataLevel, Number(match[1]));
      continue;
    }

    match = header.match(/^sSTATE_BLOW (\d+) /i);
    if (match) {
      maxStateBlowLevel = Math.max(maxStateBlowLevel, Number(match[1]));
    }
  }

  return {
    maxAddonSlot,
    maxAddonLevel,
    maxSpecSlot,
    maxSpecLevel,
    maxDataLevel,
    maxStateBlowLevel,
  };
}

function isEmptyRow(row) {
  return Object.values(row).every((value) => toString(value) === "");
}

function parseSkillRow(row, columns, headerMeta, lineNumber) {
  if (isEmptyRow(row)) return null;

  const mainId = toInt(row[columns.mainId]);
  const subId = toInt(row[columns.subId]);
  const name = toString(row[columns.name]);
  const skillId = mainId !== null && subId !== null ? makeSkillId(mainId, subId) : "";

  if (!skillId) {
    throw new Error(`[build-skills] Row ${lineNumber}: failed to build skillId from main/sub.`);
  }
  if (mainId === null || subId === null) {
    throw new Error(`[build-skills] Row ${lineNumber}: mainId/subId must be numeric.`);
  }
  if (!name) {
    throw new Error(`[build-skills] Row ${lineNumber}: name is required.`);
  }

  const impactTarId = columns.impactTar ? toInt(row[columns.impactTar]) : null;
  const impactRealmId = columns.impactRealm ? toInt(row[columns.impactRealm]) : null;
  const impactSideId = columns.impactSide ? toInt(row[columns.impactSide]) : null;
  const classMask = columns.classMask ? toInt(row[columns.classMask]) : null;
  const maxLevel = columns.maxLevel ? toInt(row[columns.maxLevel]) : null;
  const safeMaxLevel = maxLevel && maxLevel > 0 ? maxLevel : null;

  const addons = [];
  for (let slot = 1; slot <= headerMeta.maxAddonSlot; slot += 1) {
    const emAddonHeader = `emADDON${slot}`;
    const addonId = toInt(row[emAddonHeader]);
    if (addonId === null) continue;

    const levels = [];
    const addonMaxLevel = safeMaxLevel
      ? Math.min(headerMeta.maxAddonLevel, safeMaxLevel)
      : headerMeta.maxAddonLevel;

    for (let level = 1; level <= addonMaxLevel; level += 1) {
      const addonVar = toFloat(row[`fADDON_VAR${slot}_${level}`]);
      const rate = toFloat(row[`fRate${slot}_${level}`]);
      if (addonVar === null && rate === null) continue;
      levels.push({ level, value: addonVar, rate });
    }

    addons.push({
      slot,
      id: addonId,
      label: enumLabel(addonId, IMPACT_ADDON_LABELS),
      scale: IMPACT_ADDON_SCALE[addonId] ?? 1,
      description: `Impact Addon: ${enumLabel(addonId, IMPACT_ADDON_LABELS)} (scale x${IMPACT_ADDON_SCALE[addonId] ?? 1})`,
      levels,
    });
  }

  const specAddons = [];
  for (let slot = 1; slot <= headerMeta.maxSpecSlot; slot += 1) {
    const specId = toInt(row[`emSPEC${slot}`]);
    if (specId === null) continue;

    const levels = [];
    const specMaxLevel = safeMaxLevel
      ? Math.min(headerMeta.maxSpecLevel, safeMaxLevel)
      : headerMeta.maxSpecLevel;

    for (let level = 1; level <= specMaxLevel; level += 1) {
      const prefix = `sSPEC${slot}_${level} `;
      const var1 = toFloat(row[`${prefix}fVAR1`]);
      const var2 = toFloat(row[`${prefix}fVAR2`]);
      const rate = toFloat(row[`${prefix}fRate`]);
      const rate2 = toFloat(row[`${prefix}fRate2`]);
      const flag = toInt(row[`${prefix}dwFLAG`]);
      const nativeMid = toInt(row[`${prefix}Native MID`]);
      const nativeSid = toInt(row[`${prefix}Native SID`]);
      const linkMid = toInt(row[`${prefix}Link MID`]);
      const linkSid = toInt(row[`${prefix}Link SID`]);

      if (
        var1 === null && var2 === null && rate === null && rate2 === null &&
        flag === null && nativeMid === null && nativeSid === null &&
        linkMid === null && linkSid === null
      ) {
        continue;
      }

      levels.push({
        level,
        var1,
        var2,
        rate,
        rate2,
        flag,
        nativeId: nativeMid === null && nativeSid === null ? null : { mainId: nativeMid ?? 0, subId: nativeSid ?? 0 },
        linkId: linkMid === null && linkSid === null ? null : { mainId: linkMid ?? 0, subId: linkSid ?? 0 },
      });
    }

    specAddons.push({
      slot,
      id: specId,
      label: getSpecLabel(specId),
      var1Label: getSpecVar1Label(specId),
      var2Label: getSpecVar2Label(specId),
      var1Scale: getSpecVar1Scale(specId),
      var2Scale: getSpecVar2Scale(specId),
      description:
        `Spec Addon: ${getSpecLabel(specId)} | ` +
        `Var1: ${getSpecVar1Label(specId)} (x${getSpecVar1Scale(specId)}) | ` +
        `Var2: ${getSpecVar2Label(specId)} (x${getSpecVar2Scale(specId)})`,
      levels,
    });
  }

  const dataLevels = [];
  const dataMaxLevel = safeMaxLevel
    ? Math.min(headerMeta.maxDataLevel, safeMaxLevel - 1)
    : headerMeta.maxDataLevel;
  for (let level = 0; level <= dataMaxLevel; level += 1) {
    const prefix = `sDATA_LVL ${level} `;
    const entry = {
      level,
      delayTime: toFloat(row[`${prefix}fDELAYTIME`]),
      life: toFloat(row[`${prefix}fLIFE`]),
      applyRange: toInt(row[`${prefix}wAPPLYRANGE`]),
      applyRangeCheck: toInt(row[`${prefix}wApplyRangeCheck`]),
      applyNum: toInt(row[`${prefix}wAPPLYNUM`]),
      applyAngle: toInt(row[`${prefix}wAPPLYANGLE`]),
      pierceNum: toInt(row[`${prefix}wPIERCENUM`]),
      tarNum: toInt(row[`${prefix}wTARNUM`]),
      basicVar: toFloat(row[`${prefix}fBASIC_VAR`]),
      useArrowNum: toInt(row[`${prefix}wUSE_ARROWNUM`]),
      useCharmNum: toInt(row[`${prefix}wUSE_CHARMNUM`]),
      useBulletNum: toInt(row[`${prefix}wUSE_BULLETNUM`]),
      useExp: toInt(row[`${prefix}wUSE_EXP`]),
      useHp: toInt(row[`${prefix}wUSE_HP`]),
      useMp: toInt(row[`${prefix}wUSE_MP`]),
      useSp: toInt(row[`${prefix}wUSE_SP`]),
      useCp: toInt(row[`${prefix}wUSE_CP`]),
      useBattery: toInt(row[`${prefix}nUSE_BATTERY`]),
      useHpPty: toInt(row[`${prefix}wUSE_HP_PTY`]),
      useMpPty: toInt(row[`${prefix}wUSE_MP_PTY`]),
      useSpPty: toInt(row[`${prefix}wUSE_SP_PTY`]),
    };

    if (Object.values(entry).some((value) => value !== null && value !== level)) {
      dataLevels.push(entry);
    }
  }

  const stateBlowLevels = [];
  const stateBlowMaxLevel = safeMaxLevel
    ? Math.min(headerMeta.maxStateBlowLevel, safeMaxLevel - 1)
    : headerMeta.maxStateBlowLevel;
  for (let level = 0; level <= stateBlowMaxLevel; level += 1) {
    const prefix = `sSTATE_BLOW ${level} `;
    const rate = toFloat(row[`${prefix}fRATE`]);
    const var1 = toFloat(row[`${prefix}fVAR1`]);
    const var2 = toFloat(row[`${prefix}fVAR2`]);
    if (rate === null && var1 === null && var2 === null) continue;
    stateBlowLevels.push({ level, rate, var1, var2 });
  }

  return {
    skillId,
    mainId,
    subId,
    name,
    grade: columns.grade ? toInt(row[columns.grade]) : null,
    maxLevel,
    role: columns.role ? toInt(row[columns.role]) : null,
    apply: columns.apply ? toInt(row[columns.apply]) : null,
    actionType: columns.actionType ? toInt(row[columns.actionType]) : null,
    impact: {
      target: impactTarId === null ? null : { id: impactTarId, label: enumLabel(impactTarId, IMPACT_TAR) },
      realm: impactRealmId === null ? null : { id: impactRealmId, label: enumLabel(impactRealmId, IMPACT_REALM) },
      side: impactSideId === null ? null : { id: impactSideId, label: enumLabel(impactSideId, IMPACT_SIDE) },
      tarRange: columns.tarRange ? toInt(row[columns.tarRange]) : null,
      tarRangeCheck: columns.tarRangeCheck ? toInt(row[columns.tarRangeCheck]) : null,
    },
    applyMeta: {
      basicType: columns.basicType ? toInt(row[columns.basicType]) : null,
      element: columns.element ? toInt(row[columns.element]) : null,
      cureFlag: columns.cureFlag ? toInt(row[columns.cureFlag]) : null,
      levels: dataLevels,
    },
    stateBlow: {
      type: columns.stateBlow ? toInt(row[columns.stateBlow]) : null,
      levels: stateBlowLevels,
    },
    classInfo:
      classMask === null
        ? resolveClassInfo(mainId)
        : resolveClassInfoFromMask(classMask, mainId),
    addons,
    specAddons,
  };
}

export async function buildSkills(
  csvPath = INPUT,
  outputPath = OUTPUT,
  columnMap = SKILL_COLUMN_MAP,
  stringsPath = STRINGS_PATH,
) {
  const skills = [];
  let columns = null;
  let headerMeta = null;
  let lineNumber = 1;

  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath, { encoding: ENCODING })
      .pipe(csv())
      .on("headers", (headers) => {
        try {
          columns = resolveColumns(headers, columnMap);
          headerMeta = detectHeaderMeta(headers);
        } catch (err) {
          reject(err);
        }
      })
      .on("data", (row) => {
        lineNumber += 1;
        try {
          const parsed = parseSkillRow(row, columns, headerMeta, lineNumber);
          if (parsed) skills.push(parsed);
        } catch (err) {
          reject(err);
        }
      })
      .on("end", resolve)
      .on("error", reject);
  });

  if (!columns) {
    throw new Error("[build-skills] CSV is empty or missing headers.");
  }

  let stringsMap = {};
  if (stringsPath && fs.existsSync(stringsPath)) {
    try {
      stringsMap = JSON.parse(fs.readFileSync(stringsPath, "utf8"));
    } catch {
      stringsMap = {};
    }
  }

  const merged = skills.map((skill) => {
    const mapped = stringsMap[skill.skillId];
    if (!mapped) return skill;

    return {
      ...skill,
      name: mapped.name || skill.name,
      description: mapped.description || null,
    };
  });

  merged.sort((a, b) => a.mainId - b.mainId || a.subId - b.subId);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(merged, null, 2));

  return { skillCount: merged.length };
}

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  buildSkills().then(({ skillCount }) => {
    console.log(`Built ${skillCount} skills`);
  });
}
