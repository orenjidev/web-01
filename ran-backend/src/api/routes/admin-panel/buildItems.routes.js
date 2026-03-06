import { Router } from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { requireStaff } from "../../middlewares/auth.middleware.js";
import { buildItems } from "../../../../scripts/build-items.js";
import {
  initItemsCache,
  getItems,
  getItemById,
  getItemsCacheInfo,
} from "../../../services/items.service.js";

const router = Router();
router.use(requireStaff);

const CSV_PATH = path.resolve("data/items/Item.csv");
const OUTPUT_PATH = path.resolve("generated/items.web.json");

/* Upload storage — save directly to data/items/ as Item.csv */
const csvUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = path.dirname(CSV_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, _file, cb) => cb(null, "Item.csv"),
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (_req, file, cb) => {
    if (!file.originalname.toLowerCase().endsWith(".csv")) {
      cb(new Error("Only .csv files are allowed"));
    } else {
      cb(null, true);
    }
  },
});

/* GET /preview — paginated preview of current items JSON + cache info */
router.get("/preview", (_req, res) => {
  // Try loading if not yet loaded and the file exists
  const info = getItemsCacheInfo();
  if (!info.loaded && fs.existsSync(OUTPUT_PATH)) {
    try {
      initItemsCache(true);
    } catch {
      // file may be corrupt or empty — ignore
    }
  }

  const freshInfo = getItemsCacheInfo();
  if (!freshInfo.loaded) {
    return res.json({
      ok: true,
      info: freshInfo,
      items: [],
      total: 0,
      page: 1,
      limit: 50,
    });
  }

  const page = Math.max(1, parseInt(_req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(_req.query.limit) || 50));
  const search = (_req.query.search || "").trim().toLowerCase();

  let all = getItems();
  if (search) {
    all = all.filter(
      (i) =>
        i.itemId.includes(search) ||
        (i.name && i.name.toLowerCase().includes(search)),
    );
  }

  const total = all.length;
  const start = (page - 1) * limit;
  const items = all.slice(start, start + limit);

  res.json({ ok: true, info: freshInfo, items, total, page, limit });
});

/* GET /item/:itemId — single item with resolved box contents */
router.get("/item/:itemId", (_req, res) => {
  const item = getItemById(_req.params.itemId);
  if (!item)
    return res.status(404).json({ ok: false, message: "Item not found." });

  const result = { ...item };

  // Resolve box item names & icons
  if (result.box?.items) {
    result.box = {
      ...result.box,
      items: result.box.items.map((bi) => {
        const meta = getItemById(bi.itemId);
        return {
          ...bi,
          name: meta?.name ?? "Unknown",
          icon: meta?.icon ?? null,
          type: meta?.type ?? null,
        };
      }),
    };
  }

  // Resolve random box item names & icons
  if (result.randomBox) {
    result.randomBox = result.randomBox.map((bi) => {
      const meta = getItemById(bi.itemId);
      return {
        ...bi,
        name: meta?.name ?? "Unknown",
        icon: meta?.icon ?? null,
        type: meta?.type ?? null,
      };
    });
  }

  res.json({ ok: true, item: result });
});

/* POST /upload — upload new Item.csv then build */
router.post("/upload", csvUpload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, message: "No file uploaded." });
  }
  try {
    const { itemCount } = await buildItems(CSV_PATH, OUTPUT_PATH);
    initItemsCache(true); // refresh in-memory cache without server restart
    res.json({
      ok: true,
      itemCount,
      message: `Built ${itemCount} items from uploaded CSV.`,
    });
  } catch (err) {
    res
      .status(500)
      .json({ ok: false, message: err.message || "Build failed." });
  }
});

/* POST /build — rebuild from existing CSV */
router.post("/build", async (_req, res) => {
  if (!fs.existsSync(CSV_PATH)) {
    return res
      .status(404)
      .json({ ok: false, message: "Item.csv not found. Upload one first." });
  }
  try {
    const { itemCount } = await buildItems(CSV_PATH, OUTPUT_PATH);
    initItemsCache(true); // refresh in-memory cache without server restart
    res.json({ ok: true, itemCount, message: `Rebuilt ${itemCount} items.` });
  } catch (err) {
    res
      .status(500)
      .json({ ok: false, message: err.message || "Build failed." });
  }
});

export default router;
