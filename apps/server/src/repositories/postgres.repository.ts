import { type Conversation, type PersistentMessage, type PublicUser } from "@pulse-chat/contracts";
import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import {
  conversationMembers,
  conversations,
  messages,
  sessions,
  users,
  type ConversationRow,
  type MessageRow,
  type UserRow,
} from "../db/schema.js";
import {
  type AppRepository,
  type CreateConversationInput,
  type CreateMessageInput,
  type CreateSessionInput,
  type CreateUserInput,
  type SessionRecord,
  type UserWithPassword,
} from "./app-repository.js";

const normalizeUsername = (username: string): string => username.trim().toLowerCase();

const toIso = (date: Date): string => date.toISOString();

const nullableToIso = (date: Date | null): string | null => (date === null ? null : toIso(date));

const toPublicUser = (row: UserRow): PublicUser => ({
  id: row.id,
  username: row.username,
  displayName: row.displayName,
  avatarUrl: row.avatarUrl,
  createdAt: toIso(row.createdAt),
  updatedAt: toIso(row.updatedAt),
});

const toUserWithPassword = (row: UserRow): UserWithPassword => ({
  ...toPublicUser(row),
  passwordHash: row.passwordHash,
  deletedAt: nullableToIso(row.deletedAt),
});

const toSessionRecord = (row: typeof sessions.$inferSelect): SessionRecord => ({
  id: row.id,
  userId: row.userId,
  tokenHash: row.tokenHash,
  expiresAt: toIso(row.expiresAt),
  createdAt: toIso(row.createdAt),
  revokedAt: nullableToIso(row.revokedAt),
});

export const createPostgresRepository = (databaseUrl: string): AppRepository => {
  const client = postgres(databaseUrl, {
    max: 10,
  });
  const db = drizzle(client);

  const findUserRowById = async (userId: string): Promise<UserRow | undefined> => {
    const rows = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1);
    return rows[0];
  };

  const listMessageRows = async (conversationId: string): Promise<readonly MessageRow[]> =>
    db
      .select()
      .from(messages)
      .where(and(eq(messages.conversationId, conversationId), isNull(messages.deletedAt)))
      .orderBy(asc(messages.createdAt));

  const mapMessage = async (row: MessageRow): Promise<PersistentMessage> => {
    const sender = await findUserRowById(row.senderId);

    if (sender === undefined) {
      throw new Error(`Missing sender for message ${row.id}.`);
    }

    return {
      id: row.id,
      conversationId: row.conversationId,
      sender: toPublicUser(sender),
      body: row.body,
      clientMessageId: row.clientMessageId,
      createdAt: toIso(row.createdAt),
      updatedAt: toIso(row.updatedAt),
      deletedAt: nullableToIso(row.deletedAt),
    };
  };

  const hasActiveMembership = async (conversationId: string, userId: string): Promise<boolean> => {
    const rows = await db
      .select()
      .from(conversationMembers)
      .where(
        and(
          eq(conversationMembers.conversationId, conversationId),
          eq(conversationMembers.userId, userId),
          isNull(conversationMembers.deletedAt),
        ),
      )
      .limit(1);
    return rows.length === 1;
  };

  const buildConversation = async (
    conversation: ConversationRow,
    viewerId: string,
  ): Promise<Conversation | undefined> => {
    if (!(await hasActiveMembership(conversation.id, viewerId))) {
      return undefined;
    }

    const memberRows = await db
      .select()
      .from(conversationMembers)
      .where(
        and(
          eq(conversationMembers.conversationId, conversation.id),
          isNull(conversationMembers.deletedAt),
        ),
      );
    const memberIds = memberRows.map((member) => member.userId);

    if (memberIds.length === 0) {
      return undefined;
    }

    const userRows = await db
      .select()
      .from(users)
      .where(and(inArray(users.id, memberIds), isNull(users.deletedAt)));
    const messageRows = await listMessageRows(conversation.id);
    const messagesForConversation = await Promise.all(messageRows.map(mapMessage));
    const viewerMember = memberRows.find((member) => member.userId === viewerId);
    const lastReadMessageId = viewerMember?.lastReadMessageId;
    const lastReadIndex =
      lastReadMessageId === null || lastReadMessageId === undefined
        ? -1
        : messagesForConversation.findIndex((message) => message.id === lastReadMessageId);
    const unreadCount = messagesForConversation.filter(
      (message, index) => message.sender.id !== viewerId && index > lastReadIndex,
    ).length;

    return {
      id: conversation.id,
      type: "one_to_one",
      members: userRows.map(toPublicUser),
      lastMessage: messagesForConversation.at(-1) ?? null,
      unreadCount,
      createdAt: toIso(conversation.createdAt),
      updatedAt: toIso(conversation.updatedAt),
      deletedAt: nullableToIso(conversation.deletedAt),
    };
  };

  const findOneToOneConversation = async (
    creatorId: string,
    participantId: string,
  ): Promise<Conversation | undefined> => {
    const existingConversations = await Promise.all(
      (await db.select().from(conversations).where(isNull(conversations.deletedAt))).map(
        (conversation) => buildConversation(conversation, creatorId),
      ),
    );

    return existingConversations
      .filter((conversation): conversation is Conversation => conversation !== undefined)
      .find((conversation) => {
        const memberIds = conversation.members.map((member) => member.id).sort();
        return memberIds.join(":") === [creatorId, participantId].sort().join(":");
      });
  };

  return {
    createUser: async (input: CreateUserInput) => {
      const rows = await db
        .insert(users)
        .values({
          id: input.id,
          username: input.username,
          displayName: input.displayName,
          passwordHash: input.passwordHash,
          createdAt: new Date(input.createdAt),
          updatedAt: new Date(input.updatedAt),
        })
        .returning();
      const row = rows[0];

      if (row === undefined) {
        throw new Error("Failed to create user.");
      }

      return toUserWithPassword(row);
    },
    findUserById: async (userId) => {
      const row = await findUserRowById(userId);
      return row === undefined ? undefined : toPublicUser(row);
    },
    findUserWithPasswordByUsername: async (username) => {
      const rows = await db
        .select()
        .from(users)
        .where(
          and(
            sql`lower(${users.username}) = ${normalizeUsername(username)}`,
            isNull(users.deletedAt),
          ),
        )
        .limit(1);
      const row = rows[0];
      return row === undefined ? undefined : toUserWithPassword(row);
    },
    searchUsersByUsername: async (query, limit) => {
      const rows = await db
        .select()
        .from(users)
        .where(
          and(
            sql`lower(${users.username}) LIKE ${`%${normalizeUsername(query)}%`}`,
            isNull(users.deletedAt),
          ),
        )
        .limit(limit);
      return rows.map(toPublicUser);
    },
    createSession: async (input: CreateSessionInput) => {
      const rows = await db
        .insert(sessions)
        .values({
          id: input.id,
          userId: input.userId,
          tokenHash: input.tokenHash,
          expiresAt: new Date(input.expiresAt),
          createdAt: new Date(input.createdAt),
        })
        .returning();
      const row = rows[0];

      if (row === undefined) {
        throw new Error("Failed to create session.");
      }

      return toSessionRecord(row);
    },
    findSessionByTokenHash: async (tokenHash, now) => {
      const rows = await db
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.tokenHash, tokenHash),
            isNull(sessions.revokedAt),
            sql`${sessions.expiresAt} > ${new Date(now)}`,
          ),
        )
        .limit(1);
      const session = rows[0];

      if (session === undefined) {
        return undefined;
      }

      const user = await findUserRowById(session.userId);

      if (user === undefined) {
        return undefined;
      }

      return {
        session: toSessionRecord(session),
        user: toPublicUser(user),
      };
    },
    revokeSession: async (tokenHash, revokedAt) => {
      await db
        .update(sessions)
        .set({
          revokedAt: new Date(revokedAt),
        })
        .where(eq(sessions.tokenHash, tokenHash));
    },
    createOrFindOneToOneConversation: async (input: CreateConversationInput) => {
      const existingConversation = await findOneToOneConversation(
        input.creatorId,
        input.participantId,
      );

      if (existingConversation !== undefined) {
        return {
          conversation: existingConversation,
          created: false,
        };
      }

      const conversationRows = await db
        .insert(conversations)
        .values({
          id: input.id,
          type: "one_to_one",
          createdBy: input.creatorId,
          createdAt: new Date(input.createdAt),
          updatedAt: new Date(input.createdAt),
        })
        .returning();

      await db.insert(conversationMembers).values([
        {
          conversationId: input.id,
          userId: input.creatorId,
          joinedAt: new Date(input.createdAt),
        },
        {
          conversationId: input.id,
          userId: input.participantId,
          joinedAt: new Date(input.createdAt),
        },
      ]);

      const row = conversationRows[0];

      if (row === undefined) {
        throw new Error("Failed to create conversation.");
      }

      const conversation = await buildConversation(row, input.creatorId);

      if (conversation === undefined) {
        throw new Error("Failed to read created conversation.");
      }

      return {
        conversation,
        created: true,
      };
    },
    listConversationsForUser: async (userId) => {
      const memberRows = await db
        .select()
        .from(conversationMembers)
        .where(and(eq(conversationMembers.userId, userId), isNull(conversationMembers.deletedAt)));
      const conversationIds = memberRows.map((member) => member.conversationId);

      if (conversationIds.length === 0) {
        return [];
      }

      const rows = await db
        .select()
        .from(conversations)
        .where(and(inArray(conversations.id, conversationIds), isNull(conversations.deletedAt)))
        .orderBy(desc(conversations.updatedAt));
      const mapped = await Promise.all(
        rows.map((conversation) => buildConversation(conversation, userId)),
      );
      return mapped.filter(
        (conversation): conversation is Conversation => conversation !== undefined,
      );
    },
    getConversationForUser: async (conversationId, userId) => {
      const rows = await db
        .select()
        .from(conversations)
        .where(and(eq(conversations.id, conversationId), isNull(conversations.deletedAt)))
        .limit(1);
      const conversation = rows[0];
      return conversation === undefined ? undefined : buildConversation(conversation, userId);
    },
    listConversationMemberIds: async (conversationId) => {
      const rows = await db
        .select()
        .from(conversationMembers)
        .where(
          and(
            eq(conversationMembers.conversationId, conversationId),
            isNull(conversationMembers.deletedAt),
          ),
        );
      return rows.map((member) => member.userId);
    },
    listMessagesForUser: async (conversationId, userId) => {
      if (!(await hasActiveMembership(conversationId, userId))) {
        return [];
      }

      const rows = await listMessageRows(conversationId);
      return Promise.all(rows.map(mapMessage));
    },
    createMessage: async (input: CreateMessageInput) => {
      const existingRows = await db
        .select()
        .from(messages)
        .where(
          and(
            eq(messages.senderId, input.senderId),
            eq(messages.clientMessageId, input.clientMessageId),
            isNull(messages.deletedAt),
          ),
        )
        .limit(1);
      const existingRow = existingRows[0];

      if (existingRow !== undefined) {
        return {
          message: await mapMessage(existingRow),
          duplicate: true,
        };
      }

      const rows = await db
        .insert(messages)
        .values({
          id: input.id,
          conversationId: input.conversationId,
          senderId: input.senderId,
          body: input.body,
          clientMessageId: input.clientMessageId,
          createdAt: new Date(input.createdAt),
          updatedAt: new Date(input.createdAt),
        })
        .returning();
      await db
        .update(conversations)
        .set({
          updatedAt: new Date(input.createdAt),
        })
        .where(eq(conversations.id, input.conversationId));
      const row = rows[0];

      if (row === undefined) {
        throw new Error("Failed to create message.");
      }

      return {
        message: await mapMessage(row),
        duplicate: false,
      };
    },
    markMessageRead: async (conversationId, userId, messageId) => {
      const result = await db
        .update(conversationMembers)
        .set({
          lastReadMessageId: messageId,
        })
        .where(
          and(
            eq(conversationMembers.conversationId, conversationId),
            eq(conversationMembers.userId, userId),
            isNull(conversationMembers.deletedAt),
          ),
        );
      return result.count > 0;
    },
    close: async () => {
      await client.end();
    },
  };
};
