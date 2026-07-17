import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import { createEntityId } from "@pulse-chat/utils";
import Fastify, { type FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { type AddressInfo } from "node:net";
import { type IncomingMessage } from "node:http";
import { type Duplex } from "node:stream";
import { WebSocketServer } from "ws";
import { ZodError } from "zod";

import { createAuthService } from "../auth/auth.service.js";
import { DEFAULT_APP_CONFIG, type AppConfig } from "../config/app-config.js";
import { createMessagingService } from "../messaging/messaging.service.js";
import { type AppRepository } from "../repositories/app-repository.js";
import { createMemoryRepository } from "../repositories/memory.repository.js";
import { createPostgresRepository } from "../repositories/postgres.repository.js";
import { registerRestRoutes } from "./rest-routes.js";
import { type GatewayLogger } from "../websocket/gateway-logger.js";
import { WebSocketGateway } from "../websocket/websocket.gateway.js";

export type PulseChatServer = {
  readonly app: FastifyInstance;
  readonly webSocketServer: WebSocketServer;
  readonly gateway: WebSocketGateway;
  readonly config: AppConfig;
  readonly start: () => Promise<void>;
  readonly stop: () => Promise<void>;
  readonly getWebSocketUrl: () => string;
};

export type PulseChatServerOptions = {
  readonly config?: AppConfig;
  readonly repository?: AppRepository;
};

const createId = (prefix: string): string => createEntityId(prefix, randomUUID);
const now = (): string => new Date().toISOString();

const getUpgradePath = (request: IncomingMessage): string => {
  try {
    return new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`).pathname;
  } catch {
    return "/";
  }
};

const closeWebSocketServer = (webSocketServer: WebSocketServer): Promise<void> =>
  new Promise((resolve, reject) => {
    webSocketServer.close((error) => {
      if (error !== undefined) {
        reject(error);
        return;
      }

      resolve();
    });
  });

const createGatewayLogger = (app: FastifyInstance): GatewayLogger => ({
  info: (message, details) => {
    app.log.info({ details }, message);
  },
  warn: (message, details) => {
    app.log.warn({ details }, message);
  },
  error: (message, details) => {
    app.log.error({ details }, message);
  },
});

const createRepository = (config: AppConfig): AppRepository =>
  config.databaseUrl === undefined
    ? createMemoryRepository()
    : createPostgresRepository(config.databaseUrl);

export const createPulseChatServer = (
  optionsOrConfig: PulseChatServerOptions | AppConfig = DEFAULT_APP_CONFIG,
): PulseChatServer => {
  const config =
    "host" in optionsOrConfig ? optionsOrConfig : (optionsOrConfig.config ?? DEFAULT_APP_CONFIG);
  const repository =
    "host" in optionsOrConfig
      ? createRepository(config)
      : (optionsOrConfig.repository ?? createRepository(config));
  const app = Fastify({
    logger: config.loggerEnabled,
  });
  const webSocketServer = new WebSocketServer({
    noServer: true,
  });
  const authService = createAuthService({
    repository,
    createId,
    now,
    sessionTtlDays: config.sessionTtlDays,
  });
  const messagingService = createMessagingService({
    repository,
    createId,
    now,
  });
  const gateway = new WebSocketGateway({
    webSocketServer,
    authService,
    messagingService,
    sessionCookieName: config.sessionCookieName,
    createId,
    now,
    heartbeatIntervalMs: config.heartbeatIntervalMs,
    logger: createGatewayLogger(app),
  });

  app.register(cors, {
    credentials: true,
    origin: (origin, callback) => {
      if (origin === undefined || config.allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin is not allowed."), false);
    },
  });
  app.register(cookie);

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request payload.",
        },
      });
    }

    app.log.error({ error }, "Unhandled request error.");
    return reply.status(500).send({
      error: {
        code: "INTERNAL_ERROR",
        message: "Unexpected server error.",
      },
    });
  });

  app.get("/health", async () => ({
    status: "ok",
    service: "pulse-chat-server",
    storage: config.databaseUrl === undefined ? "memory" : "postgres",
  }));

  registerRestRoutes({
    app,
    authService,
    messagingService,
    repository,
    config,
    onConversationCreated: (conversation) => {
      gateway.broadcastConversationCreated(conversation);
    },
    onMessageCreated: (message, clientMessageId) => {
      gateway.broadcastMessageCreated(message, clientMessageId);
    },
  });

  const handleUpgrade = (request: IncomingMessage, socket: Duplex, head: Buffer): void => {
    if (getUpgradePath(request) !== config.websocketPath) {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      socket.destroy();
      return;
    }

    webSocketServer.handleUpgrade(request, socket, head, (webSocket) => {
      webSocketServer.emit("connection", webSocket, request);
    });
  };

  app.server.on("upgrade", handleUpgrade);
  gateway.start();

  const start = async (): Promise<void> => {
    await app.listen({
      host: config.host,
      port: config.port,
    });
  };

  const stop = async (): Promise<void> => {
    app.server.off("upgrade", handleUpgrade);
    gateway.stop();
    await closeWebSocketServer(webSocketServer);
    await repository.close();
    await app.close();
  };

  const getWebSocketUrl = (): string => {
    const address = app.server.address();

    if (address === null || typeof address === "string") {
      throw new Error("Server has not started on a TCP address.");
    }

    const { port } = address as AddressInfo;
    return `ws://127.0.0.1:${port}${config.websocketPath}`;
  };

  return {
    app,
    webSocketServer,
    gateway,
    config,
    start,
    stop,
    getWebSocketUrl,
  };
};
