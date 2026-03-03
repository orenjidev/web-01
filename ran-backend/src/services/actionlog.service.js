import sql from "mssql";
import { getWebPool } from "../loaders/mssql.js";
import { baseServerConfig } from "../config/server.config.js";

/**
 * Write an action log entry
 *
 * @param {Object} params
 * @param {number|null} params.userId
 * @param {string} params.actionType
 * @param {string|null} params.entityType
 * @param {string|number|null} params.entityId
 * @param {string|null} params.description
 * @param {Object|null} params.metadata
 * @param {string|null} params.ipAddress
 * @param {string|null} params.userAgent
 * @param {boolean} [params.success=true]
 */
export const logAction = async ({
  userId = null,
  actionType,
  entityType = null,
  entityId = null,
  description = null,
  metadata = null,
  ipAddress = null,
  userAgent = null,
  success = true,
}) => {
  if (!baseServerConfig.coreOptions.enableLogs) {
    return;
  }
  if (!actionType) {
    throw new Error("actionType is required for action logging");
  }

  try {
    const pool = await getWebPool();

    await pool
      .request()
      .input("UserID", sql.Int, userId)
      .input("ActionType", sql.NVarChar(50), actionType)
      .input("EntityType", sql.NVarChar(50), entityType)
      .input("EntityID", sql.NVarChar(100), entityId?.toString() ?? null)
      .input("Description", sql.NVarChar(500), description)
      .input(
        "MetadataJson",
        sql.NVarChar(sql.MAX),
        metadata ? JSON.stringify(metadata) : null,
      )
      .input("IPAddress", sql.NVarChar(45), ipAddress)
      .input("UserAgent", sql.NVarChar(512), userAgent)
      .input("Success", sql.Bit, success ? 1 : 0).query(`
        INSERT INTO ActionLog (
          UserID,
          ActionType,
          EntityType,
          EntityID,
          Description,
          MetadataJson,
          IPAddress,
          UserAgent,
          Success
        )
        VALUES (
          @UserID,
          @ActionType,
          @EntityType,
          @EntityID,
          @Description,
          @MetadataJson,
          @IPAddress,
          @UserAgent,
          @Success
        );
      `);
  } catch (err) {
    // IMPORTANT: never throw logging errors back to business logic
    console.error("ActionLog failed:", err);
  }
};

/**
 * Query action logs with filtering and pagination.
 *
 * @param {Object} filters
 * @param {number|null}  filters.userId      - filter by user numeric ID
 * @param {string|null}  filters.actionType  - e.g. LOGIN, SHOP_PURCHASE
 * @param {string|null}  filters.entityType  - e.g. USER, CHARACTER, SHOP
 * @param {string|null}  filters.entityId    - specific entity ID
 * @param {boolean|null} filters.success     - null = all, true/false = filter
 * @param {string|null}  filters.ipAddress   - exact IP match
 * @param {string|null}  filters.dateFrom    - ISO string
 * @param {string|null}  filters.dateTo      - ISO string
 * @param {string|null}  filters.search      - free text on Description
 * @param {number}       filters.page        - 1-based page
 * @param {number}       filters.limit       - rows per page (max 200)
 */
export const getActionLogs = async ({
  userId = null,
  actionType = null,
  entityType = null,
  entityId = null,
  success = null,
  ipAddress = null,
  dateFrom = null,
  dateTo = null,
  search = null,
  page = 1,
  limit = 50,
} = {}) => {
  const pool = await getWebPool();
  const req = pool.request();
  const conditions = [];

  if (userId) {
    req.input("UserID", sql.Int, userId);
    conditions.push("UserID = @UserID");
  }
  if (actionType) {
    req.input("ActionType", sql.NVarChar(50), actionType);
    conditions.push("ActionType = @ActionType");
  }
  if (entityType) {
    req.input("EntityType", sql.NVarChar(50), entityType);
    conditions.push("EntityType = @EntityType");
  }
  if (entityId) {
    req.input("EntityID", sql.NVarChar(100), entityId);
    conditions.push("EntityID = @EntityID");
  }
  if (success !== null && success !== undefined) {
    req.input("Success", sql.Bit, success ? 1 : 0);
    conditions.push("Success = @Success");
  }
  if (ipAddress) {
    req.input("IPAddress", sql.NVarChar(45), ipAddress);
    conditions.push("IPAddress = @IPAddress");
  }
  if (dateFrom) {
    req.input("DateFrom", sql.DateTime2, new Date(dateFrom));
    conditions.push("CreatedAt >= @DateFrom");
  }
  if (dateTo) {
    req.input("DateTo", sql.DateTime2, new Date(dateTo));
    conditions.push("CreatedAt <= @DateTo");
  }
  if (search) {
    req.input("Search", sql.NVarChar(200), `%${search}%`);
    conditions.push("Description LIKE @Search");
  }

  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(Math.max(1, Number(limit) || 50), 200);
  const offset = (safePage - 1) * safeLimit;

  req.input("Offset", sql.Int, offset);
  req.input("Limit", sql.Int, safeLimit);

  const result = await req.query(`
    SELECT
      ID, UserID, ActionType, EntityType, EntityID,
      Description, MetadataJson, IPAddress, UserAgent,
      Success, CreatedAt,
      COUNT(*) OVER() AS _total
    FROM ActionLog
    ${where}
    ORDER BY CreatedAt DESC
    OFFSET @Offset ROWS
    FETCH NEXT @Limit ROWS ONLY;
  `);

  const total = result.recordset[0]?._total ?? 0;
  const rows = result.recordset.map(({ _total, ...row }) => row);

  return {
    ok: true,
    rows,
    pagination: { page: safePage, limit: safeLimit, total },
  };
};

/**
 * Returns distinct action types present in ActionLog (for filter dropdowns).
 */
export const getActionLogTypes = async () => {
  const pool = await getWebPool();
  const result = await pool.request().query(`
    SELECT DISTINCT ActionType FROM ActionLog ORDER BY ActionType
  `);
  return {
    ok: true,
    actionTypes: result.recordset.map((r) => r.ActionType),
  };
};
