import * as topupService from "../../services/topup.service.js";
import { generateTopups, listTopups, setTopupUnused } from "../../services/admin.service.js";
import { getMessage } from "../../constants/messages.js";
import { baseServerConfig } from "../../config/server.config.js";

/* -------------------------
   Error Mapper
-------------------------- */

const mapTopupError = (err, MSG) => {
  switch (err.message) {
    case "INVALID_CODE":
    case "INVALID_PIN":
    case "INVALID_REQUEST":
      return MSG.TOPUP.INVALID_REQUEST;

    case "ALREADY_USED":
      return MSG.TOPUP.ALREADY_USED;

    case "CODE_NOT_FOUND":
      return MSG.TOPUP.NOT_FOUND;

    case "EXPIRED":
      return MSG.TOPUP.EXPIRED;

    default:
      return MSG.GENERAL.ERROR;
  }
};

/* -------------------------
   User Controllers
-------------------------- */
export const listUserTopupsController = async (req, res) => {
  const MSG = getMessage(req.ctx.lang);

  if (!baseServerConfig.features.topup) {
    return res.status(403).json({
      ok: false,
      message: MSG.FEATURE.TOPUP_DISABLED,
    });
  }

  try {
    const userNum = req.ctx.user.userNum;
    console.log(userNum);

    const history = await topupService.listUserTopups(userNum);

    return res.json({
      ok: true,
      history,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: MSG.TOPUP.LIST_FAILED,
    });
  }
};

export const checkTopupController = async (req, res) => {
  const MSG = getMessage(req.ctx.lang);

  if (!baseServerConfig.features.topup) {
    return res.status(403).json({
      ok: false,
      message: MSG.FEATURE.TOPUP_DISABLED,
    });
  }

  try {
    const { code, pin } = req.query;

    if (!code || !pin) {
      return res.status(400).json({
        ok: false,
        message: MSG.TOPUP.INVALID_REQUEST,
      });
    }

    const result = await topupService.checkTopup(code, pin);

    return res.json({
      ok: true,
      value: result.value,
      message: MSG.TOPUP.VALID,
    });
  } catch (err) {
    return res.status(400).json({
      ok: false,
      message: mapTopupError(err, MSG),
    });
  }
};

// OLD
export const redeemTopupController = async (req, res) => {
  const MSG = getMessage(req.ctx.lang);

  if (!baseServerConfig.features.topup) {
    return res.status(403).json({
      ok: false,
      message: MSG.FEATURE.TOPUP_DISABLED,
    });
  }

  try {
    const { code, pin } = req.body;

    if (!code || !pin) {
      return res.status(400).json({
        ok: false,
        message: MSG.TOPUP.INVALID_REQUEST,
      });
    }

    const result = await topupService.redeemTopup(
      code,
      pin,
      req.ctx.user.userNum,
      { ip: req.ip },
    );

    console.log(result);

    return res.json({
      ok: true,
      message: MSG.TOPUP.REDEEM_SUCCESS,
      newBalance: result.newBalance,
    });
  } catch (err) {
    return res.status(400).json({
      ok: false,
      message: mapTopupError(err, MSG),
    });
  }
};

// export const redeemTopupController = async (req, res) => {
//   const MSG = getMessage(req.ctx.lang);

//   if (!baseServerConfig.features.topup) {
//     return res.status(403).json({
//       ok: false,
//       message: MSG.FEATURE.TOPUP_DISABLED,
//     });
//   }

//   try {
//     const { code, pin } = req.body;

//     if (!code || !pin) {
//       return res.status(400).json({
//         ok: false,
//         message: MSG.TOPUP.INVALID_REQUEST,
//       });
//     }

//     await topupService.redeemTopup(code, pin, req.ctx.user.userNum);

//     return res.json({
//       ok: true,
//       message: MSG.TOPUP.REDEEM_SUCCESS,
//     });
//   } catch (err) {
//     return res.status(400).json({
//       ok: false,
//       message: mapTopupError(err, MSG),
//     });
//   }
// };

/* -------------------------
   Admin Controllers
-------------------------- */

export const listTopupsController = async (req, res) => {
  const MSG = getMessage(req.ctx.lang);

  try {
    const used = req.query.used === undefined ? null : Number(req.query.used);

    const cards = await listTopups({ used });

    return res.json({
      ok: true,
      cards,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: MSG.TOPUP.LIST_FAILED,
    });
  }
};

export const generateTopupsController = async (req, res) => {
  const MSG = getMessage(req.ctx.lang);

  try {
    const { count, value } = req.body;

    if (
      !Number.isInteger(count) ||
      !Number.isInteger(value) ||
      count <= 0 ||
      value <= 0
    ) {
      return res.status(400).json({
        ok: false,
        message: MSG.TOPUP.INVALID_REQUEST,
      });
    }

    await generateTopups(count, value);

    return res.json({
      ok: true,
      message: MSG.TOPUP.GENERATION_REQUESTED,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: MSG.TOPUP.GENERATE_FAILED,
    });
  }
};

export const setTopupUnusedController = async (req, res) => {
  try {
    const idx = Number(req.params.idx);
    if (!idx) return res.status(400).json({ ok: false });
    await setTopupUnused(idx);
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ ok: false });
  }
};
