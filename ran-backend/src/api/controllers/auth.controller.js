import * as authFunc from "../../services/auth.service.js";
import { getMessage } from "../../constants/messages.js";
import { baseServerConfig } from "../../config/server.config.js";

/* -------------------------
   Auth Controllers
-------------------------- */

export const loginController = async (req, res) => {
  const MSG = getMessage(req.ctx?.lang);

  const result = await authFunc.login(req.body, req.ctx);

  if (!result.ok) {
    return res.status(400).json(result);
  }

  // 🔐 Session fixation protection
  req.session.regenerate((err) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        message: MSG.GENERAL.ERROR,
      });
    }

    req.session.user = result.user;

    req.session.save(() => {
      res.json(result);
    });
  });
};

export const logoutController = (req, res) => {
  const MSG = getMessage(req.ctx?.lang);

  req.session.destroy(() => {
    res.clearCookie(process.env.COOKIE);

    res.json({
      ok: true,
      message: MSG.AUTH.LOGOUT_SUCCESS,
    });
  });
};

export const registerController = async (req, res) => {
  const result = await authFunc.register(req.body, req.ctx);

  if (!result.ok) {
    return res.status(400).json(result);
  }

  return res.json(result);
};

export const forgotPasswordController = async (req, res) => {
  const result = await authFunc.forgotPassword(req.body, req.ctx);

  if (!result.ok) {
    return res.status(400).json(result);
  }

  return res.json(result);
};
