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
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <Badge variant="secondary">Nothing here yet</Badge>
        <div>
          <h2 className="text-2xl font-black tracking-tight">{title}</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
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
    <Card className="border-destructive/30 bg-destructive/10">
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <Badge variant="destructive">Error</Badge>
        <div>
          <h2 className="text-2xl font-black tracking-tight">{title}</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {retry && (
            <Button variant="outline" onClick={retry}>
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
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <Card>
        <CardContent className="space-y-4 py-8">
          <Skeleton className="h-8 w-48 rounded-full" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <p className="text-sm font-bold text-muted-foreground">{label}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function InlineLoader({ label = "Loading..." }: { label?: string }) {
  return <p className="text-sm font-bold text-muted-foreground">{label}</p>;
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
          <Card className="w-full max-w-md">
            <CardContent className="space-y-5 py-6">
              <div>
                <Badge variant={destructive ? "destructive" : "default"} className="mb-3">
                  Confirmation
                </Badge>
                <h2 className="text-2xl font-black tracking-tight">{title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" disabled={isPending} onClick={() => setOpen(false)}>
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
