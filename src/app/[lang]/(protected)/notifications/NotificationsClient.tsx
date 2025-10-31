"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { NotificationType } from "@prisma/client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Bell,
  Building,
  Eye,
  Heart,
  MessageSquare,
  MoreHorizontal,
  Search,
  Settings,
  Users,
} from "lucide-react";

import type { NotificationPayload, SerializableNotification } from "./page";

const BADGE_SELECTOR = "[data-notification-badge]";

const NOTIFICATION_SETTING_KEYS = [
  "emailAll",
  "emailJob",
  "pushEnabled",
] as const;
type NotificationSettingKey = (typeof NOTIFICATION_SETTING_KEYS)[number];
type NotificationSettings = Record<NotificationSettingKey, boolean>;

const DEFAULT_SETTINGS: NotificationSettings = {
  emailAll: false,
  emailJob: false,
  pushEnabled: false,
};

type NotificationFilters = {
  conn: boolean;
  social: boolean;
  jobs: boolean;
  msgs: boolean;
};

const DEFAULT_FILTERS: NotificationFilters = {
  conn: true,
  social: true,
  jobs: true,
  msgs: true,
};

type NotificationsClientProps = {
  lang: "en" | "am";
  initial: SerializableNotification[];
};

type QueryFilter =
  | "all"
  | "unread"
  | "connections"
  | "mentions"
  | "jobs"
  | "messages";

const parseSettings = (value: unknown): NotificationSettings => {
  const parsed: NotificationSettings = { ...DEFAULT_SETTINGS };
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of NOTIFICATION_SETTING_KEYS) {
      const candidate = record[key];
      parsed[key] =
        typeof candidate === "boolean" ? candidate : DEFAULT_SETTINGS[key];
    }
  }
  return parsed;
};

const countUnread = (items: SerializableNotification[]): number =>
  items.reduce((count, item) => (!item.read ? count + 1 : count), 0);

const notificationMatchesFilters = (
  notification: SerializableNotification,
  filters: NotificationFilters,
): boolean => {
  switch (notification.type) {
    case "CONNECTION_REQUEST":
      return filters.conn;
    case "LIKE":
    case "COMMENT":
      return filters.social;
    case "JOB_INVITATION":
    case "APPLICATION_UPDATE":
      return filters.jobs;
    case "MESSAGE":
      return filters.msgs;
    default:
      return true;
  }
};

const parseQueryFilter = (value: string | null): QueryFilter => {
  switch (value?.toLowerCase()) {
    case "unread":
      return "unread";
    case "connections":
      return "connections";
    case "mentions":
      return "mentions";
    case "jobs":
      return "jobs";
    case "messages":
      return "messages";
    default:
      return "all";
  }
};

const matchesQueryFilter = (
  notification: SerializableNotification,
  filter: QueryFilter,
): boolean => {
  switch (filter) {
    case "unread":
      return !notification.read;
    case "connections":
      return notification.type === "CONNECTION_REQUEST";
    case "mentions":
      return (
        notification.type === "COMMENT" || notification.type === "LIKE"
      );
    case "jobs":
      return (
        notification.type === "JOB_INVITATION" ||
        notification.type === "APPLICATION_UPDATE"
      );
    case "messages":
      return notification.type === "MESSAGE";
    default:
      return true;
  }
};

const getInitials = (title: string): string => {
  if (!title) return "N";
  const [firstWord] = title.trim().split(/\s+/);
  return firstWord?.charAt(0)?.toUpperCase() ?? "N";
};

const formatTimestamp = (isoDate: string): string =>
  new Date(isoDate).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const iconForNotification = (type: NotificationType) => {
  switch (type) {
    case "CONNECTION_REQUEST":
      return <Users className="h-4 w-4 text-blue-600" />;
    case "LIKE":
      return <Heart className="h-4 w-4 text-red-600" />;
    case "COMMENT":
      return <MessageSquare className="h-4 w-4 text-green-600" />;
    case "JOB_INVITATION":
    case "APPLICATION_UPDATE":
      return <Building className="h-4 w-4 text-purple-600" />;
    case "MESSAGE":
      return <MessageSquare className="h-4 w-4 text-blue-600" />;
    default:
      return <Bell className="h-4 w-4 text-gray-600" />;
  }
};

const getDestinationUrl = (
  lang: NotificationsClientProps["lang"],
  notification: SerializableNotification,
): string => {
  const payload: NotificationPayload | null = notification.data;
  if (notification.type === "MESSAGE") {
    return `/${lang}/chat`;
  }
  if (
    payload?.jobId &&
    (notification.type === "JOB_INVITATION" ||
      notification.type === "APPLICATION_UPDATE")
  ) {
    return `/${lang}/jobs/${payload.jobId}`;
  }
  if (payload?.postId) {
    return `/${lang}/posts/${payload.postId}`;
  }
  return `/${lang}/dashboard`;
};

const updateUnreadBadges = (value: number) => {
  document.querySelectorAll<HTMLElement>(BADGE_SELECTOR).forEach((element) => {
    element.textContent = String(value);
  });
};

const shouldIncludeNotification = (
  notification: SerializableNotification,
  filters: NotificationFilters,
  normalizedQuery: string,
  queryFilter: QueryFilter,
): boolean => {
  if (!matchesQueryFilter(notification, queryFilter)) {
    return false;
  }

  if (!notificationMatchesFilters(notification, filters)) {
    return false;
  }

  if (!normalizedQuery) {
    return true;
  }

  const combined =
    `${notification.title} ${notification.message}`.toLowerCase();
  return combined.includes(normalizedQuery);
};

export default function NotificationsClient({
  lang,
  initial,
}: NotificationsClientProps) {
  const searchParams = useSearchParams();
  const queryFilter = parseQueryFilter(searchParams.get("type"));
  const [items, setItems] = useState<SerializableNotification[]>(() =>
    initial.map((notification) => ({ ...notification })),
  );
  const [query, setQuery] = useState<string>("");
  const [filters, setFilters] = useState<NotificationFilters>({
    ...DEFAULT_FILTERS,
  });
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    ...DEFAULT_SETTINGS,
  });
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const loadSettings = async () => {
      try {
        const response = await fetch("/api/notifications/settings", {
          cache: "no-store",
        });
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        if (isMounted) {
          setSettings(parseSettings(data));
        }
      } catch {
        // Default settings remain in place if the request fails.
      }
    };

    loadSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    updateUnreadBadges(countUnread(items));
  }, [items]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((notification) =>
      shouldIncludeNotification(
        notification,
        filters,
        normalizedQuery,
        queryFilter,
      ),
    );
  }, [items, query, filters, queryFilter]);

  const hasUnread = useMemo(
    () => items.some((notification) => !notification.read),
    [items],
  );

  const openNotification = (notification: SerializableNotification) => {
    window.location.href = getDestinationUrl(lang, notification);
  };

  const markAllRead = async () => {
    try {
      const response = await fetch("/api/notifications", { method: "POST" });
      if (!response.ok) {
        return;
      }
      setItems((previous) =>
        previous.map((notification) =>
          notification.read ? notification : { ...notification, read: true },
        ),
      );
    } catch {
      // Ignore network errors to avoid interrupting the UX.
    }
  };

  const toggleRead = async (id: string, read: boolean) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read }),
      });
      if (!response.ok) {
        return;
      }
      setItems((previous) =>
        previous.map((notification) =>
          notification.id === id ? { ...notification, read } : notification,
        ),
      );
    } catch {
      // Ignore network errors.
    }
  };

  const removeNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        return;
      }
      setItems((previous) =>
        previous.filter((notification) => notification.id !== id),
      );
    } catch {
      // Ignore network errors.
    }
  };

  const saveSettings = async () => {
    try {
      setIsSavingSettings(true);
      await fetch("/api/notifications/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSettingsOpen(false);
    } catch {
      // Ignore network errors.
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  placeholder="Search notifications..."
                  className="w-64 border-gray-200 pl-10"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <div className="hidden items-center space-x-3 md:flex">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.conn}
                    onChange={(event) =>
                      setFilters((previous) => ({
                        ...previous,
                        conn: event.target.checked,
                      }))
                    }
                  />
                  Connection requests
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.social}
                    onChange={(event) =>
                      setFilters((previous) => ({
                        ...previous,
                        social: event.target.checked,
                      }))
                    }
                  />
                  Likes & comments
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.jobs}
                    onChange={(event) =>
                      setFilters((previous) => ({
                        ...previous,
                        jobs: event.target.checked,
                      }))
                    }
                  />
                  Jobs
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.msgs}
                    onChange={(event) =>
                      setFilters((previous) => ({
                        ...previous,
                        msgs: event.target.checked,
                      }))
                    }
                  />
                  Messages
                </label>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="mr-1 h-4 w-4" />
                Settings
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={markAllRead}
                disabled={!hasUnread}
              >
                Mark all as read
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm">
        <CardContent className="p-0">
          <div className="space-y-1">
            {filteredItems.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                No notifications match your current filters.
              </div>
            ) : (
              filteredItems.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start space-x-4 p-4 hover:bg-gray-50 ${
                    notification.read
                      ? ""
                      : "border-blue-500 bg-blue-50 border-l-4"
                  }`}
                >
                  <div className="flex flex-1 items-start space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                        {getInitials(notification.title)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          {iconForNotification(notification.type)}
                          <h4
                            className={`font-medium ${
                              notification.read
                                ? "text-gray-700"
                                : "text-gray-900"
                            }`}
                          >
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <span className="h-2 w-2 rounded-full bg-blue-600" />
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(notification.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openNotification(notification)}
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      View
                    </Button>
                    <div className="group relative">
                      <Button variant="ghost" size="sm" type="button">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                      <div className="absolute right-0 mt-2 hidden rounded border bg-white text-sm shadow-md group-hover:block">
                        <button
                          type="button"
                          className="block w-full px-3 py-2 text-left hover:bg-gray-50"
                          onClick={() =>
                            toggleRead(notification.id, !notification.read)
                          }
                        >
                          {notification.read
                            ? "Mark as unread"
                            : "Mark as read"}
                        </button>
                        <button
                          type="button"
                          className="block w-full px-3 py-2 text-left text-red-600 hover:bg-red-50"
                          onClick={() => removeNotification(notification.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Notification Settings</h3>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="text-gray-500"
                aria-label="Close settings"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.emailAll}
                  onChange={(event) =>
                    setSettings((previous) => ({
                      ...previous,
                      emailAll: event.target.checked,
                    }))
                  }
                />
                Email me all notifications
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.emailJob}
                  onChange={(event) =>
                    setSettings((previous) => ({
                      ...previous,
                      emailJob: event.target.checked,
                    }))
                  }
                />
                Email job-related updates
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.pushEnabled}
                  onChange={(event) =>
                    setSettings((previous) => ({
                      ...previous,
                      pushEnabled: event.target.checked,
                    }))
                  }
                />
                Enable browser push
              </label>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setSettingsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveSettings} disabled={isSavingSettings}>
                {isSavingSettings ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
