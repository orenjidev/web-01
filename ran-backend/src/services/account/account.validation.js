import { VALID_REGEX } from "../util/auth.util.js";

/** Returns an error result object, or null if valid. */

export function validateChangePincodeBody(body, MSG) {
  if (!body || typeof body !== "object")
    return { ok: false, message: MSG.GENERAL.INVALID_BODY };
  const required = ["pincode", "confirmPincode", "newPincode", "confirmNewPincode", "email", "confirmEmail"];
  for (const key of required) {
    if (!(key in body)) return { ok: false, message: MSG.GENERAL.BUFFER_SIZE };
  }
  const { pincode, confirmPincode, newPincode, confirmNewPincode, email, confirmEmail } = body;
  if (!pincode || !confirmPincode || !newPincode || !confirmNewPincode || !email || !confirmEmail)
    return { ok: false, message: MSG.GENERAL.FILL_FORMS };
  if (pincode !== confirmPincode)
    return { ok: false, message: MSG.FORGOT_PASSWORD.PINCODE_MISMATCHED };
  if (newPincode !== confirmNewPincode)
    return { ok: false, message: MSG.FORGOT_PASSWORD.PINCODE_MISMATCHED };
  if (email !== confirmEmail)
    return { ok: false, message: MSG.ACCOUNT.EMAIL_MISMATCH };
  if (!VALID_REGEX.test(pincode) || !VALID_REGEX.test(newPincode))
    return { ok: false, message: MSG.GENERAL.INVALID_CHARS };
  return null;
}

export function validateChangePasswordBody(body, MSG) {
  if (!body || typeof body !== "object")
    return { ok: false, message: MSG.GENERAL.INVALID_BODY };
  const required = ["oldPassword", "confirmOldPassword", "pincode", "confirmPincode", "newPassword", "confirmNewPassword"];
  for (const key of required) {
    if (!(key in body)) return { ok: false, message: MSG.GENERAL.BUFFER_SIZE };
  }
  const { oldPassword, confirmOldPassword, pincode, confirmPincode, newPassword, confirmNewPassword } = body;
  if (!oldPassword || !confirmOldPassword || !pincode || !confirmPincode || !newPassword || !confirmNewPassword)
    return { ok: false, message: MSG.GENERAL.FILL_FORMS };
  if (oldPassword !== confirmOldPassword)
    return { ok: false, message: MSG.AUTH.PASSWORD_MISMATCH };
  if (newPassword !== confirmNewPassword)
    return { ok: false, message: MSG.AUTH.PASSWORD_MISMATCH_NEW };
  if (pincode !== confirmPincode)
    return { ok: false, message: MSG.FORGOT_PASSWORD.PINCODE_MISMATCHED };
  if (!VALID_REGEX.test(newPassword))
    return { ok: false, message: MSG.GENERAL.INVALID_CHARS };
  return null;
}

export function validateChangeEmailBody(body, MSG) {
  if (!body || typeof body !== "object")
    return { ok: false, message: MSG.GENERAL.INVALID_BODY };
  const required = ["email", "confirmEmail", "pincode"];
  for (const key of required) {
    if (!(key in body)) return { ok: false, message: MSG.GENERAL.BUFFER_SIZE };
  }
  const { email, confirmEmail, pincode } = body;
  if (!email || !confirmEmail || !pincode)
    return { ok: false, message: MSG.GENERAL.FILL_FORMS };
  if (email !== confirmEmail)
    return { ok: false, message: MSG.ACCOUNT.EMAIL_MISMATCH };
  return null;
}

export function validateConvertPointsBody(body, MSG) {
  if (!body || typeof body !== "object")
    return { ok: false, message: MSG.GENERAL.INVALID_BODY };
  const required = ["direction", "amount", "pincode"];
  for (const key of required) {
    if (!(key in body)) return { ok: false, message: MSG.GENERAL.BUFFER_SIZE };
  }
  const { direction, amount, pincode } = body;
  if (!direction || amount == null || !pincode)
    return { ok: false, message: MSG.GENERAL.FILL_FORMS };
  if (direction !== "vp2ep" && direction !== "ep2vp")
    return { ok: false, message: MSG.CONVERT.INVALID_DIRECTION };
  const amountNum = Number(amount);
  if (!Number.isInteger(amountNum) || amountNum <= 0)
    return { ok: false, message: MSG.CONVERT.AMOUNT_INVALID };
  return null;
}
