import sql from "mssql";
import { getDbConfig } from "../config/database.js";

const pools = new Map();

/**
 * Create or return a cached pool per database.
 */
const connectToDb = async (dbName) => {
  if (pools.has(dbName)) return pools.get(dbName);

  const config = getDbConfig(dbName);
  if (typeof config.server !== "string" || !config.server) {
    throw new Error(`DB_HOST is missing/invalid. server="${config.server}"`);
  }
  if (!config.user || !config.password) {
    throw new Error("DB_USER/DB_PASS missing. Check your .env");
  }
  if (!config.database) {
    throw new Error("Database name missing.");
  }

  const pool = new sql.ConnectionPool(config);

  // If the pool errors later, log it (helps with flaky networks)
  pool.on("error", (err) => {
    console.error(`[MSSQL ${dbName}] pool error:`, err);
  });

  await pool.connect();
  console.log(`MSSQL connected: ${dbName}`);

  pools.set(dbName, pool);
  return pool;
};

// Public helpers (clean + explicit)
export const getUserPool = async () => connectToDb(process.env.DB_NAME_USER);
export const getGamePool = async () => connectToDb(process.env.DB_NAME_GAME);
export const getLogPool = async () => connectToDb(process.env.DB_NAME_LOG);
export const getShopPool = async () => connectToDb(process.env.DB_NAME_SHOP);
export const getWebPool = async () => connectToDb(process.env.DB_NAME_WEB);

// Optional: close all pools on shutdown
export const closeAllPools = async () => {
  const closing = [];
  for (const [dbName, pool] of pools.entries()) {
    closing.push(
      pool
        .close()
        .catch((e) => console.error(`[MSSQL ${dbName}] close error:`, e)),
    );
  }
  await Promise.all(closing);
  pools.clear();
};
