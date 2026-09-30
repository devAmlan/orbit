import * as React from "react"
import { ProposeChangesSchema, type Change, type State, type WorkItem } from "@orbit/types"
import { ArrowUpIcon, SquareIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { proposeChanges } from "@/services/ai"
import { useAppStore } from "@/store"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

const OP_LABEL: Record<Change["op"], string> = {
  add: "Add",
  update: "Update",
  move: "Move",
  delete: "Delete",
}

export type FollowUpChatProps = {
  states: State[]
  items: WorkItem[]
  onApply: (changes: Change[]) => void
}

function FollowUpChat({ states, items, onApply }: FollowUpChatProps) {
  const [text, setText] = React.useState("")
  const [status, setStatus] = React.useState<"idle" | "streaming">("idle")
  const [error, setError] = React.useState<string | null>(null)
  const abortRef = React.useRef<AbortController | null>(null)

  const messages = useAppStore((s) => s.messages)
  const pendingChanges = useAppStore((s) => s.pendingChanges)
  const sendMessage = useAppStore((s) => s.send)
  const setPendingChanges = useAppStore((s) => s.applyChanges)
  const discard = useAppStore((s) => s.discard)

  async function handleSend() {
    if (status === "streaming") {
      abortRef.current?.abort()
      setStatus("idle")
      return
    }
    if (!text.trim()) return

    setError(null)
    const instruction = text
    sendMessage(instruction)
    setText("")
    setStatus("streaming")
    const controller = new AbortController()
    abortRef.current = controller
    let buffer = ""

    try {
      for await (const event of proposeChanges({ states, items }, instruction, controller.signal)) {
        if (event.event === "delta") buffer += event.data.json
        else if (event.event === "error") throw new Error(event.data.message)
      }
      const parsed = ProposeChangesSchema.parse(JSON.parse(buffer))
      setPendingChanges(parsed.changes)
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setStatus("idle")
    }
  }

  function applyAll() {
    if (!pendingChanges) return
    onApply(pendingChanges)
    discard()
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Ask AI</h2>
        <p className="text-xs text-muted-foreground">Describe a change — review before it lands on the board.</p>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-3 px-4 py-3">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                message.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted",
              )}
            >
              {message.content}
            </div>
          ))}

          {pendingChanges && pendingChanges.length > 0 && (
            <div className="space-y-2 rounded-lg border p-3">
              <p className="text-xs font-medium text-muted-foreground">Proposed changes</p>
              {pendingChanges.map((change, index) => (
                <div key={index} className="rounded-md bg-muted px-2.5 py-2 text-xs">
                  <span className="font-medium">{OP_LABEL[change.op]}</span>{" "}
                  {change.item?.title ?? change.itemId ?? ""}
                  <p className="mt-0.5 text-muted-foreground">{change.reason}</p>
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={applyAll}>
                  Apply all
                </Button>
                <Button size="sm" variant="ghost" onClick={discard}>
                  Discard
                </Button>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </ScrollArea>

      <div className="flex items-center gap-2 border-t p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder="e.g. Move the auth tasks to In Progress"
          className="h-9 min-w-0 flex-1 rounded-md border bg-transparent px-3 text-sm outline-none"
        />
        <Button size="icon-sm" onClick={handleSend} disabled={status === "idle" && !text.trim()}>
          {status === "streaming" ? <SquareIcon className="size-3 fill-current" /> : <ArrowUpIcon />}
        </Button>
      </div>
    </div>
  )
}

export { FollowUpChat }
