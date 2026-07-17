import { X } from "lucide-react";

import { Button } from "../ui/button";

export type ErrorBannerProps = {
  readonly message: string | undefined;
  readonly onDismiss: () => void;
};

export const ErrorBanner = ({ message, onDismiss }: ErrorBannerProps) => {
  if (message === undefined) {
    return null;
  }

  return (
    <div className="flex items-start justify-between gap-3 rounded-card border border-coral bg-white px-4 py-3 text-sm text-ink shadow-panel">
      <p>{message}</p>
      <Button
        aria-label="Dismiss error"
        className="h-7 w-7"
        onClick={onDismiss}
        size="icon"
        title="Dismiss error"
        type="button"
        variant="ghost"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};
