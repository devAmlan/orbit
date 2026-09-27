import { randomUUID } from "node:crypto";
import { LoginSchema, SignupSchema } from "@orbit/types";
import type { Response } from "express";
import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { requireAuth } from "../middleware/auth.js";
import { hashPassword, SESSION_COOKIE, signSession, verifyPassword } from "../services/auth.js";
import { db, type UserRow } from "../services/db.js";

const DAY_MS = 24 * 60 * 60 * 1000;

function setSessionCookie(res: Response, token: string, remember: boolean): void {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: remember ? 30 * DAY_MS : DAY_MS,
  });
}

function toPublicUser(row: Pick<UserRow, "id" | "email" | "name">) {
  return { id: row.id, email: row.email, name: row.name };
}

export function createAuthRouter(): Router {
  const authRouter = Router();
  // Own limiter instance per router so each app (one per test, one in prod) gets a fresh counter.
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
  });

  authRouter.post("/signup", loginLimiter, async (req, res) => {
    const parsed = SignupSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ code: "INVALID_BODY", message: parsed.error.issues[0]?.message ?? "Invalid body" });
      return;
    }
    const { name, email, password } = parsed.data;

    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) {
      res.status(409).json({ code: "EMAIL_TAKEN", message: "Email already registered" });
      return;
    }

    const user: UserRow = {
      id: randomUUID(),
      email,
      name,
      passwordHash: await hashPassword(password),
      createdAt: new Date().toISOString(),
    };
    db.prepare(
      "INSERT INTO users (id, email, passwordHash, name, createdAt) VALUES (@id, @email, @passwordHash, @name, @createdAt)",
    ).run(user);

    setSessionCookie(res, signSession(user.id, false), false);
    res.status(201).json({ user: toPublicUser(user) });
  });

  authRouter.post("/login", loginLimiter, async (req, res) => {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ code: "INVALID_BODY", message: parsed.error.issues[0]?.message ?? "Invalid body" });
      return;
    }
    const { email, password, remember = false } = parsed.data;

    const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as UserRow | undefined;
    const valid = row ? await verifyPassword(password, row.passwordHash) : false;
    if (!row || !valid) {
      res.status(401).json({ code: "INVALID_CREDENTIALS", message: "Incorrect email or password" });
      return;
    }

    setSessionCookie(res, signSession(row.id, remember), remember);
    res.json({ user: toPublicUser(row) });
  });

  authRouter.post("/logout", (_req, res) => {
    res.clearCookie(SESSION_COOKIE);
    res.status(204).end();
  });

  authRouter.get("/me", requireAuth, (req, res) => {
    const row = db.prepare("SELECT id, email, name FROM users WHERE id = ?").get(req.userId) as
      | Pick<UserRow, "id" | "email" | "name">
      | undefined;
    if (!row) {
      res.status(401).json({ code: "AUTH_REQUIRED", message: "Session invalid" });
      return;
    }
    res.json({ user: row });
  });

  return authRouter;
}
