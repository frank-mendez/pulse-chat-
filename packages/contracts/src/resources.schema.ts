import { z } from "zod";

import { MESSAGE_MAX_LENGTH, MESSAGE_MIN_LENGTH } from "./protocol.constants.js";
import { isoDateTimeSchema, messageBodySchema, usernameSchema } from "./common.schema.js";

export const entityIdSchema = z.string().min(1);
export const nullableUrlSchema = z.string().url().nullable();
export const displayNameSchema = z.string().trim().min(1).max(80);
export const passwordSchema = z.string().min(8).max(256);
export const clientMessageIdSchema = z.string().trim().min(1).max(120);

export const publicUserSchema = z
  .object({
    id: entityIdSchema,
    username: usernameSchema,
    displayName: displayNameSchema,
    avatarUrl: nullableUrlSchema,
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .strict();

export const conversationTypeSchema = z.enum(["one_to_one"]);

export const messageDeliveryStatusSchema = z.enum([
  "sending",
  "sent",
  "delivered",
  "read",
  "failed",
]);

export const persistentMessageSchema = z
  .object({
    id: entityIdSchema,
    conversationId: entityIdSchema,
    sender: publicUserSchema,
    body: messageBodySchema,
    clientMessageId: clientMessageIdSchema.nullable(),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
    deletedAt: isoDateTimeSchema.nullable(),
  })
  .strict();

export const conversationSchema = z
  .object({
    id: entityIdSchema,
    type: conversationTypeSchema,
    members: z.array(publicUserSchema).min(1),
    lastMessage: persistentMessageSchema.nullable(),
    unreadCount: z.number().int().min(0),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
    deletedAt: isoDateTimeSchema.nullable(),
  })
  .strict();

export const registerRequestSchema = z
  .object({
    username: usernameSchema,
    displayName: displayNameSchema,
    password: passwordSchema,
  })
  .strict();

export const loginRequestSchema = z
  .object({
    username: usernameSchema,
    password: passwordSchema,
  })
  .strict();

export const authResponseSchema = z
  .object({
    user: publicUserSchema,
  })
  .strict();

export const meResponseSchema = authResponseSchema;

export const createConversationRequestSchema = z
  .object({
    participantUsername: usernameSchema,
  })
  .strict();

export const conversationsResponseSchema = z
  .object({
    conversations: z.array(conversationSchema),
  })
  .strict();

export const usersResponseSchema = z
  .object({
    users: z.array(publicUserSchema),
  })
  .strict();

export const messagesResponseSchema = z
  .object({
    messages: z.array(persistentMessageSchema),
  })
  .strict();

export const postMessageRequestSchema = z
  .object({
    conversationId: entityIdSchema,
    body: z.string().trim().min(MESSAGE_MIN_LENGTH).max(MESSAGE_MAX_LENGTH),
    clientMessageId: clientMessageIdSchema,
  })
  .strict();

export const postMessageResponseSchema = z
  .object({
    message: persistentMessageSchema,
  })
  .strict();

export type PublicUser = z.infer<typeof publicUserSchema>;
export type Conversation = z.infer<typeof conversationSchema>;
export type PersistentMessage = z.infer<typeof persistentMessageSchema>;
export type MessageDeliveryStatus = z.infer<typeof messageDeliveryStatusSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type CreateConversationRequest = z.infer<typeof createConversationRequestSchema>;
export type ConversationsResponse = z.infer<typeof conversationsResponseSchema>;
export type UsersResponse = z.infer<typeof usersResponseSchema>;
export type MessagesResponse = z.infer<typeof messagesResponseSchema>;
export type PostMessageRequest = z.infer<typeof postMessageRequestSchema>;
export type PostMessageResponse = z.infer<typeof postMessageResponseSchema>;
