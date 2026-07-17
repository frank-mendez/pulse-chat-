import { type Conversation, type PersistentMessage, type PublicUser } from "@pulse-chat/contracts";

import {
  type AppRepository,
  type CreateConversationInput,
  type CreateMessageInput,
  type CreateSessionInput,
  type CreateUserInput,
  type SessionRecord,
  type UserWithPassword,
} from "./app-repository.js";

type ConversationRecord = {
  readonly id: string;
  readonly type: "one_to_one";
  readonly memberIds: readonly string[];
  readonly createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

type ConversationMemberRecord = {
  readonly conversationId: string;
  readonly userId: string;
  readonly joinedAt: string;
  lastReadMessageId: string | null;
  deletedAt: string | null;
};

type MessageRecord = {
  readonly id: string;
  readonly conversationId: string;
  readonly senderId: string;
  readonly body: string;
  readonly clientMessageId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  deletedAt: string | null;
};

const normalizeUsername = (username: string): string => username.trim().toLowerCase();

const toPublicUser = (user: UserWithPassword): PublicUser => ({
  id: user.id,
  username: user.username,
  displayName: user.displayName,
  avatarUrl: user.avatarUrl,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const createMemoryRepository = (): AppRepository => {
  const usersById = new Map<string, UserWithPassword>();
  const userIdByUsername = new Map<string, string>();
  const sessionsByTokenHash = new Map<string, SessionRecord>();
  const conversationsById = new Map<string, ConversationRecord>();
  const membersByConversationId = new Map<string, ConversationMemberRecord[]>();
  const messagesById = new Map<string, MessageRecord>();
  const messageIdBySenderAndClientId = new Map<string, string>();

  const readPublicUser = (userId: string): PublicUser | undefined => {
    const user = usersById.get(userId);
    return user === undefined || user.deletedAt !== null ? undefined : toPublicUser(user);
  };

  const readMessagesForConversation = (conversationId: string): PersistentMessage[] =>
    [...messagesById.values()]
      .filter((message) => message.conversationId === conversationId && message.deletedAt === null)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
      .map((message) => {
        const sender = readPublicUser(message.senderId);

        if (sender === undefined) {
          throw new Error(`Missing sender for message ${message.id}.`);
        }

        return {
          id: message.id,
          conversationId: message.conversationId,
          sender,
          body: message.body,
          clientMessageId: message.clientMessageId,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
          deletedAt: message.deletedAt,
        };
      });

  const hasActiveMembership = (conversationId: string, userId: string): boolean =>
    membersByConversationId
      .get(conversationId)
      ?.some((member) => member.userId === userId && member.deletedAt === null) ?? false;

  const readConversation = (conversationId: string, viewerId: string): Conversation | undefined => {
    const record = conversationsById.get(conversationId);

    if (
      record === undefined ||
      record.deletedAt !== null ||
      !hasActiveMembership(conversationId, viewerId)
    ) {
      return undefined;
    }

    const members = (membersByConversationId.get(conversationId) ?? [])
      .filter((member) => member.deletedAt === null)
      .map((member) => readPublicUser(member.userId))
      .filter((user): user is PublicUser => user !== undefined);
    const messages = readMessagesForConversation(conversationId);
    const viewerMembership = membersByConversationId
      .get(conversationId)
      ?.find((member) => member.userId === viewerId && member.deletedAt === null);
    const lastReadMessageId = viewerMembership?.lastReadMessageId;
    const lastReadIndex =
      lastReadMessageId === null || lastReadMessageId === undefined
        ? -1
        : messages.findIndex((message) => message.id === lastReadMessageId);
    const unreadCount = messages.filter(
      (message, index) => message.sender.id !== viewerId && index > lastReadIndex,
    ).length;

    return {
      id: record.id,
      type: record.type,
      members,
      lastMessage: messages.at(-1) ?? null,
      unreadCount,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
    };
  };

  const findOneToOneConversationId = (
    leftUserId: string,
    rightUserId: string,
  ): string | undefined => {
    const pair = [leftUserId, rightUserId].sort().join(":");

    for (const conversation of conversationsById.values()) {
      if (conversation.deletedAt !== null || conversation.type !== "one_to_one") {
        continue;
      }

      if ([...conversation.memberIds].sort().join(":") === pair) {
        return conversation.id;
      }
    }

    return undefined;
  };

  return {
    createUser: async (input: CreateUserInput) => {
      const normalizedUsername = normalizeUsername(input.username);

      if (userIdByUsername.has(normalizedUsername)) {
        throw new Error("USERNAME_TAKEN");
      }

      const user: UserWithPassword = {
        id: input.id,
        username: input.username,
        displayName: input.displayName,
        avatarUrl: null,
        passwordHash: input.passwordHash,
        createdAt: input.createdAt,
        updatedAt: input.updatedAt,
        deletedAt: null,
      };

      usersById.set(user.id, user);
      userIdByUsername.set(normalizedUsername, user.id);
      return user;
    },
    findUserById: async (userId) => readPublicUser(userId),
    findUserWithPasswordByUsername: async (username) => {
      const userId = userIdByUsername.get(normalizeUsername(username));

      if (userId === undefined) {
        return undefined;
      }

      const user = usersById.get(userId);
      return user?.deletedAt === null ? user : undefined;
    },
    searchUsersByUsername: async (query, limit) => {
      const normalizedQuery = normalizeUsername(query);
      return [...usersById.values()]
        .filter(
          (user) =>
            user.deletedAt === null && normalizeUsername(user.username).includes(normalizedQuery),
        )
        .slice(0, limit)
        .map(toPublicUser);
    },
    createSession: async (input: CreateSessionInput) => {
      const session: SessionRecord = {
        ...input,
        revokedAt: null,
      };
      sessionsByTokenHash.set(input.tokenHash, session);
      return session;
    },
    findSessionByTokenHash: async (tokenHash, now) => {
      const session = sessionsByTokenHash.get(tokenHash);

      if (session === undefined || session.revokedAt !== null || session.expiresAt <= now) {
        return undefined;
      }

      const user = readPublicUser(session.userId);

      if (user === undefined) {
        return undefined;
      }

      return {
        session,
        user,
      };
    },
    revokeSession: async (tokenHash, revokedAt) => {
      const session = sessionsByTokenHash.get(tokenHash);

      if (session === undefined) {
        return;
      }

      sessionsByTokenHash.set(tokenHash, {
        ...session,
        revokedAt,
      });
    },
    createOrFindOneToOneConversation: async (input: CreateConversationInput) => {
      const existingConversationId = findOneToOneConversationId(
        input.creatorId,
        input.participantId,
      );

      if (existingConversationId !== undefined) {
        const existingConversation = readConversation(existingConversationId, input.creatorId);

        if (existingConversation === undefined) {
          throw new Error("CONVERSATION_NOT_FOUND");
        }

        return {
          conversation: existingConversation,
          created: false,
        };
      }

      conversationsById.set(input.id, {
        id: input.id,
        type: "one_to_one",
        memberIds: [input.creatorId, input.participantId],
        createdAt: input.createdAt,
        updatedAt: input.createdAt,
        deletedAt: null,
      });
      membersByConversationId.set(input.id, [
        {
          conversationId: input.id,
          userId: input.creatorId,
          joinedAt: input.createdAt,
          lastReadMessageId: null,
          deletedAt: null,
        },
        {
          conversationId: input.id,
          userId: input.participantId,
          joinedAt: input.createdAt,
          lastReadMessageId: null,
          deletedAt: null,
        },
      ]);

      const conversation = readConversation(input.id, input.creatorId);

      if (conversation === undefined) {
        throw new Error("CONVERSATION_NOT_FOUND");
      }

      return {
        conversation,
        created: true,
      };
    },
    listConversationsForUser: async (userId) =>
      [...conversationsById.values()]
        .map((conversation) => readConversation(conversation.id, userId))
        .filter((conversation): conversation is Conversation => conversation !== undefined)
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    getConversationForUser: async (conversationId, userId) =>
      readConversation(conversationId, userId),
    listConversationMemberIds: async (conversationId) =>
      (membersByConversationId.get(conversationId) ?? [])
        .filter((member) => member.deletedAt === null)
        .map((member) => member.userId),
    listMessagesForUser: async (conversationId, userId) =>
      hasActiveMembership(conversationId, userId)
        ? readMessagesForConversation(conversationId)
        : [],
    createMessage: async (input: CreateMessageInput) => {
      const duplicateKey = `${input.senderId}:${input.clientMessageId}`;
      const existingMessageId = messageIdBySenderAndClientId.get(duplicateKey);

      if (existingMessageId !== undefined) {
        const existingMessage = readMessagesForConversation(input.conversationId).find(
          (message) => message.id === existingMessageId,
        );

        if (existingMessage !== undefined) {
          return {
            message: existingMessage,
            duplicate: true,
          };
        }
      }

      messagesById.set(input.id, {
        id: input.id,
        conversationId: input.conversationId,
        senderId: input.senderId,
        body: input.body,
        clientMessageId: input.clientMessageId,
        createdAt: input.createdAt,
        updatedAt: input.createdAt,
        deletedAt: null,
      });
      messageIdBySenderAndClientId.set(duplicateKey, input.id);

      const conversation = conversationsById.get(input.conversationId);

      if (conversation !== undefined) {
        conversation.updatedAt = input.createdAt;
      }

      const message = readMessagesForConversation(input.conversationId).find(
        (candidate) => candidate.id === input.id,
      );

      if (message === undefined) {
        throw new Error("MESSAGE_NOT_FOUND");
      }

      return {
        message,
        duplicate: false,
      };
    },
    markMessageRead: async (conversationId, userId, messageId) => {
      const member = membersByConversationId
        .get(conversationId)
        ?.find((candidate) => candidate.userId === userId && candidate.deletedAt === null);

      if (member === undefined || !messagesById.has(messageId)) {
        return false;
      }

      member.lastReadMessageId = messageId;
      return true;
    },
    close: async () => undefined,
  };
};
