import express from "express";
import {
  getItemById,
  ITEMS_CACHE_VERSION,
} from "../../services/items.service.js";

const router = express.Router();

/**
 * -----------------------------------------------------
 * GET /api/items/:mid/:sid
 * -----------------------------------------------------
 * Description:
 *   Retrieve static item metadata from the game item pool.
 *   Data is read-only and cached in memory.
 *
 * Example:
 *   /api/items/2/5  → itemId "2-5"
 *
 * Auth:
 *   - Public
 *
 * Cache:
 *   - Browser: 1 day
 *   - CDN: 7 days
 * -----------------------------------------------------
 */
router.get("/:mid/:sid", (req, res) => {
  const { mid, sid } = req.params;

  // ─────────────────────────────
  // Input validation
  // ─────────────────────────────
  const midNum = Number(mid);
  const sidNum = Number(sid);

  if (!Number.isInteger(midNum) || !Number.isInteger(sidNum)) {
    return res.status(400).json({
      ok: false,
      error: "INVALID_ITEM_ID",
    });
  }

  const itemId = `${midNum}-${sidNum}`;
  const item = getItemById(itemId);

  if (!item) {
    return res.status(404).json({
      ok: false,
      error: "ITEM_NOT_FOUND",
    });
  }

  // ─────────────────────────────
  // Cache headers (maintenance-level)
  // ─────────────────────────────
  res.setHeader(
    "Cache-Control",
    "public, max-age=86400, s-maxage=604800, immutable",
  );
  res.setHeader("Vary", "Accept-Encoding");
  res.type("application/json");

  // ─────────────────────────────
  // Response
  // ─────────────────────────────
  res.json({
    ok: true,
    version: ITEMS_CACHE_VERSION,
    item,
  });
});

export default router;
