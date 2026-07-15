import { cn } from "@DormMatch/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default:
"border-blue-200 bg-blue-100 text-[#1E293B]",

secondary:
"border-slate-200 bg-slate-100 text-[#1E293B]",

success:
"border-green-300 bg-green-100 text-green-700",

warning:
"border-yellow-300 bg-yellow-100 text-yellow-700",

destructive:
"border-red-300 bg-red-100 text-red-700",

cyan:
"border-blue-200 bg-[#E8F2FF] text-[#1E293B]",

pink:
"border-blue-200 bg-[#E8F2FF] text-[#1E293B]",
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
