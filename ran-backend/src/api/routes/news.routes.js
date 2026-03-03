/**
 * =====================================================
 * News API
 * =====================================================
 * Base Path : /api/news
 *
 * Description:
 *   Public endpoints for viewing news
 * =====================================================
 */

import { Router } from "express";

import {
  listNewsController,
  getNewsController,
  listNewsCategoriesController,
} from "../controllers/news.controller.js";

const router = Router();

/**
 * -----------------------------------------------------
 * GET /api/news
 * -----------------------------------------------------
 * Query:
 * - pinned : 1 | 0 (optional)
 */
router.get("/", listNewsController);

/**
 * -----------------------------------------------------
 * GET /api/news/categories
 * -----------------------------------------------------
 */
router.get("/categories", listNewsCategoriesController);

/**
 * -----------------------------------------------------
 * GET /api/news/:id
 * -----------------------------------------------------
 */
router.get("/:id", getNewsController);

export default router;
