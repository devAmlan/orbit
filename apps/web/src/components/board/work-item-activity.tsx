import { useState } from "react"
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDownWideNarrow,
  Bold,
  Code,
  Image,
  Indent,
  Italic,
  List,
  ListChecks,
  ListFilter,
  ListOrdered,
  type LucideIcon,
  Paperclip,
  Strikethrough,
  Underline,
} from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/motion/motion-tabs"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type ActivityKind = "state" | "update" | "comment"

export type ActivityEntry = {
  id: string
  kind: ActivityKind
  icon: LucideIcon
  iconClassName?: string
  text: React.ReactNode
  timestamp: Date
}

const ACTOR_NAME = "devcyphexo"

const ACTIVITY_TABS: { value: string; label: string; filter: (entry: ActivityEntry) => boolean }[] = [
  { value: "all", label: "All", filter: () => true },
  { value: "activity", label: "Activity", filter: (entry) => entry.kind !== "comment" },
  { value: "comments", label: "Comments", filter: (entry) => entry.kind === "comment" },
  { value: "updates", label: "Updates", filter: (entry) => entry.kind === "update" },
  { value: "transition", label: "Transition", filter: (entry) => entry.kind === "state" },
  { value: "history", label: "History", filter: () => true },
]

function relativeTime(date: Date) {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? "" : "s"} ago`
}

function ActivityRow({ entry, isLast }: { entry: ActivityEntry; isLast: boolean }) {
  const Icon = entry.icon

  return (
    <div className="relative flex gap-3">
      {!isLast && <span className="absolute top-7 left-3.5 h-[calc(100%-0.25rem)] w-px bg-border" />}
      <span
        className={cn(
          "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground",
          entry.iconClassName,
        )}
      >
        <Icon className="size-3.5" />
      </span>
      <p className="pt-1 pb-4 text-sm">
        <span className="font-medium">{ACTOR_NAME}</span> {entry.text}
        <span className="text-muted-foreground"> · {relativeTime(entry.timestamp)}</span>
      </p>
    </div>
  )
}

function CommentComposer({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [text, setText] = useState("")

  function submit() {
    const trimmed = text.trim()
    if (!trimmed) return
    onSubmit(trimmed)
    setText("")
  }

  return (
    <div className="rounded-lg border">
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Add comment"
        rows={2}
        className="w-full resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
      />
      {/* ponytail: formatting buttons are decorative — a rich-text comment composer is a separate
          build from the tab switch this was scoped to add; wire up when comments need formatting. */}
      <div className="flex flex-wrap items-center gap-0.5 border-t px-2 py-1.5">
        <Button variant="ghost" size="icon-xs">
          <Bold />
        </Button>
        <Button variant="ghost" size="icon-xs">
          <Italic />
        </Button>
        <Button variant="ghost" size="icon-xs">
          <Underline />
        </Button>
        <Button variant="ghost" size="icon-xs">
          <Strikethrough />
        </Button>
        <div className="mx-1 h-4 w-px bg-border" />
        <Button variant="ghost" size="icon-xs">
          <AlignLeft />
        </Button>
        <Button variant="ghost" size="icon-xs">
          <AlignCenter />
        </Button>
        <Button variant="ghost" size="icon-xs">
          <AlignRight />
        </Button>
        <div className="mx-1 h-4 w-px bg-border" />
        <Button variant="ghost" size="icon-xs">
          <ListOrdered />
        </Button>
        <Button variant="ghost" size="icon-xs">
          <List />
        </Button>
        <Button variant="ghost" size="icon-xs">
          <ListChecks />
        </Button>
        <div className="mx-1 h-4 w-px bg-border" />
        <Button variant="ghost" size="icon-xs">
          <Indent />
        </Button>
        <Button variant="ghost" size="icon-xs">
          <Code />
        </Button>
        <Button variant="ghost" size="icon-xs">
          <Image />
        </Button>
        <Button variant="ghost" size="icon-xs">
          <Paperclip />
        </Button>
        <Button size="sm" className="ml-auto" disabled={!text.trim()} onClick={submit}>
          Comment
        </Button>
      </div>
    </div>
  )
}

export type WorkItemActivityProps = {
  entries: ActivityEntry[]
  onComment: (text: string) => void
}

function WorkItemActivity({ entries, onComment }: WorkItemActivityProps) {
  const sorted = [...entries].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  return (
    <Tabs defaultValue="all" className="gap-4">
      <div className="flex items-center justify-between">
        <TabsList variant="underline">
          {ACTIVITY_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {/* ponytail: decorative — no filter/sort criteria to apply yet without real activity data. */}
        <div className="mb-2 flex items-center gap-1">
          <Button variant="ghost" size="icon-sm">
            <ListFilter />
          </Button>
          <Button variant="ghost" size="icon-sm">
            <ArrowDownWideNarrow />
          </Button>
        </div>
      </div>

      <CommentComposer onSubmit={onComment} />

      {ACTIVITY_TABS.map((tab) => {
        const filtered = sorted.filter(tab.filter)
        return (
          <TabsContent key={tab.value} value={tab.value}>
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing here yet.</p>
            ) : (
              <div>
                {filtered.map((entry, index) => (
                  <ActivityRow key={entry.id} entry={entry} isLast={index === filtered.length - 1} />
                ))}
              </div>
            )}
          </TabsContent>
        )
      })}
    </Tabs>
  )
}

export { WorkItemActivity }
