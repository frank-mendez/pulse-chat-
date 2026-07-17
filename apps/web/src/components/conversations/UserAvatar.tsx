import { type PublicUser } from "@pulse-chat/contracts";

export type UserAvatarProps = {
  readonly user: PublicUser;
};

export const UserAvatar = ({ user }: UserAvatarProps) => {
  const initials = user.displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (user.avatarUrl !== null) {
    return (
      <img
        alt=""
        className="h-10 w-10 rounded-card border border-line object-cover"
        src={user.avatarUrl}
      />
    );
  }

  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card border border-line bg-signal/10 text-sm font-black text-signal">
      {initials}
    </span>
  );
};
