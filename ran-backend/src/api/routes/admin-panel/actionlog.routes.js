/**
 * =====================================================
 * Admin Panel - User Action Log Routes
 * =====================================================
 * Base Path : /api/adminpanel/actionlog
 * Auth      : Inherited from parent adminpanel router
 * Access    : Staff / Admin only
 *
 * Description:
 *   Endpoints for viewing and filtering the normal user
 *   ActionLog table. Captures user-facing actions such as
 *   logins, registrations, purchases, character changes,
 *   ticket events, account updates, and top-up redemptions.
 *
 * Separate from GM ActionLog (/api/gmtool/actionlog) which
 * tracks GM tool and admin panel management actions.
 * =====================================================
 */
import { Router } from "express";
import * as actionLogController from "../../controllers/actionlog.controller.js";
import { requireGmToolAccess } from "../../../modules/gm-tool/user/gmTool.permissions.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

/**
 * -----------------------------------------------------
 * GET /api/adminpanel/actionlog
 * -----------------------------------------------------
 * Description:
 *   Query user action logs with filtering and pagination.
 *
 * Query Parameters (all optional):
 *   userId      : number  - filter by user numeric ID
 *   actionType  : string  - e.g. LOGIN, LOGIN_FAILED, SHOP_PURCHASE,
 *                           TOPUP_REDEEM, CHANGE_SCHOOL, CHANGE_CLASS,
 *                           RESET_STATS, REBORN, DELETE_CHARACTER,
 *                           CREATE (ticket/user/download/news),
 *                           UPDATE (ticket/user/character/account),
 *                           REPLY, ASSIGN
 *   entityType  : string  - e.g. USER, CHARACTER, SHOP, ACCOUNT,
 *                           TICKET, DOWNLOAD, NEWS
 *   entityId    : string  - specific entity ID
 *   success     : boolean - "true" for successful actions only,
 *                           "false" for failed actions only (e.g. LOGIN_FAILED)
 *   ipAddress   : string  - exact IP address match
 *   dateFrom    : string  - ISO date string (e.g. 2026-03-01)
 *   dateTo      : string  - ISO date string (e.g. 2026-03-31)
 *   search      : string  - free text search on Description field
 *   page        : number  - page number (default: 1)
 *   limit       : number  - rows per page (default: 50, max: 200)
 *
 * Examples:
 *   GET /api/adminpanel/actionlog?actionType=LOGIN_FAILED&success=false
 *   GET /api/adminpanel/actionlog?userId=1001&dateFrom=2026-03-01
 *   GET /api/adminpanel/actionlog?entityType=CHARACTER&page=2&limit=25
 *   GET /api/adminpanel/actionlog?ipAddress=192.168.1.100
 *   GET /api/adminpanel/actionlog?search=reborn&dateFrom=2026-01-01
 *
 * Success Response:
 *   {
 *     "ok": true,
 *     "rows": [
 *       {
 *         "LogID": 1,
 *         "UserID": 1001,
 *         "ActionType": "LOGIN",
 *         "EntityType": "USER",
 *         "EntityID": "1001",
 *         "Description": "User logged in",
 *         "MetadataJson": null,
 *         "IPAddress": "192.168.1.1",
 *         "UserAgent": "Mozilla/5.0...",
 *         "Success": true,
 *         "CreatedAt": "2026-03-01T10:30:00.000Z"
 *       }
 *     ],
 *     "pagination": { "page": 1, "limit": 50, "total": 1024 }
 *   }
 */
router.get("/", actionLogController.getActionLogsController);

/**
 * -----------------------------------------------------
 * GET /api/adminpanel/actionlog/action-types
 * -----------------------------------------------------
 * Description:
 *   Returns distinct action types present in the ActionLog table.
 *   Use this to populate filter dropdowns in the admin UI.
 *
 * Success Response:
 *   {
 *     "ok": true,
 *     "actionTypes": [
 *       "ASSIGN",
 *       "CHANGE_CLASS",
 *       "CHANGE_SCHOOL",
 *       "CREATE",
 *       "DELETE_CHARACTER",
 *       "LOGIN",
 *       "LOGIN_FAILED",
 *       "REBORN",
 *       "REPLY",
 *       "RESET_STATS",
 *       "SHOP_PURCHASE",
 *       "TOPUP_REDEEM",
 *       "UPDATE"
 *     ]
 *   }
 */
router.get("/action-types", actionLogController.getActionLogTypesController);

export default router;
