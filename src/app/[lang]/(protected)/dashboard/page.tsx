import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  ChevronRight,
  UserPlus,
  Clock,
  Building,
  MessageSquare,
} from "lucide-react"
import Link from "next/link"
import Header from "../components/Header"
import { getCurrentUser } from "@/lib/getCurrentUser"
import { User } from "@/../types/prisma"
import Sidebar from "../components/Sidebar"
import prisma from "@/lib/prisma"
import { CreatePost } from "../components/CreatePost"
import { FeedClient } from "../components/FeedClient"


interface PostWithAuthor {
  id: string
  title?: string | null
  content: string
  createdAt: Date
  author: {
    id: string
    name: string
    image?: string
    headline?: string
  }
  likes: Array<{ id: string }>
  comments: Array<{ id: string }>
  images?: string[]
}

export default async function DashboardPage({ params }: { params: Promise<{ lang: 'en' | 'am' }> }) {
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

    // Fetch posts with author information and engagement data
    const posts = await prisma.post.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            headline: true,
          }
        },
        likes: true,
        comments: {
          include: {
            user: {
              select: { id: true, name: true, image: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    }) as PostWithAuthor[]

    // Fetch user's connections count
    const connectionsCount = await prisma.connection.count({
      where: {
        OR: [
          { senderId: user.id, status: 'ACCEPTED' },
          { receiverId: user.id, status: 'ACCEPTED' }
        ]
      }
    })

    // Fetch pending connection requests count
    const pendingRequestsCount = await prisma.connection.count({
      where: {
        receiverId: user.id,
        status: 'PENDING'
      }
    })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header lang={lang} user={user
      } />

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 md:sticky top-20 self-start">
            <Card className="bg-white shadow-sm mb-6">
              <CardHeader className="pb-4">
                <h2 className="text-lg font-semibold text-gray-900">Manage Network</h2>
              </CardHeader>
              <CardContent className="space-y-1">
                <Link
                  href="/en/connections"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="text-gray-700">My Network</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      {connectionsCount}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </Link>
                <Link
                  href="/en/grow-network"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <UserPlus className="h-5 w-5 text-green-600" />
                    <span className="text-gray-700">Grow Network</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </Link>
                <Link
                  href="/en/pending-requests"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <span className="text-gray-700">Pending Requests</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {pendingRequestsCount > 0 && (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                        {pendingRequestsCount}
                      </Badge>
                    )}
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </Link>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white shadow-sm">
              <CardHeader className="pb-4">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/en/jobs">
                  <Button variant="outline" className="w-full justify-start">
                    <Building className="h-4 w-4 mr-2" />
                    Find Jobs
                  </Button>
                </Link>
                <Link href="/en/profile">
                  <Button variant="outline" className="w-full justify-start">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Update Profile
                  </Button>
                </Link>
                <Link href="/en/chat">
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Messages
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Post */}
            <CreatePost user={user} />

            <FeedClient initialPosts={posts as any} user={user as any} />
          </div>

          {/* Right Sidebar */}
          <Sidebar user={user} lang={lang} />
        </div>
      </div>
    </div>
  )
}
