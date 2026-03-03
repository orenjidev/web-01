import crypto from "crypto";
import { baseServerConfig } from "../../config/server.config.js";

export const VALID_REGEX = /^[a-zA-Z0-9_.-]+$/;

export const encodePassword = (password = "") => {
  if (!baseServerConfig.coreOptions.ismd5) {
    return password;
  }
  const clean = password.trim();

  if (process.env.IsMD5 === "true") {
    return crypto
      .createHash("md5")
      .update(clean)
      .digest("hex")
      .toUpperCase()
      .substring(0, 19);
  }

  return clean;
};
