import { useRef, useState } from "react"
import type { Priority, State, StateGroup, WorkItem } from "@orbit/types"
import {
  AlignLeft,
  ArrowLeft,
  CalendarRange,
  Check,
  ChevronDown,
  CircleCheckBig,
  CircleDashed,
  CircleDot,
  CircleSlash2,
  EllipsisVertical,
  Gauge,
  Loader2,
  type LucideIcon,
  MessageSquare,
  Plus,
  SignalHigh,
  SignalLow,
  SignalMedium,
  SignalZero,
  Tag,
  TriangleAlert,
  User,
  X,
} from "lucide-react"

import { KanbanBoard, KanbanCard, KanbanCards, KanbanHeader, KanbanProvider } from "@/components/kibo-ui/kanban"
import { DescriptionEditor } from "@/components/editor/description-editor"
import { WorkItemActivity, type ActivityEntry } from "@/components/board/work-item-activity"
import { IconTransition } from "@/components/motion/icon-transition"
import { MotionCalendar } from "@/components/motion/motion-calendar"
import { MotionPopover } from "@/components/motion/motion-popover"
import { MotionSelect, type MotionSelectOption } from "@/components/motion/motion-select"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const STATE_GROUP_ORDER: StateGroup[] = ["backlog", "unstarted", "started", "completed"]

const STATE_GROUP_COLOR: Record<StateGroup, string> = {
  backlog: "bg-state-backlog",
  unstarted: "bg-state-unstarted",
  started: "bg-state-started",
  completed: "bg-state-completed",
}

const STATE_ICON: Record<string, LucideIcon> = {
  backlog: CircleDashed,
  todo: CircleDashed,
  "in-progress": CircleDot,
  done: CircleCheckBig,
  cancelled: CircleSlash2,
}

const PRIORITY_ICON: Record<Priority, LucideIcon> = {
  urgent: TriangleAlert,
  high: SignalHigh,
  medium: SignalMedium,
  low: SignalLow,
  none: SignalZero,
}

const PRIORITY_COLOR: Record<Priority, string> = {
  urgent: "text-priority-urgent",
  high: "text-priority-high",
  medium: "text-priority-medium",
  low: "text-priority-low",
  none: "text-muted-foreground",
}

const MOCK_STATES: State[] = [
  { id: "backlog", name: "Backlog", group: "backlog" },
  { id: "todo", name: "Todo", group: "unstarted" },
  { id: "in-progress", name: "In Progress", group: "started" },
  { id: "done", name: "Done", group: "completed" },
  { id: "cancelled", name: "Cancelled", group: "completed" },
]

const DAY = 1000 * 60 * 60 * 24
const today = new Date()
const daysFromNow = (n: number) => new Date(today.getTime() + n * DAY)

type Assignee = { name: string }

type BoardItem = WorkItem & {
  name: string
  column: string
  code: string
  startAt: Date
  endAt: Date
  assignee?: Assignee
  activity: ActivityEntry[]
}

const MOCK_ITEMS: Omit<BoardItem, "name" | "column" | "code">[] = [
  {
    id: "1",
    title: "Set up authentication API",
    stateId: "in-progress",
    priority: "high",
    labels: ["backend"],
    estimate: 5,
    startAt: daysFromNow(-3),
    endAt: daysFromNow(2),
    assignee: { name: "Ava Chen" },
  },
  {
    id: "2",
    title: "Build login UI",
    stateId: "in-progress",
    priority: "medium",
    labels: ["frontend"],
    estimate: 3,
    startAt: daysFromNow(-1),
    endAt: daysFromNow(4),
    assignee: { name: "Marco Silva" },
  },
  {
    id: "3",
    title: "Add session handling",
    stateId: "todo",
    priority: "high",
    labels: ["backend"],
    estimate: 3,
    startAt: daysFromNow(2),
    endAt: daysFromNow(6),
  },
  {
    id: "4",
    title: "Design onboarding flow",
    stateId: "todo",
    priority: "low",
    labels: ["design"],
    estimate: 2,
    startAt: daysFromNow(1),
    endAt: daysFromNow(5),
    assignee: { name: "Priya Patel" },
  },
  {
    id: "5",
    title: "Draft project brief parser",
    stateId: "backlog",
    priority: "medium",
    estimate: 5,
    startAt: daysFromNow(7),
    endAt: daysFromNow(14),
  },
  {
    id: "6",
    title: "Wire up GitHub repo import",
    stateId: "backlog",
    priority: "none",
    startAt: daysFromNow(10),
    endAt: daysFromNow(18),
  },
  {
    id: "7",
    title: "Ship empty-state illustration",
    stateId: "done",
    priority: "low",
    estimate: 1,
    startAt: daysFromNow(-8),
    endAt: daysFromNow(-4),
    assignee: { name: "Priya Patel" },
  },
  {
    id: "8",
    title: "Evaluate Firebase for auth",
    stateId: "cancelled",
    priority: "none",
    description: "Went with a first-party auth API instead — no longer needed.",
    startAt: daysFromNow(-14),
    endAt: daysFromNow(-10),
  },
]

const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" })

const DEFAULT_DESCRIPTION = [
  "This work item covers the core implementation needed to ship this feature end-to-end.",
  "It touches the API layer, the client integration, and any state management required to wire things together.",
  "Acceptance criteria: the feature works as expected, edge cases are handled, and existing tests still pass.",
  "Flag any blockers in the comments so the team can help unblock this quickly.",
]
  .map((line) => `<p>${line}</p>`)
  .join("")

function AssigneeAvatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <span
      title={name}
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground",
        className,
      )}
    >
      {initials}
    </span>
  )
}

function Pill({
  icon: Icon,
  iconClassName,
  children,
}: {
  icon?: LucideIcon
  iconClassName?: string
  children: React.ReactNode
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
      {Icon && <Icon className={cn("size-3", iconClassName)} />}
      {children}
    </span>
  )
}

function PropertyButton({
  icon: Icon,
  iconClassName,
  children,
  className,
  ref,
  ...props
}: React.ComponentProps<"button"> & {
  icon?: LucideIcon
  iconClassName?: string
  ref?: React.Ref<HTMLButtonElement>
}) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
        className,
      )}
      {...props}
    >
      {Icon && <Icon className={cn("size-3.5", iconClassName)} />}
      {children}
    </button>
  )
}

const ASSIGNEE_OPTIONS = ["Ava Chen", "Marco Silva", "Priya Patel"] as const
const UNASSIGNED = "unassigned"

function DateField({ value, onChange }: { value: Date; onChange: (date: Date) => void }) {
  return (
    <MotionCalendar
      value={value}
      onChange={onChange}
      trigger={<PropertyButton icon={CalendarRange}>{dateFormatter.format(value)}</PropertyButton>}
    />
  )
}

function AutosaveIndicator({ status }: { status: "idle" | "saving" | "saved" }) {
  if (status === "idle") return null

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <IconTransition
        transitionKey={status}
        variant="blur-scale"
        icon={
          status === "saving" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Check className="size-3.5 text-state-completed" />
          )
        }
      />
      {status === "saving" ? "Saving…" : "Saved"}
    </div>
  )
}

const LABEL_DOT_COLORS = [
  "bg-priority-urgent",
  "bg-priority-high",
  "bg-priority-medium",
  "bg-priority-low",
  "bg-state-started",
  "bg-state-completed",
]

function labelColor(label: string) {
  const hash = [...label].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return LABEL_DOT_COLORS[hash % LABEL_DOT_COLORS.length]
}

function LabelPill({ name, onRemove }: { name: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
      <span className={cn("size-2 rounded-full", labelColor(name))} />
      {name}
      {onRemove && (
        <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-foreground">
          <X className="size-3" />
        </button>
      )}
    </span>
  )
}

const LABEL_POOL = ["frontend", "backend", "design", "bug", "docs", "urgent"] as const

function LabelEditor({ labels, onChange }: { labels: string[]; onChange: (labels: string[]) => void }) {
  const [draft, setDraft] = useState("")

  function toggle(name: string) {
    onChange(labels.includes(name) ? labels.filter((l) => l !== name) : [...labels, name])
  }

  function addCustom() {
    const name = draft.trim()
    if (!name || labels.includes(name)) return
    onChange([...labels, name])
    setDraft("")
  }

  return (
    <MotionPopover
      trigger={
        <button
          type="button"
          className="inline-flex size-6 items-center justify-center rounded-full border text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Plus className="size-3.5" />
        </button>
      }
    >
      {(close) => (
        <div className="w-48 space-y-1">
          {LABEL_POOL.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                toggle(name)
                close()
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
            >
              <span className={cn("size-2 rounded-full", labelColor(name))} />
              <span className="flex-1">{name}</span>
              {labels.includes(name) && <Check className="size-3.5" />}
            </button>
          ))}
          <div className="flex items-center gap-1 border-t pt-1.5">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return
                addCustom()
                close()
              }}
              placeholder="New label…"
              className="h-7 min-w-0 flex-1 rounded-md border bg-transparent px-2 text-sm outline-none"
            />
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => {
                addCustom()
                close()
              }}
            >
              <Plus />
            </Button>
          </div>
        </div>
      )}
    </MotionPopover>
  )
}

export type ProjectBoardProps = {
  id: string
}

// ponytail: states/items are hardcoded until /generate + the store are wired up; swap for useAppStore once the backend exists.
function ProjectBoard({ id }: ProjectBoardProps) {
  const columns = [...MOCK_STATES]
    .sort((a, b) => STATE_GROUP_ORDER.indexOf(a.group) - STATE_GROUP_ORDER.indexOf(b.group))
    .map((state) => ({ id: state.id, name: state.name, colorClassName: STATE_GROUP_COLOR[state.group] }))

  const projectCode = (id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4) || "TASK").toUpperCase()
  const stateNameById = Object.fromEntries(columns.map((c) => [c.id, c.name]))

  const [items, setItems] = useState<BoardItem[]>(() =>
    MOCK_ITEMS.map((item, index) => ({
      ...item,
      name: item.title,
      column: item.stateId,
      code: `${projectCode}-${index + 1}`,
      activity: [],
    })),
  )
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const selectedItem = items.find((item) => item.id === selectedItemId) ?? null

  // ponytail: simulated — patches only ever land in local state, there's no backend to persist to yet.
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle")
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const descriptionActivityTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  function describeFieldChanges(prev: BoardItem, patch: Partial<BoardItem>): ActivityEntry[] {
    const entries: ActivityEntry[] = []
    const timestamp = new Date()

    if (patch.stateId !== undefined && patch.stateId !== prev.stateId) {
      entries.push({
        id: crypto.randomUUID(),
        kind: "state",
        icon: STATE_ICON[patch.stateId] ?? CircleDashed,
        text: (
          <>
            set the state to <strong className="font-medium">{stateNameById[patch.stateId]}</strong>.
          </>
        ),
        timestamp,
      })
    }

    if (patch.priority !== undefined && patch.priority !== prev.priority) {
      entries.push({
        id: crypto.randomUUID(),
        kind: "update",
        icon: PRIORITY_ICON[patch.priority],
        iconClassName: PRIORITY_COLOR[patch.priority],
        text: (
          <>
            set the priority to{" "}
            <strong className="font-medium">
              {patch.priority[0].toUpperCase() + patch.priority.slice(1)}
            </strong>
            .
          </>
        ),
        timestamp,
      })
    }

    if ("assignee" in patch && patch.assignee?.name !== prev.assignee?.name) {
      entries.push({
        id: crypto.randomUUID(),
        kind: "update",
        icon: User,
        text: patch.assignee ? (
          <>
            set the assignee to <strong className="font-medium">{patch.assignee.name}</strong>.
          </>
        ) : (
          "removed the assignee."
        ),
        timestamp,
      })
    }

    if (patch.startAt !== undefined && patch.startAt.getTime() !== prev.startAt.getTime()) {
      entries.push({
        id: crypto.randomUUID(),
        kind: "update",
        icon: CalendarRange,
        text: (
          <>
            set the start date to <strong className="font-medium">{dateFormatter.format(patch.startAt)}</strong>.
          </>
        ),
        timestamp,
      })
    }

    if (patch.endAt !== undefined && patch.endAt.getTime() !== prev.endAt.getTime()) {
      entries.push({
        id: crypto.randomUUID(),
        kind: "update",
        icon: CalendarRange,
        text: (
          <>
            set the due date to <strong className="font-medium">{dateFormatter.format(patch.endAt)}</strong>.
          </>
        ),
        timestamp,
      })
    }

    if (patch.labels !== undefined && patch.labels.join(",") !== (prev.labels ?? []).join(",")) {
      entries.push({
        id: crypto.randomUUID(),
        kind: "update",
        icon: Tag,
        text: "updated the labels.",
        timestamp,
      })
    }

    return entries
  }

  function updateSelectedItem(patch: Partial<BoardItem>) {
    if (!selectedItemId) return

    const isDescriptionOnly = Object.keys(patch).length === 1 && "description" in patch
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== selectedItemId) return item
        const newEntries = isDescriptionOnly ? [] : describeFieldChanges(item, patch)
        return { ...item, ...patch, activity: [...item.activity, ...newEntries] }
      }),
    )

    if ("description" in patch) {
      clearTimeout(descriptionActivityTimeoutRef.current)
      descriptionActivityTimeoutRef.current = setTimeout(() => {
        setItems((prev) =>
          prev.map((item) =>
            item.id === selectedItemId
              ? {
                  ...item,
                  activity: [
                    ...item.activity,
                    { id: crypto.randomUUID(), kind: "update", icon: AlignLeft, text: "updated the description.", timestamp: new Date() },
                  ],
                }
              : item,
          ),
        )
      }, 1200)
    }

    setSaveStatus("saving")
    clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => setSaveStatus("saved"), 600)
  }

  function addComment(text: string) {
    if (!selectedItemId) return
    setItems((prev) =>
      prev.map((item) =>
        item.id === selectedItemId
          ? {
              ...item,
              activity: [
                ...item.activity,
                {
                  id: crypto.randomUUID(),
                  kind: "comment",
                  icon: MessageSquare,
                  text: <>commented: {text}</>,
                  timestamp: new Date(),
                },
              ],
            }
          : item,
      ),
    )
  }

  function closeSheet() {
    setSelectedItemId(null)
    clearTimeout(saveTimeoutRef.current)
    clearTimeout(descriptionActivityTimeoutRef.current)
    setSaveStatus("idle")
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Project</p>
        <h1 className="text-2xl font-semibold tracking-tight">{id}</h1>
      </div>

      <div className="h-[calc(100vh-12rem)] min-h-[420px]">
        <KanbanProvider columns={columns} data={items} onDataChange={setItems}>
          {(column) => (
            <KanbanBoard id={column.id} key={column.id}>
              <KanbanHeader>
                <div className="flex items-center gap-2">
                  <div className={cn("size-2 rounded-full", column.colorClassName)} />
                  <span>{column.name}</span>
                </div>
              </KanbanHeader>
              <KanbanCards id={column.id}>
                {(item: BoardItem) => {
                  const StateIcon = STATE_ICON[item.column] ?? CircleDashed
                  const PriorityIcon = PRIORITY_ICON[item.priority]
                  const priorityLabel = item.priority[0].toUpperCase() + item.priority.slice(1)

                  return (
                    <KanbanCard column={item.column} id={item.id} key={item.id} name={item.name}>
                      <div onClick={() => setSelectedItemId(item.id)} className="cursor-pointer space-y-2 min-h-24 flex flex-col  justify-between">
                        <div className="flex flex-col gap-0.5">
                          <p className="m-0 text-xs text-muted-foreground">{item.code}</p>
                          <p className="m-0 text-sm font-semibold">{item.title}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <Pill icon={StateIcon}>{stateNameById[item.column]}</Pill>
                          <Pill icon={PriorityIcon} iconClassName={PRIORITY_COLOR[item.priority]}>
                            {priorityLabel}
                          </Pill>
                          {item.assignee && <AssigneeAvatar name={item.assignee.name} className="ml-auto" />}
                        </div>
                      </div>
                    </KanbanCard>
                  )
                }}
              </KanbanCards>
            </KanbanBoard>
          )}
        </KanbanProvider>
      </div>

      <Sheet open={selectedItem !== null} onOpenChange={(open) => !open && closeSheet()}>
        <SheetContent
          showCloseButton={false}
          className="gap-0 p-0 data-[side=right]:w-1/2 data-[side=right]:sm:max-w-none"
        >
          {selectedItem && (
            <>
              <div className="flex items-center justify-between border-b px-2 py-1.5">
                <Button variant="ghost" size="icon-sm" onClick={closeSheet}>
                  <ArrowLeft />
                </Button>
                <AutosaveIndicator status={saveStatus} />
                <Button variant="ghost" size="icon-sm">
                  <EllipsisVertical />
                </Button>
              </div>

              <ScrollArea className="min-h-0 flex-1">
                <div className="space-y-5 px-6 py-5">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{selectedItem.code}</p>
                    <h2 className="text-2xl font-semibold tracking-tight">{selectedItem.title}</h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <MotionSelect
                      value={selectedItem.column}
                      onChange={(stateId) => updateSelectedItem({ stateId, column: stateId })}
                      options={columns.map(
                        (c): MotionSelectOption<string> => ({
                          value: c.id,
                          label: c.name,
                          icon: STATE_ICON[c.id] ?? CircleDashed,
                        }),
                      )}
                      trigger={
                        <PropertyButton icon={STATE_ICON[selectedItem.column] ?? CircleDashed}>
                          {stateNameById[selectedItem.column]}
                          <ChevronDown className="size-3 text-muted-foreground" />
                        </PropertyButton>
                      }
                    />

                    <MotionSelect
                      value={selectedItem.priority}
                      onChange={(priority) => updateSelectedItem({ priority: priority as Priority })}
                      options={(Object.keys(PRIORITY_ICON) as Priority[]).map(
                        (priority): MotionSelectOption<string> => ({
                          value: priority,
                          label: priority[0].toUpperCase() + priority.slice(1),
                          icon: PRIORITY_ICON[priority],
                          iconClassName: PRIORITY_COLOR[priority],
                        }),
                      )}
                      trigger={
                        <PropertyButton
                          icon={PRIORITY_ICON[selectedItem.priority]}
                          iconClassName={PRIORITY_COLOR[selectedItem.priority]}
                        >
                          {selectedItem.priority[0].toUpperCase() + selectedItem.priority.slice(1)}
                          <ChevronDown className="size-3 text-muted-foreground" />
                        </PropertyButton>
                      }
                    />

                    <MotionSelect
                      value={selectedItem.assignee?.name ?? UNASSIGNED}
                      onChange={(name) => updateSelectedItem({ assignee: name === UNASSIGNED ? undefined : { name } })}
                      options={[
                        { value: UNASSIGNED, label: "Unassigned", icon: User },
                        ...ASSIGNEE_OPTIONS.map((name): MotionSelectOption<string> => ({ value: name, label: name })),
                      ]}
                      trigger={
                        <PropertyButton icon={selectedItem.assignee ? undefined : User}>
                          {selectedItem.assignee ? (
                            <span className="inline-flex items-center gap-1.5">
                              <AssigneeAvatar name={selectedItem.assignee.name} />
                              {selectedItem.assignee.name}
                            </span>
                          ) : (
                            "Assignee"
                          )}
                          <ChevronDown className="size-3 text-muted-foreground" />
                        </PropertyButton>
                      }
                    />

                    <DateField
                      value={selectedItem.startAt}
                      onChange={(startAt) => updateSelectedItem({ startAt })}
                    />
                    <DateField value={selectedItem.endAt} onChange={(endAt) => updateSelectedItem({ endAt })} />

                    {selectedItem.estimate && (
                      <PropertyButton icon={Gauge}>{selectedItem.estimate} pt</PropertyButton>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-sm font-medium">Description</p>
                    <DescriptionEditor
                      key={selectedItem.id}
                      content={selectedItem.description ?? DEFAULT_DESCRIPTION}
                      onChange={(description) => updateSelectedItem({ description })}
                    />
                  </div>

                  <div className="space-y-3 border-t pt-4">
                    <p className="text-sm font-medium">Properties</p>
                    <div className="grid grid-cols-[6rem_1fr] gap-y-3 text-sm">
                      <span className="self-center text-muted-foreground">Labels</span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(selectedItem.labels ?? []).map((label) => (
                          <LabelPill
                            key={label}
                            name={label}
                            onRemove={() =>
                              updateSelectedItem({
                                labels: (selectedItem.labels ?? []).filter((l) => l !== label),
                              })
                            }
                          />
                        ))}
                        <LabelEditor
                          labels={selectedItem.labels ?? []}
                          onChange={(labels) => updateSelectedItem({ labels })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 border-t pt-4 text-xs text-muted-foreground">
                    <p>Created by {selectedItem.assignee?.name ?? "you"}</p>
                    <p>Created on {dateFormatter.format(selectedItem.startAt)}</p>
                  </div>

                  <div className="border-t pt-4">
                    <WorkItemActivity entries={selectedItem.activity} onComment={addComment} />
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

export { ProjectBoard }
