import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "../../lib/utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-11 w-full rounded-card border border-line bg-white px-3 text-base text-ink shadow-sm transition placeholder:text-graphite/50 hover:border-signal focus:border-signal",
      className,
    )}
    {...props}
  />
));

Input.displayName = "Input";
