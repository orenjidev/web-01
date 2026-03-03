/**
 * =====================================================
 * Public Config API
 * =====================================================
 * Base Path : /api/public
 *
 * Description:
 *   Publicly accessible endpoint that exposes
 *   non-sensitive server configuration data used
 *   by the client application for UI behavior,
 *   feature toggles, and display values.
 *
 * Auth:
 *   - Public
 *
 * Notes:
 *   - Data is read-only
 *   - Values are sourced from baseServerConfig
 *   - Safe for unauthenticated access
 * =====================================================
 */
import express from "express";
import { getPublicConfig, getPublicStats } from "../controllers/publicConfig.controller.js";

const router = express.Router();

/**
 * -----------------------------------------------------
 * GET /api/public/config
 * -----------------------------------------------------
 * Description:
 *   Retrieve public server configuration and
 *   feature availability settings.
 *
 * Success Response:
 * {
 *   serverName     : string,
 *   serverWebsite : string,
 *   serverMotto   : string,
 *   ePointsName   : string,
 *   footertext    : string,
 *
 *   features : {
 *     changePassword   : boolean,
 *     changePin        : boolean,
 *     changeEmail      : boolean,
 *     topUp            : boolean,
 *     characterDelete  : boolean,
 *     ticketSystem     : boolean
 *   },
 *
 *   gameoptions : {
 *     changeSchool : {
 *       enabled  : boolean,
 *       fee      : number,
 *       currency : string
 *     },
 *
 *     resetStats : {
 *       enabled  : boolean,
 *       fee      : number,
 *       currency : string
 *     },
 *
 *     reborn : {
 *       enabled : boolean,
 *       tiers   : [
 *         {
 *           stage       : number,
 *           from        : number,
 *           to          : number,
 *           levelReq    : number,
 *           fee         : number,
 *           statReward  : number
 *         }
 *       ]
 *     },
 *
 *     vp2ep : {
 *       enabled : boolean,
 *       min     : number,
 *       rate    : number
 *     },
 *
 *     ep2vp : {
 *       enabled : boolean,
 *       min     : number,
 *       rate    : number
 *     },
 *
 *     uihelper : {
 *       max_topnews : number,
 *       max_toprank : number,
 *       max_rankall : number
 *     },
 *
 *     classes : {
 *       brawler   : boolean,
 *       swordsman : boolean,
 *       archer    : boolean,
 *       shaman    : boolean,
 *       extreme   : boolean,
 *       gunner    : boolean,
 *       assassin  : boolean,
 *       magician  : boolean,
 *       shaper    : boolean
 *     },
 *
 *     social : {
 *       enabled  : boolean,
 *       facebook : string | null,
 *       x        : string | null,
 *       youtube  : string | null,
 *       twitch   : string | null,
 *       steam    : string | null
 *     }
 *   }
 * }
 *
 * Error Response:
 *   - None defined at route level
 */
router.get("/config", getPublicConfig);

/**
 * -----------------------------------------------------
 * GET /api/public/stats
 * -----------------------------------------------------
 * Description:
 *   Public server statistics for the game portal home page.
 *   Returns active players, total accounts, and total characters
 *   from the latest ServerStatsDaily snapshot. No auth required.
 *
 * Success Response:
 * {
 *   activePlayers  : number,
 *   totalAccounts  : number,
 *   totalCharacters: number
 * }
 */
router.get("/stats", getPublicStats);

export default router;
