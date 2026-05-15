import { Avatar, AvatarFallback, AvatarImage } from "@DormMatch/ui/components/avatar";
import { Badge } from "@DormMatch/ui/components/badge";
import { Button } from "@DormMatch/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@DormMatch/ui/components/card";
import { Input } from "@DormMatch/ui/components/input";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState, ErrorState, MutationButton, PageLoader } from "@/components/feedback";
import { requireSession } from "@/lib/session";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/roommate-chat/$conversationId")({
  component: RoommateChatPage,
  beforeLoad: async () => {
    await requireSession();
  },
});

function RoommateChatPage() {
  const { conversationId } = Route.useParams();
  const chat = useQuery(trpc.chat.getRoommateChat.queryOptions({ id: conversationId }));
  const sendMessage = useMutation(trpc.chat.sendRoommateMessage.mutationOptions());
  const [message, setMessage] = useState("");

  const submitMessage = async () => {
    const body = message.trim();
    if (!body) {
      toast.error("Write a message before sending");
      return;
    }

    try {
      await sendMessage.mutateAsync({ conversationId, body });
      setMessage("");
      await chat.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send message");
    }
  };

  if (chat.isLoading) return <PageLoader label="Opening roommate chat..." />;

  if (chat.isError) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <ErrorState
          title="Could not open roommate chat"
          description={chat.error.message}
          retry={() => void chat.refetch()}
          action={
            <Link to="/browse">
              <Button variant="outline">Back to matches</Button>
            </Link>
          }
        />
      </div>
    );
  }

  if (!chat.data) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <EmptyState
          title="Chat not found"
          description="This roommate chat may have been removed or is not available for your account."
          action={
            <Link to="/browse">
              <Button>Find roommates</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const { conversation, messages } = chat.data;
  const roommate = conversation.roommate;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur-md md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            {roommate.image && <AvatarImage src={roommate.image} alt={roommate.name} />}
            <AvatarFallback>{roommate.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <Badge className="mb-2">Roommate Chat</Badge>
            <h1 className="text-4xl font-black tracking-tight">{roommate.name}</h1>
            {roommate.school && (
              <p className="text-muted-foreground">{roommate.school} student</p>
            )}
          </div>
        </div>
        <Link to="/browse">
          <Button variant="outline">Back to matches</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {messages.length === 0 && (
            <EmptyState
              title="No messages yet"
              description="Send the first message to compare schedules, budget, and dorm preferences."
            />
          )}
          <div className="space-y-3">
            {messages.map((item) => {
              const isMine = item.isMine;
              return (
                <div key={item.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-3xl px-4 py-3 text-sm shadow-lg ${
                      isMine
                        ? "bg-white text-zinc-950 shadow-black/20"
                        : "bg-white/10 text-foreground shadow-black/10"
                    }`}
                  >
                    <p className="font-bold">{isMine ? "You" : item.senderName}</p>
                    <p className="mt-1">{item.body}</p>
                    <p className="mt-2 text-xs opacity-70">{new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <form
            className="flex gap-2 border-t border-white/10 pt-4"
            onSubmit={(event) => {
              event.preventDefault();
              void submitMessage();
            }}
          >
            <Input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Ask about budget, schedule, cleanliness, or preferred dorms..."
            />
            <MutationButton type="submit" isPending={sendMessage.isPending} pendingLabel="Sending...">
              Send
            </MutationButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
