import { Link } from "@tanstack/react-router";
import { Building2 } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { portalPathForRole, type AppRole } from "@/lib/session";

import UserMenu from "./user-menu";

export default function Header() {
  const session = authClient.useSession();
  const role = (session.data?.user as { role?: AppRole } | undefined)?.role;
  const portalLink = role
    ? {
        to: portalPathForRole(role) as "/" | "/tenant" | "/landlord" | "/admin",
        label: role === "tenant" ? "Tenant Portal" : role === "dorm_owner" ? "Owner Portal" : "Admin",
      }
    : undefined;

  const links = [
    { to: "/", label: "Home" },
    { to: "/browse", label: "Browse" },
    ...(session.data && portalLink ? [portalLink] : []),
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-blue-900/40 bg-[#0B1F3A]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-row items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white">
            <Building2 className="size-5" />
          </span>
          <span>
            <span className="block text-lg font-black tracking-tight">DormMatch</span>
            <span className="block text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Student housing</span>
          </span>
        </Link>
        <nav className="hidden flex-wrap items-center gap-2 text-sm md:flex">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="rounded-full px-4 py-2 font-bold text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
              activeProps={{ className: "bg-white text-zinc-950" }}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
