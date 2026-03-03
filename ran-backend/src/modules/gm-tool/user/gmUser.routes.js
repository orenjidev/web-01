/**
 * =====================================================
 * GM Tool - User Routes
 * =====================================================
 * Base Path : /api/gmtool  (mounted at "/" in gmTool.routes.js)
 * Auth      : Inherited from parent gmTool router
 * Access    : GM / Admin / SuperAdmin only
 *
 * Description:
 *   User account management endpoints for privileged staff.
 *   Covers users, login logs, shop bank, top-ups, referrals,
 *   and PCID blocks. Mirrors legacy GM .exe operations.
 *
 *   Auth middleware is applied by the parent gmTool router.
 *   All write operations are audited via ActionLog.
 * =====================================================
 */
import { Router } from "express";
import * as gmToolController from "./gmTool.controller.js";

const router = Router();

/**
 * -----------------------------------------------------
 * GET /api/gmtool/users
 * -----------------------------------------------------
 * Description:
 *   Search or list user accounts with optional filtering.
 *
 * Query Parameters:
 *   - by    : string (optional, default "all")
 *       "userNum" — search by UserNum (partial match)
 *       "userId"  — search by UserID (partial match)
 *       "email"   — search by email (partial match)
 *       "pcid"    — search by PCID (partial match)
 *       "type"    — filter by UserType (exact match)
 *       "all"     — no filter, return all
 *   - q     : string (optional) — search keyword
 *   - limit : number (optional, default 50, max 200)
 *
 * Examples:
 *   GET /api/gmtool/users
 *     → all users (up to 50)
 *
 *   GET /api/gmtool/users?by=userId&q=admin&limit=10
 *     → users whose ID contains "admin"
 *
 *   GET /api/gmtool/users?by=type&q=50
 *     → all GM-type accounts
 *
 * Success Response:
 *   {
 *     "ok": true,
 *     "rows": [
 *       {
 *         "UserNum": 1001,
 *         "UserID": "player01",
 *         "UserEmail": "player@mail.com",
 *         "UserType": 0,
 *         "UserLoginState": 0,
 *         "UserAvailable": 1,
 *         "UserBlock": 0,
 *         "UserPCID": "ABC123"
 *       }
 *     ]
 *   }
 */
router.get("/users", gmToolController.searchUsersController);

/**
 * -----------------------------------------------------
 * POST /api/gmtool/users
 * -----------------------------------------------------
 * Description:
 *   Create a new user account. Mirrors legacy UserInfoNew.
 *   Action is audited.
 *
 * Request Body:
 *   {
 *     "userId":    "newplayer",    // required
 *     "pass":      "hashed_pass",  // required
 *     "pass2":     "hashed_pass2", // required (secondary password)
 *     "email":     "user@mail.com",
 *     "userType":  0,
 *     "chaRemain": 4,              // character slots
 *     "userPoint": 0               // starting points
 *   }
 *
 * Success Response:
 *   { "ok": true, "message": "Success" }
 *
 * Error Response:
 *   { "ok": false, "message": "..." }   → 403
 */
router.post("/users", gmToolController.createUserController);

/**
 * -----------------------------------------------------
 * GET /api/gmtool/users/:userNum
 * -----------------------------------------------------
 * Description:
 *   Retrieve full account information for a specific user.
 *
 * Path Parameters:
 *   - userNum : number (required)
 *
 * Example:
 *   GET /api/gmtool/users/1001
 *
 * Success Response:
 *   {
 *     "ok": true,
 *     "user": {
 *       "UserNum": 1001,
 *       "UserID": "player01",
 *       "UserEmail": "player@mail.com",
 *       "UserType": 0,
 *       "UserBlock": 0,
 *       "UserAvailable": 1,
 *       "UserPoint": 500,
 *       "UserPCID": "ABC123",
 *       "LastLoginDate": "2026-02-28T10:00:00.000Z"
 *     }
 *   }
 *
 * Error Response (not found):
 *   { "ok": false }   → 404
 */
router.get("/users/:userNum", gmToolController.getUserController);

/**
 * -----------------------------------------------------
 * PUT /api/gmtool/users/:userNum
 * -----------------------------------------------------
 * Description:
 *   Update full user account data. Mirrors legacy SaveUserInfo.
 *   Action is audited.
 *
 * Path Parameters:
 *   - userNum : number (required)
 *
 * Request Body:
 *   {
 *     "userPass":       "hashed_pass",
 *     "userPass2":      "hashed_pass2",
 *     "userEmail":      "new@mail.com",
 *     "userType":       0,
 *     "userLoginState": 0,
 *     "userAvailable":  1,
 *     "chaRemain":      4,
 *     "userPoint":      1000,
 *     "referralPer":    0,
 *     "referralUser":   0,
 *     "userBlock":      0,
 *     "userBlockDate":  null,
 *     "chatBlockDate":  null,
 *     "premiumDate":    null
 *   }
 *
 * Success Response:
 *   { "ok": true, "message": "Success" }
 */
router.put("/users/:userNum", gmToolController.saveUserController);

/**
 * -----------------------------------------------------
 * POST /api/gmtool/users/:userNum/block
 * -----------------------------------------------------
 * Description:
 *   Block a user account until a specified datetime.
 *   Sets UserBlock = 1 and UserBlockDate. Action is audited.
 *
 * Path Parameters:
 *   - userNum : number (required)
 *
 * Request Body:
 *   { "until": "2026-12-31T23:59:59Z" }
 *
 * Example:
 *   POST /api/gmtool/users/1001/block
 *   { "until": "2026-03-07T00:00:00Z" }
 *
 * Success Response:
 *   { "ok": true }
 */
router.post("/users/:userNum/block", gmToolController.blockUserController);

/**
 * -----------------------------------------------------
 * POST /api/gmtool/users/:userNum/chat-block
 * -----------------------------------------------------
 * Description:
 *   Restrict a user's chat until a specified datetime.
 *   Sets ChatBlockDate. Action is audited.
 *
 * Path Parameters:
 *   - userNum : number (required)
 *
 * Request Body:
 *   { "until": "2026-03-07T00:00:00Z" }
 *
 * Success Response:
 *   { "ok": true }
 */
router.post(
  "/users/:userNum/chat-block",
  gmToolController.chatBlockUserController,
);

/**
 * -----------------------------------------------------
 * POST /api/gmtool/users/:userNum/force-offline
 * -----------------------------------------------------
 * Description:
 *   Force a user offline by setting UserLoginState = 0.
 *   Useful when a user is stuck in an online state.
 *   Action is audited.
 *
 * Path Parameters:
 *   - userNum : number (required)
 *
 * Example:
 *   POST /api/gmtool/users/1001/force-offline
 *
 * Success Response:
 *   { "ok": true }
 */
router.post(
  "/users/:userNum/force-offline",
  gmToolController.forceOfflineController,
);

/**
 * -----------------------------------------------------
 * GET /api/gmtool/users/:userNum/login-logs
 * -----------------------------------------------------
 * Description:
 *   Retrieve login history for a user, ordered by most recent.
 *
 * Path Parameters:
 *   - userNum : number (required)
 *
 * Example:
 *   GET /api/gmtool/users/1001/login-logs
 *
 * Success Response:
 *   {
 *     "ok": true,
 *     "rows": [
 *       {
 *         "LogDate": "2026-02-28T09:45:00.000Z",
 *         "LogIpAddress": "192.168.1.10",
 *         "LogPCID": "ABC123"
 *       }
 *     ]
 *   }
 */
router.get(
  "/users/:userNum/login-logs",
  gmToolController.getLoginLogsController,
);

/**
 * -----------------------------------------------------
 * DELETE /api/gmtool/users/:userNum/login-logs
 * -----------------------------------------------------
 * Description:
 *   Clear all login history entries for a user.
 *   Action is audited.
 *
 * Path Parameters:
 *   - userNum : number (required)
 *
 * Example:
 *   DELETE /api/gmtool/users/1001/login-logs
 *
 * Success Response:
 *   { "ok": true }
 */
router.delete(
  "/users/:userNum/login-logs",
  gmToolController.clearLoginLogsController,
);

/**
 * -----------------------------------------------------
 * GET /api/gmtool/users/:userNum/characters
 * -----------------------------------------------------
 * Description:
 *   Retrieve all characters belonging to a user.
 *
 * Path Parameters:
 *   - userNum : number (required)
 *
 * Example:
 *   GET /api/gmtool/users/1001/characters
 *
 * Success Response:
 *   {
 *     "ok": true,
 *     "rows": [
 *       {
 *         "ChaNum": 10045,
 *         "ChaName": "RanWarrior",
 *         "ChaClass": 1,
 *         "ChaSchool": 2,
 *         "ChaLevel": 180,
 *         "ChaDeleted": 0
 *       }
 *     ]
 *   }
 */
router.get(
  "/users/:userNum/characters",
  gmToolController.getUserCharactersController,
);

/**
 * -----------------------------------------------------
 * GET /api/gmtool/users/:userNum/referrals
 * -----------------------------------------------------
 * Description:
 *   Retrieve referral history for a user via sp_GetReferral.
 *
 * Path Parameters:
 *   - userNum : number (required)
 *
 * Example:
 *   GET /api/gmtool/users/1001/referrals
 *
 * Success Response:
 *   { "ok": true, "rows": [...] }
 */
router.get(
  "/users/:userNum/referrals",
  gmToolController.getUserReferralsController,
);

/**
 * -----------------------------------------------------
 * GET /api/gmtool/users/:userId/bank
 * -----------------------------------------------------
 * Description:
 *   Retrieve pending (unclaimed) shop bank items for a user.
 *
 * Path Parameters:
 *   - userId : string (UserID, not UserNum)
 *
 * Example:
 *   GET /api/gmtool/users/player01/bank
 *
 * Success Response:
 *   {
 *     "ok": true,
 *     "rows": [
 *       {
 *         "PurKey": "uuid-xxx",
 *         "ProductNum": 101,
 *         "PurPrice": 500
 *       }
 *     ]
 *   }
 */
router.get("/users/:userId/bank", gmToolController.getUserBankController);

/**
 * -----------------------------------------------------
 * POST /api/gmtool/users/:userId/bank
 * -----------------------------------------------------
 * Description:
 *   Manually insert a shop item into a user's bank.
 *
 * Path Parameters:
 *   - userId : string (UserID)
 *
 * Request Body:
 *   {
 *     "productNum": 101,
 *     "itemMain":   1234,
 *     "itemSub":    0
 *   }
 *
 * Example:
 *   POST /api/gmtool/users/player01/bank
 *   { "productNum": 101, "itemMain": 1234, "itemSub": 0 }
 *
 * Success Response:
 *   { "ok": true }
 */
router.post("/users/:userId/bank", gmToolController.insertUserBankController);

/**
 * -----------------------------------------------------
 * POST /api/gmtool/users/:userId/bank/clear
 * -----------------------------------------------------
 * Description:
 *   Mark all pending bank items as taken (PurFlag = 1).
 *   Action is audited.
 *
 * Path Parameters:
 *   - userId : string (UserID)
 *
 * Example:
 *   POST /api/gmtool/users/player01/bank/clear
 *
 * Success Response:
 *   { "ok": true }
 */
router.post(
  "/users/:userId/bank/clear",
  gmToolController.clearUserBankController,
);

/**
 * -----------------------------------------------------
 * POST /api/gmtool/users/:userId/bank/:purKey/taken
 * -----------------------------------------------------
 * Description:
 *   Mark a single bank item as taken by its purchase key.
 *
 * Path Parameters:
 *   - userId : string (UserID)
 *   - purKey : string (PurKey / purchase UUID)
 *
 * Example:
 *   POST /api/gmtool/users/player01/bank/uuid-xxx/taken
 *
 * Success Response:
 *   { "ok": true }
 */
router.post(
  "/users/:userId/bank/:purKey/taken",
  gmToolController.setBankTakenController,
);

/**
 * -----------------------------------------------------
 * GET /api/gmtool/topups
 * -----------------------------------------------------
 * Description:
 *   List all unused top-up/prepaid codes.
 *
 * Example:
 *   GET /api/gmtool/topups
 *
 * Success Response:
 *   {
 *     "ok": true,
 *     "rows": [
 *       {
 *         "idx": 1,
 *         "ECode": "TOPUP-XXXX",
 *         "EPin": "1234",
 *         "EValue": 500,
 *         "GenDate": "2026-02-01T00:00:00.000Z"
 *       }
 *     ]
 *   }
 */
router.get("/topups", gmToolController.listTopupsController);

/**
 * -----------------------------------------------------
 * POST /api/gmtool/topups/generate
 * -----------------------------------------------------
 * Description:
 *   Generate a batch of new top-up codes via TopUpGenerate SP.
 *
 * Request Body:
 *   {
 *     "count": 10,   // number of codes to generate
 *     "value": 500   // point value per code
 *   }
 *
 * Example:
 *   POST /api/gmtool/topups/generate
 *   { "count": 50, "value": 1000 }
 *
 * Success Response:
 *   { "ok": true, "generated": 50 }
 */
router.post("/topups/generate", gmToolController.generateTopupsController);

/**
 * -----------------------------------------------------
 * POST /api/gmtool/topups/:idx/use
 * -----------------------------------------------------
 * Description:
 *   Manually mark a top-up code as used.
 *
 * Path Parameters:
 *   - idx : number (required)
 *
 * Example:
 *   POST /api/gmtool/topups/1/use
 *
 * Success Response:
 *   { "ok": true }
 */
router.post("/topups/:idx/use", gmToolController.setTopupUsedController);

/**
 * -----------------------------------------------------
 * GET /api/gmtool/pcid
 * -----------------------------------------------------
 * Description:
 *   List all blocked PC identifiers (PCID).
 *
 * Example:
 *   GET /api/gmtool/pcid
 *
 * Success Response:
 *   {
 *     "ok": true,
 *     "rows": [
 *       {
 *         "BlockIdx": 1,
 *         "BlockPCID": "ABC123",
 *         "BlockTYPE": 0,
 *         "BlockReason": "Cheating",
 *         "BlockDate": "2026-02-01T00:00:00.000Z"
 *       }
 *     ]
 *   }
 */
router.get("/pcid", gmToolController.listPcidBlocksController);

/**
 * -----------------------------------------------------
 * POST /api/gmtool/pcid
 * -----------------------------------------------------
 * Description:
 *   Add a PCID to the block list. Action is audited.
 *
 * Request Body:
 *   {
 *     "pcid":   "ABC123",    // required
 *     "reason": "Cheating"   // optional
 *   }
 *
 * Example:
 *   POST /api/gmtool/pcid
 *   { "pcid": "XYZ999", "reason": "Multi-account abuse" }
 *
 * Success Response:
 *   { "ok": true }
 */
router.post("/pcid", gmToolController.insertPcidBlockController);

/**
 * -----------------------------------------------------
 * DELETE /api/gmtool/pcid/:idx
 * -----------------------------------------------------
 * Description:
 *   Remove a PCID block entry by its index.
 *
 * Path Parameters:
 *   - idx : number (required) — BlockIdx from GET /pcid
 *
 * Example:
 *   DELETE /api/gmtool/pcid/1
 *
 * Success Response:
 *   { "ok": true }
 */
router.delete("/pcid/:idx", gmToolController.deletePcidBlockController);

export default router;
