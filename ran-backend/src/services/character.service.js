import { getGamePool } from "../loaders/mssql.js";
import { accountCharacterCache } from "./cache/character.cache.js";
import { getOfflineCharacterForUpdate } from "./guard/character.guard.js";
import { applyCharacterCost } from "./util/character.util.js";
import { CACHE_DURATION_MS } from "./util.service.js";
import { baseServerConfig } from "../config/server.config.js";
import { getRebornStage } from "./util/getReborn.util.js";
import {
  classMap,
  resolveClassNameFromCode,
  resolveGenderFlexible,
} from "../constants/classMap.js";
import { logAction } from "./actionlog.service.js";

/* =====================================================
   CHARACTER RANKING (with cache)
===================================================== */

const rankCache = new Map();

export const getCharacterRanking = async (limit = 100, classFilter = "") => {
  const top = Math.min(parseInt(limit, 10) || 100, 500);
  const filter = classFilter.toLowerCase();
  const cacheKey = `${top}:${filter}`;
  const now = Date.now();

  if (rankCache.has(cacheKey)) {
    const cached = rankCache.get(cacheKey);
    if (now - cached.timestamp < CACHE_DURATION_MS) {
      return cached.data;
    }
    rankCache.delete(cacheKey);
  }
  let classCondition = "";
  let orderBy = "C.ChaLevel DESC, A.PVPKills DESC";

  const enabledClassIds = Object.entries(classMap)
    .filter(([name]) => baseServerConfig.classes[name])
    .flatMap(([, ids]) => ids);

  if (classMap[filter]) {
    if (!baseServerConfig.classes[filter]) return [];
    classCondition = `AND C.ChaClass IN (${classMap[filter].join(",")})`;
  } else {
    switch (filter) {
      case "sg":
        classCondition = "AND C.ChaSchool = 0";
        break;
      case "mp":
        classCondition = "AND C.ChaSchool = 1";
        break;
      case "pnx":
        classCondition = "AND C.ChaSchool = 2";
        break;
      case "rich":
        orderBy = "C.ChaMoney DESC";
        break;
      case "exp":
        orderBy = "C.ChaLevel DESC, C.ChaEXP DESC";
        break;
      default:
        if (!enabledClassIds.length) return [];
        classCondition = `AND C.ChaClass IN (${enabledClassIds.join(",")})`;
    }
  }

  const pool = await getGamePool();
  const result = await pool.request().query(`
    SELECT TOP (${top})
      A.ChaNum AS num,
      A.PVPKills AS kills,
      A.PVPDeaths AS deaths,
      C.ChaName AS name,
      C.ChaLevel AS lvl,
      C.ChaClass AS class,
      C.ChaMoney AS money,
      C.ChaSchool AS school,
      C.ChaOnline AS isOnline
    FROM RG2Game.dbo.ChaBattleStat A
    JOIN RG2Game.dbo.ChaInfo C ON A.ChaNum = C.ChaNum
    WHERE C.ChaDeleted = 0
    ${classCondition}
    ORDER BY ${orderBy}
  `);

  rankCache.set(cacheKey, {
    data: result.recordset,
    timestamp: now,
  });

  return result.recordset;
};

/* =====================================================
   CHARACTER LIST (cached per account)
===================================================== */

export const getCharactersByUserId = async (userNum) => {
  const pool = await getGamePool();
  const req = pool.request().input("UserNum", userNum);

  const fp = await req.query(`
    SELECT COUNT(*) AS charCount, MAX(ChaNum) AS maxCharNum
    FROM RG2Game.dbo.ChaInfo
    WHERE UserNum = @UserNum AND ChaDeleted = 0
  `);

  const fingerprint = fp.recordset[0];
  const cached = accountCharacterCache.get(userNum);

  if (
    cached &&
    cached.fingerprint.charCount === fingerprint.charCount &&
    cached.fingerprint.maxCharNum === fingerprint.maxCharNum
  ) {
    return cached.data;
  }

  const result = await req.query(`
    SELECT
      ChaNum AS characterId,
      ChaName AS name,
      ChaSchool AS school,
      ChaClass AS class,
      ChaMoney AS money,
      ChaLevel AS level,
      ChaReborn AS reborn,
      ChaOnline AS isOnline
    FROM RG2Game.dbo.ChaInfo
    WHERE UserNum = @UserNum AND ChaDeleted = 0
    ORDER BY ChaNum
  `);

  const characters = result.recordset.map((char) => ({
    ...char,
    reborn: baseServerConfig.reborn?.enabled ? char.reborn : 0,
  }));

  accountCharacterCache.set(userNum, {
    fingerprint,
    data: result.recordset,
    timestamp: Date.now(),
  });

  return result.recordset;
};

/* =====================================================
   CHANGE SCHOOL
===================================================== */

const SCHOOL_MAP = { sg: 0, mp: 1, pnx: 2 };
const SCHOOL_CHANGE_COST = { chamoney: 100, userpoint: 0 };

export const changeCharacterSchool = async (characterId, school, ctx) => {
  if (!ctx?.userNum) throw new Error("UNAUTHORIZED");

  const schoolId = SCHOOL_MAP[String(school).toLowerCase()];
  if (schoolId === undefined) throw new Error("INVALID_SCHOOL");

  const { character, user } = await getOfflineCharacterForUpdate(
    characterId,
    ctx.userNum,
  );

  if (character.school === schoolId) throw new Error("SAME_SCHOOL");
  // if (character.money < SCHOOL_CHANGE_COST.chamoney)
  //   throw new Error("INSUFFICIENT_CHAMONEY");

  await applyCharacterCost({
    characterId,
    userNum: ctx.userNum,
    transactionType: "changeSchool",
    ctx,
  });

  const pool = await getGamePool();
  await pool.request().input("ChaNum", characterId).input("ChaSchool", schoolId)
    .query(`
      UPDATE RG2Game.dbo.ChaInfo
      SET ChaSchool = @ChaSchool
      WHERE ChaNum = @ChaNum
    `);

  await logAction({
    userId: user.UserNum,
    actionType: "CHANGE_SCHOOL",
    entityType: "CHARACTER",
    entityId: characterId,
    description: `Changed school to ${schoolId}`,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return true;
};

/* =====================================================
   RESET STATS
===================================================== */

export const resetCharacterStat = async (characterId, ctx) => {
  if (!ctx?.userNum) throw new Error("UNAUTHORIZED");

  const { character, user } = await getOfflineCharacterForUpdate(
    characterId,
    ctx.userNum,
  );

  // if (character.money < baseServerConfig.resetStats.fee)
  //   throw new Error("INSUFFICIENT_CHAMONEY");

  await applyCharacterCost({
    characterId,
    userNum: ctx.userNum,
    transactionType: "resetStats",
    ctx,
  });

  const pool = await getGamePool();
  await pool.request().input("ChaNum", characterId).query(`
    UPDATE RG2Game.dbo.ChaInfo
    SET
      ChaStRemain = ChaStRemain + ChaPower + ChaDex + ChaSpirit + ChaStrong + ChaStrength + ChaIntel,
      ChaPower = 0,
      ChaDex = 0,
      ChaSpirit = 0,
      ChaStrong = 0,
      ChaStrength = 0,
      ChaIntel = 0
    WHERE ChaNum = @ChaNum
  `);

  await logAction({
    userId: user.UserNum,
    actionType: "RESET_STATS",
    entityType: "CHARACTER",
    entityId: characterId,
    description: "Reset character stats",
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return true;
};

/* =====================================================
   CHANGE CLASS
===================================================== */

export const changeCharacterClass = async (characterId, targetClass, ctx) => {
  if (!ctx?.userNum) throw new Error("UNAUTHORIZED");
  if (!baseServerConfig.changeClass?.enabled)
    throw new Error("FEATURE_DISABLED");

  const entry = classMap[targetClass];
  if (!entry) throw new Error("INVALID_CLASS");

  const { character, user } = await getOfflineCharacterForUpdate(
    characterId,
    ctx.userNum,
  );

  const currentClassName = resolveClassNameFromCode(character.class);

  if (currentClassName === targetClass) {
    throw new Error("SAME_CLASS");
  }

  const gender = resolveGenderFlexible(character.class);
  const [male, female] = entry;
  const newClass = gender === "male" ? male : female;

  const pool = await getGamePool();
  await pool.request().input("ChaNum", characterId).input("ChaClass", newClass)
    .query(`
      UPDATE RG2Game.dbo.ChaInfo
      SET ChaClass = @ChaClass, ChaSkillSlot = NULL
      WHERE ChaNum = @ChaNum
    `);

  await logAction({
    userId: user.UserNum,
    actionType: "CHANGE_CLASS",
    entityType: "CHARACTER",
    entityId: characterId,
    description: `Changed class to ${targetClass}`,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return true;
};

/* =====================================================
   REBORN Character
===================================================== */
function calculateTotalRebornStat(rebornCount) {
  let total = 0;

  for (const tier of baseServerConfig.reborn.tiers) {
    const from = tier.from;
    const to = tier.to;

    if (rebornCount < from) continue;

    const upperBound = Math.min(rebornCount, to);
    const countInTier = upperBound - from + 1;

    if (countInTier > 0) {
      total += countInTier * tier.statReward;
    }
  }

  return total;
}

export const rebornCharacter = async (characterId, ctx) => {
  if (!ctx?.user.userNum) throw new Error("UNAUTHORIZED");
  if (!baseServerConfig.reborn?.enabled) throw new Error("FEATURE_DISABLED");

  const { character, user } = await getOfflineCharacterForUpdate(
    characterId,
    ctx?.user.userNum,
  );

  const currentReborn = character.reborn;

  if (currentReborn >= baseServerConfig.reborn.maxReborn) {
    throw new Error("REBORN_MAX_REACHED");
  }

  const tier = baseServerConfig.reborn.tiers.find(
    (t) => currentReborn >= t.from && currentReborn <= t.to,
  );

  if (!tier) {
    throw new Error("REBORN_MAX_REACHED");
  }

  if (character.level < tier.levelReq) {
    throw new Error("LEVEL_REQUIREMENT_NOT_MET");
  }

  // Deduct cost based on tier fee
  await applyCharacterCost({
    characterId,
    user,
    transactionType: "reborn",
    feeOverride: tier.fee,
    ctx,
  });

  const newReborn = currentReborn + 1;
  const totalRebornStat = calculateTotalRebornStat(newReborn);

  const pool = await getGamePool();

  await pool
    .request()
    .input("ChaNum", characterId)
    .input("NewReborn", newReborn)
    .input("TotalRebornStat", totalRebornStat).query(`
    UPDATE RG2Game.dbo.ChaInfo
    SET
      ChaLevel = 1,
      ChaEXP = 0,
      ChaReborn = @NewReborn,
      ChaPower = 0,
      ChaDex = 0,
      ChaSpirit = 0,
      ChaStrong = 0,
      ChaStrength = 0,
      ChaIntel = 0,
      ChaStRemain = @TotalRebornStat
    WHERE ChaNum = @ChaNum
  `);

  accountCharacterCache.delete(userNum);

  await logAction({
    userId: user.UserNum,
    actionType: "REBORN",
    entityType: "CHARACTER",
    entityId: characterId,
    description: `Reborn to ${currentReborn + 1}`,
    metadata: {
      previousReborn: currentReborn,
      newReborn: newReborn,
      totalRebornStat: totalRebornStat,
      levelRequirement: tier.levelReq,
    },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return true;
};

export const getRebornPreview = async (characterId, ctx) => {
  const userNum = ctx?.user?.userNum;
  if (!userNum) throw new Error("UNAUTHORIZED");

  const config = baseServerConfig.reborn;
  if (!config?.enabled) throw new Error("FEATURE_DISABLED");

  const { character } = await getOfflineCharacterForUpdate(
    characterId,
    userNum,
  );

  console.log(character);

  const currentReborn = character.reborn || 0;

  if (currentReborn >= config.maxReborn) {
    return {
      canReborn: false,
      reason: "REBORN_MAX_REACHED",
    };
  }

  const nextReborn = currentReborn + 1;

  const tier = config.tiers.find(
    (t) => nextReborn >= t.from && nextReborn <= t.to,
  );

  if (!tier) {
    return {
      canReborn: false,
      reason: "REBORN_TIER_NOT_FOUND",
    };
  }

  const totalStatAfter = calculateTotalRebornStat(nextReborn);

  return {
    canReborn: character.level >= tier.levelReq,
    currentReborn,
    nextReborn,
    requiredLevel: tier.levelReq,
    requiredFee: tier.fee,
    currency: config.currency,
    statRewardForNext: tier.statReward,
    totalStatAfter,
  };
};

/* =====================================================
   DELETE CHARACTER
===================================================== */

export const deleteCharacter = async (characterId, ctx) => {
  if (!ctx?.userNum) throw new Error("UNAUTHORIZED");

  const { user } = await getOfflineCharacterForUpdate(characterId, ctx.userNum);

  const pool = await getGamePool();
  await pool.request().input("ChaNum", characterId).query(`
    UPDATE RG2Game.dbo.ChaInfo
    SET ChaDeleted = 1, ChaDeletedDate = GETDATE()
    WHERE ChaNum = @ChaNum
  `);

  await logAction({
    userId: user.UserNum,
    actionType: "DELETE_CHARACTER",
    entityType: "CHARACTER",
    entityId: characterId,
    description: "Character deleted",
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return true;
};
