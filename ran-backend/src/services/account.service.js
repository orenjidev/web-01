import { getMessage } from "../constants/messages.js";
import { getUserPool } from "../loaders/mssql.js";
import { encodePassword, VALID_REGEX } from "./util/auth.util.js";
import { logAction } from "./actionlog.service.js";

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
    entityId: user.UserNum,
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
    entityId: user.UserNum,
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
    entityId: user.UserNum,
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
