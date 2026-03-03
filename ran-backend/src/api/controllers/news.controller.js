import * as newsService from "../../services/news.service.js";
import { getMessage } from "../../constants/messages.js";

/* -------------------------
   Error Mapper (SAFE)
-------------------------- */

const mapNewsError = (err, MSG) => {
  switch (err.message) {
    case "NEWS_NOT_FOUND":
      return MSG.NEWS?.NOT_FOUND ?? MSG.GENERAL.NOT_FOUND ?? MSG.GENERAL.ERROR;
    default:
      return MSG.GENERAL.ERROR;
  }
};

/* -------------------------
   Public Controllers
-------------------------- */

/**
 * GET /api/news
 */
export const listNewsController = async (req, res) => {
  const MSG = getMessage(req.ctx.lang);

  try {
    const pinned = req.query.pinned === "1";
    const news = await newsService.listNews({ pinnedOnly: pinned });

    return res.json({
      ok: true,
      data: news,
    });
  } catch (err) {
    console.error("[NEWS LIST ERROR]", err);
    return res.status(500).json({
      ok: false,
      message: MSG.GENERAL.ERROR,
    });
  }
};

/**
 * GET /api/news/:id
 */
export const getNewsController = async (req, res) => {
  const MSG = getMessage(req.ctx.lang);

  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        ok: false,
        message: MSG.GENERAL.INVALID_REQUEST,
      });
    }

    const news = await newsService.getNewsById(id);

    return res.json({
      ok: true,
      data: news,
    });
  } catch (err) {
    if (err.message === "NEWS_NOT_FOUND") {
      return res.status(404).json({
        ok: false,
        message:
          MSG.NEWS?.NOT_FOUND ?? MSG.GENERAL.NOT_FOUND ?? MSG.GENERAL.ERROR,
      });
    }

    console.error("[NEWS DETAIL ERROR]", err);
    return res.status(500).json({
      ok: false,
      message: MSG.GENERAL.ERROR,
    });
  }
};

/**
 * GET /api/news/categories
 */
export const listNewsCategoriesController = async (req, res) => {
  const MSG = getMessage(req.ctx.lang);

  try {
    const categories = await newsService.listNewsCategories();

    return res.json({
      ok: true,
      data: categories,
    });
  } catch (err) {
    console.error("[NEWS CATEGORY ERROR]", err);
    return res.status(500).json({
      ok: false,
      message: MSG.GENERAL.ERROR,
    });
  }
};
