import {
  getActionLogs,
  getActionLogTypes,
} from "../../services/actionlog.service.js";

/**
 * GET /api/adminpanel/actionlog
 *
 * Query Parameters (all optional):
 *   userId      : number   - filter by user numeric ID
 *   actionType  : string   - e.g. LOGIN, SHOP_PURCHASE, CHANGE_SCHOOL
 *   entityType  : string   - e.g. USER, CHARACTER, SHOP, TICKET, ACCOUNT
 *   entityId    : string   - specific entity ID
 *   success     : boolean  - "true" or "false"
 *   ipAddress   : string   - exact IP match
 *   dateFrom    : string   - ISO date (e.g. 2026-03-01)
 *   dateTo      : string   - ISO date (e.g. 2026-03-31)
 *   search      : string   - free text search on Description
 *   page        : number   - page number (default 1)
 *   limit       : number   - rows per page (default 50, max 200)
 */
export const getActionLogsController = async (req, res) => {
  try {
    const successParam = req.query.success;
    const success =
      successParam === "true"
        ? true
        : successParam === "false"
          ? false
          : null;

    const result = await getActionLogs({
      userId: req.query.userId ? Number(req.query.userId) : null,
      actionType: req.query.actionType || null,
      entityType: req.query.entityType || null,
      entityId: req.query.entityId || null,
      success,
      ipAddress: req.query.ipAddress || null,
      dateFrom: req.query.dateFrom || null,
      dateTo: req.query.dateTo || null,
      search: req.query.search || null,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 50,
    });

    res.json(result);
  } catch (err) {
    console.error("getActionLogs error:", err);
    res.status(500).json({ ok: false, message: "Failed to fetch action logs" });
  }
};

/**
 * GET /api/adminpanel/actionlog/action-types
 *
 * Returns distinct action types in the ActionLog table.
 * Useful for populating filter dropdowns in the admin UI.
 */
export const getActionLogTypesController = async (req, res) => {
  try {
    const result = await getActionLogTypes();
    res.json(result);
  } catch (err) {
    console.error("getActionLogTypes error:", err);
    res
      .status(500)
      .json({ ok: false, message: "Failed to fetch action types" });
  }
};
