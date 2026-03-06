/**
 * =====================================================
 * Download API
 * =====================================================
 * Base Path : /api/download
 *
 * Description:
 *   Public endpoints for downloadable files
 * =====================================================
 */

import { Router } from "express";

import {
  listDownloadsController,
  getDownloadController,
  listDownloadTypesController,
  trackClickController,
} from "../controllers/download.controller.js";

const router = Router();

/**
 * -----------------------------------------------------
 * GET /api/download
 * -----------------------------------------------------
 * Query:
 * - type : string (optional)
 */
router.get("/", listDownloadsController);

/**
 * -----------------------------------------------------
 * GET /api/download/types
 * -----------------------------------------------------
 */
router.get("/types", listDownloadTypesController);

/**
 * -----------------------------------------------------
 * POST /api/download/:id/click
 * -----------------------------------------------------
 */
router.post("/:id/click", trackClickController);

/**
 * -----------------------------------------------------
 * GET /api/download/:id
 * -----------------------------------------------------
 */
router.get("/:id", getDownloadController);

export default router;
