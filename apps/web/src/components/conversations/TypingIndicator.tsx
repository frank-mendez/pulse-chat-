import { type PublicUser } from "@pulse-chat/contracts";

export type TypingIndicatorProps = {
  readonly users: readonly PublicUser[];
};

export const TypingIndicator = ({ users }: TypingIndicatorProps) => {
  if (users.length === 0) {
    return null;
  }

  const label =
    users.length === 1 ? `${users[0]?.displayName} is typing` : "Several people are typing";

  return (
    <div className="flex h-8 items-center gap-2 px-4 text-xs font-semibold text-graphite md:px-6">
      <span>{label}</span>
      <span className="flex gap-1">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal [animation-delay:120ms]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal [animation-delay:240ms]" />
      </span>
    </div>
  );
};
