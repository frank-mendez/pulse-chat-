export type UnreadBadgeProps = {
  readonly count: number;
};

export const UnreadBadge = ({ count }: UnreadBadgeProps) => {
  if (count === 0) {
    return null;
  }

  return (
    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-card bg-coral px-2 text-xs font-black text-white">
      {count}
    </span>
  );
};
