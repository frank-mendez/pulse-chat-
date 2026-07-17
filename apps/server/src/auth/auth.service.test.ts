import { describe, expect, it } from "vitest";

import { createMemoryRepository } from "../repositories/memory.repository.js";
import { createAuthService } from "./auth.service.js";

describe("createAuthService", () => {
  it("registers, authenticates, and logs out a session", async () => {
    let id = 0;
    const service = createAuthService({
      repository: createMemoryRepository(),
      createId: (prefix) => `${prefix}_${(id += 1)}`,
      now: () => "2026-07-17T12:00:00.000Z",
      sessionTtlDays: 30,
    });

    const registered = await service.register({
      username: "Ada",
      displayName: "Ada Lovelace",
      password: "correct-horse",
    });

    expect(registered.ok).toBe(true);

    if (!registered.ok) {
      throw new Error("Expected registration to succeed.");
    }

    expect(await service.authenticateToken(registered.session.token)).toMatchObject({
      username: "Ada",
    });

    await service.logout(registered.session.token);

    expect(await service.authenticateToken(registered.session.token)).toBeUndefined();
  });

  it("rejects duplicate usernames", async () => {
    let id = 0;
    const service = createAuthService({
      repository: createMemoryRepository(),
      createId: (prefix) => `${prefix}_${(id += 1)}`,
      now: () => "2026-07-17T12:00:00.000Z",
      sessionTtlDays: 30,
    });

    await service.register({
      username: "Ada",
      displayName: "Ada",
      password: "correct-horse",
    });
    const duplicate = await service.register({
      username: "ada",
      displayName: "Ada Again",
      password: "correct-horse",
    });

    expect(duplicate).toEqual({
      ok: false,
      code: "USERNAME_TAKEN",
      message: "That username is already registered.",
    });
  });
});
