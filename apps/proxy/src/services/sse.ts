import type { Response } from "express";
import type OpenAI from "openai";

export function sendEvent(res: Response, event: string, data: unknown): void {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function pipeToolCallStream(
  res: Response,
  stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>,
): Promise<void> {
  let usage: unknown;
  for await (const chunk of stream) {
    const fragment = chunk.choices[0]?.delta?.tool_calls?.[0]?.function?.arguments;
    if (fragment) sendEvent(res, "delta", { json: fragment });
    if (chunk.usage) usage = chunk.usage;
  }
  sendEvent(res, "done", { usage });
}
