import { Router } from "express";
import { requireStaff } from "../../middlewares/auth.middleware.js";
import { getWebPool } from "../../../loaders/mssql.js";

const router = Router();
router.use(requireStaff);

/**
 * POST /api/adminpanel/master/reset
 * Body: { accessCode: string, target: "action-logs" | "server-config" | "full" }
 *
 * Verifies MASTER_ACCESS_CODE from .env before executing any reset.
 */
router.post("/reset", async (req, res) => {
  const { accessCode, target } = req.body;

  if (!process.env.MASTER_ACCESS_CODE) {
    return res.status(503).json({ ok: false, message: "MASTER_ACCESS_CODE not configured on server." });
  }

  if (!accessCode || accessCode.trim() !== process.env.MASTER_ACCESS_CODE.trim()) {
    return res.status(403).json({ ok: false, message: "Invalid access code." });
  }

  const VALID_TARGETS = ["action-logs", "action-logs-gm", "news", "downloads", "tickets", "server-config", "full", "restart"];
  if (!VALID_TARGETS.includes(target)) {
    return res.status(400).json({ ok: false, message: "Invalid reset target." });
  }

  if (target === "restart") {
    res.json({ ok: true, message: "Backend is restarting…" });
    setTimeout(() => process.exit(0), 300);
    return;
  }

  try {
    const pool = await getWebPool();

    if (target === "action-logs") {
      await pool.request().query(`TRUNCATE TABLE dbo.ActionLog`);
      return res.json({ ok: true, message: "Action logs cleared." });
    }

    if (target === "action-logs-gm") {
      await pool.request().query(`TRUNCATE TABLE dbo.ActionLogGM`);
      return res.json({ ok: true, message: "GM action logs cleared." });
    }

    if (target === "news") {
      await pool.request().query(`DELETE FROM dbo.News`);
      return res.json({ ok: true, message: "All news deleted." });
    }

    if (target === "downloads") {
      await pool.request().query(`DELETE FROM dbo.DownloadLinks`);
      return res.json({ ok: true, message: "All download links deleted." });
    }

    if (target === "tickets") {
      // Delete in FK-safe order
      await pool.request().query(`DELETE FROM dbo.TicketHistory`);
      await pool.request().query(`DELETE FROM dbo.TicketAttachments`);
      await pool.request().query(`DELETE FROM dbo.TicketReplies`);
      await pool.request().query(`DELETE FROM dbo.Tickets`);
      return res.json({ ok: true, message: "All tickets and related data deleted." });
    }

    if (target === "server-config") {
      await pool.request().query(`DELETE FROM dbo.ServerConfig`);
      return res.json({ ok: true, message: "Server config reset to defaults. Restart backend to re-seed." });
    }

    if (target === "full") {
      await pool.request().query(`TRUNCATE TABLE dbo.ActionLog`);
      await pool.request().query(`TRUNCATE TABLE dbo.ActionLogGM`);
      await pool.request().query(`DELETE FROM dbo.News`);
      await pool.request().query(`DELETE FROM dbo.DownloadLinks`);
      await pool.request().query(`DELETE FROM dbo.TicketHistory`);
      await pool.request().query(`DELETE FROM dbo.TicketAttachments`);
      await pool.request().query(`DELETE FROM dbo.TicketReplies`);
      await pool.request().query(`DELETE FROM dbo.Tickets`);
      await pool.request().query(`DELETE FROM dbo.ServerConfig`);
      return res.json({ ok: true, message: "Full web database reset complete. Restart backend to re-seed config." });
    }
  } catch (err) {
    console.error("[MasterReset] Error:", err.message);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

export default router;
