import * as shopFunc from "../../services/shop.service.js";
import { getMessage } from "../../constants/messages.js";

/* -------------------------
   Error Mapper
-------------------------- */

const mapShopError = (err, MSG) => {
  switch (err.message) {
    case "INVALID_PRODUCT":
      return MSG.SHOP.INVALID_PRODUCT;

    case "ITEM_NOT_FOUND":
      return MSG.SHOP.ITEM_NOT_FOUND;

    case "INSUFFICIENT_FUNDS":
      return MSG.SHOP.INSUFFICIENT_FUNDS;

    case "OUT_OF_STOCK":
      return MSG.SHOP.OUT_OF_STOCK;

    default:
      return MSG.GENERAL.ERROR;
  }
};

/* -------------------------
   Controllers
-------------------------- */

export const getShopCategoriesController = async (req, res) => {
  const MSG = getMessage(req.ctx?.lang);

  try {
    const data = await shopFunc.getShopCategories();

    return res.json({
      ok: true,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: MSG.SHOP.CATEGORY_LOAD_FAILED,
    });
  }
};

export const getShopItemsController = async (req, res) => {
  const MSG = getMessage(req.ctx?.lang);

  try {
    const category = Number(req.query.category);

    if (!category) {
      return res.status(400).json({
        ok: false,
        message: MSG.SHOP.INVALID_CATEGORY,
      });
    }

    const items = await shopFunc.getShopItemsByCategory(category);

    return res.json({
      ok: true,
      data: items,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: MSG.SHOP.ITEM_LOAD_FAILED,
    });
  }
};

export const getFullShopController = async (req, res) => {
  const MSG = getMessage(req.ctx?.lang);

  try {
    const shop = await shopFunc.getFullShop();

    return res.json({
      ok: true,
      data: shop,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: MSG.SHOP.LOAD_FAILED,
    });
  }
};

export const purchaseShopItemController = async (req, res) => {
  const MSG = getMessage(req.ctx?.lang);

  try {
    const { productNum } = req.body;

    if (!productNum) {
      return res.status(400).json({
        ok: false,
        message: MSG.SHOP.INVALID_PRODUCT,
      });
    }

    await shopFunc.purchaseShopItem({
      productNum,
      ctx: req.ctx.user,
    });

    return res.json({
      ok: true,
      message: MSG.SHOP.PURCHASE_SUCCESS,
    });
  } catch (err) {
    return res.status(400).json({
      ok: false,
      message: mapShopError(err, MSG),
    });
  }
};

export const purchaseCartController = async (req, res) => {
  const MSG = getMessage(req.ctx?.lang);

  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        ok: false,
        message: MSG.SHOP.INVALID_PRODUCT,
      });
    }

    await shopFunc.purchaseCart({
      items,
      ctx: req.ctx.user,
    });

    return res.json({
      ok: true,
      message: MSG.SHOP.PURCHASE_SUCCESS,
    });
  } catch (err) {
    return res.status(400).json({
      ok: false,
      message: mapShopError(err, MSG),
    });
  }
};

// History
export const getPurchaseHistoryController = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const pageSize = Math.min(parseInt(req.query.pageSize) || 10, 50);

    const data = await shopFunc.getPurchaseHistoryService({
      userId: req.ctx.user.userid,
      page,
      pageSize,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    });

    return res.json({
      ok: true,
      data,
    });
  } catch (err) {
    console.error("[SHOP HISTORY ERROR]", err);

    return res.status(500).json({
      ok: false,
      message: err.message || "Failed to fetch purchase history",
    });
  }
};
