import { CircleAlert, CircleCheck, LoaderCircle, PlugZap, WifiOff } from "lucide-react";

import { cn } from "../../lib/utils";
import { type ConnectionStatus } from "../../state/chat-store";

const statusContent: Record<
  ConnectionStatus,
  {
    readonly label: string;
    readonly className: string;
    readonly icon: typeof CircleCheck;
  }
> = {
  idle: {
    label: "Idle",
    className: "border-line bg-white text-graphite",
    icon: PlugZap,
  },
  connecting: {
    label: "Connecting",
    className: "border-brass bg-brass/10 text-ink",
    icon: LoaderCircle,
  },
  connected: {
    label: "Live",
    className: "border-signal bg-signal/10 text-signal",
    icon: CircleCheck,
  },
  reconnecting: {
    label: "Reconnecting",
    className: "border-brass bg-brass/10 text-ink",
    icon: LoaderCircle,
  },
  disconnected: {
    label: "Offline",
    className: "border-line bg-white text-graphite",
    icon: WifiOff,
  },
  error: {
    label: "Attention",
    className: "border-coral bg-coral/10 text-coral",
    icon: CircleAlert,
  },
};

export type ConnectionBadgeProps = {
  readonly status: ConnectionStatus;
};

export const ConnectionBadge = ({ status }: ConnectionBadgeProps) => {
  const content = statusContent[status];
  const Icon = content.icon;

  return (
    <span
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded-card border px-3 text-xs font-bold uppercase",
        content.className,
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", status === "connecting" && "animate-spin")} />
      {content.label}
    </span>
  );
};
