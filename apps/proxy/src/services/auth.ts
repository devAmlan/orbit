import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const SESSION_COOKIE = "orbit_session";

const SALT_ROUNDS = 12;

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET env var is required");
  return secret;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signSession(userId: string, remember: boolean): string {
  return jwt.sign({ sub: userId }, jwtSecret(), { expiresIn: remember ? "30d" : "1d" });
}

export function verifySession(token: string): string {
  const payload = jwt.verify(token, jwtSecret());
  if (typeof payload === "string" || typeof payload.sub !== "string") {
    throw new Error("Malformed session token");
  }
  return payload.sub;
}
