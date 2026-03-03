import {
  getGmActionLogs,
  getDistinctActionTypes,
} from "../../../services/actionLogGM.service.js";

export const getGmActionLogsController = async (req, res) => {
  try {
    const result = await getGmActionLogs({
      gmUserNum: req.query.gmUserNum ? Number(req.query.gmUserNum) : null,
      actionType: req.query.actionType || null,
      entityType: req.query.entityType || null,
      entityId: req.query.entityId || null,
      httpMethod: req.query.httpMethod || null,
      dateFrom: req.query.dateFrom || null,
      dateTo: req.query.dateTo || null,
      search: req.query.search || null,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 50,
    });

    res.json(result);
  } catch (err) {
    console.error("getGmActionLogs error:", err);
    res.status(500).json({ ok: false, message: "Failed to fetch GM action logs" });
  }
};

export const getActionTypesController = async (req, res) => {
  try {
    const result = await getDistinctActionTypes();
    res.json(result);
  } catch (err) {
    console.error("getDistinctActionTypes error:", err);
    res.status(500).json({ ok: false, message: "Failed to fetch action types" });
  }
};
