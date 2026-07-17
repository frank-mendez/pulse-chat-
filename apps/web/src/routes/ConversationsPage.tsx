import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { EmptyState } from "../components/conversations/EmptyState";
import { ChatSidebar } from "../components/conversations/ChatSidebar";
import { ConversationHeader } from "../components/conversations/ConversationHeader";
import { apiClient } from "../lib/api-client";
import { queryClient } from "../lib/query-client";
import { queryKeys } from "../lib/query-keys";
import { useChatStore } from "../state/chat-store";

export const ConversationsPage = () => {
  const navigate = useNavigate();
  const { disconnect, status } = useChatStore();
  const me = useQuery({
    queryKey: queryKeys.me,
    queryFn: apiClient.me,
  });
  const conversations = useQuery({
    queryKey: queryKeys.conversations,
    queryFn: apiClient.conversations,
  });
  const createConversation = useMutation({
    mutationFn: apiClient.createConversation,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.conversations, {
        conversations: [data.conversation, ...(conversations.data?.conversations ?? [])],
      });
      navigate(`/chat/${data.conversation.id}`);
    },
  });
  const logout = useMutation({
    mutationFn: apiClient.logout,
    onSuccess: () => {
      disconnect();
      queryClient.clear();
      navigate("/login");
    },
  });

  if (me.data === undefined) {
    return null;
  }

  return (
    <main className="flex h-screen min-h-[640px] flex-col text-ink">
      <ConversationHeader
        currentUser={me.data.user}
        onLogout={() => {
          logout.mutate();
        }}
        status={status}
      />
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <ChatSidebar
          activeConversationId={undefined}
          conversations={conversations.data?.conversations ?? []}
          currentUser={me.data.user}
          isLoading={conversations.isLoading}
          onCreateConversation={(participantUsername) => {
            createConversation.mutate({ participantUsername });
          }}
        />
        <section className="flex min-h-0 flex-1 items-center justify-center p-4 md:p-6">
          <EmptyState
            detail="Create or select a conversation to load persistent message history."
            title="Choose a conversation"
          />
        </section>
      </div>
    </main>
  );
};
