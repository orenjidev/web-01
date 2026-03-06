/**
 * Boundary Tests: POST /api/auth/forgotpass
 *
 * Designed to expose edge-case failures.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { forgotPassword } from "../../services/auth.service.js";

vi.mock("../../loaders/mssql.js", () => ({
  getUserPool: vi.fn(),
}));

vi.mock("../../services/actionlog.service.js", () => ({
  logAction: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../config/server.config.js", () => ({
  baseServerConfig: {
    coreOptions: { ismd5: false },
  },
}));

import { getUserPool } from "../../loaders/mssql.js";

function makePool(record = null) {
  let callCount = 0;
  const queryFn = vi.fn().mockImplementation(() => {
    callCount++;
    if (callCount === 1) return Promise.resolve({ recordset: record ? [record] : [] });
    return Promise.resolve({ recordset: [], rowsAffected: [1] }); // UPDATE
  });
  const reqObj = { input: vi.fn().mockReturnThis(), query: queryFn };
  getUserPool.mockResolvedValue({ request: () => reqObj });
}

const ctx = { lang: "en", ip: "127.0.0.1", userAgent: "test" };

const validBody = {
  userid: "testuser",
  pincode: "pin1234",
  confirmPincode: "pin1234",
  newPassword: "newpass1",
  confirmNewPassword: "newpass1",
};

describe("forgotPassword() — input validation", () => {
  it("rejects missing userid", async () => {
    const result = await forgotPassword({ ...validBody, userid: undefined }, ctx);
    expect(result.ok).toBe(false);
  });

  it("rejects pincode mismatch", async () => {
    const result = await forgotPassword({ ...validBody, confirmPincode: "different" }, ctx);
    expect(result.ok).toBe(false);
  });

  it("rejects newPassword mismatch — EXPOSES: password confirm check", async () => {
    const result = await forgotPassword({ ...validBody, confirmNewPassword: "mismatch" }, ctx);
    expect(result.ok).toBe(false);
  });

  it("rejects pincode with special chars", async () => {
    const result = await forgotPassword({ ...validBody, pincode: "pin!!", confirmPincode: "pin!!" }, ctx);
    expect(result.ok).toBe(false);
  });

  it("rejects newPassword shorter than 4 chars — boundary: 3 chars", async () => {
    const result = await forgotPassword({ ...validBody, newPassword: "abc", confirmNewPassword: "abc" }, ctx);
    expect(result.ok).toBe(false);
  });

  it("rejects userid shorter than 4 chars", async () => {
    const result = await forgotPassword({ ...validBody, userid: "abc" }, ctx);
    expect(result.ok).toBe(false);
  });
});

describe("forgotPassword() — DB-level checks", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects non-existent userid — EXPOSES: user not found check", async () => {
    makePool(null); // no record
    const result = await forgotPassword(validBody, ctx);
    expect(result.ok).toBe(false);
  });

  it("rejects wrong pincode — EXPOSES: pincode comparison", async () => {
    makePool({ UserNum: 1, UserPass2: "differenthash" });
    // With ismd5=false, encodePassword returns plain text
    // "pin1234" !== "differenthash" → should reject
    const result = await forgotPassword(validBody, ctx);
    expect(result.ok).toBe(false);
  });

  it("succeeds with correct pincode", async () => {
    // With ismd5=false, encodePassword returns plain text
    // stored value must match plain "pin1234"
    makePool({ UserNum: 1, UserPass2: "pin1234" });
    const result = await forgotPassword(validBody, ctx);
    expect(result.ok).toBe(true);
  });
});
