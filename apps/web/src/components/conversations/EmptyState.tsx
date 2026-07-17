import { MessageSquareText } from "lucide-react";

export type EmptyStateProps = {
  readonly title: string;
  readonly detail: string;
};

export const EmptyState = ({ title, detail }: EmptyStateProps) => (
  <div className="flex min-h-56 items-center justify-center rounded-card border border-dashed border-line bg-white/80 p-6 text-center">
    <div>
      <MessageSquareText className="mx-auto mb-3 h-6 w-6 text-signal" />
      <h2 className="font-display text-2xl font-bold text-ink">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-graphite">{detail}</p>
    </div>
  </div>
);
