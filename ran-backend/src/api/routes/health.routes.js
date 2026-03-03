import { Router } from "express";
import { baseServerConfig } from "../../config/server.config.js";

const router = Router();

router.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    maintenance: baseServerConfig.coreOptions.maintenanceMode,
    timestamp: Date.now(),
  });
});

export default router;
