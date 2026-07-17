import { type Conversation, type PublicUser } from "@pulse-chat/contracts";

import { ConversationItem } from "./ConversationItem";
import { EmptyState } from "./EmptyState";

export type ConversationListProps = {
  readonly conversations: readonly Conversation[];
  readonly currentUser: PublicUser;
  readonly activeConversationId: string | undefined;
};

export const ConversationList = ({
  conversations,
  currentUser,
  activeConversationId,
}: ConversationListProps) => {
  if (conversations.length === 0) {
    return (
      <EmptyState detail="Start a one-to-one conversation by username." title="No conversations" />
    );
  }

  return (
    <div className="grid gap-2">
      {conversations.map((conversation) => (
        <ConversationItem
          conversation={conversation}
          currentUser={currentUser}
          isActive={conversation.id === activeConversationId}
          key={conversation.id}
        />
      ))}
    </div>
  );
};
