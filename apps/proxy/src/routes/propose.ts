import { StateSchema, WorkItemSchema } from "@orbit/types";
import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { streamProposal } from "../services/openai.js";
import { pipeToolCallStream, sendEvent } from "../services/sse.js";

const ProposeRequestSchema = z.object({
  board: z.object({ states: z.array(StateSchema), items: z.array(WorkItemSchema) }),
  instruction: z.string().min(1).max(4000),
});

export function createProposeRouter(): Router {
  const router = Router();

  router.post("/", requireAuth, async (req, res) => {
    const parsed = ProposeRequestSchema.safeParse(req.body);
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

    const { board, instruction } = parsed.data;
    const boardContext = JSON.stringify({
      states: board.states,
      items: board.items.map((item) => ({ ...item, description: item.description?.slice(0, 300) })),
    });

    try {
      const stream = await streamProposal(`Board:\n${boardContext}\n\nInstruction: ${instruction}`);
      await pipeToolCallStream(res, stream);
    } catch (err) {
      sendEvent(res, "error", {
        code: "AI_ERROR",
        message: err instanceof Error ? err.message : "Proposal failed",
        retryable: true,
      });
    } finally {
      res.end();
    }
  });

  return router;
}
