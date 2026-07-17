import { z } from "zod";

import { CLIENT_EVENT_TYPES, ERROR_CODE_VALUES, SERVER_EVENT_TYPES } from "./protocol.constants.js";
import { isoDateTimeSchema, messageBodySchema, usernameSchema } from "./common.schema.js";
import {
  clientMessageIdSchema,
  conversationSchema,
  entityIdSchema,
  persistentMessageSchema,
  publicUserSchema,
} from "./resources.schema.js";

export const userSchema = z
  .object({
    id: z.string().min(1),
    username: usernameSchema,
    joinedAt: isoDateTimeSchema,
  })
  .strict();

export const chatMessageSchema = z
  .object({
    id: z.string().min(1),
    userId: z.string().min(1),
    username: usernameSchema,
    body: messageBodySchema,
    sentAt: isoDateTimeSchema,
  })
  .strict();

export const joinEventSchema = z
  .object({
    type: z.literal(CLIENT_EVENT_TYPES.JOIN),
    payload: z
      .object({
        username: usernameSchema,
      })
      .strict(),
  })
  .strict();

export const messageSendEventSchema = z
  .object({
    type: z.literal(CLIENT_EVENT_TYPES.MESSAGE_SEND),
    payload: z
      .object({
        conversationId: entityIdSchema,
        body: messageBodySchema,
        clientMessageId: clientMessageIdSchema,
      })
      .strict(),
  })
  .strict();

export const conversationCreateEventSchema = z
  .object({
    type: z.literal(CLIENT_EVENT_TYPES.CONVERSATION_CREATE),
    payload: z
      .object({
        participantUsername: usernameSchema,
      })
      .strict(),
  })
  .strict();

export const typingStartEventSchema = z
  .object({
    type: z.literal(CLIENT_EVENT_TYPES.TYPING_START),
    payload: z
      .object({
        conversationId: entityIdSchema,
      })
      .strict(),
  })
  .strict();

export const typingStopEventSchema = z
  .object({
    type: z.literal(CLIENT_EVENT_TYPES.TYPING_STOP),
    payload: z
      .object({
        conversationId: entityIdSchema,
      })
      .strict(),
  })
  .strict();

export const messageReadEventSchema = z
  .object({
    type: z.literal(CLIENT_EVENT_TYPES.MESSAGE_READ),
    payload: z
      .object({
        conversationId: entityIdSchema,
        messageId: entityIdSchema,
      })
      .strict(),
  })
  .strict();

export const pingEventSchema = z
  .object({
    type: z.literal(CLIENT_EVENT_TYPES.PING),
    payload: z
      .object({
        sentAt: isoDateTimeSchema.optional(),
      })
      .strict(),
  })
  .strict();

export const clientToServerEventSchema = z.discriminatedUnion("type", [
  conversationCreateEventSchema,
  joinEventSchema,
  messageSendEventSchema,
  messageReadEventSchema,
  pingEventSchema,
  typingStartEventSchema,
  typingStopEventSchema,
]);

export const chatHistoryEventSchema = z
  .object({
    type: z.literal(SERVER_EVENT_TYPES.CHAT_HISTORY),
    payload: z
      .object({
        messages: z.array(chatMessageSchema),
      })
      .strict(),
  })
  .strict();

export const messageNewEventSchema = z
  .object({
    type: z.literal(SERVER_EVENT_TYPES.MESSAGE_NEW),
    payload: z
      .object({
        message: persistentMessageSchema,
      })
      .strict(),
  })
  .strict();

export const conversationCreatedEventSchema = z
  .object({
    type: z.literal(SERVER_EVENT_TYPES.CONVERSATION_CREATED),
    payload: z
      .object({
        conversation: conversationSchema,
      })
      .strict(),
  })
  .strict();

export const messageDeliveredEventSchema = z
  .object({
    type: z.literal(SERVER_EVENT_TYPES.MESSAGE_DELIVERED),
    payload: z
      .object({
        conversationId: entityIdSchema,
        clientMessageId: clientMessageIdSchema,
        message: persistentMessageSchema,
      })
      .strict(),
  })
  .strict();

export const messageReadServerEventSchema = z
  .object({
    type: z.literal(SERVER_EVENT_TYPES.MESSAGE_READ),
    payload: z
      .object({
        conversationId: entityIdSchema,
        messageId: entityIdSchema,
        readerId: entityIdSchema,
        readAt: isoDateTimeSchema,
      })
      .strict(),
  })
  .strict();

export const typingStartedEventSchema = z
  .object({
    type: z.literal(SERVER_EVENT_TYPES.TYPING_STARTED),
    payload: z
      .object({
        conversationId: entityIdSchema,
        user: publicUserSchema,
      })
      .strict(),
  })
  .strict();

export const typingStoppedEventSchema = z
  .object({
    type: z.literal(SERVER_EVENT_TYPES.TYPING_STOPPED),
    payload: z
      .object({
        conversationId: entityIdSchema,
        user: publicUserSchema,
      })
      .strict(),
  })
  .strict();

export const presenceUpdatedEventSchema = z
  .object({
    type: z.literal(SERVER_EVENT_TYPES.PRESENCE_UPDATED),
    payload: z
      .object({
        userId: entityIdSchema,
        status: z.enum(["online", "offline"]),
        lastSeenAt: isoDateTimeSchema,
      })
      .strict(),
  })
  .strict();

export const userJoinedEventSchema = z
  .object({
    type: z.literal(SERVER_EVENT_TYPES.USER_JOINED),
    payload: z
      .object({
        user: userSchema,
      })
      .strict(),
  })
  .strict();

export const userLeftEventSchema = z
  .object({
    type: z.literal(SERVER_EVENT_TYPES.USER_LEFT),
    payload: z
      .object({
        userId: z.string().min(1),
        username: usernameSchema,
        leftAt: isoDateTimeSchema,
      })
      .strict(),
  })
  .strict();

export const usersOnlineEventSchema = z
  .object({
    type: z.literal(SERVER_EVENT_TYPES.USERS_ONLINE),
    payload: z
      .object({
        users: z.array(userSchema),
      })
      .strict(),
  })
  .strict();

export const pongEventSchema = z
  .object({
    type: z.literal(SERVER_EVENT_TYPES.PONG),
    payload: z
      .object({
        sentAt: isoDateTimeSchema,
      })
      .strict(),
  })
  .strict();

export const errorCodeSchema = z.enum(ERROR_CODE_VALUES);

export const errorEventSchema = z
  .object({
    type: z.literal(SERVER_EVENT_TYPES.ERROR),
    payload: z
      .object({
        code: errorCodeSchema,
        message: z.string().min(1),
        requestType: z.string().min(1).optional(),
      })
      .strict(),
  })
  .strict();

export const serverToClientEventSchema = z.discriminatedUnion("type", [
  chatHistoryEventSchema,
  conversationCreatedEventSchema,
  messageDeliveredEventSchema,
  messageNewEventSchema,
  messageReadServerEventSchema,
  presenceUpdatedEventSchema,
  userJoinedEventSchema,
  userLeftEventSchema,
  usersOnlineEventSchema,
  pongEventSchema,
  errorEventSchema,
  typingStartedEventSchema,
  typingStoppedEventSchema,
]);

export type User = z.infer<typeof userSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ClientToServerEvent = z.infer<typeof clientToServerEventSchema>;
export type ServerToClientEvent = z.infer<typeof serverToClientEventSchema>;
export type ErrorCode = z.infer<typeof errorCodeSchema>;
