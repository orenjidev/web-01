/**
 * =====================================================
 * GM Tool - Main Router
 * =====================================================
 * Base Path : /api/gmtool
 * Auth      : Session-based authentication (Required)
 * Access    : GM / Admin / SuperAdmin only
 *
 * Description:
 *   Top-level aggregator for all GM Tool sub-routers.
 *   Applies authentication and access control once here,
 *   then delegates to feature-specific routers:
 *
 *     /api/gmtool/users/*       → gmUser.routes.js
 *     /api/gmtool/topups/*      → gmUser.routes.js
 *     /api/gmtool/pcid/*        → gmUser.routes.js
 *     /api/gmtool/character/*   → gmCharacter.routes.js
 *     /api/gmtool/shop/*        → gmShop.routes.js
 *
 *   All write operations in sub-routers are audited.
 * =====================================================
 */
import { Router } from "express";
import { requireAuth } from "../../api/middlewares/auth.middleware.js";
import { requireGmToolAccess } from "./user/gmTool.permissions.js";
import { gmActionLogMiddleware } from "./gmActionLog.middleware.js";
import gmUserRoutes from "./user/gmUser.routes.js";
import gmCharacterRoutes from "./character/gmCharacter.routes.js";
import gmShopRoutes from "./shop/gmShop.routes.js";
import gmActionLogRoutes from "./actionlog/gmActionLog.routes.js";

const router = Router();

router.use(requireAuth);
router.use(requireGmToolAccess);
router.use(gmActionLogMiddleware);

router.use("/actionlog", gmActionLogRoutes);
router.use("/", gmUserRoutes);
router.use("/character", gmCharacterRoutes);
router.use("/shop", gmShopRoutes);

export default router;
