/**
 * =====================================================
 * GM Item API (Read Only)
 * =====================================================
 * Base Path : /gm/items
 * Auth      : Session-based authentication
 * Access   : GM / Admin only
 *
 * Description:
 *   Read-only endpoints for viewing character inventory
 *   items. No mutation is allowed in this phase.
 * =====================================================
 */

import { Router } from "express";
import * as controller from "./gmItem.controller.js";
import { requireAuth } from "../../../api/middlewares/auth.middleware.js";
import { requireGmToolAccess } from "../user/gmTool.permissions.js";

const router = Router();

router.use(requireAuth);
router.use(requireGmToolAccess);

/**
 * -----------------------------------------------------
 * GET /gm/items/character/:chaNum
 * -----------------------------------------------------
 * Description:
 *   Retrieve inventory items for a character.
 *
 * Query Parameters:
 *   - invenType : number (required)
 *
 * Notes:
 *   - Read-only
 *   - Uses dbo.sp_ItemGetItemList
 */
router.get("/character/:chaNum", controller.getCharacterItemsController);

export default router;
