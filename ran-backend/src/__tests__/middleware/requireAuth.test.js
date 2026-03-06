/**
 * Boundary Tests: requireAuth middleware
 *
 * Tests session checks and 401 behaviour.
 */

import { describe, it, expect, vi } from "vitest";
import { requireAuth } from "../../api/middlewares/auth.middleware.js";

vi.mock("../../config/server.config.js", () => ({
  baseServerConfig: {
    shop: { enabled: true },
    features: { ticketSystem: true, topup: true },
  },
}));

vi.mock("../../constants/messages.js", () => ({
  getMessage: () => ({
    AUTH: { LOGIN_REQUIRED: "Login required", STAFF_REQUIRED: "Staff required" },
    FEATURE: {},
  }),
}));

function makeRes() {
  const res = {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
  };
  return res;
}

describe("requireAuth", () => {
  it("returns 401 when no session exists", () => {
    const req = { session: null, headers: {}, ip: "127.0.0.1" };
    const res = makeRes();
    const next = vi.fn();
    requireAuth(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when session exists but has no user key", () => {
    const req = { session: {}, headers: {}, ip: "127.0.0.1" };
    const res = makeRes();
    const next = vi.fn();
    requireAuth(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when session.user is null — EXPOSES: null user check", () => {
    const req = { session: { user: null }, headers: {}, ip: "127.0.0.1" };
    const res = makeRes();
    const next = vi.fn();
    requireAuth(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next() when valid session.user is present", () => {
    const req = {
      session: { user: { userid: "user1", userNum: 1, type: 0 } },
      headers: {},
      ip: "127.0.0.1",
      ctx: null,
    };
    const res = makeRes();
    const next = vi.fn();
    requireAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.ctx).toBeDefined();
    expect(req.ctx.user.userid).toBe("user1");
  });
});
