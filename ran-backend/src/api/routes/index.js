/**
 * =====================================================
 * API Route Index
 * =====================================================
 * Base Path : /api
 *
 * Description:
 *   Central route registry for all API modules.
 *   This file mounts feature-specific routers under
 *   their respective base paths.
 *
 * Notes:
 *   - Each route module defines its own authentication,
 *     authorization, and validation rules
 *   - This file performs no access control itself
 * =====================================================
 */
import { Router } from "express";

import authRoutes from "./auth.routes.js";
import accountRoutes from "./account.routes.js";
import adminRoutes from "./admin.routes.js";
import debugRoutes from "./debug.routes.js";
import itemRoutes from "./item.routes.js";
import ticketRoutes from "./ticket.routes.js";
import characterRoutes from "./character.routes.js";
import shopRoutes from "./shop.routes.js";
import healthRoute from "./health.routes.js";
import publicRoutes from "./public.routes.js";
import topUpRoutes from "./topup.routes.js";
import gmToolRoutes from "../../modules/gm-tool/gmTool.routes.js";
import gmItemRoutes from "../../modules/gm-tool/items/gmItem.routes.js";
import newsRoutes from "../routes/news.routes.js";
import downloadRoutes from "../routes/download.routes.js";
import adminPanelRoutes from "./admin-panel/index.js";

const router = Router();

/**
 * -----------------------------------------------------
 * Mounted Routes
 * -----------------------------------------------------
 *
 * /api/auth
 *   - Authentication and session-related endpoints
 *
 * /api/account
 *   - Authenticated user account management
 *
 * /api/admin
 *   - Staff and admin administrative operations
 *
 * /api/debug
 *   - Debug and diagnostic endpoints
 *
 * /api/getshop
 *   - Item and shop-related read operations
 *
 * /api/tickets
 *   - Ticket system endpoints
 *
 * /api/character
 *   - Character management and ranking endpoints
 *
 * /api/shop
 *   - Shop purchasing and shop-related features
 *
 * /api/healthcheck
 *   - Service health and uptime checks
 *
 * /api/public
 *   - Publicly accessible endpoints
 *
 * /api/topup
 *   - Top-up and prepaid code operations
 *
 * /api/items
 *   - items backend - for shop purposes
 *
 * Please maintain documentation
 */
const routes = {
  auth: authRoutes,
  account: accountRoutes,
  admin: adminRoutes,
  adminpanel: adminPanelRoutes,
  debug: debugRoutes,
  getshop: itemRoutes,
  tickets: ticketRoutes,
  character: characterRoutes,
  shop: shopRoutes,
  healthcheck: healthRoute,
  public: publicRoutes,
  topup: topUpRoutes,
  items: itemRoutes,
  news: newsRoutes,
  download: downloadRoutes,
  gmtool: gmToolRoutes,
  gmItem: gmItemRoutes,
};

/**
 * -----------------------------------------------------
 * Route Mounting Logic
 * -----------------------------------------------------
 * Each route module is mounted dynamically using:
 *
 *   router.use(`/${path}`, handler)
 *
 * This allows centralized control of base paths
 * while keeping feature implementations isolated.
 */
Object.entries(routes).forEach(([path, handler]) => {
  router.use(`/${path}`, handler);
});

export default router;
