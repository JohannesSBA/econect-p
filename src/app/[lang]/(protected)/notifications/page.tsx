import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Search,
  Bell,
  Users,
  MessageSquare,
  Heart,
  Building,
  MoreHorizontal,
  Check,
  X,
  Eye,
  Filter,
  Settings,
} from "lucide-react"
import Link from "next/link"
import Header from "../components/Header"
import { getCurrentUser } from "@/lib/getCurrentUser"
import { User } from "@/../types/prisma"
import prisma from "@/lib/prisma"
import NotificationsClient from "./NotificationsClient"

export default async function NotificationsPage({ params }: { params: Promise<{ lang: 'en' | 'am' }> }) {
  const { lang } = await params
  const user = await getCurrentUser() as unknown as User

  // Handle case where user is not found
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">User not found</h1>
          <p className="text-gray-600 mb-4">Please log in with a valid account.</p>
          <Link href={`/${lang}/auth/login`}>
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Fetch user's notifications
  const notifications = await prisma.notification.findMany({
    where: {
      userId: user.id
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 20
  })

  const unreadCount = notifications.filter(n => !n.read).length

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "CONNECTION_REQUEST":
        return <Users className="h-4 w-4 text-blue-600" />
      case "LIKE":
        return <Heart className="h-4 w-4 text-red-600" />
      case "COMMENT":
        return <MessageSquare className="h-4 w-4 text-green-600" />
      case "JOB_INVITATION":
        return <Building className="h-4 w-4 text-purple-600" />
      case "APPLICATION_UPDATE":
        return <Building className="h-4 w-4 text-purple-600" />
      case "MESSAGE":
        return <MessageSquare className="h-4 w-4 text-blue-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  const getActionButtons = (type: string) => {
    switch (type) {
      case "CONNECTION_REQUEST":
        return (
          <div className="flex items-center space-x-2">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Check className="h-4 w-4 mr-1" />
              Accept
            </Button>
            <Button size="sm" variant="outline">
              <X className="h-4 w-4 mr-1" />
              Decline
            </Button>
          </div>
        )
      case "LIKE":
      case "COMMENT":
        return (
          <Button size="sm" variant="outline">
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
        )
      case "JOB_INVITATION":
      case "APPLICATION_UPDATE":
        return (
          <Button size="sm" className="bg-green-600 hover:bg-green-700">
            View
          </Button>
        )
      case "MESSAGE":
        return (
          <Button size="sm" variant="outline">
            <MessageSquare className="h-4 w-4 mr-1" />
            Reply
          </Button>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header lang={lang} user={user} />

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-white shadow-sm sticky top-20">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Link href={`/${lang}/notifications`} className="flex items-center space-x-2 p-2 rounded-lg bg-blue-50 text-blue-700">
                    <Bell className="h-4 w-4" />
                    <span className="text-sm font-medium">All Notifications</span>
                    <Badge id="notif-unread-badge" variant="secondary" className="ml-auto bg-blue-100 text-blue-700">
                      {unreadCount}
                    </Badge>
                  </Link>
                  <Link href={`/${lang}/notifications?type=unread`} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 text-gray-700">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm">Unread</span>
                    <Badge id="notif-unread-badge" variant="secondary" className="ml-auto bg-red-100 text-red-700">
                      {unreadCount}
                    </Badge>
                  </Link>
                  <Link href={`/${lang}/notifications?type=connections`} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 text-gray-700">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Connection Requests</span>
                  </Link>
                  <Link href={`/${lang}/notifications?type=mentions`} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 text-gray-700">
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
            <NotificationsClient lang={lang} initial={notifications as any} />

            

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
  )
}
