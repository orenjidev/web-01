/**
 * =====================================================
 * Auth API
 * =====================================================
 * Base Path : /api/auth
 * Auth      : Public endpoints (no prior authentication)
 *
 * Description:
 *   Authentication and account access endpoints,
 *   including login, registration, password recovery,
 *   and session logout.
 * =====================================================
 */
import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as authService from "../controllers/auth.controller.js";
import { getMessage } from "../../constants/messages.js";

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (req, res) => {
    const MSG = getMessage(req.ctx?.lang);
    res.status(429).json({ ok: false, message: MSG.RATE_LIMIT.REGISTER });
  },
});

const router = Router();

/**
 * -----------------------------------------------------
 * POST /api/auth/login
 * -----------------------------------------------------
 * Description:
 *   Authenticate a user and create a session.
 *
 * Request Body:
 *   - userid   : string (required, 4–20 chars, regex validated)
 *   - password : string (required, 4–20 chars, regex validated)
 *
 * Notes:
 *   - Request body must contain exactly 2 fields
 *   - Session ID is regenerated on successful login
 *
 * Success Response:
 *   {
 *     ok      : true,
 *     message : string,
 *     user    : {
 *       userid  : string,
 *       userNum : number,
 *       type    : number
 *     }
 *   }
 *
 * Error Response:
 *   - 401 Unauthorized
 *   {
 *     ok      : false,
 *     message : string
 *   }
 *
 * Error Cases:
 *   - Invalid request body size
 *   - Missing credentials
 *   - Invalid characters
 *   - Invalid length
 *   - Username or password mismatch
 *   - Account disabled
 *   - Account blocked
 */
router.post("/login", authService.loginController);

/**
 * -----------------------------------------------------
 * POST /api/auth/register
 * -----------------------------------------------------
 * Description:
 *   Register a new user account.
 *
 * Request Body:
 *   - userid           : string (required, 4–12 chars)
 *   - password         : string (required, 4–11 chars)
 *   - confirmPassword  : string (required)
 *   - pincode          : string (required, 4–11 chars)
 *   - confirmPincode   : string (required)
 *   - email            : string (required, valid email format)
 *
 * Notes:
 *   - Request body must contain 5–7 fields
 *   - Username, password, and pincode must match regex rules
 *   - Username and email must be unique
 *
 * Success Response:
 *   {
 *     ok      : true,
 *     message : string
 *   }
 *
 * Error Response:
 *   - 401 Unauthorized
 *   {
 *     ok      : false,
 *     message : stringw
 *   }
 *
 * Error Cases:
 *   - Invalid body size
 *   - Missing fields
 *   - Length rule violations
 *   - Password or pincode mismatch
 *   - Invalid characters
 *   - Invalid email format
 *   - Username already taken
 *   - Email already taken
 */
router.post("/register", registerLimiter, authService.registerController);

/**
 * -----------------------------------------------------
 * POST /api/auth/forgotpass
 * -----------------------------------------------------
 * Description:
 *   Reset a user's password using their pincode.
 *
 * Request Body:
 *   - userid              : string (required, 4–12 chars)
 *   - pincode             : string (required, 4–11 chars)
 *   - confirmPincode      : string (required)
 *   - newPassword         : string (required, 4–11 chars)
 *   - confirmNewPassword  : string (required)
 *
 * Notes:
 *   - All fields must be present
 *   - Regex validation enforced
 *   - Pincode must match stored value
 *
 * Success Response:
 *   {
 *     ok      : true,
 *     message : string
 *   }
 *
 * Error Response:
 *   - 401 Unauthorized
 *   {
 *     ok      : false,
 *     message : string
 *   }
 *
 * Error Cases:
 *   - Invalid body structure
 *   - Missing fields
 *   - Length rule violations
 *   - Invalid characters
 *   - Pincode mismatch
 *   - New password mismatch
 *   - Invalid user
 */
router.post("/forgotpass", authService.forgotPasswordController);

/**
 * -----------------------------------------------------
 * POST /api/auth/logout
 * -----------------------------------------------------
 * Description:
 *   Destroy the current user session and clear auth cookie.
 *
 * Behavior:
 *   - Session is destroyed server-side
 *   - Auth cookie is cleared
 *   - Client is redirected to login page
 *
 * Redirect:
 *   - http://localhost:3001/login?logout=1
 *
 * Success Response:
 *   - HTTP redirect
 */
router.post("/logout", authService.logoutController);

export default router;
