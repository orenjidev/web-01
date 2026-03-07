import { getWebPool } from "../../loaders/mssql.js";

const gameDb = process.env.DB_NAME_GAME || "RG2Game";
const userDb = process.env.DB_NAME_USER || "RG2User";

/**
 * =====================================================
 * Admin Panel - Dashboard Service
 * Snapshot-driven analytics
 * =====================================================
 */

/**
 * Public Server Stats (no auth required)
 * Exposed via GET /api/public/stats for the public portal home page.
 */
export async function getPublicStats() {
  const pool = await getWebPool();

  const result = await pool.request().query(`
    SELECT TOP 1 TotalAccounts, TotalCharacters, ActivePlayers
    FROM [RG2Log].dbo.ServerStatsDaily
    ORDER BY StatDate DESC
  `);

  if (result.recordset.length === 0) {
    return { totalAccounts: 0, totalCharacters: 0, activePlayers: 0 };
  }

  const row = result.recordset[0];
  return {
    totalAccounts: Number(row.TotalAccounts),
    totalCharacters: Number(row.TotalCharacters),
    activePlayers: Number(row.ActivePlayers),
  };
}

/**
 * Main Dashboard Stats
 */
export async function getDashboardStats() {
  const pool = await getWebPool();

  // 1️⃣ Get today's snapshot
  const todayResult = await pool.request().query(`
    SELECT TOP 1
      StatDate,
      TotalCharacters,
      TotalServerGold,
      ActivePlayers,
      PeakPlayersToday,
      TotalServerEP,
      TotalAccounts,
      DailyNewAccounts,
      DailyNewCharacters,
      DailyGoldDelta,
      UpdatedAt
    FROM [RG2Log].dbo.ServerStatsDaily
    ORDER BY StatDate DESC
  `);

  if (todayResult.recordset.length === 0) {
    throw new Error("DASHBOARD_STATS_NOT_READY");
  }

  const today = todayResult.recordset[0];

  // 2️⃣ 7-Day Rolling Average (Accounts)
  const avgAccountsResult = await pool.request().query(`
    SELECT AVG(CAST(DailyNewAccounts AS float)) AS Avg7DayAccounts
    FROM (
      SELECT TOP 7 DailyNewAccounts
      FROM [RG2Log].dbo.ServerStatsDaily
      ORDER BY StatDate DESC
    ) t
  `);

  const avg7DayAccounts = avgAccountsResult.recordset[0]?.Avg7DayAccounts ?? 0;

  // 3️⃣ 7-Day Rolling Average (Characters)
  const avgCharsResult = await pool.request().query(`
    SELECT AVG(CAST(DailyNewCharacters AS float)) AS Avg7DayCharacters
    FROM (
      SELECT TOP 7 DailyNewCharacters
      FROM [RG2Log].dbo.ServerStatsDaily
      ORDER BY StatDate DESC
    ) t
  `);

  const avg7DayCharacters = avgCharsResult.recordset[0]?.Avg7DayCharacters ?? 0;

  return {
    date: today.StatDate,

    totalAccounts: Number(today.TotalAccounts),
    dailyNewAccounts: Number(today.DailyNewAccounts),
    averageAccountCreation7d: Number(avg7DayAccounts.toFixed(2)),

    totalCharacters: Number(today.TotalCharacters),
    dailyNewCharacters: Number(today.DailyNewCharacters),
    averageCharacterCreation7d: Number(avg7DayCharacters.toFixed(2)),

    totalGold: Number(today.TotalServerGold),
    dailyGoldDelta: Number(today.DailyGoldDelta),

    totalEP: Number(today.TotalServerEP),

    activePlayers: Number(today.ActivePlayers),
    peakPlayersToday: Number(today.PeakPlayersToday),

    updatedAt: today.UpdatedAt,
  };
}

/**
 * 7-Day Trend Data
 */
export async function getDashboardTrend() {
  const pool = await getWebPool();

  const result = await pool.request().query(`
    SELECT TOP 7
      StatDate,
      TotalAccounts,
      DailyNewAccounts,
      TotalCharacters,
      DailyNewCharacters,
      TotalServerGold,
      DailyGoldDelta
    FROM [RG2Log].dbo.ServerStatsDaily
    ORDER BY StatDate DESC
  `);

  return result.recordset.reverse().map((row) => ({
    date: row.StatDate,

    totalAccounts: Number(row.TotalAccounts),
    dailyNewAccounts: Number(row.DailyNewAccounts),

    totalCharacters: Number(row.TotalCharacters),
    dailyNewCharacters: Number(row.DailyNewCharacters),

    totalGold: Number(row.TotalServerGold),
    dailyGoldDelta: Number(row.DailyGoldDelta),
  }));
}

/**
 * Character Count Per School (Total + Active)
 */
// needs to be cached every 5 mins
export async function getCharactersPerSchool() {
  const pool = await getWebPool();

  const result = await pool.request().query(`
    SELECT 
      ChaSchool AS School,
      COUNT(*) AS TotalCount,
      SUM(CASE WHEN ChaOnline = 1 THEN 1 ELSE 0 END) AS ActiveCount
    FROM [${gameDb}].dbo.ChaInfo
    GROUP BY ChaSchool
    ORDER BY ChaSchool ASC
  `);

  return result.recordset.map((row) => ({
    school: Number(row.School),
    total: Number(row.TotalCount),
    active: Number(row.ActiveCount),
  }));
}

/**
 * Character Count Per Class (Total + Active)
 */
// needs to be cached every 5 mins
export async function getCharactersPerClass() {
  const pool = await getWebPool();

  const result = await pool.request().query(`
    SELECT 
      ChaClass AS Class,
      COUNT(*) AS TotalCount,
      SUM(CASE WHEN ChaOnline = 1 THEN 1 ELSE 0 END) AS ActiveCount
    FROM [${gameDb}].dbo.ChaInfo
    GROUP BY ChaClass
    ORDER BY ChaClass ASC
  `);

  return result.recordset.map((row) => ({
    class: Number(row.Class),
    total: Number(row.TotalCount),
    active: Number(row.ActiveCount),
  }));
}

/**
 * Recent Admin Activity (top 10)
 * Combines GM action log entries and admin logins.
 */
export async function getRecentAdminActivity() {
  const pool = await getWebPool();

  const [gmResult, loginResult] = await Promise.all([
    pool.request().query(`
      SELECT TOP 10
        'GM'        AS Source,
        LogID,
        GmUserID    AS Actor,
        GmUserNum   AS ActorNum,
        ActionType,
        EntityType,
        EntityID,
        CreatedAt
      FROM dbo.ActionLogGM
      WHERE ActionType IN (
        'GENERATE_TOPUPS', 'GENERATE_TOPUPS_ADMIN',
        'INSERT_BANK_ITEM', 'SAVE_USER', 'UPDATE_CHARACTER'
      )
      ORDER BY CreatedAt DESC
    `),
    pool.request().query(`
      SELECT TOP 10
        'LOGIN'     AS Source,
        al.ID       AS LogID,
        u.UserID    AS Actor,
        al.UserID   AS ActorNum,
        al.ActionType,
        NULL        AS EntityType,
        NULL        AS EntityID,
        al.CreatedAt
      FROM dbo.ActionLog al
      INNER JOIN [${userDb}].dbo.UserInfo u ON u.UserNum = al.UserID
      WHERE al.ActionType = 'LOGIN'
        AND u.UserType >= 50
      ORDER BY al.CreatedAt DESC
    `),
  ]);

  const rows = [...gmResult.recordset, ...loginResult.recordset]
    .sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt))
    .slice(0, 10)
    .map((row) => ({
      source: row.Source,
      logId: row.LogID,
      actor: row.Actor ?? null,
      actorNum: row.ActorNum ?? null,
      actionType: row.ActionType,
      entityType: row.EntityType ?? null,
      entityId: row.EntityID ?? null,
      createdAt: row.CreatedAt,
    }));

  return rows;
}
