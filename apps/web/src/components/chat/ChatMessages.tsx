import { type ChatMessage } from "@pulse-chat/contracts";
import { MessageSquareText } from "lucide-react";
import { useEffect, useRef } from "react";

import { MessageBubble } from "./MessageBubble";

export type ChatMessagesProps = {
  readonly messages: readonly ChatMessage[];
  readonly currentUsername: string;
};

export const ChatMessages = ({ messages, currentUsername }: ChatMessagesProps) => {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-8">
        <div className="rounded-card border border-dashed border-line bg-white/80 px-5 py-4 text-center text-sm text-graphite">
          <MessageSquareText className="mx-auto mb-2 h-5 w-5 text-signal" />
          The room is quiet.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-3">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            isOwnMessage={message.username === currentUsername}
            message={message}
          />
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
};
