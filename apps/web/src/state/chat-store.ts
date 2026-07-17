import {
  CLIENT_EVENT_TYPES,
  DEFAULT_HEARTBEAT_INTERVAL_MS,
  SERVER_EVENT_TYPES,
  clientToServerEventSchema,
  type ClientToServerEvent,
  type Conversation,
  type PersistentMessage,
  type PublicUser,
} from "@pulse-chat/contracts";
import { create } from "zustand";

import { queryClient } from "../lib/query-client";
import { queryKeys } from "../lib/query-keys";
import { parseServerEvent } from "../lib/server-event-parser";
import { getWebSocketUrl } from "../lib/websocket-url";
import { getReconnectDelayMs } from "./reconnect";

export type ConnectionStatus =
  "idle" | "connecting" | "connected" | "reconnecting" | "disconnected" | "error";

export type ChatStore = {
  readonly status: ConnectionStatus;
  readonly currentConversationId: string | undefined;
  readonly errorMessage: string | undefined;
  readonly lastPongAt: string | undefined;
  readonly reconnectAttempt: number;
  readonly typingUsersByConversationId: Readonly<Record<string, readonly PublicUser[]>>;
  readonly presenceByUserId: Readonly<Record<string, "online" | "offline">>;
  readonly connect: () => void;
  readonly disconnect: () => void;
  readonly setCurrentConversationId: (conversationId: string | undefined) => void;
  readonly sendMessage: (conversationId: string, body: string, clientMessageId: string) => boolean;
  readonly startTyping: (conversationId: string) => boolean;
  readonly stopTyping: (conversationId: string) => boolean;
  readonly markRead: (conversationId: string, messageId: string) => boolean;
  readonly clearError: () => void;
};

let socket: WebSocket | undefined;
let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
let heartbeatTimer: ReturnType<typeof setInterval> | undefined;
let manualDisconnect = false;

const clearReconnectTimer = (): void => {
  if (reconnectTimer !== undefined) {
    clearTimeout(reconnectTimer);
    reconnectTimer = undefined;
  }
};

const clearHeartbeatTimer = (): void => {
  if (heartbeatTimer !== undefined) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = undefined;
  }
};

const serializeClientEvent = (event: ClientToServerEvent): string =>
  JSON.stringify(clientToServerEventSchema.parse(event));

const sendClientEvent = (event: ClientToServerEvent): boolean => {
  if (socket === undefined || socket.readyState !== WebSocket.OPEN) {
    return false;
  }

  socket.send(serializeClientEvent(event));
  return true;
};

const upsertConversation = (
  conversations: readonly Conversation[] | undefined,
  conversation: Conversation,
): readonly Conversation[] => {
  const existing = conversations ?? [];
  const withoutExisting = existing.filter((candidate) => candidate.id !== conversation.id);
  return [conversation, ...withoutExisting].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );
};

const upsertMessage = (
  messages: readonly PersistentMessage[] | undefined,
  nextMessage: PersistentMessage,
): readonly PersistentMessage[] => {
  const existing = messages ?? [];
  const withoutExisting = existing.filter(
    (message) =>
      !(
        message.id === nextMessage.id ||
        (nextMessage.clientMessageId !== null &&
          message.clientMessageId === nextMessage.clientMessageId)
      ),
  );
  return [...withoutExisting, nextMessage].sort((left, right) =>
    left.createdAt.localeCompare(right.createdAt),
  );
};

const removeTypingUser = (
  users: readonly PublicUser[] | undefined,
  userId: string,
): readonly PublicUser[] => (users ?? []).filter((user) => user.id !== userId);

export const useChatStore = create<ChatStore>((set, get) => {
  const scheduleReconnect = (): void => {
    clearReconnectTimer();

    const nextAttempt = get().reconnectAttempt + 1;
    const delayMs = getReconnectDelayMs(nextAttempt);

    set({
      status: "reconnecting",
      reconnectAttempt: nextAttempt,
      errorMessage: `Connection lost. Reconnecting in ${Math.round(delayMs / 1000)}s.`,
    });

    reconnectTimer = setTimeout(() => {
      openSocket();
    }, delayMs);
  };

  const startHeartbeat = (): void => {
    clearHeartbeatTimer();

    heartbeatTimer = setInterval(() => {
      sendClientEvent({
        type: CLIENT_EVENT_TYPES.PING,
        payload: {
          sentAt: new Date().toISOString(),
        },
      });
    }, DEFAULT_HEARTBEAT_INTERVAL_MS);
  };

  const openSocket = (): void => {
    clearReconnectTimer();
    clearHeartbeatTimer();
    manualDisconnect = false;

    const nextSocket = new WebSocket(getWebSocketUrl());
    socket = nextSocket;

    set({
      status: get().status === "reconnecting" ? "reconnecting" : "connecting",
      errorMessage: undefined,
    });

    nextSocket.addEventListener("open", () => {
      if (socket !== nextSocket) {
        return;
      }

      set({
        status: "connected",
        reconnectAttempt: 0,
        errorMessage: undefined,
      });
      startHeartbeat();
    });

    nextSocket.addEventListener("message", (messageEvent: MessageEvent<unknown>) => {
      if (socket !== nextSocket) {
        return;
      }

      const parsedEvent = parseServerEvent(messageEvent.data);

      if (!parsedEvent.ok) {
        set({
          errorMessage: parsedEvent.message,
        });
        return;
      }

      switch (parsedEvent.event.type) {
        case SERVER_EVENT_TYPES.CHAT_HISTORY:
        case SERVER_EVENT_TYPES.USER_JOINED:
        case SERVER_EVENT_TYPES.USER_LEFT:
        case SERVER_EVENT_TYPES.USERS_ONLINE:
          return;
        case SERVER_EVENT_TYPES.CONVERSATION_CREATED: {
          const createdConversation = parsedEvent.event.payload.conversation;
          queryClient.setQueryData(
            queryKeys.conversations,
            (existing: { readonly conversations: readonly Conversation[] } | undefined) => ({
              conversations: upsertConversation(existing?.conversations, createdConversation),
            }),
          );
          return;
        }
        case SERVER_EVENT_TYPES.MESSAGE_DELIVERED:
        case SERVER_EVENT_TYPES.MESSAGE_NEW: {
          const message = parsedEvent.event.payload.message;
          queryClient.setQueryData(
            queryKeys.messages(message.conversationId),
            (existing: { readonly messages: readonly PersistentMessage[] } | undefined) => ({
              messages: upsertMessage(existing?.messages, message),
            }),
          );
          queryClient.setQueryData(
            queryKeys.conversations,
            (existing: { readonly conversations: readonly Conversation[] } | undefined) => ({
              conversations: (existing?.conversations ?? []).map((conversation) =>
                conversation.id === message.conversationId
                  ? {
                      ...conversation,
                      lastMessage: message,
                      updatedAt: message.createdAt,
                    }
                  : conversation,
              ),
            }),
          );
          return;
        }
        case SERVER_EVENT_TYPES.MESSAGE_READ:
          return;
        case SERVER_EVENT_TYPES.PONG:
          set({
            lastPongAt: parsedEvent.event.payload.sentAt,
          });
          return;
        case SERVER_EVENT_TYPES.PRESENCE_UPDATED: {
          const presence = parsedEvent.event.payload;
          set((state) => ({
            presenceByUserId: {
              ...state.presenceByUserId,
              [presence.userId]: presence.status,
            },
          }));
          return;
        }
        case SERVER_EVENT_TYPES.TYPING_STARTED: {
          const typingStarted = parsedEvent.event.payload;
          set((state) => {
            const existingUsers =
              state.typingUsersByConversationId[typingStarted.conversationId] ?? [];
            const withoutExisting = removeTypingUser(existingUsers, typingStarted.user.id);
            return {
              typingUsersByConversationId: {
                ...state.typingUsersByConversationId,
                [typingStarted.conversationId]: [...withoutExisting, typingStarted.user],
              },
            };
          });
          return;
        }
        case SERVER_EVENT_TYPES.TYPING_STOPPED: {
          const typingStopped = parsedEvent.event.payload;
          set((state) => ({
            typingUsersByConversationId: {
              ...state.typingUsersByConversationId,
              [typingStopped.conversationId]: removeTypingUser(
                state.typingUsersByConversationId[typingStopped.conversationId],
                typingStopped.user.id,
              ),
            },
          }));
          return;
        }
        case SERVER_EVENT_TYPES.ERROR:
          set({
            status: parsedEvent.event.payload.code === "UNAUTHORIZED" ? "error" : get().status,
            errorMessage: parsedEvent.event.payload.message,
          });
          return;
      }
    });

    nextSocket.addEventListener("close", () => {
      if (socket !== nextSocket) {
        return;
      }

      clearHeartbeatTimer();
      socket = undefined;

      if (manualDisconnect) {
        set({
          status: "disconnected",
          reconnectAttempt: 0,
        });
        return;
      }

      scheduleReconnect();
    });

    nextSocket.addEventListener("error", () => {
      if (socket !== nextSocket) {
        return;
      }

      set({
        status: "error",
        errorMessage: "Unable to reach the realtime server.",
      });
    });
  };

  return {
    status: "idle",
    currentConversationId: undefined,
    errorMessage: undefined,
    lastPongAt: undefined,
    reconnectAttempt: 0,
    typingUsersByConversationId: {},
    presenceByUserId: {},
    connect: () => {
      if (
        socket !== undefined &&
        (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }

      openSocket();
    },
    disconnect: () => {
      manualDisconnect = true;
      clearReconnectTimer();
      clearHeartbeatTimer();

      if (socket !== undefined) {
        socket.close();
        socket = undefined;
      }

      set({
        status: "disconnected",
        errorMessage: undefined,
        lastPongAt: undefined,
        reconnectAttempt: 0,
        typingUsersByConversationId: {},
        presenceByUserId: {},
      });
    },
    setCurrentConversationId: (conversationId) => {
      set({
        currentConversationId: conversationId,
      });
    },
    sendMessage: (conversationId, body, clientMessageId) =>
      sendClientEvent({
        type: CLIENT_EVENT_TYPES.MESSAGE_SEND,
        payload: {
          conversationId,
          body,
          clientMessageId,
        },
      }),
    startTyping: (conversationId) =>
      sendClientEvent({
        type: CLIENT_EVENT_TYPES.TYPING_START,
        payload: {
          conversationId,
        },
      }),
    stopTyping: (conversationId) =>
      sendClientEvent({
        type: CLIENT_EVENT_TYPES.TYPING_STOP,
        payload: {
          conversationId,
        },
      }),
    markRead: (conversationId, messageId) =>
      sendClientEvent({
        type: CLIENT_EVENT_TYPES.MESSAGE_READ,
        payload: {
          conversationId,
          messageId,
        },
      }),
    clearError: () => {
      set({
        errorMessage: undefined,
      });
    },
  };
});
