import sql from "mssql";
import { getMessage } from "../constants/messages.js";
import { getUserPool } from "../loaders/mssql.js";
import { encodePassword, VALID_REGEX } from "./util/auth.util.js";
import { logAction } from "./actionlog.service.js";
import { baseServerConfig } from "../config/server.config.js";

/* -------------------------
   Change Pincode
-------------------------- */

export const changePincode = async (body, ctx = {}) => {
  const MSG = getMessage(ctx.lang);

  if (!ctx.user?.userid) {
    return { ok: false, message: MSG.AUTH.LOGIN_REQUIRED };
  }

  if (!body || typeof body !== "object") {
    return { ok: false, message: MSG.GENERAL.INVALID_BODY };
  }

  const requiredKeys = [
    "pincode",
    "confirmPincode",
    "newPincode",
    "confirmNewPincode",
    "email",
    "confirmEmail",
  ];

  for (const key of requiredKeys) {
    if (!(key in body)) {
      return { ok: false, message: MSG.GENERAL.BUFFER_SIZE };
    }
  }

  const {
    pincode,
    confirmPincode,
    newPincode,
    confirmNewPincode,
    email,
    confirmEmail,
  } = body;

  if (
    !pincode ||
    !confirmPincode ||
    !newPincode ||
    !confirmNewPincode ||
    !email ||
    !confirmEmail
  ) {
    return { ok: false, message: MSG.GENERAL.FILL_FORMS };
  }

  if (pincode !== confirmPincode) {
    return { ok: false, message: MSG.FORGOT_PASSWORD.PINCODE_MISMATCHED };
  }

  if (newPincode !== confirmNewPincode) {
    return { ok: false, message: MSG.FORGOT_PASSWORD.PINCODE_MISMATCHED };
  }

  if (email !== confirmEmail) {
    return { ok: false, message: MSG.ACCOUNT.EMAIL_MISMATCH };
  }

  if (!VALID_REGEX.test(pincode) || !VALID_REGEX.test(newPincode)) {
    return { ok: false, message: MSG.GENERAL.INVALID_CHARS };
  }

  const userPool = await getUserPool();
  const userid = ctx.user.userid;

  const result = await userPool
    .request()
    .input("UserID", userid)
    .input("UserPass2", encodePassword(pincode))
    .input("UserEmail", email).query(`
      SELECT TOP 1 UserNum
      FROM dbo.UserInfo
      WHERE UserID = @UserID
        AND UserPass2 = @UserPass2
        AND UserEmail = @UserEmail
    `);

  const user = result.recordset[0];
  if (!user) {
    return { ok: false, message: MSG.FORGOT_PASSWORD.INVALID_REQ };
  }

  await userPool
    .request()
    .input("UserID", userid)
    .input("UserPass2", encodePassword(newPincode)).query(`
      UPDATE dbo.UserInfo
      SET UserPass2 = @UserPass2
      WHERE UserID = @UserID
    `);

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

  if (!ctx.user?.userid) {
    return { ok: false, message: MSG.AUTH.LOGIN_REQUIRED };
  }

  if (!body || typeof body !== "object") {
    return { ok: false, message: MSG.GENERAL.INVALID_BODY };
  }

  const requiredKeys = [
    "oldPassword",
    "confirmOldPassword",
    "pincode",
    "confirmPincode",
    "newPassword",
    "confirmNewPassword",
  ];

  for (const key of requiredKeys) {
    if (!(key in body)) {
      return { ok: false, message: MSG.GENERAL.BUFFER_SIZE };
    }
  }

  const {
    oldPassword,
    confirmOldPassword,
    pincode,
    confirmPincode,
    newPassword,
    confirmNewPassword,
  } = body;

  if (
    !oldPassword ||
    !confirmOldPassword ||
    !pincode ||
    !confirmPincode ||
    !newPassword ||
    !confirmNewPassword
  ) {
    return { ok: false, message: MSG.GENERAL.FILL_FORMS };
  }

  if (oldPassword !== confirmOldPassword) {
    return { ok: false, message: MSG.AUTH.PASSWORD_MISMATCH };
  }

  if (newPassword !== confirmNewPassword) {
    return { ok: false, message: MSG.AUTH.PASSWORD_MISMATCH_NEW };
  }

  if (pincode !== confirmPincode) {
    return { ok: false, message: MSG.FORGOT_PASSWORD.PINCODE_MISMATCHED };
  }

  if (!VALID_REGEX.test(newPassword)) {
    return { ok: false, message: MSG.GENERAL.INVALID_CHARS };
  }

  const userPool = await getUserPool();
  const userid = ctx.user.userid;

  const result = await userPool
    .request()
    .input("UserID", userid)
    .input("UserPass", encodePassword(oldPassword))
    .input("UserPass2", encodePassword(pincode)).query(`
      SELECT TOP 1 UserNum
      FROM dbo.UserInfo
      WHERE UserID = @UserID
        AND UserPass = @UserPass
        AND UserPass2 = @UserPass2
    `);

  const user = result.recordset[0];
  if (!user) {
    return { ok: false, message: MSG.AUTH.PASSWORD_MISMATCH };
  }

  await userPool
    .request()
    .input("UserID", userid)
    .input("UserPass", encodePassword(newPassword)).query(`
      UPDATE dbo.UserInfo
      SET UserPass = @UserPass
      WHERE UserID = @UserID
    `);

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

  if (!ctx.user?.userid) {
    return { ok: false, message: MSG.AUTH.LOGIN_REQUIRED };
  }

  if (!body || typeof body !== "object") {
    return { ok: false, message: MSG.GENERAL.INVALID_BODY };
  }

  const requiredKeys = ["email", "confirmEmail", "pincode"];

  for (const key of requiredKeys) {
    if (!(key in body)) {
      return { ok: false, message: MSG.GENERAL.BUFFER_SIZE };
    }
  }

  const { email, confirmEmail, pincode } = body;

  if (!email || !confirmEmail || !pincode) {
    return { ok: false, message: MSG.GENERAL.FILL_FORMS };
  }

  if (email !== confirmEmail) {
    return { ok: false, message: MSG.ACCOUNT.EMAIL_MISMATCH };
  }

  const userPool = await getUserPool();
  const userid = ctx.user.userid;

  const result = await userPool
    .request()
    .input("UserID", userid)
    .input("UserPass2", encodePassword(pincode)).query(`
      SELECT TOP 1 UserNum
      FROM dbo.UserInfo
      WHERE UserID = @UserID
        AND UserPass2 = @UserPass2
    `);

  const user = result.recordset[0];
  if (!user) {
    return { ok: false, message: MSG.AUTH.INVALID_REQ };
  }

  await userPool.request().input("UserID", userid).input("UserEmail", email)
    .query(`
      UPDATE dbo.UserInfo
      SET UserEmail = @UserEmail
      WHERE UserID = @UserID
    `);

  await logAction({
    userId: user.UserNum,
    actionType: "UPDATE",
    entityType: "USER",
    entityId: `${user.UserNum}:${userid}`,
    description: MSG.LOG.ACTION_EMAIL_CHANGE,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return {
    ok: true,
    message: MSG.ACCOUNT.EMAIL_UPDATED,
    email,
  };
};

/* -------------------------
   Convert Points
-------------------------- */

export const convertPoints = async (body, ctx = {}) => {
  const MSG = getMessage(ctx.lang);

  if (!ctx.user?.userid) {
    return { ok: false, message: MSG.AUTH.LOGIN_REQUIRED };
  }

  if (!body || typeof body !== "object") {
    return { ok: false, message: MSG.GENERAL.INVALID_BODY };
  }

  const requiredKeys = ["direction", "amount", "pincode"];
  for (const key of requiredKeys) {
    if (!(key in body)) {
      return { ok: false, message: MSG.GENERAL.BUFFER_SIZE };
    }
  }

  const { direction, amount, pincode } = body;

  if (!direction || amount == null || !pincode) {
    return { ok: false, message: MSG.GENERAL.FILL_FORMS };
  }

  if (direction !== "vp2ep" && direction !== "ep2vp") {
    return { ok: false, message: MSG.CONVERT.INVALID_DIRECTION };
  }

  const amountNum = Number(amount);
  if (!Number.isInteger(amountNum) || amountNum <= 0) {
    return { ok: false, message: MSG.CONVERT.AMOUNT_INVALID };
  }

  const convertConfig = baseServerConfig.convertfeature[direction];
  if (amountNum < convertConfig.min) {
    return { ok: false, message: MSG.CONVERT.AMOUNT_TOO_LOW(convertConfig.min) };
  }

  const received = Math.floor(amountNum * convertConfig.rate);

  const userPool = await getUserPool();
  const userid = ctx.user.userid;

  // Verify pincode
  const authResult = await userPool
    .request()
    .input("UserID", userid)
    .input("UserPass2", encodePassword(pincode)).query(`
      SELECT TOP 1 UserNum
      FROM dbo.UserInfo
      WHERE UserID = @UserID
        AND UserPass2 = @UserPass2
    `);

  const user = authResult.recordset[0];
  if (!user) {
    return { ok: false, message: MSG.FORGOT_PASSWORD.PINCODE_MISMATCHED };
  }

  // Atomic single UPDATE — 0 rows affected means insufficient balance
  const fromCol = direction === "vp2ep" ? "UserPoint2" : "UserPoint";
  const toCol = direction === "vp2ep" ? "UserPoint" : "UserPoint2";
  const fromLabel = direction === "vp2ep" ? "VP" : "EP";
  const toLabel = direction === "vp2ep" ? "EP" : "VP";

  const updateResult = await userPool
    .request()
    .input("UserNum", sql.Int, user.UserNum)
    .input("Amount", sql.Int, amountNum)
    .input("Received", sql.Int, received).query(`
      UPDATE dbo.UserInfo
      SET ${fromCol} = ${fromCol} - @Amount,
          ${toCol}   = ${toCol}   + @Received
      WHERE UserNum = @UserNum
        AND ${fromCol} >= @Amount
    `);

  if (updateResult.rowsAffected[0] === 0) {
    return { ok: false, message: MSG.CONVERT.INSUFFICIENT_BALANCE };
  }

  await logAction({
    userId: user.UserNum,
    actionType: "UPDATE",
    entityType: "USER",
    entityId: `${user.UserNum}:${userid}`,
    description: `${MSG.LOG.ACTION_CONVERT_POINTS}: ${amountNum} ${fromLabel} → ${received} ${toLabel}`,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return {
    ok: true,
    message: MSG.CONVERT.SUCCESS(amountNum, fromLabel, received, toLabel),
  };
};

/* -------------------------
   Get Account Info
-------------------------- */

export const getAccountInfo = async (ctx = {}) => {
  const MSG = getMessage(ctx.lang);

  if (!ctx.user?.userid) {
    return { ok: false, message: MSG.AUTH.LOGIN_REQUIRED };
  }

  const userPool = await getUserPool();
  const userid = ctx.user.userid;

  const result = await userPool.request().input("UserID", userid).query(`
      SELECT TOP 1
        UserID,
        UserType,
        UserAvailable,
        UserBlock,
        ChaRemain,
        UserEmail,
        UserPoint,
        UserPoint2
      FROM dbo.UserInfo
      WHERE UserID = @UserID
    `);

  const user = result.recordset[0];
  if (!user) {
    return { ok: false, message: MSG.AUTH.INVALID_REQ };
  }

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
