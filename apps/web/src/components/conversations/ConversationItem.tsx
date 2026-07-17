import { type Conversation, type PublicUser } from "@pulse-chat/contracts";
import { Link } from "react-router-dom";

import { cn } from "../../lib/utils";
import { UserAvatar } from "./UserAvatar";
import { UnreadBadge } from "./UnreadBadge";

export type ConversationItemProps = {
  readonly conversation: Conversation;
  readonly currentUser: PublicUser;
  readonly isActive: boolean;
};

const formatPreviewTime = (isoDate: string): string =>
  new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoDate));

export const ConversationItem = ({
  conversation,
  currentUser,
  isActive,
}: ConversationItemProps) => {
  const otherMember =
    conversation.members.find((member) => member.id !== currentUser.id) ?? conversation.members[0];

  if (otherMember === undefined) {
    return null;
  }

  return (
    <Link
      className={cn(
        "grid grid-cols-[auto_1fr_auto] gap-3 rounded-card border p-3 text-left transition",
        isActive
          ? "border-signal bg-signal/10"
          : "border-line bg-white hover:border-signal hover:bg-paper-strong",
      )}
      to={`/chat/${conversation.id}`}
    >
      <UserAvatar user={otherMember} />
      <span className="min-w-0">
        <span className="block truncate text-sm font-black text-ink">
          {otherMember.displayName}
        </span>
        <span className="mt-1 block truncate text-xs text-graphite">
          {conversation.lastMessage?.body ?? "No messages yet"}
        </span>
      </span>
      <span className="flex flex-col items-end gap-2">
        <span className="text-xs text-graphite">
          {conversation.lastMessage === null
            ? ""
            : formatPreviewTime(conversation.lastMessage.createdAt)}
        </span>
        <UnreadBadge count={conversation.unreadCount} />
      </span>
    </Link>
  );
};
