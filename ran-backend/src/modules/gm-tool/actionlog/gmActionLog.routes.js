/**
 * =====================================================
 * GM Tool - Action Log Routes
 * =====================================================
 * Base Path : /api/gmtool/actionlog
 * Auth      : Inherited from parent gmTool router
 * Access    : GM / Admin / SuperAdmin only
 *
 * Description:
 *   Endpoints for viewing and filtering GM action logs.
 *   All GM tool and admin panel actions are automatically
 *   logged via the gmActionLog middleware.
 * =====================================================
 */
import { Router } from "express";
import * as gmActionLogController from "./gmActionLog.controller.js";

const router = Router();

/**
 * -----------------------------------------------------
 * GET /api/gmtool/actionlog
 * -----------------------------------------------------
 * Description:
 *   Query GM action logs with filtering and pagination.
 *
 * Query Parameters:
 *   - gmUserNum  : number (optional) - filter by GM user
 *   - actionType : string (optional) - e.g. 'UPDATE_CHARACTER'
 *   - entityType : string (optional) - e.g. 'CHARACTER', 'USER'
 *   - entityId   : string (optional) - specific entity
 *   - httpMethod  : string (optional) - GET, POST, PATCH, etc.
 *   - dateFrom   : ISO string (optional) - start date
 *   - dateTo     : ISO string (optional) - end date
 *   - search     : string (optional) - free text search
 *   - page       : number (optional, default 1)
 *   - limit      : number (optional, default 50, max 100)
 *
 * Examples:
 *   GET /api/gmtool/actionlog?actionType=UPDATE_CHARACTER&page=1&limit=20
 *   GET /api/gmtool/actionlog?gmUserNum=1&dateFrom=2026-03-01
 *   GET /api/gmtool/actionlog?entityType=USER&entityId=1001
 *
 * Success Response:
 *   {
 *     "ok": true,
 *     "rows": [
 *       {
 *         "LogID": 1,
 *         "GmUserNum": 1,
 *         "GmUserID": "admin",
 *         "GmUserType": 50,
 *         "ActionType": "UPDATE_CHARACTER",
 *         "HttpMethod": "PATCH",
 *         "HttpPath": "/api/gmtool/character/10045",
 *         "EntityType": "CHARACTER",
 *         "EntityID": "10045",
 *         "Description": "UPDATE_CHARACTER via PATCH /character/10045",
 *         "RequestBody": "{\"level\":180}",
 *         "MetadataJson": null,
 *         "IPAddress": "192.168.1.1",
 *         "UserAgent": "Mozilla/5.0...",
 *         "Success": true,
 *         "ResponseStatus": 200,
 *         "CreatedAt": "2026-03-01T10:30:00.000Z"
 *       }
 *     ],
 *     "pagination": { "page": 1, "limit": 50, "total": 234 }
 *   }
 */
router.get("/", gmActionLogController.getGmActionLogsController);

/**
 * -----------------------------------------------------
 * GET /api/gmtool/actionlog/action-types
 * -----------------------------------------------------
 * Description:
 *   Returns the list of distinct action types in the log.
 *   Useful for populating filter dropdowns in the admin UI.
 *
 * Success Response:
 *   {
 *     "ok": true,
 *     "actionTypes": [
 *       "BLOCK_USER",
 *       "CREATE_USER",
 *       "SEARCH_CHARACTERS",
 *       "UPDATE_CHARACTER",
 *       ...
 *     ]
 *   }
 */
router.get("/action-types", gmActionLogController.getActionTypesController);

export default router;
