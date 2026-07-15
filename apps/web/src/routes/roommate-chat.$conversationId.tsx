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
  <div className="min-h-screen bg-[#F4F9FF]">
    <div className="container mx-auto max-w-4xl px-4 py-8">
        <ErrorState
          title="Could not open roommate chat"
          description={chat.error.message}
          retry={() => void chat.refetch()}
          action={
            <Link to="/browse">
              <Button
  variant="outline"
  className="rounded-full border-[#BFDBFE] bg-[#EFF6FF] text-[#0F3D73] hover:bg-[#DBEAFE]"
>
  Back to matches
</Button>
            </Link>
          }
        />
      </div>
      </div>
    );
  }

  if (!chat.data) {
    return (
  <div className="min-h-screen bg-[#F4F9FF]">
    <div className="container mx-auto max-w-4xl px-4 py-8">
        <EmptyState
          title="Chat not found"
          description="This roommate chat may have been removed or is not available for your account."
          action={
            <Link to="/browse">
              <Button className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
  Find roommates
</Button>
            </Link>
          }
        />
      </div>
      </div>
    );
  }

  const { conversation, messages } = chat.data;
  const roommate = conversation.roommate;

  return (
     <div className="min-h-screen bg-[#F4F9FF]">
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-col justify-between gap-4 rounded-3xl border border-blue-100 bg-white p-6 shadow-xl shadow-blue-100/60 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <Avatar className="size-16 bg-[#DBEAFE]">
  {roommate.image && (
    <AvatarImage src={roommate.image} alt={roommate.name} />
  )}

  <AvatarFallback className="bg-[#DBEAFE] font-bold text-[#0F3D73]">
    {roommate.name.slice(0, 2).toUpperCase()}
  </AvatarFallback>
</Avatar>
          <div>
            <Badge className="mb-2 rounded-full border border-[#BFDBFE] bg-[#DBEAFE] px-4 py-1 text-[#0F3D73]">Roommate Chat</Badge>
            <h1 className="text-4xl font-black tracking-tight text-[#1E293B]">{roommate.name}</h1>
            {roommate.school && (
              <p className="text-[#64748B]">{roommate.school} student</p>
            )}
          </div>
        </div>
        <Link to="/browse">
          <Button
  variant="outline"
  className="rounded-full border-[#BFDBFE] bg-[#EFF6FF] text-[#0F3D73] hover:bg-[#DBEAFE]"
>Back to matches</Button>
        </Link>
      </div>

      <Card className="border border-blue-100 bg-white shadow-lg shadow-blue-100/50">
        <CardHeader>
          <CardTitle className="text-[#1E293B]">Messages</CardTitle>
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
                        ? "bg-[#2563EB] text-white shadow-blue-200/50"
                        : "bg-[#EFF6FF] text-[#1E293B] shadow-blue-100/50"
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
            className="flex gap-2 border-t border-blue-100 pt-4"
            onSubmit={(event) => {
              event.preventDefault();
              void submitMessage();
            }}
          >
            <Input
  className="border-[#BFDBFE] focus-visible:ring-[#2563EB]"
  value={message}
  onChange={(event) => setMessage(event.target.value)}
  placeholder="Ask about budget, schedule, cleanliness, or preferred dorms..."
/>
            <MutationButton
  className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]" type="submit" isPending={sendMessage.isPending} pendingLabel="Sending...">
              Send
            </MutationButton>
          </form>
        </CardContent>
      </Card>
    </div>
    </div>
  );
}
