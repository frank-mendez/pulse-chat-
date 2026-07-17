import {
  MESSAGE_MAX_LENGTH,
  type Conversation,
  type PersistentMessage,
  type PublicUser,
} from "@pulse-chat/contracts";

import { type Clock, type IdFactory } from "../chat/chat.service.js";
import { type AppRepository } from "../repositories/app-repository.js";

export type CreateConversationResult =
  | {
      readonly ok: true;
      readonly conversation: Conversation;
      readonly created: boolean;
    }
  | {
      readonly ok: false;
      readonly code: "USER_NOT_FOUND" | "SELF_CONVERSATION";
      readonly message: string;
    };

export type CreateMessageResult =
  | {
      readonly ok: true;
      readonly message: PersistentMessage;
      readonly duplicate: boolean;
    }
  | {
      readonly ok: false;
      readonly code: "CONVERSATION_NOT_FOUND" | "MESSAGE_TOO_LONG";
      readonly message: string;
    };

export type MarkReadResult =
  | {
      readonly ok: true;
    }
  | {
      readonly ok: false;
      readonly code: "CONVERSATION_NOT_FOUND";
      readonly message: string;
    };

export type MessagingService = {
  readonly createConversation: (
    currentUser: PublicUser,
    participantUsername: string,
  ) => Promise<CreateConversationResult>;
  readonly listConversations: (currentUser: PublicUser) => Promise<readonly Conversation[]>;
  readonly getConversation: (
    currentUser: PublicUser,
    conversationId: string,
  ) => Promise<Conversation | undefined>;
  readonly listMessages: (
    currentUser: PublicUser,
    conversationId: string,
  ) => Promise<readonly PersistentMessage[]>;
  readonly createMessage: (
    currentUser: PublicUser,
    conversationId: string,
    body: string,
    clientMessageId: string,
  ) => Promise<CreateMessageResult>;
  readonly markRead: (
    currentUser: PublicUser,
    conversationId: string,
    messageId: string,
  ) => Promise<MarkReadResult>;
  readonly listConversationMemberIds: (conversationId: string) => Promise<readonly string[]>;
};

export type MessagingServiceOptions = {
  readonly repository: AppRepository;
  readonly createId: IdFactory;
  readonly now: Clock;
};

export const createMessagingService = ({
  repository,
  createId,
  now,
}: MessagingServiceOptions): MessagingService => ({
  createConversation: async (currentUser, participantUsername) => {
    const participant = await repository.findUserWithPasswordByUsername(participantUsername);

    if (participant === undefined) {
      return {
        ok: false,
        code: "USER_NOT_FOUND",
        message: "No user exists with that username.",
      };
    }

    if (participant.id === currentUser.id) {
      return {
        ok: false,
        code: "SELF_CONVERSATION",
        message: "Choose another user to start a conversation.",
      };
    }

    const result = await repository.createOrFindOneToOneConversation({
      id: createId("conversation"),
      creatorId: currentUser.id,
      participantId: participant.id,
      createdAt: now(),
    });

    return {
      ok: true,
      conversation: result.conversation,
      created: result.created,
    };
  },
  listConversations: async (currentUser) => repository.listConversationsForUser(currentUser.id),
  getConversation: async (currentUser, conversationId) =>
    repository.getConversationForUser(conversationId, currentUser.id),
  listMessages: async (currentUser, conversationId) =>
    repository.listMessagesForUser(conversationId, currentUser.id),
  createMessage: async (currentUser, conversationId, body, clientMessageId) => {
    const conversation = await repository.getConversationForUser(conversationId, currentUser.id);

    if (conversation === undefined) {
      return {
        ok: false,
        code: "CONVERSATION_NOT_FOUND",
        message: "Conversation was not found.",
      };
    }

    const trimmedBody = body.trim();

    if (trimmedBody.length > MESSAGE_MAX_LENGTH) {
      return {
        ok: false,
        code: "MESSAGE_TOO_LONG",
        message: "Message is too long.",
      };
    }

    const result = await repository.createMessage({
      id: createId("message"),
      conversationId,
      senderId: currentUser.id,
      body: trimmedBody,
      clientMessageId,
      createdAt: now(),
    });

    return {
      ok: true,
      message: result.message,
      duplicate: result.duplicate,
    };
  },
  markRead: async (currentUser, conversationId, messageId) => {
    const marked = await repository.markMessageRead(
      conversationId,
      currentUser.id,
      messageId,
      now(),
    );

    if (!marked) {
      return {
        ok: false,
        code: "CONVERSATION_NOT_FOUND",
        message: "Conversation was not found.",
      };
    }

    return {
      ok: true,
    };
  },
  listConversationMemberIds: async (conversationId) =>
    repository.listConversationMemberIds(conversationId),
});
