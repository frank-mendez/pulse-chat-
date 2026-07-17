import { CheckCheck, Clock3 } from "lucide-react";

export type MessageStatusProps = {
  readonly isOptimistic: boolean;
};

export const MessageStatus = ({ isOptimistic }: MessageStatusProps) => {
  if (isOptimistic) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-brass">
        <Clock3 className="h-3 w-3" />
        Sending
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs text-signal">
      <CheckCheck className="h-3 w-3" />
      Delivered
    </span>
  );
};
