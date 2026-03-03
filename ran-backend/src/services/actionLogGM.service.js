import sql from "mssql";
import { getWebPool } from "../loaders/mssql.js";
import { baseServerConfig } from "../config/server.config.js";

/**
 * Write a GM action log entry to ActionLogGM.
 *
 * @param {Object} params
 * @param {number}      params.gmUserNum      - GM's UserNum (from session)
 * @param {string|null} params.gmUserId       - GM's UserID (for readability)
 * @param {number|null} params.gmUserType     - GM's UserType
 * @param {string}      params.actionType     - e.g. 'SEARCH_CHARACTERS', 'UPDATE_CHARACTER'
 * @param {string|null} params.httpMethod     - GET, POST, PATCH, PUT, DELETE
 * @param {string|null} params.httpPath       - full request path
 * @param {string|null} params.entityType     - e.g. 'CHARACTER', 'USER'
 * @param {string|number|null} params.entityId
 * @param {string|null} params.description
 * @param {Object|null} params.requestBody    - raw request body
 * @param {Object|null} params.metadata       - additional context
 * @param {string|null} params.ipAddress
 * @param {string|null} params.userAgent
 * @param {boolean}     [params.success=true]
 * @param {number|null} params.responseStatus - HTTP status code
 */
export const logGmAction = async ({
  gmUserNum,
  gmUserId = null,
  gmUserType = null,
  actionType,
  httpMethod = null,
  httpPath = null,
  entityType = null,
  entityId = null,
  description = null,
  requestBody = null,
  metadata = null,
  ipAddress = null,
  userAgent = null,
  success = true,
  responseStatus = null,
}) => {
  if (!baseServerConfig.coreOptions.enableLogs) return;
  if (!actionType) {
    throw new Error("actionType is required for GM action logging");
  }

  try {
    const pool = await getWebPool();

    await pool
      .request()
      .input("GmUserNum", sql.Int, gmUserNum)
      .input("GmUserID", sql.NVarChar(255), gmUserId)
      .input("GmUserType", sql.Int, gmUserType)
      .input("ActionType", sql.NVarChar(50), actionType)
      .input("HttpMethod", sql.NVarChar(10), httpMethod)
      .input("HttpPath", sql.NVarChar(500), httpPath)
      .input("EntityType", sql.NVarChar(50), entityType)
      .input("EntityID", sql.NVarChar(100), entityId?.toString() ?? null)
      .input("Description", sql.NVarChar(500), description)
      .input(
        "RequestBody",
        sql.NVarChar(sql.MAX),
        requestBody ? JSON.stringify(requestBody) : null,
      )
      .input(
        "MetadataJson",
        sql.NVarChar(sql.MAX),
        metadata ? JSON.stringify(metadata) : null,
      )
      .input("IPAddress", sql.NVarChar(45), ipAddress)
      .input("UserAgent", sql.NVarChar(512), userAgent)
      .input("Success", sql.Bit, success ? 1 : 0)
      .input("ResponseStatus", sql.Int, responseStatus).query(`
        INSERT INTO ActionLogGM (
          GmUserNum, GmUserID, GmUserType,
          ActionType, HttpMethod, HttpPath,
          EntityType, EntityID,
          Description, RequestBody, MetadataJson,
          IPAddress, UserAgent,
          Success, ResponseStatus
        )
        VALUES (
          @GmUserNum, @GmUserID, @GmUserType,
          @ActionType, @HttpMethod, @HttpPath,
          @EntityType, @EntityID,
          @Description, @RequestBody, @MetadataJson,
          @IPAddress, @UserAgent,
          @Success, @ResponseStatus
        );
      `);
  } catch (err) {
    // IMPORTANT: never throw logging errors back to business logic
    console.error("ActionLogGM failed:", err);
  }
};

/**
 * Query GM action logs with filtering and pagination.
 *
 * @param {Object} filters
 * @param {number|null} filters.gmUserNum
 * @param {string|null} filters.actionType
 * @param {string|null} filters.entityType
 * @param {string|null} filters.entityId
 * @param {string|null} filters.httpMethod
 * @param {string|null} filters.dateFrom  - ISO string
 * @param {string|null} filters.dateTo    - ISO string
 * @param {string|null} filters.search    - free text search on Description/HttpPath
 * @param {number}      filters.page      - 1-based page number
 * @param {number}      filters.limit     - rows per page (max 100)
 */
export const getGmActionLogs = async ({
  gmUserNum = null,
  actionType = null,
  entityType = null,
  entityId = null,
  httpMethod = null,
  dateFrom = null,
  dateTo = null,
  search = null,
  page = 1,
  limit = 50,
} = {}) => {
  const pool = await getWebPool();
  const req = pool.request();

  const conditions = [];

  if (gmUserNum) {
    req.input("GmUserNum", sql.Int, gmUserNum);
    conditions.push("GmUserNum = @GmUserNum");
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
  if (httpMethod) {
    req.input("HttpMethod", sql.NVarChar(10), httpMethod);
    conditions.push("HttpMethod = @HttpMethod");
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
    conditions.push("(Description LIKE @Search OR HttpPath LIKE @Search)");
  }

  const where = conditions.length > 0
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(Math.max(1, Number(limit) || 50), 100);
  const offset = (safePage - 1) * safeLimit;

  req.input("Offset", sql.Int, offset);
  req.input("Limit", sql.Int, safeLimit);

  const result = await req.query(`
    SELECT
      LogID, GmUserNum, GmUserID, GmUserType,
      ActionType, HttpMethod, HttpPath,
      EntityType, EntityID,
      Description, RequestBody, MetadataJson,
      IPAddress, UserAgent,
      Success, ResponseStatus,
      CreatedAt,
      COUNT(*) OVER() AS _total
    FROM ActionLogGM
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
 * Returns distinct action types in the log (for filter dropdowns).
 */
export const getDistinctActionTypes = async () => {
  const pool = await getWebPool();
  const result = await pool.request().query(`
    SELECT DISTINCT ActionType
    FROM ActionLogGM
    ORDER BY ActionType
  `);
  return {
    ok: true,
    actionTypes: result.recordset.map((r) => r.ActionType),
  };
};
