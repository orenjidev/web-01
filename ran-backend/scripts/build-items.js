import fs from "fs";
import path from "path";
import readline from "readline";

/* ======================================================
   CONFIG
====================================================== */

const INPUT = path.resolve("data/items/Item.csv");
const OUTPUT = path.resolve("generated/items.web.json");
const ENCODING = "latin1";

const ADDON_SIZE = 5;
const ITEM_SIZE = 30; // ✅ MATCHES SERVER (SBOX)

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

const get = (row, map, key, def = 0) => {
  const k = normalizeHeader(key);
  return map[k] !== undefined ? row[map[k]] : def;
};

const normalizeHeader = (h) => h.replace(/\s+/g, " ").trim();

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
   ITEM DRUG MAP
====================================================== */

const ITEM_DRUG_LABELS = [
  "None",
  "HP Recovery",
  "MP Recovery",
  "SP Recovery",
  "HP+MP Recovery",
  "HP+SP Recovery",
  "HP+MP+SP Recovery",
  "Abnormal Condition Cure",
  "Return to Campus",
  "Recall StartPoint Position",
  "Recall BackPoint Position",
  "Revive",
  "HP Recovery+Abnormal Condition Cure",
  "HP+MP+SP Recovery+Abnormal Condition Cure",
  "Teleport to Special Map",
  "Get Combat Point",
  "Stage Pass",
  "Instance Dungeon Reload Card",
  "Attribute Recovery",
  "Costume Blessed Paper",
  "Debuff Effect",
  "Terminate Paper",
  "EXP Compressor (10 billion)",
  "EXP Compressor (100 billion)",
  "EXP Capsule (10 billion)",
  "EXP Capsule (100 billion)",
  "Temporary Enhancer",
  "Macro Duration Recharger",
  "Duration Extension",
];

const resolveDrug = (id) => ({
  id,
  label: ITEM_DRUG_LABELS[id] ?? "Unknown Drug",
});

/* ======================================================
   SUIT / ADDON / VAR / VOLUME / BLOW MAPS
====================================================== */

const SUIT_TYPE_MAP = [
  "HeadGear(Hats)",
  "UpperBody(Coat/Jacket)",
  "LowerBody(Pant/Skirt)",
  "Hand(Gloves)",
  "Foot(Shoes)",
  "Handheld(Weapon)",
  "Necklace",
  "Bracelet",
  "Ring",
  "Pet A",
  "Pet B",
  "Vehicle",
  "Vehicle Skin",
  "Vehicle Parts A",
  "Vehicle Parts B",
  "Vehicle Parts C",
  "Vehicle Parts D",
  "Vehicle Parts E",
  "Vehicle Parts F",
  "Belt",
  "Earring",
  "Accessory",
  "Ornament",
  "Rune",
  "Artifact",
  "Jewel",
];

const ADDON_TYPE_MAP = [
  "None",
  "Hit Rate",
  "Avoid Rate",
  "Attack",
  "Defense",
  "Maximum HP",
  "Maximum MP",
  "Maximum SP",
  "Stats POW",
  "Stats STR",
  "Stats SPI",
  "Stats DEX",
  "Stats INT",
  "Stats STM",
  "Melee",
  "Missile",
  "Energy",
];

const VAR_LABEL_MAP = [
  "None",
  "HP Recover %",
  "MP Recover %",
  "SP Recover %",
  "HP+MP+SP Recover %",
  "Move Speed %",
  "Attack Speed %",
  "Critical Rate %",
  "Crushing Blow %",
  "Boss Damage Reduction",
  "Boss Fixed Damage",
  "Crit vs Mob Emergency",
  "Crit vs Boss Emergency",
  "Emergency Damage Reduction",
  "EXP Gain %",
  "Money Drop %",
  "Melee Damage Reduction %",
  "Ranged Damage Reduction %",
  "Magic Damage Reduction %",
  "HP Solo",
  "HP Party",
  "Atk Speed Solo",
  "Atk Speed Party",
];

const VAR_SCALE = [
  1, 100, 100, 100, 100, 100, 100, 100, 100, 100, 1, 100, 100, 1, 100, 100, 100,
  100, 100, 1, 1, 100, 100,
];

const BLOW_TYPE_MAP = [
  "None",
  "Numb",
  "Stun",
  "Stone",
  "Burn",
  "Frozen",
  "Mad",
  "Poison",
  "Curse",
];

/* ======================================================
   RESOLVERS
====================================================== */

const resolveSuitType = (id) => ({
  id,
  label: SUIT_TYPE_MAP[id] ?? "Unknown Suit",
});

const resolveAddon = (id, value) => ({
  type: { id, label: ADDON_TYPE_MAP[id] ?? "Unknown Addon" },
  value,
});

const resolveVar = (id, raw) => {
  const scale = VAR_SCALE[id] ?? 1;
  return {
    type: {
      id,
      label: VAR_LABEL_MAP[id] ?? "Unknown Var",
      unit: scale === 100 ? "%" : "value",
    },
    value: scale === 100 ? raw * scale : raw,
  };
};

const resolveVolume = resolveVar;

const resolveBlow = (id, rate, life, v1, v2) => ({
  type: { id, label: BLOW_TYPE_MAP[id] ?? "Unknown Status" },
  chance: rate,
  duration: life,
  params: { value1: v1, value2: v2 },
});

/* ======================================================
   PARSERS
====================================================== */

function parseItem(row, map) {
  const main = toInt(get(row, map, "sNativeID wMainID"));
  const sub = toInt(get(row, map, "sNativeID wSubID"));

  return {
    itemId: `${main}-${sub}`,
    name: get(row, map, "strName"),
    level: toInt(get(row, map, "emLevel")),
    type: resolveItemType(toInt(get(row, map, "emItemType"))),

    grade: {
      attack: toInt(get(row, map, "wGradeAttack")),
      defense: toInt(get(row, map, "wGradeDefense")),
    },

    price: {
      buy: toInt(get(row, map, "llBuyPrice")),
      sell: toInt(get(row, map, "llSellPrice")),
      tradeRP: toInt(get(row, map, "nRPTrade")),
    },

    flags: decodeItemFlags(toInt(get(row, map, "dwFlags"))),
    inventoryFile: get(row, map, "strInventoryFile"),
    sIconMainID: get(row, map, "sICONID wMainID"),
    sIconSubID: get(row, map, "sICONID wSubID"),
    searchable: toBool(get(row, map, "bSearch")),
  };
}

function parseSuit(row, map) {
  const suitId = toInt(get(row, map, "emSuit"));
  if (!suitId) return null;

  const addons = [];
  for (let i = 0; i < ADDON_SIZE; i++) {
    const t = toInt(get(row, map, `sADDON ${i} emTYPE`));
    const v = toInt(get(row, map, `sADDON ${i} nVALUE`));
    if (t) addons.push(resolveAddon(t, v));
  }

  const varId = toInt(get(row, map, "sVARIATE emTYPE"));
  const volId = toInt(get(row, map, "sVOLUME emTYPE"));
  const blowId = toInt(get(row, map, "sBLOW emTYPE"));

  return {
    suitType: resolveSuitType(suitId),
    addons,

    variate: varId
      ? resolveVar(varId, toFloat(get(row, map, "sVARIATE fVariate")))
      : undefined,
    volume: volId
      ? resolveVolume(volId, toFloat(get(row, map, "sVOLUME fVolume")))
      : undefined,

    blow: blowId
      ? resolveBlow(
          blowId,
          toFloat(get(row, map, "sBLOW fRATE")),
          toFloat(get(row, map, "sBLOW fLIFE")),
          toFloat(get(row, map, "sBLOW fVAR1")),
          toFloat(get(row, map, "sBLOW fVAR2")),
        )
      : undefined,

    changeColor: toBool(get(row, map, "bChangeColor")),
  };
}

function parseDrug(row, map) {
  const drugId = toInt(get(row, map, "emDrug"));
  if (!drugId) return null;

  return {
    type: resolveDrug(drugId),
    timeLimit: toInt(get(row, map, "tTIME_LMT")),
    pileNum: toInt(get(row, map, "wPileNum")),
    duration: toInt(get(row, map, "tDuration")),
  };
}

function parseBox(row, map) {
  const items = [];

  for (let i = 0; i < ITEM_SIZE; i++) {
    const main = toInt(get(row, map, `sITEMS ${i} nidITEM wMainID`));
    const sub = toInt(get(row, map, `sITEMS ${i} nidITEM wSubID`));
    const amount = toInt(get(row, map, `sITEMS ${i} dwAMOUNT`));

    if (!main && !sub) continue;

    items.push({
      itemId: `${main}-${sub}`,
      amount,
    });
  }

  if (!items.length) return null;

  return {
    showContents: toBool(get(row, map, "Show Contents")),
    items,
  };
}

/* ======================================================
   BUILD
====================================================== */

async function buildItems() {
  const items = [];
  let headerMap = null;

  const rl = readline.createInterface({
    input: fs.createReadStream(INPUT, { encoding: ENCODING }),
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

      continue;
    }

    const item = parseItem(cols, headerMap);

    const suit = parseSuit(cols, headerMap);
    if (suit) item.suit = suit;

    const drug = parseDrug(cols, headerMap);
    if (drug) item.drug = drug;

    const box = parseBox(cols, headerMap);
    if (box) item.box = box;

    items.push(item);
  }

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(items, null, 2));
  console.log(`✔ Built ${items.length} items`);
}

buildItems();
