import { cn } from "@DormMatch/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default: "border-white/15 bg-white/10 text-zinc-100",
        secondary: "border-white/10 bg-white/5 text-zinc-300",
        success: "border-emerald-500/25 bg-emerald-950/60 text-emerald-200",
        warning: "border-amber-500/25 bg-amber-950/60 text-amber-200",
        destructive: "border-red-500/25 bg-red-950/60 text-red-200",
        cyan: "border-white/10 bg-white/5 text-zinc-300",
        pink: "border-white/10 bg-white/5 text-zinc-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
