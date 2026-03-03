import { baseServerConfig } from "../../config/server.config.js";
import { getMessage } from "../../constants/messages.js";

/* -------------------------
   Context Builder
-------------------------- */

const buildCtx = (req) => ({
  user: req.session?.user
    ? {
        userid: req.session.user.userid,
        userNum: req.session.user.userNum,
        type: req.session.user.type,
      }
    : null,
  ip: req.ip,
  lang: req.headers["accept-language"] || "en",
  userAgent: req.headers["user-agent"] || null,
});

/* -------------------------
   Authentication
-------------------------- */

export const requireAuth = (req, res, next) => {
  const MSG = getMessage(req.lang);

  if (!req.session?.user) {
    return res.status(401).json({
      ok: false,
      message: MSG.AUTH.LOGIN_REQUIRED,
    });
  }

  req.ctx = buildCtx(req);
  next();
};

/* -------------------------
   Staff Authorization
-------------------------- */

export const requireStaff = (req, res, next) => {
  const MSG = getMessage(req.lang);

  if (!req.session?.user) {
    return res.status(401).json({
      ok: false,
      message: MSG.AUTH.LOGIN_REQUIRED,
    });
  }

  req.ctx = buildCtx(req);

  if (!req.ctx.user?.type || req.ctx.user.type < 50) {
    return res.status(403).json({
      ok: false,
      message: MSG.AUTH.STAFF_REQUIRED,
    });
  }

  next();
};

/* -------------------------
   Feature Gates
-------------------------- */

export const requireShopEnabled = (req, res, next) => {
  const MSG = getMessage(req.lang);

  if (baseServerConfig.shop.enabled === false) {
    return res.status(403).json({
      ok: false,
      message: MSG.FEATURE.SHOP_DISABLED,
    });
  }

  next();
};

export const requireTicketSystem = (req, res, next) => {
  const MSG = getMessage(req.lang);

  if (baseServerConfig.features.ticketSystem === false) {
    return res.status(403).json({
      ok: false,
      message: MSG.FEATURE.TICKET_SYSTEM_DISABLED,
    });
  }

  next();
};

export const requireTopUpEnabled = (req, res, next) => {
  const MSG = getMessage(req.lang);

  if (baseServerConfig.features.topup === false) {
    return res.status(403).json({
      ok: false,
      message: MSG.FEATURE.TOPUP_DISABLED,
    });
  }

  next();
};
