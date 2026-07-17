import { type PersistentMessage } from "@pulse-chat/contracts";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ErrorBanner } from "../components/chat/ErrorBanner";
import { MessageInput } from "../components/chat/MessageInput";
import { ChatSidebar } from "../components/conversations/ChatSidebar";
import { ConversationHeader } from "../components/conversations/ConversationHeader";
import { EmptyState } from "../components/conversations/EmptyState";
import { MessageStatus } from "../components/conversations/MessageStatus";
import { MessageSkeleton } from "../components/conversations/SkeletonLoaders";
import { TypingIndicator } from "../components/conversations/TypingIndicator";
import { UserAvatar } from "../components/conversations/UserAvatar";
import { apiClient } from "../lib/api-client";
import { queryClient } from "../lib/query-client";
import { queryKeys } from "../lib/query-keys";
import { cn } from "../lib/utils";
import { useChatStore } from "../state/chat-store";

const formatTime = (sentAt: string): string =>
  new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(sentAt));

export const ChatPage = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const {
    clearError,
    disconnect,
    errorMessage,
    markRead,
    sendMessage,
    setCurrentConversationId,
    startTyping,
    status,
    stopTyping,
    typingUsersByConversationId,
  } = useChatStore();
  const me = useQuery({
    queryKey: queryKeys.me,
    queryFn: apiClient.me,
  });
  const conversations = useQuery({
    queryKey: queryKeys.conversations,
    queryFn: apiClient.conversations,
  });
  const messages = useQuery({
    enabled: conversationId !== undefined,
    queryKey: queryKeys.messages(conversationId ?? ""),
    queryFn: () => apiClient.messages(conversationId ?? ""),
  });

  useEffect(() => {
    setCurrentConversationId(conversationId);
    return () => {
      setCurrentConversationId(undefined);
    };
  }, [conversationId, setCurrentConversationId]);

  const currentConversation = useMemo(
    () =>
      conversations.data?.conversations.find((conversation) => conversation.id === conversationId),
    [conversationId, conversations.data?.conversations],
  );

  useEffect(() => {
    const lastMessage = messages.data?.messages.at(-1);

    if (conversationId !== undefined && lastMessage !== undefined) {
      markRead(conversationId, lastMessage.id);
    }
  }, [conversationId, markRead, messages.data?.messages]);

  if (conversationId === undefined || me.data === undefined) {
    return null;
  }

  const currentUser = me.data.user;
  const typingUsers = typingUsersByConversationId[conversationId] ?? [];

  const handleSend = (body: string): boolean => {
    const trimmedBody = body.trim();

    if (trimmedBody.length === 0) {
      return false;
    }

    const clientMessageId = crypto.randomUUID();
    const now = new Date().toISOString();
    const optimisticMessage: PersistentMessage = {
      id: `temp_${clientMessageId}`,
      conversationId,
      sender: currentUser,
      body: trimmedBody,
      clientMessageId,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    queryClient.setQueryData(
      queryKeys.messages(conversationId),
      (existing: { readonly messages: readonly PersistentMessage[] } | undefined) => ({
        messages: [...(existing?.messages ?? []), optimisticMessage],
      }),
    );

    return sendMessage(conversationId, trimmedBody, clientMessageId);
  };

  return (
    <main className="flex h-screen min-h-[640px] flex-col text-ink">
      <ConversationHeader
        conversation={currentConversation}
        currentUser={currentUser}
        onLogout={() => {
          void apiClient.logout().then(() => {
            disconnect();
            queryClient.clear();
            navigate("/login");
          });
        }}
        status={status}
      />
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <ChatSidebar
          activeConversationId={conversationId}
          conversations={conversations.data?.conversations ?? []}
          currentUser={currentUser}
          isLoading={conversations.isLoading}
          onCreateConversation={(participantUsername) => {
            void apiClient.createConversation({ participantUsername }).then((data) => {
              queryClient.setQueryData(queryKeys.conversations, {
                conversations: [data.conversation, ...(conversations.data?.conversations ?? [])],
              });
              navigate(`/chat/${data.conversation.id}`);
            });
          }}
        />

        <section className="flex min-h-0 flex-1 flex-col">
          <div className="px-4 pt-4 md:px-6">
            <ErrorBanner message={errorMessage} onDismiss={clearError} />
          </div>
          {messages.isLoading ? (
            <MessageSkeleton />
          ) : (messages.data?.messages.length ?? 0) === 0 ? (
            <div className="flex min-h-0 flex-1 items-center justify-center p-4 md:p-6">
              <EmptyState detail="Messages persist once sent." title="No messages yet" />
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6">
              <div className="mx-auto flex max-w-4xl flex-col gap-3">
                {messages.data?.messages.map((message) => {
                  const isOwnMessage = message.sender.id === currentUser.id;

                  return (
                    <article
                      className={cn("flex gap-3", isOwnMessage ? "justify-end" : "justify-start")}
                      key={message.id}
                    >
                      {!isOwnMessage && <UserAvatar user={message.sender} />}
                      <div
                        className={cn(
                          "max-w-[min(36rem,82vw)] rounded-card border px-4 py-3 shadow-sm",
                          isOwnMessage
                            ? "border-signal bg-signal text-white"
                            : "border-line bg-white text-ink",
                        )}
                      >
                        <div
                          className={cn(
                            "mb-1 flex items-center gap-2 text-xs font-bold uppercase",
                            isOwnMessage ? "text-white/75" : "text-graphite",
                          )}
                        >
                          <span>{message.sender.displayName}</span>
                          <span>{formatTime(message.createdAt)}</span>
                        </div>
                        <p className="whitespace-pre-wrap break-words text-sm leading-6">
                          {message.body}
                        </p>
                        {isOwnMessage && (
                          <div className="mt-2">
                            <MessageStatus isOptimistic={message.id.startsWith("temp_")} />
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
          <TypingIndicator users={typingUsers} />
          <MessageInput
            disabled={status !== "connected"}
            onDraftChange={(body) => {
              if (body.trim().length === 0) {
                stopTyping(conversationId);
                return;
              }

              startTyping(conversationId);
            }}
            onSend={handleSend}
          />
        </section>
      </div>
    </main>
  );
};
