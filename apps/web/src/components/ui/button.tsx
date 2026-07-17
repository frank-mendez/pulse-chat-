import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex h-10 items-center justify-center gap-2 rounded-card border px-4 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "border-signal bg-signal text-white shadow-panel hover:border-ink hover:bg-ink",
        secondary: "border-line bg-paper-strong text-ink hover:border-signal hover:text-signal",
        ghost: "border-transparent bg-transparent text-graphite hover:bg-white/70 hover:text-ink",
        danger: "border-coral bg-coral text-white hover:border-ink hover:bg-ink",
      },
      size: {
        icon: "h-10 w-10 px-0",
        default: "h-10 px-4",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "primary",
    },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    readonly asChild?: boolean;
    readonly children: ReactNode;
  };

export const Button = ({
  asChild = false,
  className,
  size,
  variant,
  children,
  ...props
}: ButtonProps) => {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp className={cn(buttonVariants({ className, size, variant }))} {...props}>
      {children}
    </Comp>
  );
};
