import { type Conversation, type PersistentMessage, type PublicUser } from "@pulse-chat/contracts";

export type UserWithPassword = PublicUser & {
  readonly passwordHash: string;
  readonly deletedAt: string | null;
};

export type SessionRecord = {
  readonly id: string;
  readonly userId: string;
  readonly tokenHash: string;
  readonly expiresAt: string;
  readonly createdAt: string;
  readonly revokedAt: string | null;
};

export type CreateUserInput = {
  readonly id: string;
  readonly username: string;
  readonly displayName: string;
  readonly passwordHash: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type CreateSessionInput = {
  readonly id: string;
  readonly userId: string;
  readonly tokenHash: string;
  readonly expiresAt: string;
  readonly createdAt: string;
};

export type CreateConversationInput = {
  readonly id: string;
  readonly creatorId: string;
  readonly participantId: string;
  readonly createdAt: string;
};

export type CreateMessageInput = {
  readonly id: string;
  readonly conversationId: string;
  readonly senderId: string;
  readonly body: string;
  readonly clientMessageId: string;
  readonly createdAt: string;
};

export type AppRepository = {
  readonly createUser: (input: CreateUserInput) => Promise<UserWithPassword>;
  readonly findUserById: (userId: string) => Promise<PublicUser | undefined>;
  readonly findUserWithPasswordByUsername: (
    username: string,
  ) => Promise<UserWithPassword | undefined>;
  readonly searchUsersByUsername: (query: string, limit: number) => Promise<readonly PublicUser[]>;
  readonly createSession: (input: CreateSessionInput) => Promise<SessionRecord>;
  readonly findSessionByTokenHash: (
    tokenHash: string,
    now: string,
  ) => Promise<{ readonly session: SessionRecord; readonly user: PublicUser } | undefined>;
  readonly revokeSession: (tokenHash: string, revokedAt: string) => Promise<void>;
  readonly createOrFindOneToOneConversation: (
    input: CreateConversationInput,
  ) => Promise<{ readonly conversation: Conversation; readonly created: boolean }>;
  readonly listConversationsForUser: (userId: string) => Promise<readonly Conversation[]>;
  readonly getConversationForUser: (
    conversationId: string,
    userId: string,
  ) => Promise<Conversation | undefined>;
  readonly listConversationMemberIds: (conversationId: string) => Promise<readonly string[]>;
  readonly listMessagesForUser: (
    conversationId: string,
    userId: string,
  ) => Promise<readonly PersistentMessage[]>;
  readonly createMessage: (
    input: CreateMessageInput,
  ) => Promise<{ readonly message: PersistentMessage; readonly duplicate: boolean }>;
  readonly markMessageRead: (
    conversationId: string,
    userId: string,
    messageId: string,
    readAt: string,
  ) => Promise<boolean>;
  readonly close: () => Promise<void>;
};
