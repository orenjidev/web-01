import { Router } from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { requireStaff } from "../../middlewares/auth.middleware.js";
import { buildSkills } from "../../../../scripts/build-skills.js";
import { buildSkillStrings } from "../../../../scripts/build-skill-strings.js";
import {
  initSkillsCache,
  getSkills,
  getSkillById,
  getSkillsCacheInfo,
} from "../../../services/skills.service.js";

const router = Router();
router.use(requireStaff);

const CSV_PATH = path.resolve("data/skills/Skill.csv");
const OUTPUT_PATH = path.resolve("generated/skills.web.json");
const STRINGS_XML_PATH = path.resolve("data/skills/SkillStringTable.xml");
const STRINGS_TXT_PATH = path.resolve("data/skills/SkillStringTable.txt");

const csvUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = path.dirname(CSV_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, _file, cb) => cb(null, "Skill.csv"),
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.originalname.toLowerCase().endsWith(".csv")) {
      cb(new Error("Only .csv files are allowed"));
    } else {
      cb(null, true);
    }
  },
});

const stringsUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = path.dirname(STRINGS_XML_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (ext === ".xml") return cb(null, path.basename(STRINGS_XML_PATH));
      if (ext === ".txt") return cb(null, path.basename(STRINGS_TXT_PATH));
      return cb(new Error("Only .xml and .txt files are allowed"));
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".xml" && ext !== ".txt") {
      cb(new Error("Only .xml and .txt files are allowed"));
    } else {
      cb(null, true);
    }
  },
});

router.get("/preview", (req, res) => {
  const info = getSkillsCacheInfo();
  if (!info.loaded && fs.existsSync(OUTPUT_PATH)) {
    try {
      initSkillsCache(true);
    } catch {
      // ignore load failures and return unloaded state
    }
  }

  const freshInfo = getSkillsCacheInfo();
  if (!freshInfo.loaded) {
    return res.json({
      ok: true,
      info: freshInfo,
      skills: [],
      total: 0,
      page: 1,
      limit: 50,
    });
  }

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
  const search = (req.query.search || "").trim().toLowerCase();

  let all = getSkills();
  if (search) {
    all = all.filter(
      (skill) =>
        skill.skillId.toLowerCase().includes(search) ||
        skill.name.toLowerCase().includes(search) ||
        String(skill.mainId).includes(search) ||
        String(skill.subId).includes(search),
    );
  }

  const total = all.length;
  const start = (page - 1) * limit;
  const skills = all.slice(start, start + limit);

  res.json({ ok: true, info: freshInfo, skills, total, page, limit });
});

router.get("/skill/:skillId", (req, res) => {
  const skill = getSkillById(req.params.skillId);
  if (!skill) {
    return res.status(404).json({ ok: false, message: "Skill not found." });
  }

  return res.json({ ok: true, skill });
});

router.post("/upload", csvUpload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, message: "No file uploaded." });
  }

  try {
    const { skillCount } = await buildSkills(CSV_PATH, OUTPUT_PATH);
    initSkillsCache(true);
    return res.json({
      ok: true,
      skillCount,
      message: `Built ${skillCount} skills from uploaded CSV.`,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, message: err.message || "Build failed." });
  }
});

router.post("/upload-strings", stringsUpload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, message: "No file uploaded." });
  }

  const uploadedPath = req.file.path;
  try {
    const { skillCount: stringsCount } = await buildSkillStrings(uploadedPath);

    let skillCount = null;
    if (fs.existsSync(CSV_PATH)) {
      const rebuilt = await buildSkills(CSV_PATH, OUTPUT_PATH);
      skillCount = rebuilt.skillCount;
      initSkillsCache(true);
    }

    return res.json({
      ok: true,
      stringsCount,
      skillCount,
      message:
        skillCount === null
          ? `Built ${stringsCount} skill strings. Upload/build Skill.csv next.`
          : `Built ${stringsCount} skill strings and rebuilt ${skillCount} skills.`,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, message: err.message || "String build failed." });
  }
});

router.post("/build", async (_req, res) => {
  if (!fs.existsSync(CSV_PATH)) {
    return res.status(404).json({
      ok: false,
      message: "Skill.csv not found. Upload one first.",
    });
  }

  try {
    const { skillCount } = await buildSkills(CSV_PATH, OUTPUT_PATH);
    initSkillsCache(true);
    return res.json({
      ok: true,
      skillCount,
      message: `Rebuilt ${skillCount} skills.`,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, message: err.message || "Build failed." });
  }
});

export default router;
