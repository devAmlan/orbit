import { useState } from "react"
import type { Priority, State, StateGroup, WorkItem } from "@orbit/types"
import {
  CalendarRange,
  CircleCheckBig,
  CircleDashed,
  CircleDot,
  CircleSlash2,
  Gauge,
  type LucideIcon,
  SignalHigh,
  SignalLow,
  SignalMedium,
  SignalZero,
  Tags,
  TriangleAlert,
} from "lucide-react"

import { KanbanBoard, KanbanCard, KanbanCards, KanbanHeader, KanbanProvider } from "@/components/kibo-ui/kanban"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
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
    })),
  )
  const [selectedItem, setSelectedItem] = useState<BoardItem | null>(null)

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
                      <div onClick={() => setSelectedItem(item)} className="cursor-pointer space-y-2 min-h-24 flex flex-col  justify-between">
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

      <Sheet open={selectedItem !== null} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <SheetContent className="data-[side=right]:w-1/2 data-[side=right]:sm:max-w-none">
          {selectedItem && (
            <>
              <SheetHeader>
                <p className="text-xs text-muted-foreground">{selectedItem.code}</p>
                <SheetTitle>{selectedItem.title}</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 px-4">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <Pill icon={STATE_ICON[selectedItem.column] ?? CircleDashed}>
                    {stateNameById[selectedItem.column]}
                  </Pill>
                  <Pill icon={PRIORITY_ICON[selectedItem.priority]} iconClassName={PRIORITY_COLOR[selectedItem.priority]}>
                    {selectedItem.priority[0].toUpperCase() + selectedItem.priority.slice(1)}
                  </Pill>
                  {selectedItem.assignee && (
                    <span className="inline-flex items-center gap-1.5">
                      <AssigneeAvatar name={selectedItem.assignee.name} />
                      {selectedItem.assignee.name}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <CalendarRange className="size-3.5" />
                    Start {dateFormatter.format(selectedItem.startAt)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarRange className="size-3.5" />
                    Due {dateFormatter.format(selectedItem.endAt)}
                  </span>
                  {selectedItem.estimate && (
                    <span className="inline-flex items-center gap-1">
                      <Gauge className="size-3.5" />
                      {selectedItem.estimate} pt
                    </span>
                  )}
                </div>

                {selectedItem.description && (
                  <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
                )}

                {selectedItem.labels && selectedItem.labels.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Tags className="size-3.5 text-muted-foreground" />
                    {selectedItem.labels.map((label) => (
                      <span key={label} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

export { ProjectBoard }
