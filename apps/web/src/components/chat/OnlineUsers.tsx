import { type User } from "@pulse-chat/contracts";
import { UserRound } from "lucide-react";

export type OnlineUsersProps = {
  readonly users: readonly User[];
};

export const OnlineUsers = ({ users }: OnlineUsersProps) => (
  <aside className="border-t border-line bg-paper/80 p-4 md:w-72 md:border-l md:border-t-0 md:p-5">
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-sm font-bold uppercase text-graphite">Online</h2>
      <span className="rounded-card border border-line bg-white px-2 py-1 text-xs font-bold text-graphite">
        {users.length}
      </span>
    </div>
    <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-1">
      {users.map((user) => (
        <div
          className="flex min-w-0 items-center gap-3 rounded-card border border-line bg-white px-3 py-2 text-sm shadow-sm"
          key={user.id}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-card bg-signal/10 text-signal">
            <UserRound className="h-4 w-4" />
          </span>
          <span className="min-w-0 truncate font-semibold text-ink">{user.username}</span>
        </div>
      ))}
    </div>
  </aside>
);
