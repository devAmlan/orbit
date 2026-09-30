import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import { createAuthRouter } from "./routes/auth.js";
import { createGenerateRouter } from "./routes/generate.js";
import { createProposeRouter } from "./routes/propose.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.ALLOWED_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "25mb" }));
  app.use(cookieParser());
  app.use(rateLimit({ windowMs: 60 * 60 * 1000, limit: 30 }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/auth", createAuthRouter());
  app.use("/generate", createGenerateRouter());
  app.use("/propose", createProposeRouter());

  return app;
}
