import {
  authResponseSchema,
  conversationSchema,
  conversationsResponseSchema,
  loginRequestSchema,
  meResponseSchema,
  messagesResponseSchema,
  postMessageRequestSchema,
  postMessageResponseSchema,
  registerRequestSchema,
  usersResponseSchema,
  type AuthResponse,
  type Conversation,
  type ConversationsResponse,
  type CreateConversationRequest,
  type LoginRequest,
  type MessagesResponse,
  type PostMessageRequest,
  type PostMessageResponse,
  type RegisterRequest,
  type UsersResponse,
} from "@pulse-chat/contracts";
import { z, type ZodSchema } from "zod";

import { getApiUrl } from "./api-url";

export class ApiError extends Error {
  public constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(message);
  }
}

const errorResponseSchema = z
  .object({
    error: z
      .object({
        code: z.string(),
        message: z.string(),
      })
      .strict(),
  })
  .strict();

const parseJson = async (response: Response): Promise<unknown> => {
  if (response.status === 204) {
    return undefined;
  }

  return response.json() as Promise<unknown>;
};

const apiFetch = async <ResponseValue>(
  path: string,
  schema: ZodSchema<ResponseValue>,
  init: RequestInit = {},
): Promise<ResponseValue> => {
  const response = await fetch(`${getApiUrl()}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const json = await parseJson(response);

  if (!response.ok) {
    const parsedError = errorResponseSchema.safeParse(json);
    throw new ApiError(
      parsedError.success ? parsedError.data.error.message : "Request failed.",
      response.status,
      parsedError.success ? parsedError.data.error.code : "REQUEST_FAILED",
    );
  }

  return schema.parse(json);
};

export const apiClient = {
  register: async (input: RegisterRequest): Promise<AuthResponse> =>
    apiFetch("/auth/register", authResponseSchema, {
      method: "POST",
      body: JSON.stringify(registerRequestSchema.parse(input)),
    }),
  login: async (input: LoginRequest): Promise<AuthResponse> =>
    apiFetch("/auth/login", authResponseSchema, {
      method: "POST",
      body: JSON.stringify(loginRequestSchema.parse(input)),
    }),
  logout: async (): Promise<void> => {
    await fetch(`${getApiUrl()}/auth/logout`, {
      credentials: "include",
      method: "POST",
    });
  },
  me: async (): Promise<AuthResponse> => apiFetch("/me", meResponseSchema),
  searchUsers: async (query: string): Promise<UsersResponse> =>
    apiFetch(`/users?query=${encodeURIComponent(query)}`, usersResponseSchema),
  conversations: async (): Promise<ConversationsResponse> =>
    apiFetch("/conversations", conversationsResponseSchema),
  createConversation: async (
    input: CreateConversationRequest,
  ): Promise<{ conversation: Conversation }> =>
    apiFetch(
      "/conversations",
      z
        .object({
          conversation: conversationSchema,
        })
        .strict(),
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    ),
  messages: async (conversationId: string): Promise<MessagesResponse> =>
    apiFetch(`/conversations/${conversationId}/messages`, messagesResponseSchema),
  postMessage: async (input: PostMessageRequest): Promise<PostMessageResponse> =>
    apiFetch("/messages", postMessageResponseSchema, {
      method: "POST",
      body: JSON.stringify(postMessageRequestSchema.parse(input)),
    }),
};
