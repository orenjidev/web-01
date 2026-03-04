import { getUserPool } from "../loaders/mssql.js";
import { getMessage } from "../constants/messages.js";
import { encodePassword } from "./util/auth.util.js";
import { logAction } from "./actionlog.service.js";
import { getCharactersByUserId } from "./character.service.js";
import {
  validateLoginBody,
  validateRegisterBody,
  validateForgotPasswordBody,
} from "./auth/auth.validation.js";
import {
  queryUserByUserId,
  checkUserExists,
  insertUser,
  queryUserNumAndPincode,
  updateUserPassword,
} from "./auth/auth.queries.js";

/* -------------------------
   Login
-------------------------- */

export const login = async (body, ctx = {}) => {
  const MSG = getMessage(ctx.lang);

  const validationError = validateLoginBody(body, MSG);
  if (validationError) return validationError;

  const { userid, password } = body;
  const userPool = await getUserPool();
  const encodedPass = encodePassword(password);

  const user = await queryUserByUserId(userPool, userid);

  if (!user || (user.UserPass !== encodedPass && user.UserPass2 !== encodedPass)) {
    await logAction({
      userId: user?.UserNum ?? null,
      actionType: "LOGIN_FAILED",
      entityType: "USER",
      entityId: userid,
      description: MSG.LOG.ACTION_LOGIN_FAILED,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
      success: false,
    });
    return { ok: false, message: MSG.AUTH.USER_PASS_MISMATCH };
  }

  if (user.UserAvailable === 0) {
    await logAction({
      userId: user.UserNum,
      actionType: "LOGIN_FAILED",
      entityType: "USER",
      entityId: user.UserNum,
      description: MSG.LOG.ACTION_LOGIN_FAILED,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
      success: false,
    });
    return { ok: false, message: MSG.AUTH.ACCOUNT_DISABLED };
  }

  if (user.UserBlock === 1) {
    await logAction({
      userId: user.UserNum,
      actionType: "LOGIN_FAILED",
      entityType: "USER",
      entityId: user.UserNum,
      description: MSG.LOG.ACTION_LOGIN_FAILED,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
      success: false,
    });
    return { ok: false, message: MSG.AUTH.ACCOUNT_BLOCKED };
  }

  await logAction({
    userId: user.UserNum,
    actionType: "LOGIN",
    entityType: "USER",
    entityId: user.UserNum,
    description: MSG.LOG.ACTION_LOGIN_SUCCESS,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return {
    ok: true,
    message: MSG.LOGIN.SUCCESS(user.UserID),
    user: { userid: user.UserID, userNum: user.UserNum, type: user.UserType },
    characters: await getCharactersByUserId(user.UserNum),
  };
};

/* -------------------------
   Register
-------------------------- */

export const register = async (body, ctx = {}) => {
  const MSG = getMessage(ctx.lang);

  const validationError = validateRegisterBody(body, MSG);
  if (validationError) return validationError;

  const { userid, password, pincode, email } = body;
  const userPool = await getUserPool();

  if (await checkUserExists(userPool, "UserID", userid))
    return { ok: false, message: MSG.REGISTER.USERNAME_TAKEN };

  if (await checkUserExists(userPool, "UserEmail", email))
    return { ok: false, message: MSG.REGISTER.EMAIL_TAKEN };

  await insertUser(userPool, {
    userid,
    encodedPass: encodePassword(password),
    encodedPincode: encodePassword(pincode),
    email,
  });

  await logAction({
    userId: null,
    actionType: "CREATE",
    entityType: "USER",
    entityId: userid,
    description: MSG.LOG.ACTION_REGISTER_SUCCESS,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return { ok: true, message: MSG.REGISTER.SUCCESS };
};

/* -------------------------
   Forgot Password
-------------------------- */

export const forgotPassword = async (body, ctx = {}) => {
  const MSG = getMessage(ctx.lang);

  const validationError = validateForgotPasswordBody(body, MSG);
  if (validationError) return validationError;

  const { userid, pincode, newPassword } = body;
  const userPool = await getUserPool();

  const user = await queryUserNumAndPincode(userPool, userid);

  if (!user) return { ok: false, message: MSG.FORGOT_PASSWORD.INVALID_REQ };

  if (user.UserPass2 !== encodePassword(pincode))
    return { ok: false, message: MSG.FORGOT_PASSWORD.PINCODE_MISMATCHED };

  await updateUserPassword(userPool, userid, encodePassword(newPassword));

  await logAction({
    userId: user.UserNum,
    actionType: "UPDATE",
    entityType: "USER",
    entityId: user.UserNum,
    description: MSG.LOG.ACTION_PASSWORD_RESET,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return { ok: true, message: MSG.FORGOT_PASSWORD.SUCCESS(userid) };
};
