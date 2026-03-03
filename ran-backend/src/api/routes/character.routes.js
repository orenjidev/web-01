/**
 * =====================================================
 * Character API
 * =====================================================
 * Base Path : /api/character
 *
 * Description:
 *   Endpoints for character-related features such as
 *   rankings, character management, and progression
 *   actions.
 *
 * Auth:
 *   - Some endpoints are public
 *   - Most endpoints require authenticated user session
 * =====================================================
 */
import { Router } from "express";
import * as characterService from "../controllers/character.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * -----------------------------------------------------
 * GET /api/character/rankings
 * -----------------------------------------------------
 * Description:
 *   Retrieve character rankings with optional filtering.
 *
 * Auth:
 *   - Public
 *
 * Query Parameters:
 *   - quantity : number (optional, default 100, max 500)
 *   - ctg      : string (optional, class/category filter)
 *
 * Supported Categories:
 *   brawler, swordsman, archer, shaman, extreme,
 *   gunner, assassin, magician, shaper,
 *   sg, mp, pnx, exp, rich
 *
 * Success Response:
 *   - JSON array returned by character service
 *
 * Error Response:
 *   - 500 Internal Server Error
 *   {
 *     error : string
 *   }
 */
router.get("/rankings", characterService.getCharacterRankingController);

/**
 * -----------------------------------------------------
 * Authentication Required Below
 * -----------------------------------------------------
 */
router.use(requireAuth);

/**
 * -----------------------------------------------------
 * GET /api/character/my-character
 * -----------------------------------------------------
 * Description:
 *   Retrieve all characters belonging to the
 *   authenticated user.
 *
 * Auth:
 *   - Authenticated user required
 *
 * Success Response:
 *   {
 *     ok         : true,
 *     characters : array
 *   }
 *
 * Error Response:
 *   - 404 Not Found
 *   {
 *     ok    : false,
 *     error : "NO_CHARACTERS_FOUND"
 *   }
 *
 *   - 500 Internal Server Error
 */
router.get("/my-character", characterService.getMyCharactersController);

/**
 * -----------------------------------------------------
 * POST /api/character/change-school
 * -----------------------------------------------------
 * Description:
 *   Change a character's school.
 *
 * Feature Flag:
 *   - baseServerConfig.changeSchool.enabled must be true
 *
 * Auth:
 *   - Authenticated user required
 *
 * Request Body:
 *   - characterId : number (required)
 *   - school      : string | number (required)
 *
 * Success Response:
 *   {
 *     ok      : true,
 *     message : string
 *   }
 *
 * Error Responses:
 *   - 403 Feature disabled
 *   - 400 Invalid body or rule violation
 *   - 404 Character or user not found
 *   - 401 Unauthorized
 *
 * Possible Error Codes:
 *   INVALID_SCHOOL
 *   SAME_SCHOOL
 *   CHARACTER_NOT_FOUND
 *   USER_MISMATCH
 *   INSUFFICIENT_CHAMONEY
 *   USER_NOT_FOUND
 *   INSUFFICIENT_USERPOINT
 *   UNAUTHORIZED
 */
router.post("/change-school", characterService.changeCharacterSchoolController);

/**
 * -----------------------------------------------------
 * POST /api/character/reset-stats
 * -----------------------------------------------------
 * Description:
 *   Reset a character's stat points.
 *
 * Feature Flag:
 *   - baseServerConfig.resetStats.enabled must be true
 *
 * Auth:
 *   - Authenticated user required
 *
 * Request Body:
 *   - characterId : number (required)
 *
 * Success Response:
 *   {
 *     success : true,
 *     message : string
 *   }
 *
 * Error Response:
 *   - 403 Feature disabled
 *   - 400 Invalid request or service error
 */
router.post("/reset-stats", characterService.resetStatsController);

/**
 * -----------------------------------------------------
 * POST /api/character/reborn
 * -----------------------------------------------------
 * Description:
 *   Perform a reborn operation on a character.
 *
 * Feature Flag:
 *   - baseServerConfig.reborn.enabled must be true
 *
 * Auth:
 *   - Authenticated user required
 *
 * Request Body:
 *   {
 *     char : number
 *   }
 *
 * Success Response:
 *   {
 *     ok      : 1,
 *     message : string,
 *     data    : object
 *   }
 *
 * Failure Response:
 *   {
 *     ok      : 0,
 *     message : string
 *   }
 *
 * Known Failure Messages:
 *   - Reborn system disabled
 *   - Character not found
 *   - Character must be offline
 *   - Level requirement not met
 *   - Not enough gold
 *   - Max reborn reached
 */
router.post("/reborn", characterService.rebornController);
router.get("/reborn-preview", characterService.rebornPreviewController);

/**
 * -----------------------------------------------------
 * POST /api/character/change-class
 * -----------------------------------------------------
 * Description:
 *   Change the class of an owned, offline character.
 *
 *   The character’s gender is preserved automatically.
 *   A character may only change to classes enabled in
 *   configuration and compatible with its gender.
 *
 * Auth:
 *   - Authenticated user required
 *
 * Feature Flag:
 *   - baseServerConfig.changeClass.enabled must be true
 *
 * Request Body:
 *   - characterId : number (required)
 *       Unique character identifier.
 *
 *   - class : string (required)
 *       Target class name.
 *       Must exist in classMap and be enabled in config.
 *
 * Gender Rules:
 *   - Gender is inferred from the current class code
 *   - Male characters may only change to male class codes
 *   - Female characters may only change to female class codes
 *   - Archer and Shaman use inverted gender mappings internally
 *
 * Preconditions:
 *   - Character must exist
 *   - Character must belong to the authenticated user
 *   - Character must be offline
 *   - Target class must be enabled in config
 *   - Target class must not match current class
 *
 * Side Effects:
 *   - ChaClass is updated
 *   - ChaSkillSlot is reset to NULL
 *   - Optional currency cost may be applied
 *   - Action is logged
 *
 * Success Response:
 *   {
 *     ok      : true,
 *     message : "Character class updated successfully"
 *   }
 *
 * Error Responses:
 *
 *   400 Bad Request
 *   {
 *     ok    : false,
 *     error : "INVALID_BODY"
 *   }
 *
 *   400 Bad Request
 *   {
 *     ok    : false,
 *     error : "INVALID_CLASS"
 *   }
 *
 *   400 Bad Request
 *   {
 *     ok    : false,
 *     error : "SAME_CLASS"
 *   }
 *
 *   400 Bad Request
 *   {
 *     ok    : false,
 *     error : "CHARACTER_ONLINE"
 *   }
 *
 *   400 Bad Request
 *   {
 *     ok    : false,
 *     error : "INSUFFICIENT_CHAMONEY"
 *   }
 *
 *   403 Forbidden
 *   {
 *     ok    : false,
 *     error : "USER_MISMATCH"
 *   }
 *
 *   403 Forbidden
 *   {
 *     ok    : false,
 *     error : "FEATURE_DISABLED"
 *   }
 *
 *   403 Forbidden
 *   {
 *     ok    : false,
 *     error : "CLASS_DISABLED"
 *   }
 *
 *   404 Not Found
 *   {
 *     ok    : false,
 *     error : "CHARACTER_NOT_FOUND"
 *   }
 *
 *   401 Unauthorized
 *   {
 *     ok    : false,
 *     error : "UNAUTHORIZED"
 *   }
 */
router.post(
  "/change-class",
  requireAuth,
  characterService.changeCharacterClassController,
);

/**
 * -----------------------------------------------------
 * POST /api/character/delete
 * -----------------------------------------------------
 * Description:
 *   Permanently delete a character owned by the user.
 *
 * Feature Flag:
 *   - baseServerConfig.features.characterDelete must be true
 *
 * Auth:
 *   - Authenticated user required
 *
 * Request Body:
 *   - characterId : number (required)
 *
 * Success Response:
 *   {
 *     success : true,
 *     message : string
 *   }
 *
 * Error Response:
 *   - 403 Feature disabled
 *   - 400 Invalid request or service error
 */
router.post("/delete", characterService.deleteCharacterController);

export default router;
