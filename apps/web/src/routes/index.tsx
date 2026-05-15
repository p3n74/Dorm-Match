import { Avatar, AvatarFallback } from "@DormMatch/ui/components/avatar";
import { Badge } from "@DormMatch/ui/components/badge";
import { Button } from "@DormMatch/ui/components/button";
import { Card, CardContent } from "@DormMatch/ui/components/card";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const healthCheck = useQuery(trpc.healthCheck.queryOptions());

  return (
    <div>
      <section
        className="relative min-h-[calc(100svh-73px)] overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2400&q=85')",
        }}
      >
        <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-[2px]" />

        <div className="container relative mx-auto flex min-h-[calc(100svh-73px)] max-w-7xl items-center px-4 py-16">
          <div className="grid w-full items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <Badge className="mb-5 border-white/15 bg-white/10 text-white">Verified student housing</Badge>
              <h1 className="max-w-4xl text-5xl font-black tracking-tight text-white md:text-7xl">
                Find a dorm that feels like a real place to live.
              </h1>
              <p className="mt-6 max-w-2xl text-xl text-zinc-300">
                Browse verified student rentals, compare room options, and request reservations with the confidence of
                a modern housing platform.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/browse">
                  <Button size="lg" className="bg-white text-zinc-950 hover:bg-zinc-200">
                    Start matching
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline">
                    Create account
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-3">
                {["MR", "JT", "AS", "DM"].map((name) => (
                  <Avatar key={name} className="-ml-2 border-white/20 bg-white/10 first:ml-0">
                    <AvatarFallback>{name}</AvatarFallback>
                  </Avatar>
                ))}
                <p className="text-sm font-bold text-zinc-400">Students and property owners, connected clearly.</p>
              </div>
            </div>

            <Card className="border-white/10 bg-white/5 shadow-2xl shadow-black/40 backdrop-blur-md">
              <CardContent className="space-y-5 pt-6">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="border-white/10 bg-white/10 text-white">
                    Curated listings
                  </Badge>
                  <Badge variant={healthCheck.data ? "success" : "destructive"}>
                    {healthCheck.isLoading ? "Checking API" : healthCheck.data ? "Live API" : "API offline"}
                  </Badge>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/20">
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-400">Today&apos;s focus</p>
                  <h2 className="mt-2 text-3xl font-black text-white">Browse trusted dorms and compare the essentials.</h2>
                  <p className="mt-3 text-sm text-zinc-400">
                    Price, availability, amenities, house rules, and reservation status in one clean workflow.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {["Verified dorms", "Clear pricing", "Booking status"].map((item) => (
                    <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-black text-white">
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
