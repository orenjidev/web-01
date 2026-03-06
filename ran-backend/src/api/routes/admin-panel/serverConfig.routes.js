import { Router } from "express";
import { requireStaff } from "../../middlewares/auth.middleware.js";
import { sliderUpload, validateMimeType } from "../../middlewares/upload.middleware.js";
import {
  getConfigController,
  updateConfigController,
} from "../../controllers/serverConfig.controller.js";

const router = Router();

router.use(requireStaff);

router.get("/", getConfigController);
router.put("/:section", updateConfigController);

router.post("/upload-image", sliderUpload.single("file"), async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, message: "No file uploaded." });
  }
  try {
    await validateMimeType(req.file, ["image/jpeg", "image/png", "image/webp", "image/gif"]);
  } catch (err) {
    return next(err);
  }
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const url = `${baseUrl}/uploads/slider/${req.file.filename}`;
  res.json({ ok: true, url });
});

export default router;
