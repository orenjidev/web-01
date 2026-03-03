/**
 * =====================================================
 * Top-Up API
 * =====================================================
 * Base Path : /api/topup
 *
 * Description:
 *   Endpoints for checking, redeeming, listing,
 *   and generating top-up codes.
 *
 * Feature Flag:
 *   - baseServerConfig.features.topup must be true
 *
 * Notes:
 *   - Top-up availability is enforced globally
 *   - User and admin routes are clearly separated
 * =====================================================
 */
import { Router } from "express";

import {
  checkTopupController,
  generateTopupsController,
  listTopupsController,
  listUserTopupsController,
  redeemTopupController,
} from "../controllers/topup.controllers.js";
import {
  requireAuth,
  requireStaff,
  requireTopUpEnabled,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireTopUpEnabled);
/**
 * =====================================================
 * User Routes (Authenticated)
 * =====================================================
 */

/**
 * -----------------------------------------------------
 * GET /api/topup/check
 * -----------------------------------------------------
 * Description:
 *   Validate a top-up code and retrieve its value
 *   without redeeming it.
 *
 * Auth:
 *   - Authenticated user required
 *
 * Query Parameters:
 *   - code : string (required)
 *   - pin  : string (required)
 *
 * Success Response:
 *   {
 *     success : true,
 *     value   : number
 *   }
 *
 * Error Responses:
 *   - 400 Bad Request
 *   {
 *     error : "INVALID_REQUEST"
 *   }
 *
 *   - 400 Bad Request
 *   {
 *     error : string
 *   }
 */
router.get("/history", requireAuth, listUserTopupsController);
router.get("/check", requireAuth, checkTopupController);

/**
 * -----------------------------------------------------
 * POST /api/topup/redeem
 * -----------------------------------------------------
 * Description:
 *   Redeem a top-up code and apply its value
 *   to the authenticated user's account.
 *
 * Auth:
 *   - Authenticated user required
 *
 * Request Body:
 *   - code : string (required)
 *   - pin  : string (required)
 *
 * Context Used:
 *   - userNum : session userNum
 *
 * Success Response:
 *   {
 *     success : true,
 *     message : "TOPUP_SUCCESS"
 *   }
 *
 * Error Responses:
 *   - 400 Bad Request
 *   {
 *     error : "INVALID_REQUEST"
 *   }
 *
 *   - 400 Bad Request
 *   {
 *     error : string
 *   }
 */
router.post("/redeem", requireAuth, redeemTopupController);

/**
 * =====================================================
 * Admin Routes (Staff Only)
 * =====================================================
 */

/**
 * -----------------------------------------------------
 * GET /api/topup/admin/list
 * -----------------------------------------------------
 * Description:
 *   Retrieve a list of generated top-up codes.
 *
 * Auth:
 *   - Staff authentication required
 *
 * Query Parameters:
 *   - used : number (optional)
 *       - null   : all codes
 *       - 0      : unused codes
 *       - 1      : used codes
 *
 * Success Response:
 *   {
 *     success : true,
 *     cards   : array
 *   }
 *
 * Error Response:
 *   - 500 Internal Server Error
 *   {
 *     error : "TOPUP_LIST_FAILED"
 *   }
 */
router.get("/admin/list", requireStaff, listTopupsController);

/**
 * -----------------------------------------------------
 * POST /api/topup/admin/generate
 * -----------------------------------------------------
 * Description:
 *   Generate new top-up codes.
 *
 * Auth:
 *   - Staff authentication required
 *
 * Request Body:
 *   - count : number (required, integer > 0)
 *   - value : number (required, integer > 0)
 *
 * Success Response:
 *   {
 *     success : true,
 *     message : "TOPUP_GENERATION_REQUESTED"
 *   }
 *
 * Error Responses:
 *   - 400 Bad Request
 *   {
 *     error : "INVALID_REQUEST"
 *   }
 *
 *   - 500 Internal Server Error
 *   {
 *     error : "TOPUP_GENERATE_FAILED"
 *   }
 */
router.post("/admin/generate", requireStaff, generateTopupsController);

export default router;
