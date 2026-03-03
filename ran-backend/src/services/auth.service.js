import { getUserPool } from "../loaders/mssql.js";
import { getMessage } from "../constants/messages.js";
import { encodePassword, VALID_REGEX } from "./util/auth.util.js";
import { logAction } from "./actionlog.service.js";
import { getCharactersByUserId } from "./character.service.js";

/* -------------------------
   Pure validation helpers
-------------------------- */

const isValidLength = (value, min, max) =>
  typeof value === "string" && value.length >= min && value.length <= max;

/* -------------------------
   Login
-------------------------- */

export const login = async (body, ctx = {}) => {
  const MSG = getMessage(ctx.lang);

  if (!body || typeof body !== "object") {
    return { ok: false, message: MSG.COMMON.INVALID_BODY };
  }

  if (Object.keys(body).length !== 2) {
    return { ok: false, message: MSG.COMMON.BUFFER_SIZE };
  }

  const { userid, password } = body;

  if (!userid || !password) {
    return { ok: false, message: MSG.COMMON.INVALID_BODY };
  }

  if (!isValidLength(userid, 4, 20) || !isValidLength(password, 4, 20)) {
    return { ok: false, message: MSG.AUTH.USER_PASS_LENGTH_CHECK };
  }

  if (!VALID_REGEX.test(userid) || !VALID_REGEX.test(password)) {
    return {
      ok: false,
      message: MSG.AUTH.USER_PASS_SPECIAL_CHAR_CHECK,
    };
  }

  const userPool = await getUserPool();
  const encodedPass = encodePassword(password);

  const result = await userPool.request().input("UserID", userid).query(`
      SELECT TOP 1
        UserNum,
        UserID,
        UserPass,
        UserPass2,
        UserAvailable,
        UserBlock,
        UserType
      FROM dbo.UserInfo
      WHERE UserID = @UserID
    `);

  const user = result.recordset[0];

  if (
    !user ||
    (user.UserPass !== encodedPass && user.UserPass2 !== encodedPass)
  ) {
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
    user: {
      userid: user.UserID,
      userNum: user.UserNum,
      type: user.UserType,
    },
    characters: await getCharactersByUserId(user.UserNum),
  };
};

/* -------------------------
   Register
-------------------------- */

export const register = async (body, ctx = {}) => {
  const MSG = getMessage(ctx.lang);

  if (!body || typeof body !== "object") {
    return { ok: false, message: MSG.COMMON.INVALID_BODY };
  }

  const keys = Object.keys(body);
  if (keys.length < 5 || keys.length > 7) {
    return { ok: false, message: MSG.COMMON.BUFFER_SIZE };
  }

  const { userid, password, confirmPassword, pincode, confirmPincode, email } =
    body;

  if (
    !userid ||
    !password ||
    !confirmPassword ||
    !pincode ||
    !confirmPincode ||
    !email
  ) {
    return { ok: false, message: MSG.GENERAL.FILL_FORMS };
  }

  if (
    !isValidLength(userid, 4, 12) ||
    !isValidLength(password, 4, 11) ||
    !isValidLength(pincode, 4, 11)
  ) {
    return { ok: false, message: MSG.REGISTER.LENGTH_RULE };
  }

  if (!VALID_REGEX.test(userid)) {
    return { ok: false, message: MSG.REGISTER.INVALID_USERNAME };
  }

  if (!VALID_REGEX.test(password)) {
    return { ok: false, message: MSG.REGISTER.INVALID_PASSWORD };
  }

  if (!VALID_REGEX.test(pincode)) {
    return { ok: false, message: MSG.REGISTER.INVALID_PINCODE };
  }

  if (password !== confirmPassword) {
    return { ok: false, message: MSG.REGISTER.PASSWORD_CONFIRM_MISMATCH };
  }

  if (pincode !== confirmPincode) {
    return { ok: false, message: MSG.REGISTER.PINCODE_CONFIRM_MISMATCH };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: MSG.REGISTER.INVALID_EMAIL };
  }

  const userPool = await getUserPool();

  const exists = async (column, value) =>
    (
      await userPool.request().input(column, value).query(`
          SELECT TOP 1 1
          FROM dbo.UserInfo
          WHERE ${column} = @${column}
        `)
    ).recordset.length > 0;

  if (await exists("UserID", userid)) {
    return { ok: false, message: MSG.REGISTER.USERNAME_TAKEN };
  }

  if (await exists("UserEmail", email)) {
    return { ok: false, message: MSG.REGISTER.EMAIL_TAKEN };
  }

  await userPool
    .request()
    .input("UserID", userid)
    .input("UserPass", encodePassword(password))
    .input("UserPass2", encodePassword(pincode))
    .input("UserEmail", email).query(`
      INSERT INTO dbo.UserInfo
        (UserID, UserPass, UserPass2, UserEmail)
      VALUES
        (@UserID, @UserPass, @UserPass2, @UserEmail)
    `);

  await logAction({
    userId: null,
    actionType: "CREATE",
    entityType: "USER",
    entityId: userid,
    description: MSG.LOG.ACTION_REGISTER_SUCCESS,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return {
    ok: true,
    message: MSG.REGISTER.SUCCESS,
  };
};

/* -------------------------
   Forgot Password
-------------------------- */

export const forgotPassword = async (body, ctx = {}) => {
  const MSG = getMessage(ctx.lang);

  if (!body || typeof body !== "object") {
    return { ok: false, message: MSG.GENERAL.INVALID_BODY };
  }

  const requiredKeys = [
    "userid",
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

  const { userid, pincode, confirmPincode, newPassword, confirmNewPassword } =
    body;

  if (
    !userid ||
    !pincode ||
    !confirmPincode ||
    !newPassword ||
    !confirmNewPassword
  ) {
    return { ok: false, message: MSG.GENERAL.FILL_FORMS };
  }

  if (
    !isValidLength(userid, 4, 12) ||
    !isValidLength(pincode, 4, 11) ||
    !isValidLength(newPassword, 4, 11)
  ) {
    return { ok: false, message: MSG.REGISTER.LENGTH_RULE };
  }

  if (!VALID_REGEX.test(userid)) {
    return { ok: false, message: MSG.REGISTER.INVALID_USERNAME };
  }

  if (!VALID_REGEX.test(pincode)) {
    return { ok: false, message: MSG.REGISTER.INVALID_PINCODE };
  }

  if (!VALID_REGEX.test(newPassword)) {
    return { ok: false, message: MSG.REGISTER.INVALID_PASSWORD };
  }

  if (pincode !== confirmPincode) {
    return { ok: false, message: MSG.FORGOT_PASSWORD.PINCODE_MISMATCHED };
  }

  if (newPassword !== confirmNewPassword) {
    return {
      ok: false,
      message: MSG.FORGOT_PASSWORD.PASSWORD_MISMATCHED_NEW,
    };
  }

  const userPool = await getUserPool();

  const result = await userPool.request().input("UserID", userid).query(`
      SELECT TOP 1
        UserNum,
        UserPass2
      FROM dbo.UserInfo
      WHERE UserID = @UserID
    `);

  const user = result.recordset[0];

  if (!user) {
    return { ok: false, message: MSG.FORGOT_PASSWORD.INVALID_REQ };
  }

  if (user.UserPass2 !== encodePassword(pincode)) {
    return { ok: false, message: MSG.FORGOT_PASSWORD.PINCODE_MISMATCHED };
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
    description: MSG.LOG.ACTION_PASSWORD_RESET,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return {
    ok: true,
    message: MSG.FORGOT_PASSWORD.SUCCESS(userid),
  };
};
