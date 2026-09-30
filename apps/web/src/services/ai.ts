import { SSEEventSchema, type Change, type SSEEvent, type State, type WorkItem } from "@orbit/types"

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001"

// ponytail: EventSource can't send a POST body, so we read the SSE stream by hand off fetch's ReadableStream.
async function* readSSE(res: Response): AsyncGenerator<SSEEvent> {
  if (!res.ok || !res.body) {
    throw new Error(`Request failed (${res.status})`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let separatorIndex: number
    while ((separatorIndex = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, separatorIndex)
      buffer = buffer.slice(separatorIndex + 2)

      let event = ""
      let data = ""
      for (const line of frame.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim()
        else if (line.startsWith("data:")) data = line.slice(5).trim()
      }
      if (!event || !data) continue

      const parsed = SSEEventSchema.safeParse({ event, data: JSON.parse(data) })
      if (parsed.success) yield parsed.data
    }
  }
}

export async function* generateBoard(prompt: string, signal?: AbortSignal): AsyncGenerator<SSEEvent> {
  const res = await fetch(`${API_URL}/generate`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
    signal,
  })
  yield* readSSE(res)
}

export async function* proposeChanges(
  board: { states: State[]; items: WorkItem[] },
  instruction: string,
  signal?: AbortSignal,
): AsyncGenerator<SSEEvent> {
  const res = await fetch(`${API_URL}/propose`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ board, instruction }),
    signal,
  })
  yield* readSSE(res)
}

export type { Change }
