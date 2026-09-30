import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { streamBoard } from "../services/openai.js";
import { pipeToolCallStream, sendEvent } from "../services/sse.js";

const GenerateRequestSchema = z.object({ prompt: z.string().min(1).max(8000) });

export function createGenerateRouter(): Router {
  const router = Router();

  router.post("/", requireAuth, async (req, res) => {
    const parsed = GenerateRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ code: "INVALID_BODY", message: parsed.error.issues[0]?.message ?? "Invalid body" });
      return;
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    sendEvent(res, "status", { step: "planning" });

    try {
      const stream = await streamBoard(parsed.data.prompt);
      await pipeToolCallStream(res, stream);
    } catch (err) {
      sendEvent(res, "error", {
        code: "AI_ERROR",
        message: err instanceof Error ? err.message : "Generation failed",
        retryable: true,
      });
    } finally {
      res.end();
    }
  });

  return router;
}
