import { getMessage } from "../constants/messages.js";
import { getUserPool } from "../loaders/mssql.js";
import { encodePassword } from "./util/auth.util.js";
import { logAction } from "./actionlog.service.js";
import { baseServerConfig } from "../config/server.config.js";
import {
  validateChangePincodeBody,
  validateChangePasswordBody,
  validateChangeEmailBody,
  validateConvertPointsBody,
} from "./account/account.validation.js";
import {
  verifyPincodeAndEmail,
  updatePincode,
  verifyPasswordAndPincode,
  updatePassword,
  verifyPincode,
  updateEmail,
  atomicConvertPoints,
  queryAccountInfo,
} from "./account/account.queries.js";

/* -------------------------
   Change Pincode
-------------------------- */

export const changePincode = async (body, ctx = {}) => {
  const MSG = getMessage(ctx.lang);

  if (!ctx.user?.userid) return { ok: false, message: MSG.AUTH.LOGIN_REQUIRED };

  const validationError = validateChangePincodeBody(body, MSG);
  if (validationError) return validationError;

  const { pincode, newPincode, email } = body;
  const userPool = await getUserPool();
  const userid = ctx.user.userid;

  const user = await verifyPincodeAndEmail(userPool, userid, encodePassword(pincode), email);
  if (!user) return { ok: false, message: MSG.FORGOT_PASSWORD.INVALID_REQ };

  await updatePincode(userPool, userid, encodePassword(newPincode));

  await logAction({
    userId: user.UserNum,
    actionType: "UPDATE",
    entityType: "USER",
    entityId: `${user.UserNum}:${userid}`,
    description: MSG.LOG.ACTION_PINCODE_CHANGE,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return { ok: true, message: MSG.ACCOUNT.PINCODE_CHANGED };
};

/* -------------------------
   Change Password
-------------------------- */

export const changePassword = async (body, ctx = {}) => {
  const MSG = getMessage(ctx.lang);

  if (!ctx.user?.userid) return { ok: false, message: MSG.AUTH.LOGIN_REQUIRED };

  const validationError = validateChangePasswordBody(body, MSG);
  if (validationError) return validationError;

  const { oldPassword, pincode, newPassword } = body;
  const userPool = await getUserPool();
  const userid = ctx.user.userid;

  const user = await verifyPasswordAndPincode(
    userPool,
    userid,
    encodePassword(oldPassword),
    encodePassword(pincode),
  );
  if (!user) return { ok: false, message: MSG.AUTH.PASSWORD_MISMATCH };

  await updatePassword(userPool, userid, encodePassword(newPassword));

  await logAction({
    userId: user.UserNum,
    actionType: "UPDATE",
    entityType: "USER",
    entityId: `${user.UserNum}:${userid}`,
    description: MSG.LOG.ACTION_PASSWORD_CHANGE,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return { ok: true, message: MSG.AUTH.PASSWORD_CHANGED };
};

/* -------------------------
   Change Email
-------------------------- */

export const changeEmail = async (body, ctx = {}) => {
  const MSG = getMessage(ctx.lang);

  if (!ctx.user?.userid) return { ok: false, message: MSG.AUTH.LOGIN_REQUIRED };

  const validationError = validateChangeEmailBody(body, MSG);
  if (validationError) return validationError;

  const { email, pincode } = body;
  const userPool = await getUserPool();
  const userid = ctx.user.userid;

  const user = await verifyPincode(userPool, userid, encodePassword(pincode));
  if (!user) return { ok: false, message: MSG.AUTH.INVALID_REQ };

  await updateEmail(userPool, userid, email);

  await logAction({
    userId: user.UserNum,
    actionType: "UPDATE",
    entityType: "USER",
    entityId: `${user.UserNum}:${userid}`,
    description: MSG.LOG.ACTION_EMAIL_CHANGE,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return { ok: true, message: MSG.ACCOUNT.EMAIL_UPDATED, email };
};

/* -------------------------
   Convert Points
-------------------------- */

export const convertPoints = async (body, ctx = {}) => {
  const MSG = getMessage(ctx.lang);

  if (!ctx.user?.userid) return { ok: false, message: MSG.AUTH.LOGIN_REQUIRED };

  const validationError = validateConvertPointsBody(body, MSG);
  if (validationError) return validationError;

  const { direction, amount, pincode } = body;
  const amountNum = Number(amount);
  const convertConfig = baseServerConfig.convertfeature[direction];

  if (amountNum < convertConfig.min)
    return { ok: false, message: MSG.CONVERT.AMOUNT_TOO_LOW(convertConfig.min) };

  const received = Math.floor(amountNum * convertConfig.rate);
  const userPool = await getUserPool();
  const userid = ctx.user.userid;

  const user = await verifyPincode(userPool, userid, encodePassword(pincode));
  if (!user) return { ok: false, message: MSG.FORGOT_PASSWORD.PINCODE_MISMATCHED };

  const fromCol = direction === "vp2ep" ? "UserPoint2" : "UserPoint";
  const toCol = direction === "vp2ep" ? "UserPoint" : "UserPoint2";
  const fromLabel = direction === "vp2ep" ? "VP" : "EP";
  const toLabel = direction === "vp2ep" ? "EP" : "VP";

  const rowsAffected = await atomicConvertPoints(
    userPool,
    user.UserNum,
    fromCol,
    toCol,
    amountNum,
    received,
  );

  if (rowsAffected === 0) return { ok: false, message: MSG.CONVERT.INSUFFICIENT_BALANCE };

  await logAction({
    userId: user.UserNum,
    actionType: "UPDATE",
    entityType: "USER",
    entityId: `${user.UserNum}:${userid}`,
    description: `${MSG.LOG.ACTION_CONVERT_POINTS}: ${amountNum} ${fromLabel} → ${received} ${toLabel}`,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return { ok: true, message: MSG.CONVERT.SUCCESS(amountNum, fromLabel, received, toLabel) };
};

/* -------------------------
   Get Account Info
-------------------------- */

export const getAccountInfo = async (ctx = {}) => {
  const MSG = getMessage(ctx.lang);

  if (!ctx.user?.userid) return { ok: false, message: MSG.AUTH.LOGIN_REQUIRED };

  const userPool = await getUserPool();
  const user = await queryAccountInfo(userPool, ctx.user.userid);

  if (!user) return { ok: false, message: MSG.AUTH.INVALID_REQ };

  return {
    ok: true,
    message: MSG.GENERAL.SUCCESS,
    account: {
      userid: user.UserID,
      type: user.UserType,
      available: user.UserAvailable,
      blocked: user.UserBlock,
      chaRemain: user.ChaRemain,
      email: user.UserEmail,
      epoint: user.UserPoint,
      vpoint: user.UserPoint2,
    },
  };
};
