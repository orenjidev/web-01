import { Router } from "express";
import { requireStaff } from "../../middlewares/auth.middleware.js";
import { sliderUpload, staticImageUpload, validateMimeType } from "../../middlewares/upload.middleware.js";
import {
  getConfigController,
  updateConfigController,
} from "../../controllers/serverConfig.controller.js";

const router = Router();

router.use(requireStaff);

router.get("/", getConfigController);
router.put("/:section", updateConfigController);

const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

router.post("/upload-image", sliderUpload.single("file"), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ ok: false, message: "No file uploaded." });
  try {
    await validateMimeType(req.file, ALLOWED_MIMES);
  } catch (err) {
    return next(err);
  }
  const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;
  res.json({ ok: true, url: `${baseUrl}/uploads/slider/${req.file.filename}` });
});

router.post("/upload-static", staticImageUpload.single("file"), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ ok: false, message: "No file uploaded." });
  try {
    await validateMimeType(req.file, ALLOWED_MIMES);
  } catch (err) {
    return next(err);
  }
  const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;
  res.json({ ok: true, url: `${baseUrl}/uploads/images/${req.file.filename}` });
});

export default router;
