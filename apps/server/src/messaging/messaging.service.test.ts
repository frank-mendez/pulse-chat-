import { describe, expect, it } from "vitest";

import { createAuthService } from "../auth/auth.service.js";
import { createMemoryRepository } from "../repositories/memory.repository.js";
import { createMessagingService } from "./messaging.service.js";

const createFixture = async () => {
  let id = 0;
  const repository = createMemoryRepository();
  const createId = (prefix: string): string => `${prefix}_${(id += 1)}`;
  const now = () => "2026-07-17T12:00:00.000Z";
  const auth = createAuthService({
    repository,
    createId,
    now,
    sessionTtlDays: 30,
  });
  const messaging = createMessagingService({
    repository,
    createId,
    now,
  });
  const ada = await auth.register({
    username: "Ada",
    displayName: "Ada Lovelace",
    password: "correct-horse",
  });
  const grace = await auth.register({
    username: "Grace",
    displayName: "Grace Hopper",
    password: "correct-horse",
  });

  if (!ada.ok || !grace.ok) {
    throw new Error("Fixture users failed to register.");
  }

  return {
    ada: ada.session.user,
    grace: grace.session.user,
    messaging,
  };
};

describe("createMessagingService", () => {
  it("creates a one-to-one conversation once", async () => {
    const { ada, messaging } = await createFixture();

    const created = await messaging.createConversation(ada, "Grace");
    const duplicate = await messaging.createConversation(ada, "Grace");

    expect(created.ok).toBe(true);
    expect(duplicate.ok).toBe(true);

    if (!created.ok || !duplicate.ok) {
      throw new Error("Expected conversation creation to succeed.");
    }

    expect(created.created).toBe(true);
    expect(duplicate.created).toBe(false);
    expect(duplicate.conversation.id).toBe(created.conversation.id);
  });

  it("persists messages and prevents client-message duplicates", async () => {
    const { ada, messaging } = await createFixture();
    const conversation = await messaging.createConversation(ada, "Grace");

    if (!conversation.ok) {
      throw new Error("Expected conversation creation to succeed.");
    }

    const first = await messaging.createMessage(
      ada,
      conversation.conversation.id,
      "Hello",
      "client_1",
    );
    const duplicate = await messaging.createMessage(
      ada,
      conversation.conversation.id,
      "Hello again",
      "client_1",
    );

    expect(first.ok).toBe(true);
    expect(duplicate.ok).toBe(true);

    if (!first.ok || !duplicate.ok) {
      throw new Error("Expected messages to persist.");
    }

    expect(duplicate.duplicate).toBe(true);
    expect(duplicate.message.id).toBe(first.message.id);
    await expect(messaging.listMessages(ada, conversation.conversation.id)).resolves.toHaveLength(
      1,
    );
  });
});
