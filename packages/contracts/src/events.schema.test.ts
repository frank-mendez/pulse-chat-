import { describe, expect, it } from "vitest";

import {
  CLIENT_EVENT_TYPES,
  SERVER_EVENT_TYPES,
  clientToServerEventSchema,
  serverToClientEventSchema,
} from "./index.js";

describe("clientToServerEventSchema", () => {
  it("parses a join event and trims the username", () => {
    const result = clientToServerEventSchema.parse({
      type: CLIENT_EVENT_TYPES.JOIN,
      payload: {
        username: "  Ada  ",
      },
    });

    if (result.type !== CLIENT_EVENT_TYPES.JOIN) {
      throw new Error("Expected join event.");
    }

    expect(result.payload.username).toBe("Ada");
  });

  it("rejects malformed event payloads", () => {
    const result = clientToServerEventSchema.safeParse({
      type: CLIENT_EVENT_TYPES.MESSAGE_SEND,
      payload: {
        body: "",
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects unknown event types", () => {
    const result = clientToServerEventSchema.safeParse({
      type: "message.react",
      payload: {},
    });

    expect(result.success).toBe(false);
  });
});

describe("serverToClientEventSchema", () => {
  it("parses a message event", () => {
    const result = serverToClientEventSchema.safeParse({
      type: SERVER_EVENT_TYPES.MESSAGE_NEW,
      payload: {
        message: {
          id: "msg_1",
          conversationId: "conversation_1",
          sender: {
            id: "user_1",
            username: "Ada",
            displayName: "Ada Lovelace",
            avatarUrl: null,
            createdAt: "2026-07-17T12:00:00.000Z",
            updatedAt: "2026-07-17T12:00:00.000Z",
          },
          body: "Hello",
          clientMessageId: "client_1",
          createdAt: "2026-07-17T12:00:00.000Z",
          updatedAt: "2026-07-17T12:00:00.000Z",
          deletedAt: null,
        },
      },
    });

    expect(result.success).toBe(true);
  });

  it("parses safe protocol errors", () => {
    const result = serverToClientEventSchema.safeParse({
      type: SERVER_EVENT_TYPES.ERROR,
      payload: {
        code: "VALIDATION_ERROR",
        message: "Invalid payload.",
        requestType: CLIENT_EVENT_TYPES.JOIN,
      },
    });

    expect(result.success).toBe(true);
  });
});
