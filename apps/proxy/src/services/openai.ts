import OpenAI from "openai";
import { CREATE_BOARD_FUNCTION, SYSTEM_PROMPT as CREATE_BOARD_PROMPT } from "../prompts/create-board.js";
import { PROPOSE_CHANGES_FUNCTION, SYSTEM_PROMPT as PROPOSE_CHANGES_PROMPT } from "../prompts/propose-changes.js";

let client: OpenAI | undefined;

function openai(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY env var is required");
  client ??= new OpenAI({ apiKey });
  return client;
}

function model(): string {
  const value = process.env.OPENAI_MODEL;
  if (!value) throw new Error("OPENAI_MODEL env var is required");
  return value;
}

function streamToolCall(
  systemPrompt: string,
  userContent: string,
  tool: { name: string; description: string; parameters: Record<string, unknown> },
) {
  return openai().chat.completions.create({
    model: model(),
    stream: true,
    stream_options: { include_usage: true },
    tool_choice: { type: "function", function: { name: tool.name } },
    tools: [{ type: "function", function: tool }],
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
  });
}

export function streamBoard(prompt: string) {
  return streamToolCall(CREATE_BOARD_PROMPT, prompt, CREATE_BOARD_FUNCTION);
}

export function streamProposal(userContent: string) {
  return streamToolCall(PROPOSE_CHANGES_PROMPT, userContent, PROPOSE_CHANGES_FUNCTION);
}
