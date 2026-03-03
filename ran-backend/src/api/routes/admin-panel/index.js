import { Router } from "express";
import { gmActionLogMiddleware } from "../../../modules/gm-tool/gmActionLog.middleware.js";
import dashboardRoutes from "./dashboard.routes.js";
import characterRoutes from "./character.routes.js";
import shopRoutes from "./shop.routes.js";
import actionlogRoutes from "./actionlog.routes.js";

const router = Router();

router.use(gmActionLogMiddleware);

router.use("/dashboard", dashboardRoutes);
router.use("/character", characterRoutes);
router.use("/shop", shopRoutes);
router.use("/actionlog", actionlogRoutes);

export default router;
