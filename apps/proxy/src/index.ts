import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";

const app = express();
const port = process.env.PORT ?? 3001;

app.use(cors({ origin: process.env.ALLOWED_ORIGIN }));
app.use(express.json({ limit: "25mb" }));
app.use(rateLimit({ windowMs: 60 * 60 * 1000, limit: 30 }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`proxy listening on :${port}`);
});
