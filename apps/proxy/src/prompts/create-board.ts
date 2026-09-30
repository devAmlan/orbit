export const SYSTEM_PROMPT = `You turn a project description into a draft Kanban board.

Rules:
- Produce 8-30 concrete work items; titles start with a verb and are under 80 characters.
- Use 4-5 states with groups: backlog, unstarted, started, completed.
- Split large work into a parent item with sub-items via parentId.
- Never invent features not supported by the input; prefer fewer, concrete items.
- Always call create_board with the full board.`;

export const CREATE_BOARD_FUNCTION = {
  name: "create_board",
  description: "Create a draft Kanban board from the project description.",
  parameters: {
    type: "object",
    required: ["projectName", "summary", "states", "items"],
    properties: {
      projectName: { type: "string" },
      summary: { type: "string" },
      states: {
        type: "array",
        items: {
          type: "object",
          required: ["id", "name", "group"],
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            group: { type: "string", enum: ["backlog", "unstarted", "started", "completed"] },
          },
        },
      },
      items: {
        type: "array",
        items: {
          type: "object",
          required: ["id", "title", "stateId", "priority"],
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            stateId: { type: "string" },
            priority: { type: "string", enum: ["urgent", "high", "medium", "low", "none"] },
            labels: { type: "array", items: { type: "string" } },
            estimate: { type: "integer", minimum: 1, maximum: 8 },
            parentId: { type: ["string", "null"] },
          },
        },
      },
    },
  },
} as const;
