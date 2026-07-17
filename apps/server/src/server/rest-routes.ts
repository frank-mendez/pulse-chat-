import {
  createConversationRequestSchema,
  loginRequestSchema,
  postMessageRequestSchema,
  registerRequestSchema,
  type Conversation,
  type PersistentMessage,
  type PublicUser,
} from "@pulse-chat/contracts";
import { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import { z, type ZodSchema } from "zod";

import { type AuthService, type AuthenticatedSession } from "../auth/auth.service.js";
import { type AppConfig } from "../config/app-config.js";
import { type AppRepository } from "../repositories/app-repository.js";
import { type MessagingService } from "../messaging/messaging.service.js";

export type RestRouteOptions = {
  readonly app: FastifyInstance;
  readonly authService: AuthService;
  readonly messagingService: MessagingService;
  readonly repository: AppRepository;
  readonly config: AppConfig;
  readonly onConversationCreated: (conversation: Conversation) => void;
  readonly onMessageCreated: (message: PersistentMessage, clientMessageId: string) => void;
};

const userSearchQuerySchema = z
  .object({
    query: z.string().trim().min(1).max(32).optional(),
  })
  .strict();

const routeIdParamsSchema = z
  .object({
    id: z.string().min(1),
  })
  .strict();

const parseUnknown = <Value>(schema: ZodSchema<Value>, value: unknown): Value =>
  schema.parse(value);

const sendError = (
  reply: FastifyReply,
  statusCode: number,
  code: string,
  message: string,
): FastifyReply =>
  reply.status(statusCode).send({
    error: {
      code,
      message,
    },
  });

const setSessionCookie = (
  reply: FastifyReply,
  config: AppConfig,
  session: AuthenticatedSession,
): void => {
  reply.setCookie(config.sessionCookieName, session.token, {
    expires: new Date(session.expiresAt),
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: config.secureCookies,
  });
};

const clearSessionCookie = (reply: FastifyReply, config: AppConfig): void => {
  reply.clearCookie(config.sessionCookieName, {
    path: "/",
  });
};

const readSessionToken = (request: FastifyRequest, config: AppConfig): string | undefined => {
  const token = request.cookies[config.sessionCookieName];
  return typeof token === "string" && token.length > 0 ? token : undefined;
};

const requireUser = async (
  request: FastifyRequest,
  reply: FastifyReply,
  authService: AuthService,
  config: AppConfig,
): Promise<PublicUser | undefined> => {
  const user = await authService.authenticateToken(readSessionToken(request, config));

  if (user === undefined) {
    sendError(reply, 401, "UNAUTHORIZED", "Authentication is required.");
    return undefined;
  }

  return user;
};

export const registerRestRoutes = ({
  app,
  authService,
  messagingService,
  repository,
  config,
  onConversationCreated,
  onMessageCreated,
}: RestRouteOptions): void => {
  app.post("/auth/register", async (request, reply) => {
    const body = parseUnknown(registerRequestSchema, request.body);
    const result = await authService.register(body);

    if (!result.ok) {
      return sendError(reply, 409, result.code, result.message);
    }

    setSessionCookie(reply, config, result.session);
    return reply.status(201).send({
      user: result.session.user,
    });
  });

  app.post("/auth/login", async (request, reply) => {
    const body = parseUnknown(loginRequestSchema, request.body);
    const result = await authService.login(body);

    if (!result.ok) {
      return sendError(reply, 401, result.code, result.message);
    }

    setSessionCookie(reply, config, result.session);
    return {
      user: result.session.user,
    };
  });

  app.post("/auth/logout", async (request, reply) => {
    const token = readSessionToken(request, config);

    if (token !== undefined) {
      await authService.logout(token);
    }

    clearSessionCookie(reply, config);
    return reply.status(204).send();
  });

  app.get("/me", async (request, reply) => {
    const user = await requireUser(request, reply, authService, config);

    if (user === undefined) {
      return reply;
    }

    return {
      user,
    };
  });

  app.get("/users", async (request, reply) => {
    const user = await requireUser(request, reply, authService, config);

    if (user === undefined) {
      return reply;
    }

    const query = parseUnknown(userSearchQuerySchema, request.query).query ?? "";
    const users = query.length === 0 ? [] : await repository.searchUsersByUsername(query, 10);
    return {
      users: users.filter((candidate) => candidate.id !== user.id),
    };
  });

  app.get("/conversations", async (request, reply) => {
    const user = await requireUser(request, reply, authService, config);

    if (user === undefined) {
      return reply;
    }

    return {
      conversations: await messagingService.listConversations(user),
    };
  });

  app.post("/conversations", async (request, reply) => {
    const user = await requireUser(request, reply, authService, config);

    if (user === undefined) {
      return reply;
    }

    const body = parseUnknown(createConversationRequestSchema, request.body);
    const result = await messagingService.createConversation(user, body.participantUsername);

    if (!result.ok) {
      return sendError(
        reply,
        result.code === "USER_NOT_FOUND" ? 404 : 400,
        result.code,
        result.message,
      );
    }

    if (result.created) {
      onConversationCreated(result.conversation);
    }

    return reply.status(result.created ? 201 : 200).send({
      conversation: result.conversation,
    });
  });

  app.get("/conversations/:id/messages", async (request, reply) => {
    const user = await requireUser(request, reply, authService, config);

    if (user === undefined) {
      return reply;
    }

    const params = parseUnknown(routeIdParamsSchema, request.params);
    const conversation = await messagingService.getConversation(user, params.id);

    if (conversation === undefined) {
      return sendError(reply, 404, "CONVERSATION_NOT_FOUND", "Conversation was not found.");
    }

    return {
      messages: await messagingService.listMessages(user, params.id),
    };
  });

  app.post("/messages", async (request, reply) => {
    const user = await requireUser(request, reply, authService, config);

    if (user === undefined) {
      return reply;
    }

    const body = parseUnknown(postMessageRequestSchema, request.body);
    const result = await messagingService.createMessage(
      user,
      body.conversationId,
      body.body,
      body.clientMessageId,
    );

    if (!result.ok) {
      return sendError(
        reply,
        result.code === "CONVERSATION_NOT_FOUND" ? 404 : 400,
        result.code,
        result.message,
      );
    }

    if (!result.duplicate) {
      onMessageCreated(result.message, body.clientMessageId);
    }

    return reply.status(result.duplicate ? 200 : 201).send({
      message: result.message,
    });
  });
};
