import {
  CLIENT_EVENT_TYPES,
  SERVER_EVENT_TYPES,
  serverToClientEventSchema,
  type ServerToClientEvent,
} from "@pulse-chat/contracts";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import WebSocket from "ws";

import { DEFAULT_APP_CONFIG } from "../config/app-config.js";
import { createPulseChatServer, type PulseChatServer } from "../server/create-pulse-chat-server.js";

type ServerEventOf<Type extends ServerToClientEvent["type"]> = Extract<
  ServerToClientEvent,
  { type: Type }
>;

const toHttpUrl = (webSocketUrl: string): string =>
  webSocketUrl.replace("ws://", "http://").replace("/ws", "");

const registerUser = async (
  server: PulseChatServer,
  username: string,
): Promise<{ readonly cookie: string; readonly userId: string }> => {
  const response = await fetch(`${toHttpUrl(server.getWebSocketUrl())}/auth/register`, {
    body: JSON.stringify({
      username,
      displayName: username,
      password: "correct-horse",
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const cookie = response.headers.get("set-cookie")?.split(";")[0];
  const body = (await response.json()) as { readonly user: { readonly id: string } };

  if (cookie === undefined) {
    throw new Error("Expected registration to set a session cookie.");
  }

  return {
    cookie,
    userId: body.user.id,
  };
};

const createConversation = async (
  server: PulseChatServer,
  cookie: string,
  participantUsername: string,
): Promise<string> => {
  const response = await fetch(`${toHttpUrl(server.getWebSocketUrl())}/conversations`, {
    body: JSON.stringify({
      participantUsername,
    }),
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    method: "POST",
  });
  const body = (await response.json()) as { readonly conversation: { readonly id: string } };
  return body.conversation.id;
};

const openSocket = async (url: string, cookie?: string): Promise<WebSocket> =>
  new Promise((resolve, reject) => {
    const socket = new WebSocket(url, {
      headers: cookie === undefined ? undefined : { Cookie: cookie },
    });
    socket.once("open", () => {
      resolve(socket);
    });
    socket.once("error", reject);
  });

const sendJson = (socket: WebSocket, payload: unknown): void => {
  socket.send(JSON.stringify(payload));
};

const waitForEvent = async <Type extends ServerToClientEvent["type"]>(
  socket: WebSocket,
  eventType: Type,
): Promise<ServerEventOf<Type>> =>
  new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.off("message", onMessage);
      reject(new Error(`Timed out waiting for ${eventType}.`));
    }, 2_000);

    const onMessage = (data: WebSocket.RawData): void => {
      const parsedJson: unknown = JSON.parse(data.toString());
      const parsedEvent = serverToClientEventSchema.parse(parsedJson);

      if (parsedEvent.type !== eventType) {
        return;
      }

      clearTimeout(timeout);
      socket.off("message", onMessage);
      resolve(parsedEvent as ServerEventOf<Type>);
    };

    socket.on("message", onMessage);
  });

const waitForClose = async (
  socket: WebSocket,
): Promise<{ readonly code: number; readonly reason: string }> =>
  new Promise((resolve) => {
    socket.once("close", (code, reason) => {
      resolve({
        code,
        reason: reason.toString(),
      });
    });
  });

describe("WebSocket gateway", () => {
  let server: PulseChatServer;

  beforeEach(async () => {
    server = createPulseChatServer({
      ...DEFAULT_APP_CONFIG,
      host: "127.0.0.1",
      port: 0,
      heartbeatIntervalMs: 10_000,
      loggerEnabled: false,
    });
    await server.start();
  });

  afterEach(async () => {
    await server.stop();
  });

  it("rejects unauthenticated websocket connections", async () => {
    const socket = new WebSocket(server.getWebSocketUrl());
    const errorPromise = waitForEvent(socket, SERVER_EVENT_TYPES.ERROR);
    const closePromise = waitForClose(socket);
    const error = await errorPromise;
    const close = await closePromise;

    expect(error.payload.code).toBe("UNAUTHORIZED");
    expect(close).toEqual({
      code: 1008,
      reason: "Authentication is required.",
    });
  });

  it("broadcasts persisted messages to conversation members", async () => {
    const ada = await registerUser(server, "Ada");
    const grace = await registerUser(server, "Grace");
    const conversationId = await createConversation(server, ada.cookie, "Grace");
    const adaSocket = await openSocket(server.getWebSocketUrl(), ada.cookie);
    const graceSocket = await openSocket(server.getWebSocketUrl(), grace.cookie);
    const adaMessagePromise = waitForEvent(adaSocket, SERVER_EVENT_TYPES.MESSAGE_NEW);
    const graceMessagePromise = waitForEvent(graceSocket, SERVER_EVENT_TYPES.MESSAGE_NEW);
    const deliveredPromise = waitForEvent(adaSocket, SERVER_EVENT_TYPES.MESSAGE_DELIVERED);

    sendJson(adaSocket, {
      type: CLIENT_EVENT_TYPES.MESSAGE_SEND,
      payload: {
        conversationId,
        body: "Hello Grace",
        clientMessageId: "client_1",
      },
    });

    const adaMessage = await adaMessagePromise;
    const graceMessage = await graceMessagePromise;
    const delivered = await deliveredPromise;

    expect(adaMessage.payload.message.body).toBe("Hello Grace");
    expect(graceMessage.payload.message.conversationId).toBe(conversationId);
    expect(delivered.payload.clientMessageId).toBe("client_1");
    expect(delivered.payload.message.sender.id).toBe(ada.userId);

    adaSocket.close();
    graceSocket.close();
  });

  it("returns friendly errors for malformed authenticated payloads", async () => {
    const ada = await registerUser(server, "Ada");
    const socket = await openSocket(server.getWebSocketUrl(), ada.cookie);
    const errorPromise = waitForEvent(socket, SERVER_EVENT_TYPES.ERROR);

    socket.send("{");

    const error = await errorPromise;

    expect(error.payload.code).toBe("INVALID_JSON");
    expect(error.payload.message).toBe("Message must be valid JSON.");

    socket.close();
  });

  it("broadcasts typing indicators to other conversation members", async () => {
    const ada = await registerUser(server, "Ada");
    const grace = await registerUser(server, "Grace");
    const conversationId = await createConversation(server, ada.cookie, "Grace");
    const adaSocket = await openSocket(server.getWebSocketUrl(), ada.cookie);
    const graceSocket = await openSocket(server.getWebSocketUrl(), grace.cookie);
    const typingPromise = waitForEvent(graceSocket, SERVER_EVENT_TYPES.TYPING_STARTED);

    sendJson(adaSocket, {
      type: CLIENT_EVENT_TYPES.TYPING_START,
      payload: {
        conversationId,
      },
    });

    const typing = await typingPromise;

    expect(typing.payload.conversationId).toBe(conversationId);
    expect(typing.payload.user.id).toBe(ada.userId);

    adaSocket.close();
    graceSocket.close();
  });
});
