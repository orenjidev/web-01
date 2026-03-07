/**
 * =====================================================
 * Admin Panel - Dashboard API
 * =====================================================
 * Base Path : /api/admin-panel/dashboard
 * =====================================================
 */

import { Router } from "express";
import * as dashboardRoutes from "../../controllers/admin-panel/dashboard.controller.js";
import { requireStaff } from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(requireStaff);

router.get("/", dashboardRoutes.getDashboardController);
router.get("/trend", dashboardRoutes.getDashboardTrendController);
router.get("/stat-per-school", dashboardRoutes.getCharacterPerSchoolController);
router.get("/stat-per-class", dashboardRoutes.getCharacterPerClassController);
router.get("/recent-activity", dashboardRoutes.getRecentAdminActivityController);

export default router;
