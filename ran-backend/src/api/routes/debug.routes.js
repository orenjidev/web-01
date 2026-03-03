/**
 * =====================================================
 * Session API
 * =====================================================
 * Base Path : /api/session
 *
 * Description:
 *   Utility endpoint for inspecting the current HTTP
 *   session and authentication state.
 *
 * Notes:
 *   - Intended for debugging or client-side session checks
 *   - Does not modify session state
 * =====================================================
 */
import { Router } from "express";

const router = Router();

/**
 * -----------------------------------------------------
 * GET /api/session/session
 * -----------------------------------------------------
 * Description:
 *   Retrieve information about the current session.
 *
 * Auth:
 *   - Public
 *
 * Response Fields:
 *   - hasCookie : boolean
 *       Indicates whether the request includes a Cookie header
 *
 *   - sessionID : string
 *       Express session identifier
 *
 *   - user : object | null
 *       Session user object if logged in, otherwise null
 *
 * Success Response:
 *   {
 *     hasCookie : boolean,
 *     sessionID : string,
 *     user      : object | null
 *   }
 *
 * Error Response:
 *   - None defined
 */
router.get("/session", (req, res) => {
  res.json({
    hasCookie: !!req.headers.cookie,
    sessionID: req.sessionID,
    user: req.session?.user || null,
  });
});

export default router;
