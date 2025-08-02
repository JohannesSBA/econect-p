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
                  <Link href="/notifications" className="flex items-center space-x-2 p-2 rounded-lg bg-blue-50 text-blue-700">
                    <Bell className="h-4 w-4" />
                    <span className="text-sm font-medium">All Notifications</span>
                    <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-700">
                      {notifications.length}
                    </Badge>
                  </Link>
                  <Link href="/notifications?type=unread" className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 text-gray-700">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm">Unread</span>
                    <Badge variant="secondary" className="ml-auto bg-red-100 text-red-700">
                      {unreadCount}
                    </Badge>
                  </Link>
                  <Link href="/notifications?type=connections" className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 text-gray-700">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Connection Requests</span>
                  </Link>
                  <Link href="/notifications?type=mentions" className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 text-gray-700">
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-sm">Mentions</span>
                  </Link>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Filter by</h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-gray-300" />
                      <span className="text-sm text-gray-700">Connection requests</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-gray-300" />
                      <span className="text-sm text-gray-700">Likes and comments</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-gray-300" />
                      <span className="text-sm text-gray-700">Job invitations</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-gray-300" />
                      <span className="text-sm text-gray-700">Messages</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search and Actions */}
            <Card className="bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search notifications..."
                        className="pl-10 border-gray-200 w-64"
                      />
                    </div>
                    <Button variant="outline">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-1" />
                      Settings
                    </Button>
                    <Button variant="outline" size="sm">
              Mark all as read
            </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications List */}
            <Card className="bg-white shadow-sm">
              <CardContent className="p-0">
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start space-x-4 p-4 hover:bg-gray-50 ${
                        !notification.read ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3 flex-1">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                            {notification.title.split(" ")[0].charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2">
                              {getNotificationIcon(notification.type)}
                              <h4 className={`font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">{new Date(notification.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {getActionButtons(notification.type)}
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
        </CardContent>
      </Card>

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