import { describe, expect, it } from "vitest";

import { createUsersService } from "./users.service.js";

describe("createUsersService", () => {
  it("registers and lists online users", () => {
    const service = createUsersService({
      createId: () => "user_1",
      now: () => "2026-07-17T12:00:00.000Z",
    });

    const result = service.registerClient({ clientId: "client_1", username: "Ada" });

    expect(result.ok).toBe(true);
    expect(service.listOnlineUsers()).toEqual([
      {
        id: "user_1",
        username: "Ada",
        joinedAt: "2026-07-17T12:00:00.000Z",
      },
    ]);
  });

  it("rejects duplicate active usernames", () => {
    let id = 0;
    const service = createUsersService({
      createId: () => `user_${(id += 1)}`,
      now: () => "2026-07-17T12:00:00.000Z",
    });

    service.registerClient({ clientId: "client_1", username: "Ada" });
    const result = service.registerClient({ clientId: "client_2", username: "ada" });

    expect(result).toEqual({
      ok: false,
      code: "USERNAME_TAKEN",
      message: "That username is already connected.",
    });
  });

  it("removes disconnected users", () => {
    const service = createUsersService({
      createId: () => "user_1",
      now: () => "2026-07-17T12:00:00.000Z",
    });

    service.registerClient({ clientId: "client_1", username: "Ada" });

    expect(service.unregisterClient("client_1")?.username).toBe("Ada");
    expect(service.listOnlineUsers()).toEqual([]);
  });
});
