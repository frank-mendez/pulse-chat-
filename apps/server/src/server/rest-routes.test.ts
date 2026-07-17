import { describe, expect, it } from "vitest";

import { DEFAULT_APP_CONFIG } from "../config/app-config.js";
import { createPulseChatServer } from "./create-pulse-chat-server.js";

const readCookie = (setCookieHeader: string | string[] | undefined): string => {
  const value = Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader;

  if (value === undefined) {
    throw new Error("Expected Set-Cookie header.");
  }

  return value.split(";")[0] ?? value;
};

describe("REST routes", () => {
  it("registers, reads /me, and logs out", async () => {
    const server = createPulseChatServer({
      ...DEFAULT_APP_CONFIG,
      loggerEnabled: false,
    });

    try {
      const registered = await server.app.inject({
        method: "POST",
        url: "/auth/register",
        payload: {
          username: "Ada",
          displayName: "Ada Lovelace",
          password: "correct-horse",
        },
      });
      const cookie = readCookie(registered.headers["set-cookie"]);

      expect(registered.statusCode).toBe(201);

      const me = await server.app.inject({
        headers: {
          cookie,
        },
        method: "GET",
        url: "/me",
      });

      expect(me.statusCode).toBe(200);
      expect(me.json()).toMatchObject({
        user: {
          username: "Ada",
        },
      });

      const logout = await server.app.inject({
        headers: {
          cookie,
        },
        method: "POST",
        url: "/auth/logout",
      });

      expect(logout.statusCode).toBe(204);
    } finally {
      await server.stop();
    }
  });

  it("creates conversations and persists messages", async () => {
    const server = createPulseChatServer({
      ...DEFAULT_APP_CONFIG,
      loggerEnabled: false,
    });

    try {
      const adaResponse = await server.app.inject({
        method: "POST",
        url: "/auth/register",
        payload: {
          username: "Ada",
          displayName: "Ada Lovelace",
          password: "correct-horse",
        },
      });
      const graceResponse = await server.app.inject({
        method: "POST",
        url: "/auth/register",
        payload: {
          username: "Grace",
          displayName: "Grace Hopper",
          password: "correct-horse",
        },
      });
      const adaCookie = readCookie(adaResponse.headers["set-cookie"]);
      readCookie(graceResponse.headers["set-cookie"]);

      const conversationResponse = await server.app.inject({
        headers: {
          cookie: adaCookie,
        },
        method: "POST",
        payload: {
          participantUsername: "Grace",
        },
        url: "/conversations",
      });
      const conversation = conversationResponse.json() as {
        readonly conversation: { readonly id: string };
      };

      expect(conversationResponse.statusCode).toBe(201);

      const messageResponse = await server.app.inject({
        headers: {
          cookie: adaCookie,
        },
        method: "POST",
        payload: {
          conversationId: conversation.conversation.id,
          body: "Hello Grace",
          clientMessageId: "client_1",
        },
        url: "/messages",
      });

      expect(messageResponse.statusCode).toBe(201);

      const messagesResponse = await server.app.inject({
        headers: {
          cookie: adaCookie,
        },
        method: "GET",
        url: `/conversations/${conversation.conversation.id}/messages`,
      });

      expect(messagesResponse.json()).toMatchObject({
        messages: [
          {
            body: "Hello Grace",
            clientMessageId: "client_1",
          },
        ],
      });
    } finally {
      await server.stop();
    }
  });
});
