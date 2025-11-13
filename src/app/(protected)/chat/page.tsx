import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, MessageSquare } from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { User } from "@/../types/prisma";
import prisma from "@/lib/prisma";
import { chatHrefConstructor } from "@/lib/utils";
import { getAvatarUrl } from "@/lib/image-utils";
import { conversation } from "@/../types/types";

type MessageRequestPreview = {
  id: string;
  name: string;
  avatar: string;
  chatId: string | undefined;
  lastMessage: string;
  timestamp: string;
};

export default async function ChatPage() {
  const user = (await getCurrentUser()) as unknown as User;

  // Handle case where user is not found
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            User not found
          </h1>
          <p className="text-gray-600 mb-4">
            Please log in with a valid account.
          </p>
          <a
            href="/auth/login"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  // Fetch user's connections for conversations
  const connections = await prisma.connection.findMany({
    where: {
      OR: [
        { senderId: user.id, status: "ACCEPTED" },
        { receiverId: user.id, status: "ACCEPTED" },
      ],
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          image: true,
          headline: true,
        },
      },
      receiver: {
        select: {
          id: true,
          name: true,
          image: true,
          headline: true,
        },
      },
    },
  });

  // Transform connections to conversations with real last message + unread count
  const conversations: conversation[] = await Promise.all(
    connections.map(async (connection) => {
      const otherUser =
        connection.senderId === user.id
          ? connection.receiver
          : connection.sender;
      const [lastMsg, unreadCount] = await Promise.all([
        prisma.message.findFirst({
          where: {
            OR: [
              { senderId: user.id, recipientId: otherUser.id },
              { senderId: otherUser.id, recipientId: user.id },
            ],
          },
          orderBy: { createdAt: "desc" },
          select: { text: true, createdAt: true, senderId: true },
        }),
        prisma.message.count({
          where: {
            recipientId: user.id,
            senderId: otherUser.id,
            NOT: { readBy: { some: { id: user.id } } },
          },
        }),
      ]);

      const lastMessageText = lastMsg
        ? `${lastMsg.senderId === user.id ? "You: " : ""}${lastMsg.text}`
        : "No messages yet";
      const timestamp = lastMsg
        ? new Date(lastMsg.createdAt).toLocaleString()
        : "";

      return {
        id: otherUser.id,
        name: otherUser.name,
        lastMessage: lastMessageText,
        timestamp,
        unreadCount,
        isOnline: false,
        avatar: getAvatarUrl(otherUser.image, otherUser.name),
        company: otherUser.headline || "Professional",
        chatId: chatHrefConstructor(user.id, otherUser.id),
      };
    }),
  );

  // Sort by most recent message
  conversations.sort((a, b) => {
    const ta = a.timestamp ? Date.parse(a.timestamp) : 0;
    const tb = b.timestamp ? Date.parse(b.timestamp) : 0;
    return tb - ta;
  });

  // If employer/recruiter/admin, load message requests (pending DMs from non-connections)
  const isEmployerUser =
    user.role === "EMPLOYER" ||
    user.role === "RECRUITER" ||
    user.role === "ADMIN";
  let requests: MessageRequestPreview[] = [];
  if (isEmployerUser) {
    const pending = await prisma.messageRequest.findMany({
      where: { recipientId: user.id, status: "PENDING" },
      include: {
        sender: {
          select: { id: true, name: true, image: true, headline: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    requests = await Promise.all(
      pending.map(async (req) => {
        const lastMsg = await prisma.message.findFirst({
          where: {
            OR: [
              { senderId: user.id, recipientId: req.sender.id },
              { senderId: req.sender.id, recipientId: user.id },
            ],
          },
          orderBy: { createdAt: "desc" },
          select: { text: true, createdAt: true, senderId: true },
        });
        const lastMessageText = lastMsg
          ? `${lastMsg.senderId === user.id ? "You: " : ""}${lastMsg.text}`
          : "Request to message you";
        const timestamp = lastMsg
          ? new Date(lastMsg.createdAt).toLocaleString()
          : new Date(req.createdAt).toLocaleString();
        return {
          id: req.sender.id,
          name: req.sender.name,
          avatar: getAvatarUrl(req.sender.image, req.sender.name),
          chatId: chatHrefConstructor(user.id, req.sender.id),
          lastMessage: lastMessageText,
          timestamp,
        };
      }),
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Chat Header */}
          <Card className="bg-white shadow-sm mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-semibold text-gray-900">
                    Messages
                  </CardTitle>
                  <p className="text-gray-600 mt-1">
                    Connect with your network
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Search Bar */}
          <Card className="bg-white shadow-sm mb-6">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-10 border-gray-200"
                />
              </div>
            </CardContent>
          </Card>

          {/* Conversations List */}
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Recent Conversations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {conversations.length > 0 ? (
                <div className="space-y-1">
                  {conversations.map((conversation) => (
                    <Link
                      key={conversation.id}
                      href={`/chat/${conversation.chatId}`}
                    >
                      <div className="flex items-center space-x-3 p-4 hover:bg-gray-50 cursor-pointer border-l-4 border-transparent hover:border-blue-500 transition-colors">
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={conversation.avatar} />
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                              {conversation.name
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {conversation.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900 truncate">
                              {conversation.name}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {conversation.timestamp}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {conversation.lastMessage}
                          </p>
                          <p className="text-xs text-gray-500">
                            {conversation.company}
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          {conversation.unreadCount > 0 && (
                            <Badge
                              variant="secondary"
                              className="bg-blue-600 text-white text-xs"
                            >
                              {conversation.unreadCount}
                            </Badge>
                          )}
                          <Button variant="ghost" size="sm">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No conversations yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Start connecting with people to begin messaging
                  </p>
                  <Link href="/grow-network">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Grow Your Network
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {isEmployerUser && (
            <Card className="bg-white shadow-sm mt-6">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Message Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {requests.length > 0 ? (
                  <div className="space-y-1">
                    {requests.map((r) => (
                      <Link key={r.id} href={`/chat/${r.chatId}`}>
                        <div className="flex items-center space-x-3 p-4 hover:bg-gray-50 cursor-pointer border-l-4 border-yellow-400/60">
                          <div className="relative">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={r.avatar} />
                              <AvatarFallback className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                                {r.name
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-900 truncate">
                                {r.name}{" "}
                                <span className="ml-2 text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded">
                                  Request
                                </span>
                              </h4>
                              <span className="text-xs text-gray-500">
                                {r.timestamp}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 truncate">
                              {r.lastMessage}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No message requests</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="bg-white shadow-sm mt-6">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/grow-network">
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Find People to Message
                  </Button>
                </Link>
                <Link href="/connects">
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    View Connections
                  </Button>
                </Link>
                <Link href="/pending-requests">
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Pending Requests
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
