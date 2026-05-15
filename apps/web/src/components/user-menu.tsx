import { Avatar, AvatarFallback, AvatarImage } from "@DormMatch/ui/components/avatar";
import { Button } from "@DormMatch/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@DormMatch/ui/components/dropdown-menu";
import { Skeleton } from "@DormMatch/ui/components/skeleton";
import { Link, useNavigate } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";

function initials(name?: string | null) {
  return (
    name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "DM"
  );
}

export default function UserMenu() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <Skeleton className="h-9 w-24" />;
  }

  if (!session) {
    return (
      <Link to="/login">
        <Button>Join community</Button>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" className="h-12 gap-3 pl-1.5 pr-5" />}>
        <Avatar className="size-9">
          {session.user.image && <AvatarImage src={session.user.image} alt={session.user.name} />}
          <AvatarFallback>{initials(session.user.name)}</AvatarFallback>
        </Avatar>
        <span className="hidden sm:inline">{session.user.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 rounded-2xl border border-white/10 bg-zinc-950 p-2 shadow-2xl shadow-black/40">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="flex items-center gap-3">
              <Avatar>
                {session.user.image && <AvatarImage src={session.user.image} alt={session.user.name} />}
                <AvatarFallback>{initials(session.user.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-black text-foreground">{session.user.name}</p>
                <p className="text-xs normal-case tracking-normal text-muted-foreground">{session.user.email}</p>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Community profile</DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    navigate({
                      to: "/",
                    });
                  },
                },
              });
            }}
          >
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
