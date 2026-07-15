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
      <DropdownMenuTrigger render={<Button
  variant="outline"
  className="h-12 gap-3 rounded-full border-[#BFDBFE] bg-white pl-1.5 pr-5 text-[#1E293B] shadow-md hover:bg-[#EFF6FF] hover:text-[#1E293B]"
/>}>
        <Avatar className="size-9 bg-[#DBEAFE]">
          {session.user.image && <AvatarImage src={session.user.image} alt={session.user.name} />}
          <AvatarFallback className="bg-[#DBEAFE] font-bold text-[#0F3D73]">
  {initials(session.user.name)}
</AvatarFallback>
        </Avatar>
        <span className="hidden sm:inline">{session.user.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 rounded-3xl border border-blue-100 bg-white p-2 shadow-xl shadow-blue-100/60">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="flex items-center gap-3">
              <Avatar className="bg-[#DBEAFE]">
                {session.user.image && <AvatarImage src={session.user.image} alt={session.user.name} />}
                <AvatarFallback className="bg-[#DBEAFE] font-bold text-[#0F3D73]">
  {initials(session.user.name)}
</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-[#1E293B]">{session.user.name}</p>
                <p className="text-xs text-[#64748B]">{session.user.email}</p>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
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
