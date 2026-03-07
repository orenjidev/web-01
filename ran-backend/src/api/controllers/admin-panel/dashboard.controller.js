import * as dashboardService from "../../../services/admin-panel/dashboard.service.js";
import { getMessage } from "../../../constants/messages.js";

/* -------------------------
   Error Mapper
-------------------------- */

const mapDashboardError = (err, MSG) => {
  switch (err.message) {
    case "DASHBOARD_STATS_NOT_READY":
      return MSG.DASHBOARD?.NOT_READY ?? MSG.GENERAL.ERROR;
    default:
      return MSG.GENERAL.ERROR;
  }
};

/**
 * GET /api/admin-panel/dashboard
 */
export const getDashboardController = async (req, res) => {
  const MSG = getMessage(req.ctx.lang);

  try {
    const stats = await dashboardService.getDashboardStats();

    return res.json({
      ok: true,
      data: stats,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: mapDashboardError(err, MSG),
    });
  }
};

/**
 * GET /api/admin-panel/dashboard/trend
 */
export const getDashboardTrendController = async (req, res) => {
  const MSG = getMessage(req.ctx.lang);

  try {
    const trend = await dashboardService.getDashboardTrend();

    return res.json({
      ok: true,
      data: trend,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: MSG.GENERAL.ERROR,
    });
  }
};

export const getCharacterPerSchoolController = async (req, res) => {
  const MSG = getMessage(req.ctx.lang);

  try {
    const trend = await dashboardService.getCharactersPerSchool();

    return res.json({
      ok: true,
      data: trend,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: MSG.GENERAL.ERROR,
    });
  }
};

export const getRecentAdminActivityController = async (req, res) => {
  try {
    const data = await dashboardService.getRecentAdminActivity();
    return res.json({ ok: true, data });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};

export const getCharacterPerClassController = async (req, res) => {
  const MSG = getMessage(req.ctx.lang);

  try {
    const trend = await dashboardService.getCharactersPerClass();

    return res.json({
      ok: true,
      data: trend,
    });
  } catch (error) {
    console.error("CHAR_PER_SCHOOL_ERROR:", error);
    res.status(500).json({
      ok: false,
      message: error.message,
      stack: error.stack,
    });
  }
};
