import type { NextFunction, Request, Response } from "express";
import { SESSION_COOKIE, verifySession } from "../services/auth.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.[SESSION_COOKIE];
  if (typeof token !== "string") {
    res.status(401).json({ code: "AUTH_REQUIRED", message: "No session" });
    return;
  }
  try {
    req.userId = verifySession(token);
    next();
  } catch {
    res.status(401).json({ code: "AUTH_REQUIRED", message: "Invalid or expired session" });
  }
}
