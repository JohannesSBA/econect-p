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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getAvatarUrl } from "@/lib/image-utils"

interface PostWithAuthor {
  id: string
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
        comments: true,
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
                  href="/connections"
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
                  href="/grow-network"
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
                  href="/pending-requests"
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
                <Link href="/jobs">
                  <Button variant="outline" className="w-full justify-start">
                    <Building className="h-4 w-4 mr-2" />
                    Find Jobs
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline" className="w-full justify-start">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Update Profile
                  </Button>
                </Link>
                <Link href="/chat">
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
            <Card className="bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                  <AvatarImage src={getAvatarUrl(user?.image, user?.name)} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm">
                    {user?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                  <div className="flex-1">
                    <input
                      placeholder="What do you want to talk about?"
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Post
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Posts Feed */}
            <div className="space-y-6">
              {posts.map((post: PostWithAuthor) => (
                <Card key={post.id} className="bg-white shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-3 mb-4">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {post.author.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">{post.author.name}</h3>
                          {post.author.headline && (
                            <Badge variant="secondary" className="text-xs">
                              {post.author.headline}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-800 mb-2">{post.content}</p>
                    </div>

                    <div className="flex items-center space-x-6 mb-4">
                      <button className="flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-colors">
                        <span className="text-sm">👍 {post.likes.length}</span>
                      </button>
                      <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors">
                        <span className="text-sm">💬 {post.comments.length}</span>
                      </button>
                      <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors">
                        <span className="text-sm">Share</span>
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Right Sidebar */}
          <Sidebar user={user} lang={lang} />
        </div>
      </div>
    </div>
  )
}
