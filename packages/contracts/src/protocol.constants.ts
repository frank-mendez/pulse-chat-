export const CLIENT_EVENT_TYPES = {
  CONVERSATION_CREATE: "conversation.create",
  JOIN: "join",
  MESSAGE_SEND: "message.send",
  MESSAGE_READ: "message.read",
  PING: "ping",
  TYPING_START: "typing.start",
  TYPING_STOP: "typing.stop",
} as const;

export const SERVER_EVENT_TYPES = {
  CHAT_HISTORY: "chat.history",
  CONVERSATION_CREATED: "conversation.created",
  MESSAGE_NEW: "message.new",
  MESSAGE_DELIVERED: "message.delivered",
  MESSAGE_READ: "message.read",
  USER_JOINED: "user.joined",
  USER_LEFT: "user.left",
  USERS_ONLINE: "users.online",
  PRESENCE_UPDATED: "presence.updated",
  PONG: "pong",
  ERROR: "error",
  TYPING_STARTED: "typing.started",
  TYPING_STOPPED: "typing.stopped",
} as const;

export const ERROR_CODE_VALUES = [
  "INVALID_JSON",
  "UNKNOWN_EVENT",
  "VALIDATION_ERROR",
  "USERNAME_REQUIRED",
  "USERNAME_TAKEN",
  "USER_NOT_FOUND",
  "SELF_CONVERSATION",
  "INVALID_CREDENTIALS",
  "JOIN_REQUIRED",
  "UNAUTHORIZED",
  "CONVERSATION_NOT_FOUND",
  "DUPLICATE_CONVERSATION",
  "MESSAGE_TOO_LONG",
  "RATE_LIMITED",
  "INTERNAL_ERROR",
] as const;

export const USERNAME_MIN_LENGTH = 2;
export const USERNAME_MAX_LENGTH = 32;
export const MESSAGE_MIN_LENGTH = 1;
export const MESSAGE_MAX_LENGTH = 1000;
export const DEFAULT_MESSAGE_HISTORY_LIMIT = 100;
export const DEFAULT_HEARTBEAT_INTERVAL_MS = 25_000;
export const DEFAULT_CLIENT_TIMEOUT_MS = 60_000;
export const USERNAME_PATTERN = /^[A-Za-z0-9 _-]+$/;
