import { baseServerConfig } from "../../config/server.config.js";
import * as accountFunc from "../../services/account.service.js";
import { getMessage } from "../../constants/messages.js";

/* -------------------------
   Account Controllers
-------------------------- */

export const changePasswordController = async (req, res) => {
  const MSG = getMessage(req.ctx?.lang);

  if (!baseServerConfig.features.changePassword) {
    return res.status(403).json({
      ok: false,
      message: MSG.FEATURE.CHANGE_PASSWORD_DISABLED,
    });
  }

  const result = await accountFunc.changePassword(req.body, req.ctx);

  if (!result.ok) {
    return res.status(400).json(result);
  }

  return res.json(result);
};

export const changePincodeController = async (req, res) => {
  const MSG = getMessage(req.ctx?.lang);

  if (!baseServerConfig.features.changePin) {
    return res.status(403).json({
      ok: false,
      message: MSG.FEATURE.CHANGE_PIN_DISABLED,
    });
  }

  const result = await accountFunc.changePincode(req.body, req.ctx);

  if (!result.ok) {
    return res.status(400).json(result);
  }

  return res.json(result);
};

export const changeEmailController = async (req, res) => {
  const MSG = getMessage(req.ctx?.lang);

  if (!baseServerConfig.features.changeEmail) {
    return res.status(403).json({
      ok: false,
      message: MSG.FEATURE.CHANGE_EMAIL_DISABLED,
    });
  }

  const result = await accountFunc.changeEmail(req.body, req.ctx);

  if (!result.ok) {
    return res.status(400).json(result);
  }

  return res.json(result);
};

export const getAccountInfoController = async (req, res) => {
  const result = await accountFunc.getAccountInfo(req.ctx);
  return res.json(result);
};
