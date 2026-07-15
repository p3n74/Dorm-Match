import { cn } from "@DormMatch/ui/lib/utils";
import * as React from "react";

function Tabs({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="tabs" className={cn("w-full", className)} {...props} />;
}

function TabsList({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="tabs-list"
     className={cn(
    "inline-flex rounded-full border border-blue-300 bg-[#DCEBFA] p-1 shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  active,
  ...props
}: React.ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      type="button"
      data-slot="tabs-trigger"
      data-state={active ? "active" : "inactive"}
      className={cn(
        "relative rounded-full px-5 py-2 text-sm font-black text-[#1E293B] transition-colors duration-200 hover:bg-[#0F3D73] hover:text-white data-[state=active]:bg-[#0F3D73] data-[state=active]:text-white",
        "after:absolute after:inset-x-5 after:-bottom-1.5 after:h-0.5 after:origin-center after:scale-x-0 after:rounded-full after:bg-[#0F3D73] after:transition-transform after:duration-300 data-[state=active]:after:scale-x-100",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  active,
  ...props
}: React.ComponentProps<"div"> & { active?: boolean }) {
  if (!active) {
    return null;
  }

  return (
    <div
      data-slot="tabs-content"
      className={cn("animate-in fade-in-50 slide-in-from-bottom-2 duration-300", className)}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
