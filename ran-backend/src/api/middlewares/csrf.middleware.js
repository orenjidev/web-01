import crypto from "crypto";

/**
 * Synchronizer token pattern CSRF protection.
 * Token is stored server-side in the session — no cookie parsing needed.
 */

/** Called by GET /api/csrf-token — generates and stores a token in the session */
export function generateCsrfToken(req, res) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString("hex");
  }
  return req.session.csrfToken;
}

/** Middleware — rejects mutations that don't carry the correct token */
export function doubleCsrfProtection(req, res, next) {
  const sessionToken = req.session?.csrfToken;
  const headerToken = req.headers["x-csrf-token"];

  if (!sessionToken || !headerToken || sessionToken !== headerToken) {
    res.status(403).json({ ok: false, message: "Invalid CSRF token" });
    return;
  }
  next();
}
