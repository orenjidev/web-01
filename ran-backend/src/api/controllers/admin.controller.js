import * as adminService from "../../services/admin.service.js";
import { getMessage } from "../../constants/messages.js";
//"../../services/account.service.js";

export const insertDownloadController = async (req, res) => {
  const ctx = {
    userId: req.session?.user?.userNum,
    userType: req.session?.user?.type,
    ip: req.ip,
    userAgent: req.headers["user-agent"] || null,
  };

  const result = await adminService.insertDownload(req.body, ctx);

  if (!result.ok) {
    return res.status(403).json(result);
  }

  res.json(result);
};

export const updateDownloadController = async (req, res) => {
  const ctx = {
    userId: req.session?.user?.userNum,
    userType: req.session?.user?.type,
    ip: req.ip,
    userAgent: req.headers["user-agent"] || null,
  };

  const result = await adminService.updateDownload(req.body, ctx);

  if (!result.ok) {
    return res.status(403).json(result);
  }

  res.json(result);
};

export const insertNewsController = async (req, res) => {
  const ctx = {
    userId: req.session?.user?.userNum,
    userType: req.session?.user?.type,
    ip: req.ip,
    userAgent: req.headers["user-agent"] || null,
  };

  const result = await adminService.insertNews(req.body, ctx);

  if (!result.ok) {
    return res.status(403).json(result);
  }

  res.json(result);
};

export const updateNewsController = async (req, res) => {
  const ctx = {
    userId: req.session?.user?.userNum,
    userType: req.session?.user?.type,
    ip: req.ip,
    userAgent: req.headers["user-agent"] || null,
  };

  const result = await adminService.updateNews(req.body, ctx);

  if (!result.ok) {
    return res.status(403).json(result);
  }

  res.json(result);
};

// --
// [RNGDEV]
// SHOPFUNC BELOW
// --

/* -------------------------
   Shop Category Controllers
-------------------------- */

export const createShopCategoryController = async (req, res) => {
  const MSG = getMessage(req.ctx?.lang);

  try {
    await adminService.createShopCategory(req.body);
    res.json({ ok: true, message: MSG.GENERAL.SUCCESS });
  } catch (err) {
    res.status(400).json({
      ok: false,
      message: mapShopError(err, MSG),
    });
  }
};

export const updateShopCategoryController = async (req, res) => {
  const MSG = getMessage(req.ctx?.lang);

  try {
    const categoryNum = Number(req.params.categoryNum);

    await adminService.updateShopCategory({
      categoryNum,
      ...req.body,
    });

    res.json({ ok: true, message: MSG.GENERAL.SUCCESS });
  } catch (err) {
    res.status(400).json({
      ok: false,
      message: mapShopError(err, MSG),
    });
  }
};

/* -------------------------
   Shop Item Controllers
-------------------------- */

export const createShopItemMapController = async (req, res) => {
  const MSG = getMessage(req.ctx?.lang);

  try {
    const result = await adminService.createShopItemMap(req.body);

    res.json({
      ok: true,
      productNum: result.productNum,
      message: MSG.GENERAL.SUCCESS,
    });
  } catch (err) {
    res.status(400).json({
      ok: false,
      message: mapShopError(err, MSG),
    });
  }
};

export const updateShopItemMapController = async (req, res) => {
  const MSG = getMessage(req.ctx?.lang);

  try {
    const productNum = Number(req.params.productNum);

    await adminService.updateShopItemMap({
      productNum,
      ...req.body,
    });

    res.json({
      ok: true,
      message: MSG.GENERAL.SUCCESS,
    });
  } catch (err) {
    res.status(400).json({
      ok: false,
      message: mapShopError(err, MSG),
    });
  }
};

/* -------------------------
   Error Mapper
-------------------------- */

const mapShopError = (err, MSG) => {
  switch (err.message) {
    case "INVALID_INPUT":
      return MSG.GENERAL.INVALID_BODY;

    case "INVALID_PRODUCTNUM":
      return MSG.SHOP.INVALID_PRODUCT;

    case "ITEM_NOT_FOUND":
      return MSG.SHOP.ITEM_NOT_FOUND;

    default:
      return MSG.GENERAL.ERROR;
  }
};
