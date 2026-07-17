import { type ChatMessage } from "@pulse-chat/contracts";

import { cn } from "../../lib/utils";

export type MessageBubbleProps = {
  readonly message: ChatMessage;
  readonly isOwnMessage: boolean;
};

const formatTime = (sentAt: string): string =>
  new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(sentAt));

export const MessageBubble = ({ message, isOwnMessage }: MessageBubbleProps) => (
  <article className={cn("flex", isOwnMessage ? "justify-end" : "justify-start")}>
    <div
      className={cn(
        "max-w-[min(36rem,82vw)] rounded-card border px-4 py-3 shadow-sm",
        isOwnMessage ? "border-signal bg-signal text-white" : "border-line bg-white text-ink",
      )}
    >
      <div
        className={cn(
          "mb-1 flex items-center gap-2 text-xs font-bold uppercase",
          isOwnMessage ? "text-white/75" : "text-graphite",
        )}
      >
        <span>{message.username}</span>
        <span>{formatTime(message.sentAt)}</span>
      </div>
      <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.body}</p>
    </div>
  </article>
);
