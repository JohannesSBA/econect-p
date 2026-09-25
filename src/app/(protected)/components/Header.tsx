"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { Bell, Menu, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import { getAvatarUrl } from "@/lib/image-utils";
import { socketManager } from "@/lib/socket";
import { cn } from "@/lib/utils";

import SearchComponent from "./SearchComponent";
import Signout from "./Signout";

interface HeaderProps {
  user: {
    id?: string;
    name?: string;
    email?: string;
    image?: string;
    headline?: string;
    role?: string;
  };
}

export default function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const lastNotifCountRef = useRef<number>(0);

  useEffect(() => {
    let isMounted = true;
    const loadCounts = async () => {
      try {
        const [msgRes, notifRes] = await Promise.all([
          fetch(`/api/message/unread-count`, { cache: "no-store" }),
          fetch(`/api/notifications/unread-count`, { cache: "no-store" }),
        ]);
        if (!msgRes.ok || !notifRes.ok) return;
        const msgJson = await msgRes.json();
        const notifJson = await notifRes.json();
        if (!isMounted) return;
        setUnreadMessages(msgJson.count ?? 0);
        setUnreadNotifications(notifJson.count ?? 0);
        lastNotifCountRef.current = notifJson.count ?? 0;
      } catch (_) {
        // ignore
      }
    };
    loadCounts();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const userKey = user?.email || user?.id;
    if (!userKey) return;
    socketManager.connect(String(userKey));

    const markOnline = async (isOnline: boolean) => {
      try {
        await fetch("/api/user/online", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isOnline }),
        });
      } catch {}
    };

    markOnline(true);

    const onBeforeUnload = () => {
      try {
        const data = new Blob([JSON.stringify({ isOnline: false })], {
          type: "application/json",
        });
        navigator.sendBeacon("/api/user/online", data);
      } catch {}
    };

    window.addEventListener("beforeunload", onBeforeUnload);

    const onNewMessage = (payload: unknown) => {
      if (!payload || typeof payload !== "object") {
        return;
      }
      const data = payload as {
        message?: {
          recipientId?: string;
          text?: string;
          sender?: { name?: string | null; image?: string | null };
        };
      };
      try {
        const message = data?.message;
        if (!message) return;
        if (
          message.recipientId &&
          user?.id &&
          message.recipientId === user.id
        ) {
          setUnreadMessages((count) => count + 1);
          const preview = (message.text || "New message").slice(0, 80);
          const senderName = message.sender?.name ?? "Someone";
          const senderImage = message.sender?.image ?? undefined;
          if (!pathname.includes("/chat")) {
            toast.custom(() => (
              <div className="flex items-center gap-3 rounded-lg bg-white p-2 shadow-md">
                <div className="flex items-center gap-3 rounded-lg bg-gray-100 p-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={getAvatarUrl(senderImage, senderName)} />
                    <AvatarFallback>
                      {(senderName || "U").slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <span className="font-medium">{senderName}</span>: {preview}
                  </div>
                </div>
              </div>
            ));
          }
        }
      } catch {
        // noop
      }
    };

    const onMessagesRead = async () => {
      try {
        const res = await fetch(`/api/message/unread-count`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = await res.json();
        setUnreadMessages(json.count ?? 0);
      } catch {}
    };

    socketManager.on("new_message", onNewMessage);
    socketManager.on("messages_read", onMessagesRead);

    return () => {
      socketManager.off("new_message", onNewMessage);
      socketManager.off("messages_read", onMessagesRead);
      window.removeEventListener("beforeunload", onBeforeUnload);
      markOnline(false);
    };
  }, [pathname, user?.email, user?.id]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/message/unread-count`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = await res.json();
        setUnreadMessages(json.count ?? 0);
      } catch {}
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/notifications/unread-count`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = await res.json();
        const count = json.count ?? 0;
        setUnreadNotifications(count);
        if (count > lastNotifCountRef.current) {
          toast.info("You have a new notification");
        }
        lastNotifCountRef.current = count;
      } catch {}
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  const navLinks = [
    {
      label: "Chat",
      href: "/chat",
      badge: unreadMessages,
    },
    {
      label: "Jobs",
      href: "/jobs",
      badge: 0,
    },
    {
      label: "People",
      href: "/users",
      badge: 0,
    },
    {
      label: "Connections",
      href: "/connects",
      badge: 0,
    },
  ];

  const mobileNavId = "header-primary-nav";

  const isActive = (href: string) => pathname.startsWith(href);

  const NotificationButton = ({ className }: { className?: string }) => (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className={cn(
        "relative rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:text-blue-700",
        className,
      )}
      aria-label="View notifications"
    >
      <Link href="/notifications">
        {unreadNotifications > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] rounded-full bg-blue-600 px-1 text-[11px] leading-[1] text-white">
            {unreadNotifications > 99 ? "99+" : unreadNotifications}
          </Badge>
        )}
        <Bell className="h-5 w-5" />
      </Link>
    </Button>
  );

  const ProfileButton = ({ className }: { className?: string }) => (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className={cn(
        "relative size-10 overflow-hidden rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:text-blue-700",
        className,
      )}
      aria-label="View profile"
    >
      <Link href="/profile">
        <Avatar className="size-full">
          <AvatarImage src={getAvatarUrl(user?.image, user?.name)} />
          <AvatarFallback>
            {(user?.name || user?.email || "U").slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </Link>
    </Button>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-white/60 bg-white/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 pb-2 px-3 sm:px-6 sm:py-4 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-4">
            <Link
              href="/dashboard"
              aria-label="Go to Econnect dashboard"
              className="flex shrink-0 items-center gap-2"
            >
              <Image
                src="/logoWName.png"
                alt="Econnect"
                width={120}
                height={40}
                priority
              />
            </Link>
            <nav
              className="hidden flex-wrap items-center gap-2 md:flex"
              aria-label="Primary navigation"
            >
              {user?.role === "ADMIN" && (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="rounded-full px-4 font-medium transition-all whitespace-nowrap"
                >
                  <Link href="/admin">Admin</Link>
                </Button>
              )}
              {navLinks.map((item) => {
                const active = isActive(item.href);
                return (
                  <Button
                    key={item.href}
                    asChild
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "rounded-full px-4 font-medium transition-all whitespace-nowrap",
                      active
                        ? "bg-blue-600 text-white shadow-sm hover:bg-blue-600"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                    )}
                  >
                    <Link href={item.href} className="flex items-center gap-2">
                      <span>{item.label}</span>
                      {item.badge > 0 && (
                        <Badge className="h-5 min-w-[1.5rem] rounded-full bg-emerald-500 px-2 text-[11px] leading-[1] text-white">
                          {item.badge > 99 ? "99+" : item.badge}
                        </Badge>
                      )}
                    </Link>
                  </Button>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden min-w-[14rem] max-w-full flex-1 lg:block">
              <SearchComponent />
            </div>
            <ProfileButton className="hidden shrink-0 md:inline-flex" />
            <NotificationButton className="hidden shrink-0 md:inline-flex" />
            <div className="hidden shrink-0 lg:block">
              <Signout />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 md:hidden"
              type="button"
              onClick={() => setIsMobileNavOpen((open) => !open)}
              aria-controls={mobileNavId}
              aria-expanded={isMobileNavOpen}
              aria-label={
                isMobileNavOpen
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
            >
              {isMobileNavOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-3 lg:hidden">
          <div className="min-w-0 flex-1 basis-full sm:basis-auto">
            <SearchComponent />
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <NotificationButton className="shrink-0 md:hidden" />
            <ProfileButton className="shrink-0 md:hidden" />
            <div className="shrink-0">
              <Signout />
            </div>
          </div>
        </div>

        <nav
          id={mobileNavId}
          aria-label="Primary navigation"
          className={cn(
            "w-full md:hidden",
            isMobileNavOpen
              ? "mt-2 grid gap-1 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
              : "hidden",
          )}
        >
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between gap-3 rounded-lg px-4 py-2 text-sm font-medium",
                isActive(item.href)
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-700 hover:bg-slate-100",
              )}
            >
              <span>{item.label}</span>
              {item.badge > 0 && (
                <Badge className="h-5 min-w-[1.5rem] rounded-full bg-emerald-500 px-2 text-[11px] leading-[1] text-white">
                  {item.badge > 99 ? "99+" : item.badge}
                </Badge>
              )}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
