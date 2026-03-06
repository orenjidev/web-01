/**
 * Boundary Tests: requireStaff middleware
 *
 * Tests staff threshold (type >= 50) boundary conditions.
 */

import { describe, it, expect, vi } from "vitest";
import { requireStaff } from "../../api/middlewares/auth.middleware.js";

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

function makeReq(type) {
  return {
    session: { user: { userid: "u", userNum: 1, type } },
    headers: {},
    ip: "127.0.0.1",
    ctx: null,
  };
}

function makeRes() {
  const res = {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
  };
  return res;
}

describe("requireStaff — UserType boundaries", () => {
  it("returns 401 when no session", () => {
    const req = { session: null, headers: {}, ip: "127.0.0.1" };
    const res = makeRes();
    const next = vi.fn();
    requireStaff(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 for UserType = 0 (regular user)", () => {
    const req = makeReq(0);
    const res = makeRes();
    const next = vi.fn();
    requireStaff(req, res, next);
    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 for UserType = 49 — boundary: one below staff threshold", () => {
    const req = makeReq(49);
    const res = makeRes();
    const next = vi.fn();
    requireStaff(req, res, next);
    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
    // EXPOSES: if threshold is > 50 instead of >= 50, type=50 users get blocked
  });

  it("calls next() for UserType = 50 — exact threshold", () => {
    const req = makeReq(50);
    const res = makeRes();
    const next = vi.fn();
    requireStaff(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.statusCode).toBeNull();
  });

  it("calls next() for UserType = 100 (high-privilege admin)", () => {
    const req = makeReq(100);
    const res = makeRes();
    const next = vi.fn();
    requireStaff(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
