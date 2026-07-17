import {
  CLIENT_EVENT_TYPES,
  SERVER_EVENT_TYPES,
  clientToServerEventSchema,
  type ClientToServerEvent,
  type Conversation,
  type ErrorCode,
  type PersistentMessage,
  type PublicUser,
  type ServerToClientEvent,
} from "@pulse-chat/contracts";
import { type IncomingMessage } from "node:http";
import { type RawData, WebSocket, type WebSocketServer } from "ws";

import { type AuthService } from "../auth/auth.service.js";
import { type Clock, type IdFactory } from "../chat/chat.service.js";
import { type MessagingService } from "../messaging/messaging.service.js";
import { parseJsonMessage, readIncomingType } from "../validation/message-parser.js";
import { type ClientSession } from "./client-session.js";
import { type GatewayLogger } from "./gateway-logger.js";
import { sendEvent } from "./send-event.js";

const KNOWN_CLIENT_EVENT_TYPES = new Set<string>(Object.values(CLIENT_EVENT_TYPES));

export type WebSocketGatewayOptions = {
  readonly webSocketServer: WebSocketServer;
  readonly authService: AuthService;
  readonly messagingService: MessagingService;
  readonly sessionCookieName: string;
  readonly createId: IdFactory;
  readonly now: Clock;
  readonly heartbeatIntervalMs: number;
  readonly logger: GatewayLogger;
};

const parseCookies = (cookieHeader: string | undefined): ReadonlyMap<string, string> => {
  const cookies = new Map<string, string>();

  if (cookieHeader === undefined) {
    return cookies;
  }

  for (const cookie of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = cookie.trim().split("=");
    const name = rawName?.trim();

    if (name === undefined || name.length === 0) {
      continue;
    }

    cookies.set(name, decodeURIComponent(rawValue.join("=")));
  }

  return cookies;
};

export class WebSocketGateway {
  private readonly sessions = new Map<string, ClientSession>();
  private heartbeatTimer: NodeJS.Timeout | undefined;

  public constructor(private readonly options: WebSocketGatewayOptions) {}

  public start(): void {
    this.options.webSocketServer.on("connection", this.handleConnection);
    this.heartbeatTimer = setInterval(this.checkHeartbeats, this.options.heartbeatIntervalMs);
  }

  public stop(): void {
    if (this.heartbeatTimer !== undefined) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }

    this.options.webSocketServer.off("connection", this.handleConnection);

    for (const session of this.sessions.values()) {
      session.socket.terminate();
    }

    this.sessions.clear();
  }

  public broadcastConversationCreated(conversation: Conversation): void {
    this.broadcastToConversationMembers(
      conversation.members.map((member) => member.id),
      {
        type: SERVER_EVENT_TYPES.CONVERSATION_CREATED,
        payload: {
          conversation,
        },
      },
    );
  }

  public broadcastMessageCreated(message: PersistentMessage, clientMessageId: string): void {
    void this.options.messagingService
      .listConversationMemberIds(message.conversationId)
      .then((memberIds) => {
        this.broadcastToConversationMembers(memberIds, {
          type: SERVER_EVENT_TYPES.MESSAGE_NEW,
          payload: {
            message,
          },
        });
        this.broadcastToConversationMembers([message.sender.id], {
          type: SERVER_EVENT_TYPES.MESSAGE_DELIVERED,
          payload: {
            conversationId: message.conversationId,
            clientMessageId,
            message,
          },
        });
      })
      .catch((error: unknown) => {
        this.options.logger.error("Failed to broadcast created message.", error);
      });
  }

  private readonly handleConnection = (socket: WebSocket, request: IncomingMessage): void => {
    void this.authenticateConnection(socket, request);
  };

  private async authenticateConnection(socket: WebSocket, request: IncomingMessage): Promise<void> {
    const cookies = parseCookies(request.headers.cookie);
    const sessionToken = cookies.get(this.options.sessionCookieName);
    const user = await this.options.authService.authenticateToken(sessionToken);

    if (user === undefined) {
      const closeUnauthorizedSocket = (): void => {
        socket.close(1008, "Authentication is required.");
      };
      const errorWasSent = sendEvent(
        socket,
        {
          type: SERVER_EVENT_TYPES.ERROR,
          payload: {
            code: "UNAUTHORIZED",
            message: "Authentication is required.",
          },
        },
        closeUnauthorizedSocket,
      );

      if (!errorWasSent) {
        closeUnauthorizedSocket();
      }

      return;
    }

    const session: ClientSession = {
      clientId: this.options.createId("client"),
      socket,
      isAlive: true,
      user,
    };

    this.sessions.set(session.clientId, session);
    this.broadcastPresence(user, "online");

    socket.on("message", (data: RawData) => {
      void this.handleMessage(session, data);
    });

    socket.on("pong", () => {
      session.isAlive = true;
    });

    socket.on("close", () => {
      this.handleDisconnect(session);
    });

    socket.on("error", (error: Error) => {
      this.options.logger.warn("WebSocket connection error.", {
        clientId: session.clientId,
        errorMessage: error.message,
      });
    });
  }

  private async handleMessage(session: ClientSession, data: RawData): Promise<void> {
    const parsedJson = parseJsonMessage(data);

    if (!parsedJson.ok) {
      this.sendError(session, "INVALID_JSON", "Message must be valid JSON.");
      return;
    }

    const parsedEvent = clientToServerEventSchema.safeParse(parsedJson.value);

    if (!parsedEvent.success) {
      const requestType = readIncomingType(parsedJson.value);

      if (requestType !== undefined && !KNOWN_CLIENT_EVENT_TYPES.has(requestType)) {
        this.sendError(session, "UNKNOWN_EVENT", "Unknown event type.", requestType);
        return;
      }

      this.sendError(session, "VALIDATION_ERROR", "Invalid payload.", requestType);
      return;
    }

    await this.handleClientEvent(session, parsedEvent.data);
  }

  private async handleClientEvent(
    session: ClientSession,
    event: ClientToServerEvent,
  ): Promise<void> {
    switch (event.type) {
      case CLIENT_EVENT_TYPES.CONVERSATION_CREATE:
        await this.handleConversationCreate(session, event.payload.participantUsername);
        return;
      case CLIENT_EVENT_TYPES.JOIN:
        this.sendError(
          session,
          "VALIDATION_ERROR",
          "Join is not used after authentication.",
          event.type,
        );
        return;
      case CLIENT_EVENT_TYPES.MESSAGE_SEND:
        await this.handleMessageSend(
          session,
          event.payload.conversationId,
          event.payload.body,
          event.payload.clientMessageId,
        );
        return;
      case CLIENT_EVENT_TYPES.MESSAGE_READ:
        await this.handleMessageRead(
          session,
          event.payload.conversationId,
          event.payload.messageId,
        );
        return;
      case CLIENT_EVENT_TYPES.PING:
        sendEvent(session.socket, {
          type: SERVER_EVENT_TYPES.PONG,
          payload: {
            sentAt: this.options.now(),
          },
        });
        return;
      case CLIENT_EVENT_TYPES.TYPING_START:
        await this.handleTyping(session, event.payload.conversationId, true);
        return;
      case CLIENT_EVENT_TYPES.TYPING_STOP:
        await this.handleTyping(session, event.payload.conversationId, false);
        return;
    }
  }

  private async handleConversationCreate(
    session: ClientSession,
    participantUsername: string,
  ): Promise<void> {
    const result = await this.options.messagingService.createConversation(
      session.user,
      participantUsername,
    );

    if (!result.ok) {
      this.sendError(session, result.code, result.message, CLIENT_EVENT_TYPES.CONVERSATION_CREATE);
      return;
    }

    this.broadcastConversationCreated(result.conversation);
  }

  private async handleMessageSend(
    session: ClientSession,
    conversationId: string,
    body: string,
    clientMessageId: string,
  ): Promise<void> {
    const result = await this.options.messagingService.createMessage(
      session.user,
      conversationId,
      body,
      clientMessageId,
    );

    if (!result.ok) {
      this.sendError(session, result.code, result.message, CLIENT_EVENT_TYPES.MESSAGE_SEND);
      return;
    }

    this.broadcastMessageCreated(result.message, clientMessageId);
  }

  private async handleMessageRead(
    session: ClientSession,
    conversationId: string,
    messageId: string,
  ): Promise<void> {
    const result = await this.options.messagingService.markRead(
      session.user,
      conversationId,
      messageId,
    );

    if (!result.ok) {
      this.sendError(session, result.code, result.message, CLIENT_EVENT_TYPES.MESSAGE_READ);
      return;
    }

    const memberIds = await this.options.messagingService.listConversationMemberIds(conversationId);
    this.broadcastToConversationMembers(memberIds, {
      type: SERVER_EVENT_TYPES.MESSAGE_READ,
      payload: {
        conversationId,
        messageId,
        readerId: session.user.id,
        readAt: this.options.now(),
      },
    });
  }

  private async handleTyping(
    session: ClientSession,
    conversationId: string,
    isTyping: boolean,
  ): Promise<void> {
    const conversation = await this.options.messagingService.getConversation(
      session.user,
      conversationId,
    );

    if (conversation === undefined) {
      this.sendError(
        session,
        "CONVERSATION_NOT_FOUND",
        "Conversation was not found.",
        isTyping ? CLIENT_EVENT_TYPES.TYPING_START : CLIENT_EVENT_TYPES.TYPING_STOP,
      );
      return;
    }

    const event: ServerToClientEvent = {
      type: isTyping ? SERVER_EVENT_TYPES.TYPING_STARTED : SERVER_EVENT_TYPES.TYPING_STOPPED,
      payload: {
        conversationId,
        user: session.user,
      },
    };

    this.broadcastToConversationMembers(
      conversation.members
        .map((member) => member.id)
        .filter((userId) => userId !== session.user.id),
      event,
    );
  }

  private handleDisconnect(session: ClientSession): void {
    if (!this.sessions.delete(session.clientId)) {
      return;
    }

    if (![...this.sessions.values()].some((candidate) => candidate.user.id === session.user.id)) {
      this.broadcastPresence(session.user, "offline");
    }
  }

  private readonly checkHeartbeats = (): void => {
    for (const session of this.sessions.values()) {
      if (!session.isAlive) {
        this.options.logger.warn("Terminating stale WebSocket connection.", {
          clientId: session.clientId,
        });
        session.socket.terminate();
        this.handleDisconnect(session);
        continue;
      }

      session.isAlive = false;

      if (session.socket.readyState === WebSocket.OPEN) {
        session.socket.ping();
      }
    }
  };

  private broadcastPresence(user: PublicUser, status: "online" | "offline"): void {
    this.broadcast({
      type: SERVER_EVENT_TYPES.PRESENCE_UPDATED,
      payload: {
        userId: user.id,
        status,
        lastSeenAt: this.options.now(),
      },
    });
  }

  private broadcastToConversationMembers(
    memberIds: readonly string[],
    event: ServerToClientEvent,
  ): void {
    const memberIdSet = new Set(memberIds);

    for (const session of this.sessions.values()) {
      if (memberIdSet.has(session.user.id)) {
        sendEvent(session.socket, event);
      }
    }
  }

  private broadcast(event: ServerToClientEvent): void {
    for (const session of this.sessions.values()) {
      sendEvent(session.socket, event);
    }
  }

  private sendError(
    session: ClientSession,
    code: ErrorCode,
    message: string,
    requestType?: string,
  ): void {
    sendEvent(session.socket, {
      type: SERVER_EVENT_TYPES.ERROR,
      payload: {
        code,
        message,
        requestType,
      },
    });
  }
}
