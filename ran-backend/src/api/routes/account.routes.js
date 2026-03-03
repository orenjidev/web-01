/**
 * =====================================================
 * Account API
 * =====================================================
 * Base Path : /api/account
 * Auth      : Bearer Token (Required for all routes)
 *
 * Description:
 *   Endpoints for authenticated user account management,
 *   such as credentials, security data, and profile info.
 * =====================================================
 */
import { Router } from "express";
import * as accountController from "../controllers/account.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

/**
 * -----------------------------------------------------
 * POST /api/account/change-password
 * -----------------------------------------------------
 * Description:
 *   Change the password of the authenticated user.
 *
 * Request Body:
 *   - oldPassword : string (required)
 *   - newPassword : string (required)
 *
 * Success Response:
 *   - message : string
 *
 * Error Cases:
 *   - Invalid old password
 *   - Weak or invalid new password
 */
router.post("/change-password", accountController.changePasswordController);

/**
 * -----------------------------------------------------
 * POST /api/account/change-pincode
 * -----------------------------------------------------
 * Description:
 *   Change the PIN code of the authenticated user.
 *
 * Request Body:
 *   - oldPin : string (required)
 *   - newPin : string (required)
 *
 * Success Response:
 *   - message : string
 *
 * Error Cases:
 *   - Invalid old PIN
 *   - Invalid PIN format
 */
router.post("/change-pincode", accountController.changePincodeController);

/**
 * -----------------------------------------------------
 * POST /api/account/change-email
 * -----------------------------------------------------
 * Description:
 *   Change the email address of the authenticated user.
 *   Requires password confirmation.
 *
 * Request Body:
 *   - email    : string (required)
 *   - password : string (required)
 *
 * Success Response:
 *   - message : string
 *
 * Error Cases:
 *   - Incorrect password
 *   - Email already in use
 *   - Invalid email format
 */
router.post("/change-email", accountController.changeEmailController);

/**
 * -----------------------------------------------------
 * GET /api/account/me
 * -----------------------------------------------------
 * Description:
 *   Retrieve the authenticated user's account details.
 *
 * Success Response:
 *   - userId   : number | string
 *   - username : string
 *   - email    : string
 *   - userType : string
 */
router.get("/me", accountController.getAccountInfoController);

export default router;
