import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { hashPassword, signSession, verifyPassword, verifySession } from "./auth.js";

describe("password hashing", () => {
  it("hashes a password so the hash differs from the plaintext but still verifies", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash).not.toBe("correct horse battery staple");
    await expect(verifyPassword("correct horse battery staple", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong password", hash)).resolves.toBe(false);
  });

  it("salts each hash uniquely", async () => {
    const [a, b] = await Promise.all([hashPassword("same-password"), hashPassword("same-password")]);
    expect(a).not.toBe(b);
  });
});

describe("session tokens", () => {
  it("round-trips a user id through sign and verify", () => {
    const token = signSession("user-123", false);
    expect(verifySession(token)).toBe("user-123");
  });

  it("rejects a garbage token", () => {
    expect(() => verifySession("not-a-jwt")).toThrow();
  });

  it("rejects a token signed with a different secret", () => {
    const forged = jwt.sign({ sub: "user-123" }, "a-different-secret");
    expect(() => verifySession(forged)).toThrow();
  });

  it("rejects an expired token", () => {
    const expired = jwt.sign({ sub: "user-123" }, "test-secret", { expiresIn: -1 });
    expect(() => verifySession(expired)).toThrow();
  });
});
