/**
 * Boundary Tests: POST /api/auth/login
 *
 * These tests are designed to expose edge-case failures in the login service.
 * Some tests WILL FAIL if the implementation has gaps — that is intentional.
 * Failing tests indicate real issues to fix.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { login } from "../../services/auth.service.js";

// --- Mocks ---

vi.mock("../../loaders/mssql.js", () => ({
  getUserPool: vi.fn(),
}));

vi.mock("../../services/actionlog.service.js", () => ({
  logAction: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../services/character.service.js", () => ({
  getCharactersByUserId: vi.fn().mockResolvedValue([]),
}));

vi.mock("../../config/server.config.js", () => ({
  baseServerConfig: {
    coreOptions: { ismd5: false },
  },
}));

// --- Helpers ---

import { getUserPool } from "../../loaders/mssql.js";

function makePool(record = null) {
  const queryFn = vi.fn().mockResolvedValue({ recordset: record ? [record] : [] });
  const reqObj = { input: vi.fn().mockReturnThis(), query: queryFn };
  getUserPool.mockResolvedValue({ request: () => reqObj });
  return queryFn;
}

const ctx = { lang: "en", ip: "127.0.0.1", userAgent: "test" };

// --- Tests ---

describe("login() — input validation (no DB hit)", () => {
  it("rejects missing body", async () => {
    const result = await login(null, ctx);
    expect(result.ok).toBe(false);
  });

  it("rejects empty string userid (EXPOSES: falsy check)", async () => {
    const result = await login({ userid: "", password: "pass1" }, ctx);
    expect(result.ok).toBe(false);
  });

  it("rejects empty string password (EXPOSES: falsy check)", async () => {
    const result = await login({ userid: "user1", password: "" }, ctx);
    expect(result.ok).toBe(false);
  });

  it("rejects userid shorter than 4 chars — boundary: 3 chars", async () => {
    const result = await login({ userid: "abc", password: "pass1" }, ctx);
    expect(result.ok).toBe(false);
  });

  it("rejects userid longer than 20 chars — boundary: 21 chars", async () => {
    const result = await login({ userid: "a".repeat(21), password: "pass1" }, ctx);
    expect(result.ok).toBe(false);
  });

  it("accepts userid at minimum boundary — exactly 4 chars", async () => {
    makePool({ UserNum: 1, UserID: "user", UserPass: "pass1", UserPass2: null, UserAvailable: 1, UserBlock: 0, UserType: 0 });
    const result = await login({ userid: "user", password: "pass1" }, ctx);
    // Should reach DB; may succeed or fail on password, but should not fail on length
    expect(result.ok).not.toBe(false, "4-char userid should pass length validation");
  });

  it("rejects special chars in userid — EXPOSES: VALID_REGEX boundary", async () => {
    const result = await login({ userid: "<script>", password: "pass1" }, ctx);
    expect(result.ok).toBe(false);
    // EXPOSES: if VALID_REGEX doesn't catch angle brackets, this reaches DB
  });

  it("rejects SQL-like injection string in userid (validation layer, not DB)", async () => {
    const result = await login({ userid: "' OR '1'='1", password: "x" }, ctx);
    expect(result.ok).toBe(false);
    // The space in the string should fail VALID_REGEX
  });

  it("rejects body with extra keys — EXPOSES: strict body size check (must be exactly 2 keys)", async () => {
    const result = await login({ userid: "user1", password: "pass1", extra: "data" }, ctx);
    expect(result.ok).toBe(false);
  });

  it("rejects body with missing second key", async () => {
    const result = await login({ userid: "user1" }, ctx);
    expect(result.ok).toBe(false);
  });
});

describe("login() — DB-level auth checks", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns failure for non-existent user (empty DB result)", async () => {
    makePool(null); // no record
    const result = await login({ userid: "nouser", password: "pass1" }, ctx);
    expect(result.ok).toBe(false);
  });

  it("returns failure for wrong password", async () => {
    makePool({
      UserNum: 42,
      UserID: "testuser",
      UserPass: "WRONGHASH",
      UserPass2: null,
      UserAvailable: 1,
      UserBlock: 0,
      UserType: 0,
    });
    const result = await login({ userid: "testuser", password: "wrongpass" }, ctx);
    expect(result.ok).toBe(false);
  });

  it("returns failure for disabled account (UserAvailable=0)", async () => {
    makePool({
      UserNum: 42,
      UserID: "testuser",
      UserPass: "pass1", // matches plain (ismd5=false)
      UserPass2: null,
      UserAvailable: 0, // <-- disabled
      UserBlock: 0,
      UserType: 0,
    });
    const result = await login({ userid: "testuser", password: "pass1" }, ctx);
    expect(result.ok).toBe(false);
    // EXPOSES: if disabled check is missing, this would return ok:true
  });

  it("returns failure for blocked account (UserBlock=1)", async () => {
    makePool({
      UserNum: 42,
      UserID: "testuser",
      UserPass: "pass1",
      UserPass2: null,
      UserAvailable: 1,
      UserBlock: 1, // <-- blocked
      UserType: 0,
    });
    const result = await login({ userid: "testuser", password: "pass1" }, ctx);
    expect(result.ok).toBe(false);
    // EXPOSES: if blocked check is missing, blocked users can log in
  });

  it("returns ok:true for valid credentials", async () => {
    makePool({
      UserNum: 42,
      UserID: "testuser",
      UserPass: "pass1",
      UserPass2: null,
      UserAvailable: 1,
      UserBlock: 0,
      UserType: 0,
    });
    const result = await login({ userid: "testuser", password: "pass1" }, ctx);
    expect(result.ok).toBe(true);
    expect(result.user.userid).toBe("testuser");
  });
});
