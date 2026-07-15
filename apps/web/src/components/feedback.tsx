import { Badge } from "@DormMatch/ui/components/badge";
import { Button } from "@DormMatch/ui/components/button";
import { Card, CardContent } from "@DormMatch/ui/components/card";
import { Skeleton } from "@DormMatch/ui/components/skeleton";
import { type ReactNode, useState } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
return (
  <Card className="border border-blue-100 bg-white shadow-lg shadow-blue-100/50">
    <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
      <Badge className="rounded-full border border-[#BFDBFE] bg-[#DBEAFE] text-[#0F3D73]">
        Nothing here yet
      </Badge>

      <div>
        <h2 className="text-2xl font-black tracking-tight text-[#1E293B]">
          {title}
        </h2>

        <p className="mt-2 max-w-md text-sm text-[#64748B]">
          {description}
        </p>
      </div>

      {action}
    </CardContent>
  </Card>
);
}

type ErrorStateProps = {
  title?: string;
  description?: string;
  retry?: () => void;
  action?: ReactNode;
};

export function ErrorState({
  title = "Something went wrong",
  description = "We could not load this data. Try again in a moment.",
  retry,
  action,
}: ErrorStateProps) {
  return (
    <Card className="border border-red-200 bg-white shadow-lg shadow-red-100/50">
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <Badge
  variant="destructive"
  className="rounded-full px-4 py-1">Error</Badge>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-[#1E293B]">{title}</h2>
          <p className="mt-2 max-w-md text-sm text-[#64748B]">{description}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {retry && (
            <Button
  variant="outline"
  className="rounded-full border-[#BFDBFE] bg-[#EFF6FF] text-[#0F3D73] hover:bg-[#DBEAFE]"
 onClick={retry}>
              Try again
            </Button>
          )}
          {action}
        </div>
      </CardContent>
    </Card>
  );
}

export function PageLoader({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="min-h-screen bg-[#F4F9FF]">
  <div className="container mx-auto max-w-5xl px-4 py-8">
      <Card className="border border-blue-100 bg-white shadow-lg shadow-blue-100/50">
        <CardContent className="space-y-4 py-8">
          <Skeleton className="h-8 w-48 rounded-full" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <p className="text-sm font-bold text-[#64748B]">{label}</p>
        </CardContent>
      </Card>
    </div>
    </div>
  );
}

export function InlineLoader({ label = "Loading..." }: { label?: string }) {
  return (
  <p className="text-sm font-semibold text-[#64748B]">
    {label}
  </p>
);
}

type MutationButtonProps = React.ComponentProps<typeof Button> & {
  isPending?: boolean;
  pendingLabel?: string;
};

export function MutationButton({
  children,
  disabled,
  isPending,
  pendingLabel = "Working...",
  ...props
}: MutationButtonProps) {
  return (
    <Button disabled={disabled || isPending} {...props}>
      {isPending ? pendingLabel : children}
    </Button>
  );
}

type ConfirmActionProps = {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  isPending?: boolean;
  onConfirm: () => void | Promise<void>;
};

export function ConfirmAction({
  trigger,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive,
  isPending,
  onConfirm,
}: ConfirmActionProps) {
  const [open, setOpen] = useState(false);

  const confirm = async () => {
    await onConfirm();
    setOpen(false);
  };

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <Card className="w-full max-w-md rounded-3xl border border-blue-100 bg-white shadow-2xl shadow-blue-100/60">
            <CardContent className="space-y-5 py-6">
              <div>
                <Badge
  variant={destructive ? "destructive" : "default"}
  className={
    destructive
      ? "mb-3 rounded-full px-4 py-1"
      : "mb-3 rounded-full border border-[#BFDBFE] bg-[#DBEAFE] px-4 py-1 text-[#0F3D73]"
  }
>
  Confirmation
</Badge>
                <h2 className="text-2xl font-black tracking-tight text-[#1E293B]">{title}</h2>
                <p className="mt-2 text-sm text-[#64748B]">{description}</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
  variant="outline"
  className="rounded-full border-[#BFDBFE] bg-[#EFF6FF] text-[#0F3D73] hover:bg-[#DBEAFE]"
disabled={isPending} onClick={() => setOpen(false)}>
                  {cancelLabel}
                </Button>
                <MutationButton
                  variant={destructive ? "destructive" : "default"}
                  isPending={isPending}
                  pendingLabel="Confirming..."
                  onClick={confirm}
                >
                  {confirmLabel}
                </MutationButton>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
