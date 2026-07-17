import {
  DEFAULT_CLIENT_TIMEOUT_MS,
  DEFAULT_HEARTBEAT_INTERVAL_MS,
  DEFAULT_MESSAGE_HISTORY_LIMIT,
} from "@pulse-chat/contracts";

export type AppConfig = {
  readonly host: string;
  readonly port: number;
  readonly websocketPath: string;
  readonly databaseUrl: string | undefined;
  readonly sessionCookieName: string;
  readonly sessionTtlDays: number;
  readonly secureCookies: boolean;
  readonly messageHistoryLimit: number;
  readonly heartbeatIntervalMs: number;
  readonly clientTimeoutMs: number;
  readonly allowedOrigins: readonly string[];
  readonly loggerEnabled: boolean;
};

export const DEFAULT_APP_CONFIG: AppConfig = {
  host: "0.0.0.0",
  port: 3000,
  websocketPath: "/ws",
  databaseUrl: undefined,
  sessionCookieName: "pulse_chat_session",
  sessionTtlDays: 30,
  secureCookies: false,
  messageHistoryLimit: DEFAULT_MESSAGE_HISTORY_LIMIT,
  heartbeatIntervalMs: DEFAULT_HEARTBEAT_INTERVAL_MS,
  clientTimeoutMs: DEFAULT_CLIENT_TIMEOUT_MS,
  allowedOrigins: [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5300",
    "http://127.0.0.1:5300",
  ],
  loggerEnabled: true,
};

type Environment = Record<string, string | undefined>;

const readNumber = (value: string | undefined, fallback: number): number => {
  if (value === undefined || value.trim().length === 0) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const readBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) {
    return fallback;
  }

  return value === "true";
};

const readOrigins = (value: string | undefined, fallback: readonly string[]): readonly string[] => {
  if (value === undefined || value.trim().length === 0) {
    return fallback;
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
};

export const loadConfig = (env: Environment = process.env): AppConfig => ({
  host: env.HOST ?? DEFAULT_APP_CONFIG.host,
  port: readNumber(env.PORT, DEFAULT_APP_CONFIG.port),
  websocketPath: env.WEBSOCKET_PATH ?? DEFAULT_APP_CONFIG.websocketPath,
  databaseUrl:
    env.DATABASE_URL === undefined || env.DATABASE_URL.trim().length === 0
      ? DEFAULT_APP_CONFIG.databaseUrl
      : env.DATABASE_URL,
  sessionCookieName: env.SESSION_COOKIE_NAME ?? DEFAULT_APP_CONFIG.sessionCookieName,
  sessionTtlDays: readNumber(env.SESSION_TTL_DAYS, DEFAULT_APP_CONFIG.sessionTtlDays),
  secureCookies: readBoolean(env.SECURE_COOKIES, DEFAULT_APP_CONFIG.secureCookies),
  messageHistoryLimit: readNumber(
    env.MESSAGE_HISTORY_LIMIT,
    DEFAULT_APP_CONFIG.messageHistoryLimit,
  ),
  heartbeatIntervalMs: readNumber(
    env.HEARTBEAT_INTERVAL_MS,
    DEFAULT_APP_CONFIG.heartbeatIntervalMs,
  ),
  clientTimeoutMs: readNumber(env.CLIENT_TIMEOUT_MS, DEFAULT_APP_CONFIG.clientTimeoutMs),
  allowedOrigins: readOrigins(env.ALLOWED_ORIGINS, DEFAULT_APP_CONFIG.allowedOrigins),
  loggerEnabled: readBoolean(env.LOGGER_ENABLED, DEFAULT_APP_CONFIG.loggerEnabled),
});
