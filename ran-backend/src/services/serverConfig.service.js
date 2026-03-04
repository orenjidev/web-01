import sql from "mssql";
import { getWebPool } from "../loaders/mssql.js";
import { baseServerConfig } from "../config/server.config.js";

// Sections managed in DB — excludes database, gameVersion, security (structural)
const DB_SECTIONS = [
  "coreOptions",
  "features",
  "definitions",
  "changeSchool",
  "changeClass",
  "resetStats",
  "reborn",
  "convertfeature",
  "votingSystem",
  "shop",
  "uihelper",
  "classes",
  "social",
  "sliderConfig",
  "systemRequirements",
];

const CREATE_TABLE_SQL = `
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_NAME = 'ServerConfig'
  )
  CREATE TABLE dbo.ServerConfig (
    ConfigKey        NVARCHAR(100)  NOT NULL,
    ConfigValue      NVARCHAR(MAX)  NOT NULL,
    UpdatedAt        DATETIME2      NOT NULL DEFAULT GETDATE(),
    UpdatedByUserNum INT            NULL,
    CONSTRAINT PK_ServerConfig PRIMARY KEY (ConfigKey)
  );
`;

/**
 * Called once at startup.
 * Creates the ServerConfig table if missing, seeds defaults for any
 * absent section, then merges all DB values into the in-memory
 * baseServerConfig object (in-place, so all existing importers
 * automatically see the live values).
 */
export const loadServerConfig = async () => {
  try {
    const pool = await getWebPool();

    // Ensure table exists
    await pool.request().query(CREATE_TABLE_SQL);

    // Fetch all stored rows
    const result = await pool.request().query(
      `SELECT ConfigKey, ConfigValue FROM dbo.ServerConfig`,
    );

    const dbMap = {};
    for (const row of result.recordset) {
      try {
        dbMap[row.ConfigKey] = JSON.parse(row.ConfigValue);
      } catch {
        // skip malformed rows
      }
    }

    // Seed missing sections from hard-coded defaults
    for (const key of DB_SECTIONS) {
      if (!dbMap[key] && baseServerConfig[key] !== undefined) {
        const json = JSON.stringify(baseServerConfig[key]);
        await pool
          .request()
          .input("K", sql.NVarChar(100), key)
          .input("V", sql.NVarChar(sql.MAX), json).query(`
            IF NOT EXISTS (SELECT 1 FROM dbo.ServerConfig WHERE ConfigKey = @K)
              INSERT INTO dbo.ServerConfig (ConfigKey, ConfigValue)
              VALUES (@K, @V);
          `);
        dbMap[key] = baseServerConfig[key];
      }
    }

    // Merge DB values into the live in-memory object (shallow per section)
    for (const key of DB_SECTIONS) {
      if (dbMap[key] !== undefined && baseServerConfig[key] !== undefined) {
        Object.assign(baseServerConfig[key], dbMap[key]);
      }
    }

    console.log("[ServerConfig] Loaded from DB successfully");
  } catch (err) {
    console.error(
      "[ServerConfig] Failed to load from DB, using static defaults:",
      err.message,
    );
  }
};

/**
 * Returns all DB-managed config sections as a plain object.
 * Used by the admin GET endpoint.
 */
export const getAllConfig = async () => {
  const pool = await getWebPool();
  const result = await pool
    .request()
    .query(`SELECT ConfigKey, ConfigValue FROM dbo.ServerConfig ORDER BY ConfigKey`);

  const out = {};
  for (const row of result.recordset) {
    try {
      out[row.ConfigKey] = JSON.parse(row.ConfigValue);
    } catch {
      // skip
    }
  }
  return out;
};

/**
 * UPSERT a single config section in DB and apply in-memory immediately.
 * @param {string} key     - Must be one of DB_SECTIONS
 * @param {object} value   - The new section value (full replacement)
 * @param {number|null} userNum - Staff user who made the change
 */
export const updateConfigSection = async (key, value, userNum = null) => {
  if (!DB_SECTIONS.includes(key)) {
    throw Object.assign(new Error(`Invalid config section: ${key}`), {
      status: 400,
    });
  }

  const pool = await getWebPool();
  const json = JSON.stringify(value);

  await pool
    .request()
    .input("K", sql.NVarChar(100), key)
    .input("V", sql.NVarChar(sql.MAX), json)
    .input("U", sql.Int, userNum).query(`
      MERGE dbo.ServerConfig AS t
      USING (SELECT @K AS K) AS s ON t.ConfigKey = s.K
      WHEN MATCHED THEN
        UPDATE SET ConfigValue = @V, UpdatedAt = GETDATE(), UpdatedByUserNum = @U
      WHEN NOT MATCHED THEN
        INSERT (ConfigKey, ConfigValue, UpdatedAt, UpdatedByUserNum)
        VALUES (@K, @V, GETDATE(), @U);
    `);

  // Apply in-memory immediately (no restart required)
  if (baseServerConfig[key] !== undefined) {
    Object.assign(baseServerConfig[key], value);
  }
};
