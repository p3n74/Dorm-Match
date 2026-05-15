import { cn } from "@DormMatch/ui/lib/utils";
import { UserRound } from "lucide-react";
import * as React from "react";

function Avatar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar"
      className={cn(
        "relative flex size-11 shrink-0 overflow-hidden rounded-full border border-white/15 bg-zinc-800 text-zinc-100 shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

function AvatarImage({ className, alt = "", ...props }: React.ComponentProps<"img">) {
  return <img data-slot="avatar-image" alt={alt} className={cn("aspect-square size-full", className)} {...props} />;
}

function AvatarFallback({ className, ...props }: React.ComponentProps<"span">) {
  const hasChildren = props.children !== undefined && props.children !== null;

  return (
    <span
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-zinc-800 text-sm font-black text-zinc-100",
        className,
      )}
      {...props}
    >
      {hasChildren ? props.children : <UserRound className="size-5 text-zinc-300" />}
    </span>
  );
}

export { Avatar, AvatarFallback, AvatarImage };
