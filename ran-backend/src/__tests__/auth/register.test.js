/**
 * Boundary Tests: POST /api/auth/register
 *
 * Designed to expose edge-case failures. Failing tests indicate real bugs.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { register } from "../../services/auth.service.js";

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

function makePool({ userExists = false, emailExists = false } = {}) {
  let callCount = 0;
  const queryFn = vi.fn().mockImplementation(() => {
    callCount++;
    // First query = check username, second = check email
    if (callCount === 1) return Promise.resolve({ recordset: userExists ? [1] : [] });
    if (callCount === 2) return Promise.resolve({ recordset: emailExists ? [1] : [] });
    return Promise.resolve({ recordset: [] }); // INSERT
  });
  const reqObj = { input: vi.fn().mockReturnThis(), query: queryFn };
  getUserPool.mockResolvedValue({ request: () => reqObj });
}

const ctx = { lang: "en", ip: "127.0.0.1", userAgent: "test" };

const validBody = {
  userid: "testuser",
  password: "pass1234",
  confirmPassword: "pass1234",
  pincode: "pin1234",
  confirmPincode: "pin1234",
  email: "test@example.com",
};

describe("register() — input validation", () => {
  it("rejects body with missing required fields", async () => {
    const result = await register({ userid: "u", password: "p" }, ctx);
    expect(result.ok).toBe(false);
  });

  it("rejects userid shorter than 4 chars — boundary: 3 chars", async () => {
    const result = await register({ ...validBody, userid: "abc" }, ctx);
    expect(result.ok).toBe(false);
  });

  it("accepts userid at exactly 4 chars — EXPOSES: off-by-one", async () => {
    makePool();
    const result = await register({ ...validBody, userid: "abcd" }, ctx);
    // Should pass validation and reach DB
    expect(result.ok).toBe(true);
  });

  it("rejects userid longer than 12 chars — boundary: 13 chars", async () => {
    const result = await register({ ...validBody, userid: "a".repeat(13) }, ctx);
    expect(result.ok).toBe(false);
  });

  it("accepts userid at exactly 12 chars — EXPOSES: off-by-one", async () => {
    makePool();
    const result = await register({ ...validBody, userid: "a".repeat(12) }, ctx);
    expect(result.ok).toBe(true);
  });

  it("rejects password shorter than 4 chars — boundary: 3 chars", async () => {
    const result = await register({ ...validBody, password: "abc", confirmPassword: "abc" }, ctx);
    expect(result.ok).toBe(false);
  });

  it("rejects pincode with special chars — EXPOSES: VALID_REGEX check on pincode", async () => {
    const result = await register({ ...validBody, pincode: "pin!!", confirmPincode: "pin!!" }, ctx);
    expect(result.ok).toBe(false);
  });

  it("rejects password mismatch", async () => {
    const result = await register({ ...validBody, confirmPassword: "different" }, ctx);
    expect(result.ok).toBe(false);
  });

  it("rejects pincode mismatch", async () => {
    const result = await register({ ...validBody, confirmPincode: "different" }, ctx);
    expect(result.ok).toBe(false);
  });

  it("rejects invalid email format — no @", async () => {
    const result = await register({ ...validBody, email: "notanemail" }, ctx);
    expect(result.ok).toBe(false);
  });

  it("rejects invalid email format — no domain", async () => {
    const result = await register({ ...validBody, email: "user@" }, ctx);
    expect(result.ok).toBe(false);
  });

  it("rejects userid with spaces — EXPOSES: VALID_REGEX check", async () => {
    const result = await register({ ...validBody, userid: "test user" }, ctx);
    expect(result.ok).toBe(false);
  });

  it("rejects userid with angle brackets — EXPOSES: VALID_REGEX XSS vector", async () => {
    const result = await register({ ...validBody, userid: "<script>" }, ctx);
    expect(result.ok).toBe(false);
  });
});

describe("register() — uniqueness checks (DB level)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects duplicate username", async () => {
    makePool({ userExists: true });
    const result = await register(validBody, ctx);
    expect(result.ok).toBe(false);
  });

  it("rejects duplicate email", async () => {
    makePool({ emailExists: true });
    const result = await register(validBody, ctx);
    expect(result.ok).toBe(false);
  });

  it("succeeds with unique credentials", async () => {
    makePool();
    const result = await register(validBody, ctx);
    expect(result.ok).toBe(true);
  });
});
