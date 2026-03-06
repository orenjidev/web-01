import { VALID_REGEX } from "../util/auth.util.js";

const isValidLength = (value, min, max) =>
  typeof value === "string" && value.length >= min && value.length <= max;

/** Returns an error result object, or null if valid. */

export function validateLoginBody(body, MSG) {
  if (!body || typeof body !== "object")
    return { ok: false, message: MSG.COMMON.INVALID_BODY };
  if (Object.keys(body).length !== 2)
    return { ok: false, message: MSG.COMMON.BUFFER_SIZE };
  const { userid, password } = body;
  if (!userid || !password)
    return { ok: false, message: MSG.COMMON.INVALID_BODY };
  if (!isValidLength(userid, 4, 20) || !isValidLength(password, 4, 20))
    return { ok: false, message: MSG.AUTH.USER_PASS_LENGTH_CHECK };
  if (!VALID_REGEX.test(userid) || !VALID_REGEX.test(password))
    return { ok: false, message: MSG.AUTH.USER_PASS_SPECIAL_CHAR_CHECK };
  return null;
}

export function validateRegisterBody(body, MSG) {
  if (!body || typeof body !== "object")
    return { ok: false, message: MSG.COMMON.INVALID_BODY };
  const keys = Object.keys(body);
  if (keys.length < 5 || keys.length > 7)
    return { ok: false, message: MSG.COMMON.BUFFER_SIZE };
  const { userid, password, confirmPassword, pincode, confirmPincode, email } = body;
  if (!userid || !password || !confirmPassword || !pincode || !confirmPincode || !email)
    return { ok: false, message: MSG.GENERAL.FILL_FORMS };
  if (!isValidLength(userid, 4, 12) || !isValidLength(password, 4, 11) || !isValidLength(pincode, 4, 11))
    return { ok: false, message: MSG.REGISTER.LENGTH_RULE };
  if (!VALID_REGEX.test(userid))
    return { ok: false, message: MSG.REGISTER.INVALID_USERNAME };
  if (!VALID_REGEX.test(password))
    return { ok: false, message: MSG.REGISTER.INVALID_PASSWORD };
  if (!VALID_REGEX.test(pincode))
    return { ok: false, message: MSG.REGISTER.INVALID_PINCODE };
  if (password !== confirmPassword)
    return { ok: false, message: MSG.REGISTER.PASSWORD_CONFIRM_MISMATCH };
  if (pincode !== confirmPincode)
    return { ok: false, message: MSG.REGISTER.PINCODE_CONFIRM_MISMATCH };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { ok: false, message: MSG.REGISTER.INVALID_EMAIL };
  return null;
}

export function validateForgotPasswordBody(body, MSG) {
  if (!body || typeof body !== "object")
    return { ok: false, message: MSG.GENERAL.INVALID_BODY };
  const required = ["userid", "pincode", "confirmPincode", "newPassword", "confirmNewPassword"];
  for (const key of required) {
    if (!(key in body)) return { ok: false, message: MSG.GENERAL.BUFFER_SIZE };
  }
  const { userid, pincode, confirmPincode, newPassword, confirmNewPassword } = body;
  if (!userid || !pincode || !confirmPincode || !newPassword || !confirmNewPassword)
    return { ok: false, message: MSG.GENERAL.FILL_FORMS };
  if (!isValidLength(userid, 4, 12) || !isValidLength(pincode, 4, 11) || !isValidLength(newPassword, 4, 11))
    return { ok: false, message: MSG.REGISTER.LENGTH_RULE };
  if (!VALID_REGEX.test(userid))
    return { ok: false, message: MSG.REGISTER.INVALID_USERNAME };
  if (!VALID_REGEX.test(pincode))
    return { ok: false, message: MSG.REGISTER.INVALID_PINCODE };
  if (!VALID_REGEX.test(newPassword))
    return { ok: false, message: MSG.REGISTER.INVALID_PASSWORD };
  if (pincode !== confirmPincode)
    return { ok: false, message: MSG.FORGOT_PASSWORD.PINCODE_MISMATCHED };
  if (newPassword !== confirmNewPassword)
    return { ok: false, message: MSG.FORGOT_PASSWORD.PASSWORD_MISMATCHED_NEW };
  return null;
}
