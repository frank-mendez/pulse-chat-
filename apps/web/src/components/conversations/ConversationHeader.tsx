import { type Conversation, type PublicUser } from "@pulse-chat/contracts";
import { LogOut, Radio } from "lucide-react";

import { type ConnectionStatus } from "../../state/chat-store";
import { Button } from "../ui/button";
import { ConnectionBadge } from "../chat/ConnectionBadge";
import { UserAvatar } from "./UserAvatar";

export type ConversationHeaderProps = {
  readonly conversation?: Conversation | undefined;
  readonly currentUser: PublicUser;
  readonly status: ConnectionStatus;
  readonly onLogout: () => void;
};

export const ConversationHeader = ({
  conversation,
  currentUser,
  status,
  onLogout,
}: ConversationHeaderProps) => {
  const otherMember = conversation?.members.find((member) => member.id !== currentUser.id);

  return (
    <header className="flex flex-col gap-3 border-b border-line bg-paper-strong/95 px-4 py-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {otherMember === undefined ? (
          <span className="flex h-10 w-10 items-center justify-center rounded-card bg-signal/10 text-signal">
            <Radio className="h-5 w-5" />
          </span>
        ) : (
          <UserAvatar user={otherMember} />
        )}
        <div className="min-w-0">
          <p className="text-xs font-black uppercase text-signal">PulseChat</p>
          <h1 className="truncate font-display text-2xl font-bold text-ink">
            {otherMember?.displayName ?? "Conversations"}
          </h1>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ConnectionBadge status={status} />
        <span className="rounded-card border border-line bg-white px-3 py-2 text-xs font-bold text-graphite">
          {currentUser.username}
        </span>
        <Button onClick={onLogout} type="button" variant="secondary">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  );
};
