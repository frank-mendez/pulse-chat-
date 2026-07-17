import { type Conversation, type PublicUser } from "@pulse-chat/contracts";
import { type FormEvent, useState } from "react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ConversationList } from "./ConversationList";
import { ConversationSkeleton } from "./SkeletonLoaders";

export type ChatSidebarProps = {
  readonly conversations: readonly Conversation[];
  readonly currentUser: PublicUser;
  readonly activeConversationId: string | undefined;
  readonly isLoading: boolean;
  readonly onCreateConversation: (participantUsername: string) => void;
};

export const ChatSidebar = ({
  conversations,
  currentUser,
  activeConversationId,
  isLoading,
  onCreateConversation,
}: ChatSidebarProps) => {
  const [participantUsername, setParticipantUsername] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (participantUsername.trim().length === 0) {
      return;
    }

    onCreateConversation(participantUsername);
    setParticipantUsername("");
  };

  return (
    <aside className="flex min-h-0 border-b border-line bg-paper/90 md:w-96 md:flex-col md:border-b-0 md:border-r">
      <div className="w-full space-y-4 p-4 md:p-5">
        <form className="grid gap-2" onSubmit={handleSubmit}>
          <Input
            aria-label="Username"
            onChange={(event) => {
              setParticipantUsername(event.target.value);
            }}
            placeholder="Start with username"
            value={participantUsername}
          />
          <Button disabled={participantUsername.trim().length < 2} type="submit">
            New conversation
          </Button>
        </form>
        {isLoading ? (
          <ConversationSkeleton />
        ) : (
          <ConversationList
            activeConversationId={activeConversationId}
            conversations={conversations}
            currentUser={currentUser}
          />
        )}
      </div>
    </aside>
  );
};
