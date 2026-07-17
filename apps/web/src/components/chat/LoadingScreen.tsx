import { LoaderCircle } from "lucide-react";

export const LoadingScreen = () => (
  <div className="flex min-h-screen items-center justify-center px-4">
    <div className="flex items-center gap-3 rounded-card border border-line bg-white px-4 py-3 text-sm font-semibold text-ink shadow-panel">
      <LoaderCircle className="h-4 w-4 animate-spin text-signal" />
      Opening channel
    </div>
  </div>
);
