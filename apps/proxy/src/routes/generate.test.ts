import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app.js";
import { SESSION_COOKIE, signSession } from "../services/auth.js";

vi.mock("../services/openai.js", () => ({
  streamBoard: vi.fn(),
}));

import { streamBoard } from "../services/openai.js";

let app: ReturnType<typeof createApp>;
const cookie = `${SESSION_COOKIE}=${signSession("user-1", false)}`;

beforeEach(() => {
  app = createApp();
  vi.mocked(streamBoard).mockReset();
});

function fakeStream(chunks: unknown[]) {
  return (async function* () {
    for (const chunk of chunks) yield chunk;
  })();
}

describe("POST /generate", () => {
  it("rejects an unauthenticated request", async () => {
    const res = await request(app).post("/generate").send({ prompt: "a todo app" });
    expect(res.status).toBe(401);
  });

  it("rejects an empty prompt", async () => {
    const res = await request(app).post("/generate").set("Cookie", cookie).send({ prompt: "" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_BODY");
  });

  it("streams tool-call argument fragments as delta events, then done", async () => {
    vi.mocked(streamBoard).mockResolvedValue(
      fakeStream([
        { choices: [{ delta: { tool_calls: [{ function: { arguments: '{"pro' } }] } }] },
        { choices: [{ delta: { tool_calls: [{ function: { arguments: 'jectName":"X"}' } }] } }] },
        { choices: [{ delta: {} }], usage: { total_tokens: 42 } },
      ]) as never,
    );

    const res = await request(app).post("/generate").set("Cookie", cookie).send({ prompt: "a todo app" });

    expect(res.status).toBe(200);
    expect(res.text).toContain("event: status");
    expect(res.text).toContain('data: {"json":"{\\"pro"}');
    expect(res.text).toContain('data: {"json":"jectName\\":\\"X\\"}"}');
    expect(res.text).toContain("event: done");
    expect(res.text).toContain('"total_tokens":42');
  });

  it("emits an error event when the upstream call fails", async () => {
    vi.mocked(streamBoard).mockRejectedValue(new Error("boom"));

    const res = await request(app).post("/generate").set("Cookie", cookie).send({ prompt: "a todo app" });

    expect(res.status).toBe(200);
    expect(res.text).toContain("event: error");
    expect(res.text).toContain('"code":"AI_ERROR"');
    expect(res.text).toContain('"message":"boom"');
  });
});
