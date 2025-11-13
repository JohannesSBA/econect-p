import Link from "next/link";
import { Bell, Eye, MessageSquare, Users } from "lucide-react";
import type { Prisma } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "../components/Header";
import { getCurrentUser } from "@/lib/getCurrentUser";
import prisma from "@/lib/prisma";
import NotificationsClient from "./NotificationsClient";
import { Notification } from "@/../types/types";

type SidebarFilter = "all" | "unread" | "connections" | "mentions";

interface NotificationsPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export type NotificationPayload = Record<string, unknown> & {
  jobId?: string;
  postId?: string;
  senderId?: string;
};

export type SerializableNotification = Pick<
  Notification,
  "id" | "type" | "title" | "message" | "read"
> & {
  createdAt: string;
  data: NotificationPayload | null;
};

const parseNotificationData = (
  value: Prisma.Payload<Notification> | null,
): NotificationPayload | null => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as NotificationPayload;
};

const serializeNotifications = (
  items: Notification[],
): SerializableNotification[] =>
  items.map((notification) => ({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    read: notification.read,
    createdAt: notification.createdAt.toISOString(),
    data: parseNotificationData(notification.data),
  }));

const parseSidebarFilter = (value: unknown): SidebarFilter => {
  if (typeof value !== "string") {
    return "all";
  }
  switch (value.toLowerCase()) {
    case "unread":
      return "unread";
    case "connections":
      return "connections";
    case "mentions":
      return "mentions";
    default:
      return "all";
  }
};

const linkBaseClass = "flex items-center space-x-2 p-2 rounded-lg";
const linkActiveClass = "bg-blue-50 text-blue-700";
const linkInactiveClass = "hover:bg-gray-50 text-gray-700";

export default async function NotificationsPage({
  searchParams,
}: NotificationsPageProps) {
  const resolvedSearchParams: Record<string, string | string[] | undefined> =
    (await searchParams) ?? {};
  const activeFilter = parseSidebarFilter(resolvedSearchParams.type);
  const user = await getCurrentUser();

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
          <Link href="/auth/login">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Fetch user's notifications
  const notifications = await prisma.notification.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
  });

  const serializedNotifications = serializeNotifications(
    notifications as Notification[],
  );

  const unreadCount = serializedNotifications.reduce(
    (count, notification) => (notification.read ? count : count + 1),
    0,
  );

  const headerUser = {
    id: user.id,
    name: user.name ?? undefined,
    email: user.email ?? undefined,
    image: user.image ?? undefined,
    headline: undefined,
    role: user.role ?? undefined,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={headerUser} />

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-white shadow-sm sticky top-20">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Link
                    href="/notifications"
                    className={`${linkBaseClass} ${
                      activeFilter === "all"
                        ? linkActiveClass
                        : linkInactiveClass
                    }`}
                  >
                    <Bell className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      All Notifications
                    </span>
                    <Badge
                      data-notification-badge
                      variant="secondary"
                      className="ml-auto bg-blue-100 text-blue-700"
                    >
                      {unreadCount}
                    </Badge>
                  </Link>
                  <Link
                    href="/notifications?type=unread"
                    className={`${linkBaseClass} ${
                      activeFilter === "unread"
                        ? linkActiveClass
                        : linkInactiveClass
                    }`}
                  >
                    <Eye className="h-4 w-4" />
                    <span className="text-sm">Unread</span>
                    <Badge
                      data-notification-badge
                      variant="secondary"
                      className="ml-auto bg-red-100 text-red-700"
                    >
                      {unreadCount}
                    </Badge>
                  </Link>
                  <Link
                    href="/notifications?type=connections"
                    className={`${linkBaseClass} ${
                      activeFilter === "connections"
                        ? linkActiveClass
                        : linkInactiveClass
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Connection Requests</span>
                  </Link>
                  <Link
                    href="/notifications?type=mentions"
                    className={`${linkBaseClass} ${
                      activeFilter === "mentions"
                        ? linkActiveClass
                        : linkInactiveClass
                    }`}
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-sm">Mentions</span>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search and Actions */}
            {/* Interactive client controls + list */}
            <NotificationsClient initial={serializedNotifications} />

            {/* Load More */}
            <div className="text-center">
              <Button variant="outline" size="lg">
                Load more notifications
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
