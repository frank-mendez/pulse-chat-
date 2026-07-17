export const ConversationSkeleton = () => (
  <div className="grid gap-2">
    {Array.from({ length: 4 }, (_, index) => (
      <div className="h-20 animate-pulse rounded-card border border-line bg-white/70" key={index} />
    ))}
  </div>
);

export const MessageSkeleton = () => (
  <div className="flex flex-col gap-3 p-4 md:p-6">
    {Array.from({ length: 5 }, (_, index) => (
      <div className="h-16 animate-pulse rounded-card border border-line bg-white/70" key={index} />
    ))}
  </div>
);
