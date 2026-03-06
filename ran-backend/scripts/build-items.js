import fs from "fs";
import path from "path";
import readline from "readline";

/* ======================================================
   CONFIG
====================================================== */

const INPUT = path.resolve("data/items/Item.csv");
const OUTPUT = path.resolve("generated/items.web.json");
const ENCODING = "latin1";

const ITEM_SIZE = 30;
const BOX_SIZE = 30;

/* ======================================================
   HELPERS
====================================================== */

const toInt = (v) => {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
};

const toFloat = (v) => {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
};

const toBool = (v) => v === "1" || v === 1 || v === true;

const normalizeHeader = (h) => h.replace(/\s+/g, " ").trim();

/** Returns raw cell value or undefined if column is missing from CSV */
const get = (row, map, key) => {
  const k = normalizeHeader(key);
  return map[k] !== undefined ? row[map[k]] : undefined;
};

/** Check whether a header (or any of its aliases) exists in the CSV */
const has = (map, ...keys) => keys.some((k) => normalizeHeader(k) in map);

const getStr = (row, map, key) => {
  const v = get(row, map, key);
  if (v === undefined) return "";
  return typeof v === "string" ? v.trim() : String(v).trim();
};

/* ======================================================
   ITEM TYPE MAP
====================================================== */

const ITEM_TYPE_MAP = [
  "Wearable Item",
  "Arrow",
  "Potion",
  "Skill Scroll",
  "Position Recall Card",
  "Quest Item",
  "Refines",
  "Talisman",
  "Bus Ticket",
  "SkillPoint Reset",
  "StatPoint Reset",
  "SkillStatPoint Reset",
  "ItemBox",
  "Remove Costume ( Delete )",
  "Megaphone",
  "Firecrackers",
  "Character Slot Card",
  "Inventory LineAdd(BackPack)",
  "Locker Rental",
  "Locker Remote",
  "Item Box (Premium)",
  "Personal Store Permit",
  "RandomBox",
  "Remove Costume (Separate)",
  "Character Hair Style",
  "Character Face Style",
  "Question Item",
  "Authentication CD",
  "Character Teleport Card",
  "Club Call (Not Used)",
  "Hair Shop (Not Used)",
  "Character Rename Card",
  "Character Hair Style Card",
  "Character Hair Color Card",
  "Revive Necklace",
  "Pet Card",
  "Pet Food",
  "Pet Rename Card",
  "Pet Color Card",
  "Pet Style Card",
  "Pet Skill Scroll",
  "SMS Send Card",
  "Pet Revive",
  "Item Protection Necklace",
  "Item Remodel",
  "Vehicle",
  "Vehicle Battery-Oil",
  "ItemCard",
  "ExpCard",
  "Character Change Gender Card",
  "Garbage Card",
  "Map Teleport Card",
  "Pet Skin Pack",
  "Character Face Style Card",
  "Taxi Ticket",
  "Material Item",
  "NPC Call Card",
  "Neutron Bullets",
  "Lunch Box",
  "Pet Dual Skill",
  "Strengthen Beads",
  "Relaxant Beads",
  "Bike Color Change Card",
  "Bike Boost Card",
  "Oblivion Potion(New)",
  "Costume Color Change Card",
  "Post Card(Mail)",
  "Point Card(Refundable)",
  "Point Card(No Refundable)",
  "Item Mix Scroll",
  "Reset Compounding",
  "Personal Store Searching Card",
  "Repair tools link card",
  "Sealed Card",
  "Stage Pass",
  "Instant Dungeon Reload Card",
  "Game Card Link Card",
  "Ran Game Money",
  "Expansion Card",
  "Mystery Box",
  "Key",
  "Wrapper",
  "Wrapper Box",
  "Campus Change Card (SG)",
  "Campus Change Card (MP)",
  "Campus Change Card (PH)",
  "Country Change Card",
  "Costume Blessed Paper",
  "Debuff Potion",
  "Terminate Paper",
  "EXP Card",
  "Choice Box",
  "EXP Compress",
  "EXP Capsule",
  "Temporary Enhancer",
  "Extend Duration",
  "Ran In the Pocket Char Link Ticket",
  "Ran In the Pocket Gems",
  "Shaper's Disguise Costume",
  "Club Name Change Card",
  "Item Skill Change Card",
  "Item Basic Stats Change Card",
  "Item Additional Stats Change Card",
  "Character Slot Expansion Card",
  "Sorcerer Gem",
  "Endurance Supplement",
  "Endurance Expansion",
  "PET Adoption Card",
  "Adopted PET",
  "PET [Prev]",
  "Clothing Inven expansion Card",
  "Mount Inventory Expansion Card",
  "Pet Inven expansion Card",
  "Special Class Wine",
  "RebornCard(A)",
  "RebornCard(B)",
  "Emotes Effect",
  "BattlePass Reset",
  "BattlePass LevelUp",
  "BattlePass Premium",
  "NonDrop Card",
  "RandomOption Card",
  "Grinding Protection",
  "Item Dismantle",
  "Codex Entry Reset",
  "VIP Card",
  "Game Point Card",
  "Buff Card",
  "Personal Lock Enable",
  "Personal Lock Reset",
  "Personal Lock Change Pin",
  "Personal Lock Recover Pin",
];

const resolveItemType = (id) => ({
  id,
  label: ITEM_TYPE_MAP[id] ?? "Unknown Item Type",
});

/* ======================================================
   ITEM FLAGS
====================================================== */

function decodeItemFlags(dwFlags) {
  return {
    canSellToNPC: (dwFlags & 0x01) !== 0,
    canTrade: (dwFlags & 0x02) !== 0,
    canDrop: (dwFlags & 0x04) !== 0,
    isEventItem: (dwFlags & 0x08) !== 0,
    isCostume: (dwFlags & 0x10) !== 0,
    isTimeLimited: (dwFlags & 0x20) !== 0,
    canWrap: (dwFlags & 0x200) !== 0,
    canDismantle: (dwFlags & 0x400) !== 0,
    restricted: (dwFlags & 0x100) !== 0,
    canSendPost: (dwFlags & 0x1600) !== 0,
  };
}

/* ======================================================
   DYNAMIC PARSER — adapts to whatever columns the CSV has
====================================================== */

/**
 * Detects which column groups exist in the header and returns
 * a set of feature flags so parseRow only extracts what's present.
 */
function detectFeatures(map) {
  return {
    hasId: has(map, "sNativeID wMainID"),
    hasName: has(map, "strName"),
    hasLevel: has(map, "emLevel"),
    hasType: has(map, "emItemType", "emType"),
    hasGrade: has(map, "wGradeAttack") || has(map, "wGradeDefense"),
    hasIcon: has(map, "sICONID wMainID"),
    hasEffects:
      has(map, "strSelfBodyEffect") ||
      has(map, "strTargBodyEffect") ||
      has(map, "strTargetEffect") ||
      has(map, "strGeneralEffect"),
    hasFiles: has(map, "strFieldFile") || has(map, "strInventoryFile"),
    hasArrInv: has(map, "strArrInventoryFile 0"),
    hasWearing: has(map, "strWearingFile 0"),
    hasWearingEx: has(map, "strWearingFileEx 0"),
    hasBox: has(map, "sITEMS 0 nidITEM wMainID"),
    hasRandomBox: has(map, "vecBOX 0 nidITEM wMainID"),
    hasFlags: has(map, "dwFlags"),
    hasShowContents: has(map, "Show Contents"),
  };
}

function parseRow(row, map, feat) {
  const main = feat.hasId ? toInt(get(row, map, "sNativeID wMainID")) : 0;
  const sub = feat.hasId ? toInt(get(row, map, "sNativeID wSubID")) : 0;

  const item = { itemId: `${main}-${sub}` };

  if (feat.hasName) item.name = getStr(row, map, "strName");
  if (feat.hasLevel) item.level = toInt(get(row, map, "emLevel"));
  if (feat.hasFlags) item.flags = decodeItemFlags(toInt(get(row, map, "dwFlags")));

  if (feat.hasType) {
    const raw = get(row, map, "emItemType") ?? get(row, map, "emType");
    item.type = resolveItemType(toInt(raw));
  }

  if (feat.hasGrade) {
    item.grade = {
      attack: toInt(get(row, map, "wGradeAttack")),
      defense: toInt(get(row, map, "wGradeDefense")),
    };
  }

  if (feat.hasIcon) {
    item.icon = {
      main: toInt(get(row, map, "sICONID wMainID")),
      sub: toInt(get(row, map, "sICONID wSubID")),
    };
  }

  if (feat.hasEffects) {
    item.effects = {
      selfBody: getStr(row, map, "strSelfBodyEffect"),
      targBody: getStr(row, map, "strTargBodyEffect"),
      target: getStr(row, map, "strTargetEffect"),
      general: getStr(row, map, "strGeneralEffect"),
    };
  }

  if (feat.hasFiles) {
    item.files = {
      field: getStr(row, map, "strFieldFile"),
      inventory: getStr(row, map, "strInventoryFile"),
    };
  }

  if (feat.hasArrInv) {
    const arr = [];
    for (let i = 0; i < 20; i++) {
      const v = getStr(row, map, `strArrInventoryFile ${i}`);
      if (v) arr.push({ index: i, file: v });
    }
    if (arr.length) item.arrInventoryFiles = arr;
  }

  if (feat.hasWearing) {
    const arr = [];
    for (let i = 0; i < 20; i++) {
      const v = getStr(row, map, `strWearingFile ${i}`);
      if (v) arr.push({ index: i, file: v });
    }
    if (arr.length) item.wearingFiles = arr;
  }

  if (feat.hasWearingEx) {
    const arr = [];
    for (let i = 0; i < 20; i++) {
      const v = getStr(row, map, `strWearingFileEx ${i}`);
      if (v) arr.push({ index: i, file: v });
    }
    if (arr.length) item.wearingFilesEx = arr;
  }

  if (feat.hasBox) {
    const boxItems = [];
    for (let i = 0; i < ITEM_SIZE; i++) {
      const m = toInt(get(row, map, `sITEMS ${i} nidITEM wMainID`));
      const s = toInt(get(row, map, `sITEMS ${i} nidITEM wSubID`));
      const amount = toInt(get(row, map, `sITEMS ${i} dwAMOUNT`));
      if (!m && !s) continue;
      boxItems.push({ itemId: `${m}-${s}`, amount });
    }
    if (boxItems.length) {
      item.box = {
        showContents: feat.hasShowContents ? toBool(get(row, map, "Show Contents")) : false,
        items: boxItems,
      };
    }
  }

  if (feat.hasRandomBox) {
    const rbox = [];
    for (let i = 0; i < BOX_SIZE; i++) {
      const m = toInt(get(row, map, `vecBOX ${i} nidITEM wMainID`));
      const s = toInt(get(row, map, `vecBOX ${i} nidITEM wSubID`));
      const rate = toFloat(get(row, map, `vecBOX ${i} fRATE`));
      if (!m && !s) continue;
      rbox.push({ itemId: `${m}-${s}`, rate });
    }
    if (rbox.length) item.randomBox = rbox;
  }

  return item;
}

/* ======================================================
   BUILD
====================================================== */

export async function buildItems(csvPath = INPUT, outputPath = OUTPUT) {
  const items = [];
  let headerMap = null;
  let feat = null;

  const rl = readline.createInterface({
    input: fs.createReadStream(csvPath, { encoding: ENCODING }),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!line.trim()) continue;
    const cols = line.split(",");

    if (!headerMap) {
      headerMap = {};
      cols.forEach((h, i) => {
        headerMap[normalizeHeader(h)] = i;
      });
      feat = detectFeatures(headerMap);
      console.log(`[build-items] Detected features:`, feat);
      continue;
    }

    items.push(parseRow(cols, headerMap, feat));
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(items, null, 2));

  return { itemCount: items.length };
}

// CLI: run directly with `node scripts/build-items.js`
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  buildItems().then(({ itemCount }) => {
    console.log(`✔ Built ${itemCount} items`);
  });
}
