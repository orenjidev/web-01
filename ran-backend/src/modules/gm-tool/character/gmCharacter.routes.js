/**
 * =====================================================
 * GM Tool - Character API
 * =====================================================
 * Base Path : /api/gmtool/character
 * Auth      : Inherited from parent gmTool router
 * Access    : GM / Admin / SuperAdmin only
 *
 * Description:
 *   Character management endpoints for privileged staff.
 *   Mirrors legacy ADOManager character DB operations:
 *   - ChaSearchName / ChaSearchChaNum / ChaSearchUserNum
 *   - GetCharInfo (base, currency, battle stats, PK combo)
 *   - SaveCharInfoBase / SaveCharInfoEtc
 *
 *   Auth middleware is applied by the parent gmTool router.
 *   All write operations are audited via ActionLog.
 * =====================================================
 */
import { Router } from "express";
import * as gmCharacterController from "./gmCharacter.controller.js";

const router = Router();

/**
 * -----------------------------------------------------
 * GET /api/gmtool/character/search
 * -----------------------------------------------------
 * Description:
 *   Search characters by name, ChaNum, or UserNum.
 *   If no query is provided with type=name, returns all
 *   characters up to the limit.
 *
 * Query Parameters:
 *   - type  : string (optional, default "name")
 *       "name"    — LIKE search on ChaName
 *       "chanum"  — exact match on ChaNum (q required)
 *       "usernum" — all characters for a UserNum (q required)
 *   - q     : string (optional for name, required for chanum/usernum)
 *   - limit : number (optional, default 50, max 100) — name search only
 *
 * Examples:
 *   GET /api/gmtool/character/search
 *     → returns all characters (up to 50)
 *
 *   GET /api/gmtool/character/search?q=Ran&limit=10
 *     → characters whose name contains "Ran"
 *
 *   GET /api/gmtool/character/search?type=chanum&q=10045
 *     → exact character with ChaNum 10045
 *
 *   GET /api/gmtool/character/search?type=usernum&q=2001
 *     → all characters belonging to UserNum 2001
 *
 * Success Response:
 *   {
 *     "ok": true,
 *     "rows": [
 *       {
 *         "UserNum": 2001,
 *         "ChaNum": 10045,
 *         "ChaName": "RanWarrior",
 *         "ChaClass": 1,
 *         "ChaSchool": 2,
 *         "ChaLevel": 180,
 *         "ChaOnline": 0,
 *         "ChaDeleted": 0
 *       }
 *     ]
 *   }
 *
 * Error Response:
 *   { "ok": false, "message": "INVALID_CHANUM" }   // chanum with no q
 *   { "ok": false, "message": "INVALID_USERNUM" }  // usernum with no q
 */
router.get("/search", gmCharacterController.searchCharactersController);

/**
 * -----------------------------------------------------
 * GET /api/gmtool/character/:chaNum
 * -----------------------------------------------------
 * Description:
 *   Retrieve full character detail for a given ChaNum.
 *   Aggregates data from multiple sources:
 *     - ChaInfo (base stats, position, attributes)
 *     - ChaInfoCurrencySelect SP (play time, points)
 *     - sp_ChaBattleStatSelect SP (PVP/PVE statistics)
 *     - sp_ChaPKComboSelect SP (PK combo counts)
 *
 * Path Parameters:
 *   - chaNum : number (required)
 *
 * Example:
 *   GET /api/gmtool/character/10045
 *
 * Success Response:
 *   {
 *     "ok": true,
 *     "character": {
 *       "base": {
 *         "UserNum": 2001,
 *         "ChaName": "RanWarrior",
 *         "ChaClass": 1,
 *         "ChaLevel": 180,
 *         "ChaMoney": 5000000,
 *         "ChaHP": 9999,
 *         "ChaMP": 4000,
 *         "ChaSP": 500,
 *         "ChaPower": 80,
 *         "ChaDex": 60,
 *         "ChaStrong": 70,
 *         "ChaSpirit": 50,
 *         "ChaStrength": 75,
 *         "ChaIntel": 40,
 *         "ChaStRemain": 0,
 *         "ChaSchool": 2,
 *         "ChaReborn": 1,
 *         "ChaOnline": 0,
 *         "ChaDeleted": 0
 *       },
 *       "currency": {
 *         "PlayTime": 36000,
 *         "PlayPoint": 1500,
 *         "ContributionPoint": 200
 *       },
 *       "battleStats": {
 *         "LeaguePoint": 3200,
 *         "PVPKills": 540,
 *         "PVPDeaths": 120,
 *         "PVEMobKills": 98000,
 *         "PVEGoldLoot": 75000000
 *       },
 *       "pkCombo": {
 *         "counts": [10, 5, 2, 1, 0, 0, 0, 0]
 *       }
 *     }
 *   }
 *
 * Error Response (not found):
 *   { "ok": false }   → 404
 *
 * Notes:
 *   - Binary blob fields (skills, quest, codex, battle pass)
 *     require game-engine deserialization and are excluded.
 *   - currency/battleStats/pkCombo are null if the SP does
 *     not exist or returns no rows.
 */
router.get("/:chaNum", gmCharacterController.getCharacterDetailController);

/**
 * -----------------------------------------------------
 * PATCH /api/gmtool/character/:chaNum
 * -----------------------------------------------------
 * Description:
 *   Partially update a character's data.
 *   Only fields present in the request body are modified.
 *   All changes are logged to ActionLog.
 *
 * Path Parameters:
 *   - chaNum : number (required)
 *
 * Request Body (all fields optional):
 *   Field         DB Column       Range
 *   ------------- --------------- --------
 *   level         ChaLevel        1–999
 *   money         ChaMoney        ≥ 0
 *   hp            ChaHP           ≥ 0
 *   mp            ChaMP           ≥ 0
 *   sp            ChaSP           ≥ 0
 *   cp            ChaCP           ≥ 0
 *   skillPoint    ChaSkillPoint   ≥ 0
 *   statsRemain   ChaStRemain     ≥ 0
 *   pow           ChaPower        0–9999
 *   dex           ChaDex          0–9999
 *   str           ChaStrong       0–9999
 *   spi           ChaSpirit       0–9999
 *   sta           ChaStrength     0–9999
 *   intel         ChaIntel        0–9999
 *   school        ChaSchool       0–9
 *   hair          ChaHair         ≥ 0
 *   face          ChaFace         ≥ 0
 *   hairColor     ChaHairColor    ≥ 0
 *   sex           ChaSex          0 or 1
 *   living        ChaLiving       ≥ 0
 *   isOnline      ChaOnline       0 or 1
 *   isDeleted     ChaDeleted      0 or 1
 *
 * Example — level up and give gold:
 *   PATCH /api/gmtool/character/10045
 *   Content-Type: application/json
 *   {
 *     "level": 180,
 *     "money": 10000000
 *   }
 *
 * Example — max stats:
 *   PATCH /api/gmtool/character/10045
 *   {
 *     "pow": 255, "dex": 255, "str": 255,
 *     "spi": 255, "sta": 255, "intel": 255
 *   }
 *
 * Example — restore deleted character:
 *   PATCH /api/gmtool/character/10045
 *   { "isDeleted": 0 }
 *
 * Success Response:
 *   { "ok": true }
 *
 * Error Responses:
 *   { "ok": false, "message": "NO_FIELDS_PROVIDED" }
 *   { "ok": false, "message": "INVALID_VALUE: level" }
 *   { "ok": false, "message": "OUT_OF_RANGE: school" }
 */
router.patch("/:chaNum", gmCharacterController.updateCharacterController);

router.get("/:chaNum/skills", gmCharacterController.getCharacterSkills);
router.put("/:chaNum/skills", gmCharacterController.updateCharacterSkills);

router.get("/:chaNum/puton", gmCharacterController.getPutOnItems);
router.post("/:chaNum/puton/save", gmCharacterController.savePutOnController);

export default router;
