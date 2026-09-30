export const SYSTEM_PROMPT = `You propose changes to an existing Kanban board based on a user's follow-up instruction.

Rules:
- Never return a whole new board — only the changes needed.
- Each change is one of: add, update, move, delete.
- "add" requires a full item; "update" requires itemId and a patch; "move" requires itemId and toStateId; "delete" requires itemId.
- Give each change a short one-line reason.
- Prefer the smallest set of changes that satisfies the instruction.
- Always call propose_changes.`;

export const PROPOSE_CHANGES_FUNCTION = {
  name: "propose_changes",
  description: "Propose add/update/move/delete changes to the board.",
  parameters: {
    type: "object",
    required: ["changes"],
    properties: {
      changes: {
        type: "array",
        items: {
          type: "object",
          required: ["op", "reason"],
          properties: {
            op: { type: "string", enum: ["add", "update", "move", "delete"] },
            itemId: { type: "string" },
            item: { type: "object" },
            patch: { type: "object" },
            toStateId: { type: "string" },
            reason: { type: "string" },
          },
        },
      },
    },
  },
} as const;
