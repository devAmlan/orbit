import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app.js";
import { SESSION_COOKIE, signSession } from "../services/auth.js";

vi.mock("../services/openai.js", () => ({
  streamProposal: vi.fn(),
}));

import { streamProposal } from "../services/openai.js";

let app: ReturnType<typeof createApp>;
const cookie = `${SESSION_COOKIE}=${signSession("user-1", false)}`;

const board = {
  states: [{ id: "todo", name: "Todo", group: "unstarted" }],
  items: [{ id: "1", title: "Set up auth", stateId: "todo", priority: "high" }],
}

beforeEach(() => {
  app = createApp();
  vi.mocked(streamProposal).mockReset();
});

function fakeStream(chunks: unknown[]) {
  return (async function* () {
    for (const chunk of chunks) yield chunk;
  })();
}

describe("POST /propose", () => {
  it("rejects an unauthenticated request", async () => {
    const res = await request(app).post("/propose").send({ board, instruction: "add a task" });
    expect(res.status).toBe(401);
  });

  it("rejects a missing instruction", async () => {
    const res = await request(app).post("/propose").set("Cookie", cookie).send({ board, instruction: "" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_BODY");
  });

  it("rejects a malformed board", async () => {
    const res = await request(app)
      .post("/propose")
      .set("Cookie", cookie)
      .send({ board: { states: "nope" }, instruction: "add a task" });
    expect(res.status).toBe(400);
  });

  it("streams tool-call argument fragments as delta events, then done", async () => {
    vi.mocked(streamProposal).mockResolvedValue(
      fakeStream([
        { choices: [{ delta: { tool_calls: [{ function: { arguments: '{"changes":[' } }] } }] },
        { choices: [{ delta: {} }], usage: { total_tokens: 7 } },
      ]) as never,
    );

    const res = await request(app)
      .post("/propose")
      .set("Cookie", cookie)
      .send({ board, instruction: "move it to done" });

    expect(res.status).toBe(200);
    expect(streamProposal).toHaveBeenCalledWith(expect.stringContaining("move it to done"));
    expect(res.text).toContain("event: status");
    expect(res.text).toContain('data: {"json":"{\\"changes\\":["}');
    expect(res.text).toContain("event: done");
  });

  it("emits an error event when the upstream call fails", async () => {
    vi.mocked(streamProposal).mockRejectedValue(new Error("boom"));

    const res = await request(app)
      .post("/propose")
      .set("Cookie", cookie)
      .send({ board, instruction: "move it to done" });

    expect(res.status).toBe(200);
    expect(res.text).toContain("event: error");
    expect(res.text).toContain('"code":"AI_ERROR"');
  });
});
