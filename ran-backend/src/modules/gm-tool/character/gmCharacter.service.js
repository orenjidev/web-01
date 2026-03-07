import sql from "mssql";
import { getGamePool } from "../../../loaders/mssql.js";
import { deserializeExpSkills } from "../../../utils/deserializeGameImage.js";
import { deserialize } from "./skillsBinary/index.js";
import { getItemById } from "../../../services/items.service.js";
import { baseServerConfig } from "../../../config/server.config.js";

const { itemStorage } = baseServerConfig.gameVersion;

/* =====================================================
   CHARACTER SEARCH
   Legacy:
   - ChaSearchName
   - ChaSearchChaNum
   - ChaSearchUserNum
===================================================== */

export const searchCharacters = async (query) => {
  const { type = "name", q = "", limit = 50 } = query;

  const pool = await getGamePool();
  const safeLimit = Math.min(Number(limit) || 50, 100);
  const req = pool.request();

  let sqlText;

  if (type === "chanum") {
    const chaNum = Number(q);
    if (!chaNum) return { ok: false, message: "INVALID_CHANUM" };

    req.input("ChaNum", sql.Int, chaNum);
    sqlText = `
      SELECT TOP 1
        UserNum, ChaNum, ChaName, ChaClass, ChaSchool, ChaLevel, ChaOnline, ChaDeleted
      FROM ChaInfo WITH (NOLOCK)
      WHERE ChaNum = @ChaNum
    `;
  } else if (type === "usernum") {
    const userNum = Number(q);
    if (!userNum) return { ok: false, message: "INVALID_USERNUM" };

    req.input("UserNum", sql.Int, userNum);
    sqlText = `
      SELECT
        UserNum, ChaNum, ChaName, ChaClass, ChaSchool, ChaLevel, ChaOnline, ChaDeleted
      FROM ChaInfo WITH (NOLOCK)
      WHERE UserNum = @UserNum
      ORDER BY ChaNum
    `;
  } else {
    // name search: filter by q if provided, otherwise return all
    if (q) {
      req.input("Q", sql.NVarChar(50), `%${q}%`);
    }
    sqlText = `
      SELECT TOP (${safeLimit})
        UserNum, ChaNum, ChaName, ChaClass, ChaSchool, ChaLevel, ChaOnline, ChaDeleted
      FROM ChaInfo WITH (NOLOCK)
      ${q ? "WHERE ChaName LIKE @Q" : ""}
      ORDER BY ChaNum DESC
    `;
  }

  const result = await req.query(sqlText);

  return { ok: true, rows: result.recordset };
};

/* =====================================================
   INVENTORY TYPE CONSTANTS
===================================================== */
const INVEN_INVEN = 2; // regular inventory
const INVEN_PUTON = 1; // equipped items

/* =====================================================
   CHARACTER DETAIL — CHARINFO Container
   Legacy:
   - GetCharInfo
     - GetCharacterInfoBase
     - GetCharacterInfoCurrency
     - GetCharacterInfoBattleStat
     - GetCharacterInfoPKCombo
     - Skills, PutOn, Inventory
===================================================== */

/* ---------- helper: Currency ---------- */
const fetchCurrency = async (pool, chaNum) => {
  const result = await pool
    .request()
    .input("ChaNum", sql.Int, chaNum)
    .execute("dbo.ChaInfoCurrencySelect");
  return result.recordset[0] ?? null;
};

/* ---------- helper: Battle Stats ---------- */
const fetchBattleStats = async (pool, chaNum) => {
  const result = await pool
    .request()
    .input("ChaNum", sql.Int, chaNum)
    .execute("dbo.sp_ChaBattleStatSelect");
  return result.recordset[0] ?? null;
};

/* ---------- helper: PK Combo ---------- */
const fetchPKCombo = async (pool, chaNum) => {
  const result = await pool
    .request()
    .input("ChaNum", sql.Int, chaNum)
    .execute("dbo.sp_ChaPKComboSelect");
  const row = result.recordset[0];
  if (!row) return null;
  return {
    counts: [
      row.PKCombo00,
      row.PKCombo01,
      row.PKCombo02,
      row.PKCombo03,
      row.PKCombo04,
      row.PKCombo05,
      row.PKCombo06,
      row.PKCombo07,
    ],
  };
};

/* ---------- helper: resolve Promise.allSettled value ---------- */
const settled = (r) => (r.status === "fulfilled" ? r.value : null);

export const getCharacterDetail = async (chaNum) => {
  const pool = await getGamePool();

  // Step 1: Base info (required — if missing, character doesn't exist)
  const baseResult = await pool.request().input("ChaNum", sql.Int, chaNum)
    .query(`
      SELECT
        UserNum, ChaName, ChaTribe, ChaClass, ChaBright, ChaLevel,
        ChaDex, ChaIntel, ChaStrong, ChaPower, ChaSpirit, ChaStrength, ChaStRemain,
        ChaAttackP, ChaDefenseP, ChaFightA, ChaShootA, ChaSkillPoint,
        ChaHP, ChaMP, ChaSP, ChaPK,
        ChaStartMap, ChaStartGate, ChaPosX, ChaPosY, ChaPosZ,
        ChaMoney, ChaExp, ChaSaveMap, ChaSavePosX, ChaSavePosY, ChaSavePosZ,
        ChaSchool, ChaHair, ChaFace, ChaLiving, ChaInvenLine, ChaReturnMap,
        ChaReturnPosX, ChaReturnPosY, ChaReturnPosZ, GuNum, ChaGuName,
        ChaSex, ChaHairColor, ChaReExp, ChaSafeTime, ChaCP, ChaMacroT,
        ChaReborn, ChaTalentPoint1, ChaTalentPoint2, ChaTalentPoint3, ChaOutfitStatus,
        ChaOnline, ChaDeleted, SGNum
      FROM ChaInfo WITH (NOLOCK)
      WHERE ChaNum = @ChaNum
    `);

  if (baseResult.recordset.length === 0) {
    return { ok: false };
  }

  const base = baseResult.recordset[0];

  // Step 2: Fetch everything else in parallel (all optional — null on failure)
  const results = await Promise.allSettled([
    fetchCurrency(pool, chaNum),
    fetchBattleStats(pool, chaNum),
    fetchPKCombo(pool, chaNum),
    getCharacterSkills(chaNum),
    getCharacterPutOnItems(chaNum),
    getCharacterItems(chaNum, INVEN_INVEN),
  ]);

  return {
    ok: true,
    character: {
      base,
      currency: settled(results[0]),
      battleStats: settled(results[1]),
      pkCombo: settled(results[2]),
      skills: settled(results[3]),
      putOnItems: settled(results[4]),
      inventory: settled(results[5]),
    },
  };
};

/* =====================================================
   CHARACTER EDIT
   Legacy:
   - SaveCharInfoBase
   - SaveCharInfoEtc
===================================================== */

// Allowed editable fields mapped to their DB column, sql type, and numeric bounds
const EDITABLE_FIELDS = {
  level: { col: "ChaLevel", type: () => sql.SmallInt, min: 1, max: 999 },
  money: { col: "ChaMoney", type: () => sql.BigInt, min: 0 },
  hp: { col: "ChaHP", type: () => sql.Int, min: 0 },
  mp: { col: "ChaMP", type: () => sql.Int, min: 0 },
  sp: { col: "ChaSP", type: () => sql.Int, min: 0 },
  cp: { col: "ChaCP", type: () => sql.Int, min: 0 },
  skillPoint: { col: "ChaSkillPoint", type: () => sql.Int, min: 0 },
  statsRemain: { col: "ChaStRemain", type: () => sql.SmallInt, min: 0 },
  pow: { col: "ChaPower", type: () => sql.SmallInt, min: 0, max: 9999 },
  dex: { col: "ChaDex", type: () => sql.SmallInt, min: 0, max: 9999 },
  str: { col: "ChaStrong", type: () => sql.SmallInt, min: 0, max: 9999 },
  spi: { col: "ChaSpirit", type: () => sql.SmallInt, min: 0, max: 9999 },
  sta: { col: "ChaStrength", type: () => sql.SmallInt, min: 0, max: 9999 },
  intel: { col: "ChaIntel", type: () => sql.SmallInt, min: 0, max: 9999 },
  class: { col: "ChaClass", type: () => sql.Int, min: 0, max: 524288 },
  school: { col: "ChaSchool", type: () => sql.SmallInt, min: 0, max: 9 },
  hair: { col: "ChaHair", type: () => sql.SmallInt, min: 0 },
  face: { col: "ChaFace", type: () => sql.SmallInt, min: 0 },
  hairColor: { col: "ChaHairColor", type: () => sql.Int, min: 0 },
  sex: { col: "ChaSex", type: () => sql.SmallInt, min: 0, max: 1 },
  living: { col: "ChaLiving", type: () => sql.Int, min: 0 },
  isOnline: { col: "ChaOnline", type: () => sql.Bit, min: 0, max: 1 },
  isDeleted: { col: "ChaDeleted", type: () => sql.Bit, min: 0, max: 1 },
};

export const updateCharacter = async (chaNum, body, ctx = {}) => {
  const setClauses = [];
  const pool = await getGamePool();
  const req = pool.request();

  req.input("ChaNum", sql.Int, chaNum);

  for (const [key, def] of Object.entries(EDITABLE_FIELDS)) {
    if (!(key in body)) continue;

    const val = Number(body[key]);
    if (isNaN(val)) return { ok: false, message: `INVALID_VALUE: ${key}` };
    if (def.min !== undefined && val < def.min)
      return { ok: false, message: `OUT_OF_RANGE: ${key}` };
    if (def.max !== undefined && val > def.max)
      return { ok: false, message: `OUT_OF_RANGE: ${key}` };

    req.input(key, def.type(), val);
    setClauses.push(`${def.col} = @${key}`);
  }

  if (setClauses.length === 0) {
    return { ok: false, message: "NO_FIELDS_PROVIDED" };
  }

  await req.query(`
    UPDATE ChaInfo
    SET ${setClauses.join(", ")}
    WHERE ChaNum = @ChaNum
  `);

  return { ok: true };
};

export async function getCharacterSkills(chaNum) {
  const pool = await getGamePool();

  const result = await pool
    .request()
    .input("ChaNum", sql.Int, chaNum)
    .execute("dbo.ChaInfoChaSkillsSelect");

  if (!result.recordset.length) {
    return null;
  }

  const buffer = result.recordset[0].ChaSkills;

  if (!buffer) {
    return null;
  }

  const data = deserialize(buffer);

  data.skills.sort((a, b) => a.mainId - b.mainId || a.subId - b.subId);

  return data;
}

export async function saveCharacterSkills(chaNum, version, skills) {
  const pool = await getGamePool();

  const buffer = serialize(version, skills);

  await pool
    .request()
    .input("ChaNum", sql.Int, chaNum)
    .input("ChaSkills", sql.VarBinary(sql.MAX), buffer)
    .execute("dbo.ChaInfoUpdateChaSkills");

  return { ok: true };
}

/* =====================================================
   SHARED ITEM ROW MAPPER
===================================================== */
function mapItemRow(row) {
  const mainId = row.ItemMID;
  const subId = row.ItemSID;
  const itemMeta = getItemById(`${mainId}-${subId}`);

  return {
    guid: row.ItemUUID,

    slot: row.ItemPosX,
    posY: row.ItemPosY,

    nativeId: { mainId, subId },
    itemName: itemMeta?.name ?? null,

    makeType: row.ItemMakeType,

    disguise: {
      mainId: row.ItemCostumeMID,
      subId: row.ItemCostumeSID,
    },

    remain: row.ItemRemain,

    createDate: row.ItemCreateDate ?? null,
    costumeExpireDate: row.ItemCostumeExpireDate ?? null,
    basicPeriodExTime: row.ItemBasicPeriodExTime ?? null,
    disguisePeriodExTime: row.ItemDisguisePeriodExTime ?? null,
    basicPeriodExCount: row.ItemBasicPeriodExCount,
    disguisePeriodExCount: row.ItemDisuisePeriodExCount,

    costumeStatEndDate: row.CostumeStatEndDate ?? null,

    durability: row.ItemDurability,
    durabilityCount: row.ItemDurabilityCount,
    ranPointTradeCount: row.PointTradeCount,

    grade: {
      damage: row.ItemAttack,
      defense: row.ItemDefense,
      resistFire: row.ItemResistFire,
      resistIce: row.ItemResistIce,
      resistElec: row.ItemResistElec,
      resistPoison: row.ItemResistPoison,
      resistSpirit: row.ItemResistSpirit,
    },

    randomOptions: [
      { type: row.ItemRandomType1, value: row.ItemRandomValue1 },
      { type: row.ItemRandomType2, value: row.ItemRandomValue2 },
      { type: row.ItemRandomType3, value: row.ItemRandomValue3 },
      { type: row.ItemRandomType4, value: row.ItemRandomValue4 },
      { type: row.ItemRandomType5, value: row.ItemRandomValue5 },
    ],

    petDbNum: row.ItemPetNum,
    vehicleDbNum: row.ItemVehicleNum,

    mainColor: row.ItemMainColor,
    subColor: row.ItemSubColor,

    costumeUser: {
      invest: [
        { type: row.CostumeStatType1, value: row.CostumeInvestPoint1 },
        { type: row.CostumeStatType2, value: row.CostumeInvestPoint2 },
        { type: row.CostumeStatType3, value: row.CostumeInvestPoint3 },
        { type: row.CostumeStatType4, value: row.CostumeInvestPoint4 },
        { type: row.CostumeStatType5, value: row.CostumeInvestPoint5 },
        { type: row.CostumeStatType6, value: row.CostumeInvestPoint6 },
        { type: row.CostumeStatType7, value: row.CostumeInvestPoint7 },
      ],
      endTime: row.CostumeStatEndDate ?? null,
    },

    tlGrind: {
      gradeValue: row.TempGrindValue,
      fireDate: row.TempGrindFireDate ?? null,
    },

    lockBox: row.LockBox === 1,

    basicStat: {
      attackDamage: row.BasicAttackDamage,
      defence: row.BasicDefence,
    },

    linkSkill: {
      mainId: row.ItemLinkSkillMID,
      subId: row.ItemLinkSkillSID,
      level: row.ItemLinkSkillLevel,
      target: row.ItemLinkSkillTarget,
      occurRate: row.ItemLinkSkillOccurRate,
    },

    addons: [
      { type: row.ItemAddonType1, value: row.ItemAddonValue1 },
      { type: row.ItemAddonType2, value: row.ItemAddonValue2 },
      { type: row.ItemAddonType3, value: row.ItemAddonValue3 },
      { type: row.ItemAddonType4, value: row.ItemAddonValue4 },
      { type: row.ItemAddonType5, value: row.ItemAddonValue5 },
      { type: row.ItemAddonType6, value: row.ItemAddonValue6 },
    ],

    gems: {
      count: row.GemSlotCount,
      stones: [
        { mainId: row.GemStoneMID0, subId: row.GemStoneSID0 },
        { mainId: row.GemStoneMID1, subId: row.GemStoneSID1 },
        { mainId: row.GemStoneMID2, subId: row.GemStoneSID2 },
      ],
    },
  };
}

/* =====================================================
   GET ITEMS (shared for puton + inventory)
   Version switch:
     "new"    → table-based via sp_ItemGetItemList
     "legacy" → binary blob (ChaPutOnItems / ChaInvenItems)
               TODO: implement legacy blob deserializer
===================================================== */
async function getCharacterItems(chaNum, invenType) {
  if (itemStorage === "legacy") {
    return getCharacterItemsLegacy(chaNum, invenType);
  }

  const pool = await getGamePool();

  const result = await pool
    .request()
    .input("ChaNum", sql.Int, chaNum)
    .input("InvenType", sql.TinyInt, invenType)
    .execute("dbo.sp_ItemGetItemList");

  return result.recordset.map(mapItemRow);
}

/* ---------- legacy: blob-based item loading ---------- */
async function getCharacterItemsLegacy(chaNum, invenType) {
  // TODO: implement when ready
  // 1. Query the blob column (ChaPutOnItems / ChaInvenItems) from ChaInfo
  // 2. Deserialize the binary data (version-based, like skillsBinary)
  // 3. Map to the same item shape as mapItemRow
  return [];
}

/* =====================================================
   GET PUTON ITEMS (public — used by standalone endpoint)
===================================================== */
export async function getCharacterPutOnItems(chaNum) {
  return getCharacterItems(chaNum, INVEN_PUTON);
}

/* =====================================================
   UPDATE PUTON ITEM
   Only updates allowed editable fields
===================================================== */

export async function saveCharacterPutOnItems(chaNum, items) {
  const pool = await getGamePool();

  for (const item of items) {
    const state = item.dbState;
    const guid = item.guid?.toUpperCase();

    if (!guid && state !== "insert") {
      return { success: false, error: "Invalid GUID" };
    }

    /* =====================================================
       INSERT
    ===================================================== */
    if (state === "insert") {
      const result = await pool
        .request()
        .input("ItemUUID", sql.UniqueIdentifier, guid)
        .input("ChaNum", sql.Int, chaNum)
        .input("InvenType", sql.TinyInt, INVEN_PUTON)

        .input("ItemMID", sql.SmallInt, item.nativeId.mainId)
        .input("ItemSID", sql.SmallInt, item.nativeId.subId)
        .input("ItemMakeType", sql.TinyInt, item.makeType)

        .input("ItemCostumeMID", sql.SmallInt, item.disguise.mainId)
        .input("ItemCostumeSID", sql.SmallInt, item.disguise.subId)

        .input("ItemPosX", sql.TinyInt, item.slot)
        .input("ItemPosY", sql.TinyInt, item.posY)

        .input("ItemRemain", sql.SmallInt, item.remain)

        .input("ItemCreateDate", sql.SmallDateTime, new Date(item.createDate))
        .input(
          "ItemCostumeExpireDate",
          sql.SmallDateTime,
          new Date(item.costumeExpireDate),
        )

        .input("ItemDurability", sql.Int, item.durability)
        .input("ItemDurabilityCount", sql.Int, item.durabilityCount)
        .input("PointTradeCount", sql.Int, item.ranPointTradeCount)

        .input("ItemAttack", sql.TinyInt, item.grade.damage)
        .input("ItemDefense", sql.TinyInt, item.grade.defense)

        .input("ItemRandomType1", sql.TinyInt, item.randomOptions[0]?.type ?? 0)
        .input("ItemRandomValue1", sql.Int, item.randomOptions[0]?.value ?? 0)
        .input("ItemRandomType2", sql.TinyInt, item.randomOptions[1]?.type ?? 0)
        .input("ItemRandomValue2", sql.Int, item.randomOptions[1]?.value ?? 0)
        .input("ItemRandomType3", sql.TinyInt, item.randomOptions[2]?.type ?? 0)
        .input("ItemRandomValue3", sql.Int, item.randomOptions[2]?.value ?? 0)
        .input("ItemRandomType4", sql.TinyInt, item.randomOptions[3]?.type ?? 0)
        .input("ItemRandomValue4", sql.Int, item.randomOptions[3]?.value ?? 0)
        .input("ItemRandomType5", sql.TinyInt, item.randomOptions[4]?.type ?? 0)
        .input("ItemRandomValue5", sql.Int, item.randomOptions[4]?.value ?? 0)

        .output("Return", sql.Int)
        .execute("dbo.sp_ItemCreate");

      if ((result.output.Return ?? -1) !== 0) {
        return { success: false, error: "Insert failed" };
      }
    } else if (state === "update") {
      /* =====================================================
       UPDATE  (FULL STORED PROCEDURE PARITY)
    ===================================================== */
      const req = pool.request();

      req.input("ItemUUID", sql.UniqueIdentifier, guid);
      req.input("ChaNum", sql.Int, chaNum);
      req.input("InvenType", sql.TinyInt, INVEN_PUTON);

      req.input("ItemCostumeMID", sql.SmallInt, item.disguise.mainId);
      req.input("ItemCostumeSID", sql.SmallInt, item.disguise.subId);

      req.input("ItemPosX", sql.TinyInt, item.slot);
      req.input("ItemPosY", sql.TinyInt, item.posY);
      req.input("ItemRemain", sql.SmallInt, item.remain);

      req.input(
        "ItemCostumeExpireDate",
        sql.SmallDateTime,
        new Date(item.costumeExpireDate),
      );
      req.input(
        "ItemBasicPeriodExTime",
        sql.SmallDateTime,
        new Date(item.basicPeriodExTime),
      );
      req.input(
        "ItemDisguisePeriodExTime",
        sql.SmallDateTime,
        new Date(item.disguisePeriodExTime),
      );

      req.input("ItemBasicPeriodExCount", sql.TinyInt, item.basicPeriodExCount);
      req.input(
        "ItemDisuisePeriodExCount",
        sql.TinyInt,
        item.disguisePeriodExCount,
      );

      req.input("ItemDurability", sql.Int, item.durability);
      req.input("ItemDurabilityCount", sql.Int, item.durabilityCount);
      req.input("PointTradeCount", sql.Int, item.ranPointTradeCount);

      req.input("ItemAttack", sql.TinyInt, item.grade.damage);
      req.input("ItemDefense", sql.TinyInt, item.grade.defense);

      req.input(
        "ItemRandomType1",
        sql.TinyInt,
        item.randomOptions[0]?.type ?? 0,
      );
      req.input("ItemRandomValue1", sql.Int, item.randomOptions[0]?.value ?? 0);
      req.input(
        "ItemRandomType2",
        sql.TinyInt,
        item.randomOptions[1]?.type ?? 0,
      );
      req.input("ItemRandomValue2", sql.Int, item.randomOptions[1]?.value ?? 0);
      req.input(
        "ItemRandomType3",
        sql.TinyInt,
        item.randomOptions[2]?.type ?? 0,
      );
      req.input("ItemRandomValue3", sql.Int, item.randomOptions[2]?.value ?? 0);
      req.input(
        "ItemRandomType4",
        sql.TinyInt,
        item.randomOptions[3]?.type ?? 0,
      );
      req.input("ItemRandomValue4", sql.Int, item.randomOptions[3]?.value ?? 0);
      req.input(
        "ItemRandomType5",
        sql.TinyInt,
        item.randomOptions[4]?.type ?? 0,
      );
      req.input("ItemRandomValue5", sql.Int, item.randomOptions[4]?.value ?? 0);

      req.input("ItemResistFire", sql.TinyInt, item.grade.resistFire);
      req.input("ItemResistIce", sql.TinyInt, item.grade.resistIce);
      req.input("ItemResistElec", sql.TinyInt, item.grade.resistElec);
      req.input("ItemResistPoison", sql.TinyInt, item.grade.resistPoison);
      req.input("ItemResistSpirit", sql.TinyInt, item.grade.resistSpirit);

      req.input("ItemPetNum", sql.Int, item.petDbNum);
      req.input("ItemVehicleNum", sql.Int, item.vehicleDbNum);

      req.input("ItemMainColor", sql.Int, item.mainColor);
      req.input("ItemSubColor", sql.Int, item.subColor);

      for (let i = 0; i < 7; i++) {
        req.input(
          `CostumeStatType${i + 1}`,
          sql.TinyInt,
          item.costumeUser.invest[i]?.type ?? 0,
        );
        req.input(
          `CostumeInvestPoint${i + 1}`,
          sql.SmallInt,
          item.costumeUser.invest[i]?.value ?? 0,
        );
      }

      req.input(
        "CostumeStatEndDate",
        sql.SmallDateTime,
        new Date(item.costumeUser.endTime),
      );

      req.input("TempGrindValue", sql.TinyInt, item.tlGrind.gradeValue);
      req.input(
        "TempGrindFireDate",
        sql.SmallDateTime,
        new Date(item.tlGrind.fireDate),
      );

      req.input("ItemVersion", sql.Int, 0x1000);
      req.input("ItemOption", sql.Int, 0);

      req.input("LockBox", sql.TinyInt, item.lockBox ? 1 : 0);

      req.input("GemSlotCount", sql.Int, item.gems.count);
      req.input("GemStoneMID0", sql.Int, item.gems.stones[0]?.mainId ?? 0);
      req.input("GemStoneSID0", sql.Int, item.gems.stones[0]?.subId ?? 0);
      req.input("GemStoneMID1", sql.Int, item.gems.stones[1]?.mainId ?? 0);
      req.input("GemStoneSID1", sql.Int, item.gems.stones[1]?.subId ?? 0);
      req.input("GemStoneMID2", sql.Int, item.gems.stones[2]?.mainId ?? 0);
      req.input("GemStoneSID2", sql.Int, item.gems.stones[2]?.subId ?? 0);

      req.output("Return", sql.Int);

      const result = await req.execute("dbo.sp_ItemSave");

      if ((result.output.Return ?? -1) !== 0) {
        return { success: false, error: "Update failed" };
      }
    } else if (state === "delete") {
      /* =====================================================
       DELETE
    ===================================================== */
      const result = await pool
        .request()
        .input("ItemUUID", sql.UniqueIdentifier, guid)
        .output("Return", sql.Int)
        .execute("dbo.sp_ItemDel");

      if ((result.output.Return ?? -1) !== 0) {
        return { success: false, error: "Delete failed" };
      }
    } else {
      return { success: false, error: "Invalid state" };
    }
  }

  return { success: true };
}
