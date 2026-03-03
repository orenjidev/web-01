/**
 * =====================================================
 * Admin Panel - Character API
 * =====================================================
 * Base Path : /api/adminpanel/character
 * Auth      : Session-based authentication (Required)
 * Access    : Staff (userType >= 50)
 *
 * Description:
 *   Admin panel exposure of character management endpoints.
 *   Shares the same service layer as the GM Tool character
 *   module for consistency. All write operations are audited.
 * =====================================================
 */
import { Router } from "express";
import * as gmCharacterController from "../../../modules/gm-tool/character/gmCharacter.controller.js";
import { requireStaff } from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(requireStaff);

/**
 * GET /api/adminpanel/character/search
 * Search characters by name, ChaNum, or UserNum.
 * Query: type (name|chanum|usernum), q, limit
 */
router.get("/search", gmCharacterController.searchCharactersController);

/**
 * GET /api/adminpanel/character/:chaNum
 * Get full character detail (base, currency, battle stats, PK combo).
 */
router.get("/:chaNum", gmCharacterController.getCharacterDetailController);

/**
 * PATCH /api/adminpanel/character/:chaNum
 * Partially update a character's data. All changes are audited.
 */
router.patch("/:chaNum", gmCharacterController.updateCharacterController);

export default router;
