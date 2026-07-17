import { describe, expect, it } from "vitest";

import { createChatService } from "./chat.service.js";

describe("createChatService", () => {
  it("creates messages and trims the body", () => {
    const service = createChatService({
      historyLimit: 10,
      createId: () => "msg_1",
      now: () => "2026-07-17T12:00:00.000Z",
    });

    const result = service.createMessage({
      userId: "user_1",
      username: "Ada",
      body: "  Hello  ",
    });

    expect(result).toEqual({
      ok: true,
      message: {
        id: "msg_1",
        userId: "user_1",
        username: "Ada",
        body: "Hello",
        sentAt: "2026-07-17T12:00:00.000Z",
      },
    });
  });

  it("keeps history bounded", () => {
    let id = 0;
    const service = createChatService({
      historyLimit: 2,
      createId: () => `msg_${(id += 1)}`,
      now: () => "2026-07-17T12:00:00.000Z",
    });

    service.createMessage({ userId: "user_1", username: "Ada", body: "One" });
    service.createMessage({ userId: "user_1", username: "Ada", body: "Two" });
    service.createMessage({ userId: "user_1", username: "Ada", body: "Three" });

    expect(service.getHistory().map((message) => message.body)).toEqual(["Two", "Three"]);
  });
});
