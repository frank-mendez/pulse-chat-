import { LogOut, Radio, Users } from "lucide-react";

import { type ConnectionStatus } from "../../state/chat-store";
import { Button } from "../ui/button";
import { ConnectionBadge } from "./ConnectionBadge";

export type ChatHeaderProps = {
  readonly status: ConnectionStatus;
  readonly username: string;
  readonly userCount: number;
  readonly onLeave: () => void;
};

export const ChatHeader = ({ status, username, userCount, onLeave }: ChatHeaderProps) => (
  <header className="flex flex-col gap-4 border-b border-line bg-paper-strong/95 px-4 py-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between md:px-6">
    <div className="min-w-0">
      <div className="flex items-center gap-2 text-xs font-bold uppercase text-signal">
        <Radio className="h-4 w-4" />
        PulseChat
      </div>
      <div className="mt-1 flex flex-wrap items-end gap-x-3 gap-y-1">
        <h1 className="font-display text-2xl font-bold text-ink">Global Room</h1>
        <span className="text-sm text-graphite">as {username}</span>
      </div>
    </div>

    <div className="flex flex-wrap items-center gap-2">
      <ConnectionBadge status={status} />
      <span className="inline-flex h-8 items-center gap-2 rounded-card border border-line bg-white px-3 text-xs font-bold uppercase text-graphite">
        <Users className="h-3.5 w-3.5" />
        {userCount}
      </span>
      <Button onClick={onLeave} type="button" variant="secondary">
        <LogOut className="h-4 w-4" />
        Leave
      </Button>
    </div>
  </header>
);
