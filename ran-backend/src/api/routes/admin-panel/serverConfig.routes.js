import { Router } from "express";
import { requireStaff } from "../../middlewares/auth.middleware.js";
import {
  getConfigController,
  updateConfigController,
} from "../../controllers/serverConfig.controller.js";

const router = Router();

router.use(requireStaff);

router.get("/", getConfigController);
router.put("/:section", updateConfigController);

export default router;
