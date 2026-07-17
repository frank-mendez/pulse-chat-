export const queryKeys = {
  me: ["me"] as const,
  users: (query: string) => ["users", query] as const,
  conversations: ["conversations"] as const,
  messages: (conversationId: string) => ["messages", conversationId] as const,
};
