"use client"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Home,
  MessageCircle,
  Briefcase,
  Link2,
  Bell,
  Users,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import Signout from "./Signout"
import SearchComponent from "./SearchComponent"
import { getAvatarUrl } from "@/lib/image-utils"
import { useEffect, useMemo, useRef, useState } from "react"
import { socketManager } from "@/lib/socket"
import { toast } from "sonner"

interface HeaderProps {
  lang: string;
  user: {
    id?: string;
    name?: string;
    email?: string;
    image?: string;
    headline?: string;
    role?: string;
  }
}

export default function Header({ lang, user }: HeaderProps) {
    const pathname = usePathname()
    const router = useRouter()

    const [unreadMessages, setUnreadMessages] = useState<number>(0)
    const [unreadNotifications, setUnreadNotifications] = useState<number>(0)
    const lastNotifCountRef = useRef<number>(0)

    // Fetch initial counts
    useEffect(() => {
      let isMounted = true
      const loadCounts = async () => {
        try {
          const [msgRes, notifRes] = await Promise.all([
            fetch(`/api/message/unread-count`, { cache: "no-store" }),
            fetch(`/api/notifications/unread-count`, { cache: "no-store" })
          ])
          if (!msgRes.ok || !notifRes.ok) return
          const msgJson = await msgRes.json()
          const notifJson = await notifRes.json()
          if (!isMounted) return
          setUnreadMessages(msgJson.count ?? 0)
          setUnreadNotifications(notifJson.count ?? 0)
          lastNotifCountRef.current = notifJson.count ?? 0
        } catch (_) {
          // ignore
        }
      }
      loadCounts()
      return () => { isMounted = false }
    }, [])

    // Connect socket and listen to new messages for toasts + live counter
    useEffect(() => {
      const userKey = user?.email || user?.id
      if (!userKey) return
      socketManager.connect(String(userKey))
      // Mark online
      const markOnline = async (isOnline: boolean) => {
        try {
          await fetch('/api/user/online', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isOnline }) })
        } catch {}
      }
      markOnline(true)
      const onBeforeUnload = () => {
        try {
          const data = new Blob([JSON.stringify({ isOnline: false })], { type: 'application/json' })
          navigator.sendBeacon('/api/user/online', data)
        } catch {}
      }
      window.addEventListener('beforeunload', onBeforeUnload)

      const onNewMessage = (data: any) => {
        try {
          const message = data?.message
          if (!message) return
          // Only increment if this user is the recipient
          if (message.recipientId && user?.id && message.recipientId === user.id) {
            setUnreadMessages((c) => c + 1)
            const preview = (message.text || "New message").slice(0, 80)
            const senderName = message?.sender?.name || message?.senderName || "Someone"
            const senderImage = message?.sender?.image || undefined
            // Avoid noisy toasts when already in chat
            if (!pathname.includes('/chat')) {
              toast.custom(() => (
                <div className="flex items-center gap-3 bg-white p-2 rounded-lg shadow-md">
                  <div className="flex items-center gap-3 bg-gray-100 p-2 rounded-lg">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={getAvatarUrl(senderImage, senderName)} />
                    <AvatarFallback>{(senderName || 'U').slice(0,1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm"><span className="font-medium">{senderName}</span>: {preview}</div>
                  </div>
                </div>
              ))
            }
          }
        } catch {
          // noop
        }
      }

      const onMessagesRead = async (_data: any) => {
        try {
          const res = await fetch(`/api/message/unread-count`, { cache: "no-store" })
          if (!res.ok) return
          const json = await res.json()
          setUnreadMessages(json.count ?? 0)
        } catch {}
      }

      socketManager.on('new_message', onNewMessage)
      socketManager.on('messages_read', onMessagesRead)
      return () => {
        socketManager.off('new_message', onNewMessage)
        socketManager.off('messages_read', onMessagesRead)
        window.removeEventListener('beforeunload', onBeforeUnload)
        markOnline(false)
      }
    }, [user?.email, user?.id, pathname])

    // Poll unread message count to sync when messages are read elsewhere
    useEffect(() => {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/message/unread-count`, { cache: "no-store" })
          if (!res.ok) return
          const json = await res.json()
          setUnreadMessages(json.count ?? 0)
        } catch {
          // ignore
        }
      }, 10000)
      return () => clearInterval(interval)
    }, [])

    // Poll notifications to detect newly arrived items and toast
    useEffect(() => {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/notifications/unread-count`, { cache: "no-store" })
          if (!res.ok) return
          const json = await res.json()
          const count = json.count ?? 0
          setUnreadNotifications(count)
          if (count > lastNotifCountRef.current) {
            toast.info("You have a new notification")
          }
          lastNotifCountRef.current = count
        } catch {
          // ignore
        }
      }, 15000)
      return () => clearInterval(interval)
    }, [])

     return(
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Image src="/icon1.png" alt="Econnect" width={32} height={32} />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Econnect
            </span>
          </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8 ">
              <Link
                href={`/${lang}/dashboard`}
                className={`flex flex-col items-center space-y-1 hover:text-blue-600  ${pathname.includes('dashboard') ? ' pb-4 border-b-2 border-blue-600 text-blue-600' : ''}`}
              >
                <Home className="h-3 w-3" />
                <span className="text-xs ">Dashboard</span>
              </Link>
              <Link
                href={`/${lang}/chat`}
                className={`flex flex-col items-center space-y-1 text-gray-600 hover:text-blue-600 ${pathname.includes('messaging') ? ' pb-4 border-b-2 border-blue-600 text-blue-600' : ''}`}
              >
                <div className="relative">
                  <MessageCircle className="h-3 w-3" />
                  {unreadMessages > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-4 w-4 p-0 bg-blue-600 text-white text-[10px] leading-none flex items-center justify-center">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </Badge>
                  )}
                </div>
                <span className="text-xs">Messaging</span>
              </Link>
              <Link
                href={`/${lang}/jobs`}
                className={`flex flex-col items-center space-y-1 text-gray-600 hover:text-blue-600 ${pathname.includes('listings') ? ' pb-4 border-b-2 border-blue-600 text-blue-600' : ''}`}
              >
                <Briefcase className="h-3 w-3" />
                <span className="text-xs">Listings</span>
              </Link>
              {(user?.role === 'EMPLOYER' || user?.role === 'ADMIN' || user?.role === 'RECRUITER') && (
                <Link
                  href={`/${lang}/employer/dashboard`}
                  className={`flex flex-col items-center space-y-1 text-gray-600 hover:text-blue-600 ${pathname.includes('employer') ? ' pb-4 border-b-2 border-blue-600 text-blue-600' : ''}`}
                >
                  <Briefcase className="h-3 w-3" />
                  <span className="text-xs">Employer</span>
                </Link>
              )}
              <Link
                href={`/${lang}/connects`}
                className={`flex flex-col items-center space-y-1 text-gray-600 hover:text-blue-600 ${pathname.includes('connects') ? ' pb-4 border-b-2 border-blue-600 text-blue-600' : ''}`}
              >
                <Link2 className="h-3 w-3" />
                <span className="text-xs">Connects</span>
              </Link>
              <Link
                href={`/${lang}/users`}
                className={`flex flex-col items-center space-y-1 text-gray-600 hover:text-blue-600 ${pathname.includes('users') ? ' pb-4 border-b-2 border-blue-600 text-blue-600' : ''}`}
              >
                <Users className="h-3 w-3" />
                <span className="text-xs">People</span>
              </Link>
            </nav>

            {/* Search and Profile */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:block">
                <SearchComponent />
              </div>
              <Link href={`/${lang}/notifications`} className="relative">
                {unreadNotifications > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 bg-blue-600 text-white text-[10px] leading-none flex items-center justify-center">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </Badge>
                )}
                <Bell className="h-3 w-3 text-gray-600" />
              </Link>
              <Link href={`/${lang}/profile`} className="flex items-center space-x-3 hover:bg-gray-100/90 rounded-md p-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={getAvatarUrl(user?.image, user?.name)} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm">
                    {user?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <div className="text-sm font-medium text-blue-600">{user?.name}</div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                </div>
              </Link>
              <Signout />
            </div>
          </div>
        </div>
      </header> 
     )    
}
