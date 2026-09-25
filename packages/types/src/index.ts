import { z } from "zod";

export const StateGroupSchema = z.enum(["backlog", "unstarted", "started", "completed"]);

export const StateSchema = z.object({
  id: z.string(),
  name: z.string(),
  group: StateGroupSchema,
});

export const PrioritySchema = z.enum(["urgent", "high", "medium", "low", "none"]);

export const SourceTypeSchema = z.enum(["readme", "issue", "file", "screenshot", "prompt"]);

export const WorkItemSchema = z.object({
  id: z.string(),
  title: z.string().max(80),
  description: z.string().optional(),
  stateId: z.string(),
  priority: PrioritySchema,
  labels: z.array(z.string()).optional(),
  estimate: z.number().int().min(1).max(8).optional(),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().optional(),
  source: z
    .object({
      type: SourceTypeSchema,
      ref: z.string().optional(),
    })
    .optional(),
});

export const BoardSchema = z.object({
  projectName: z.string(),
  summary: z.string(),
  states: z.array(StateSchema),
  items: z.array(WorkItemSchema),
});

export const ChangeSchema = z.object({
  op: z.enum(["add", "update", "move", "delete"]),
  itemId: z.string().optional(),
  item: WorkItemSchema.optional(),
  patch: WorkItemSchema.partial().optional(),
  toStateId: z.string().optional(),
  reason: z.string(),
});

export const ProposeChangesSchema = z.object({
  changes: z.array(ChangeSchema),
});

export const SSEEventSchema = z.discriminatedUnion("event", [
  z.object({ event: z.literal("status"), data: z.object({ step: z.enum(["repo", "files", "planning"]) }) }),
  z.object({ event: z.literal("delta"), data: z.object({ json: z.string() }) }),
  z.object({ event: z.literal("done"), data: z.object({ usage: z.unknown().optional() }) }),
  z.object({
    event: z.literal("error"),
    data: z.object({ code: z.string(), message: z.string(), retryable: z.boolean() }),
  }),
]);

export type StateGroup = z.infer<typeof StateGroupSchema>;
export type State = z.infer<typeof StateSchema>;
export type Priority = z.infer<typeof PrioritySchema>;
export type SourceType = z.infer<typeof SourceTypeSchema>;
export type WorkItem = z.infer<typeof WorkItemSchema>;
export type Board = z.infer<typeof BoardSchema>;
export type Change = z.infer<typeof ChangeSchema>;
export type SSEEvent = z.infer<typeof SSEEventSchema>;
