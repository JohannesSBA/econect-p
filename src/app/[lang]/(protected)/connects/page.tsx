
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Search,
  Users,
  UserPlus,
  MessageSquare,
  MoreHorizontal,
  MapPin,
  Clock,
  Filter,
  Check,
  X,
} from "lucide-react"
import Link from "next/link"
import Header from "../components/Header"
import { getCurrentUser } from "@/lib/getCurrentUser"
import { User } from "@/../types/prisma"
import prisma from "@/lib/prisma"
import { chatHrefConstructor } from "@/lib/utils"
import { getAvatarUrl } from "@/lib/image-utils"

export default async function ConnectionsPage({ params }: { params: Promise<{ lang: 'en' | 'am' }> }) {
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

  // Fetch user's accepted connections
  const connections = await prisma.connection.findMany({
    where: {
      OR: [
        { senderId: user.id, status: 'ACCEPTED' },
        { receiverId: user.id, status: 'ACCEPTED' }
      ]
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          image: true,
          headline: true,
          location: true,
        }
      },
      receiver: {
        select: {
          id: true,
          name: true,
          image: true,
          headline: true,
          location: true,
        }
      }
    }
  })

  // Fetch pending connection requests
  const pendingRequests = await prisma.connection.findMany({
    where: {
      receiverId: user.id,
      status: 'PENDING'
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          image: true,
          headline: true,
          location: true,
        }
      }
    }
  })

  // Transform connections to get the other user (not the current user)
  const transformedConnections = connections.map(connection => {
    const otherUser = connection.senderId === user.id ? connection.receiver : connection.sender
    return {
      id: connection.id,
      user: otherUser,
      connectedDate: connection.createdAt,
      isOnline: Math.random() > 0.5 // Random online status for demo
    }
  })

  // Transform pending requests
  const transformedPendingRequests = pendingRequests.map(request => ({
    id: request.id,
    user: request.sender,
    requestDate: request.createdAt
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <Header lang={lang} user={user} />

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-white shadow-sm sticky top-20">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Network</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Link href="/connections" className="flex items-center space-x-2 p-2 rounded-lg bg-blue-50 text-blue-700">
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-medium">My Network</span>
                    <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-700">
                      {transformedConnections.length}
                    </Badge>
                  </Link>
                  <Link href="/pending-requests" className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 text-gray-700">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Pending Requests</span>
                    <Badge variant="secondary" className="ml-auto bg-orange-100 text-orange-700">
                      {transformedPendingRequests.length}
                    </Badge>
                  </Link>
                  <Link href="/grow-network" className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 text-gray-700">
                    <UserPlus className="h-4 w-4" />
                    <span className="text-sm">Grow Network</span>
                  </Link>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Filter by</h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-gray-300" />
                      <span className="text-sm text-gray-700">Online now</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-gray-300" />
                      <span className="text-sm text-gray-700">Recent connections</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-gray-300" />
                      <span className="text-sm text-gray-700">Same company</span>
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
                <div className="flex items-center space-x-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search connections..."
                      className="pl-10 border-gray-200"
                    />
                  </div>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Pending Requests */}
            {transformedPendingRequests.length > 0 && (
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Pending Requests</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {transformedPendingRequests.map((request) => (
                    <div key={request.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={getAvatarUrl(request.user.image, request.user.name)} />
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                          {request.user.name?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{request.user.name}</h3>
                        <p className="text-gray-600 text-sm">{request.user.headline}</p>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                          {request.user.location && (
                            <>
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3" />
                                <span>{request.user.location}</span>
                              </div>
                              <span>•</span>
                            </>
                          )}
                          <span>{new Date(request.requestDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
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
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Connections List */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">My Connections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {transformedConnections.map((connection) => (
                    <div key={connection.id} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={getAvatarUrl(connection.user.image, connection.user.name)} />
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                            {connection.user.name?.charAt(0)?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        {connection.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{connection.user.name}</h3>
                        <p className="text-gray-600 text-sm truncate">{connection.user.headline}</p>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                          {connection.user.location && (
                            <>
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3" />
                                <span>{connection.user.location}</span>
                              </div>
                              <span>•</span>
                            </>
                          )}
                          <span>Connected {new Date(connection.connectedDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        <Button size="sm" variant="outline" >
                            <Link href={`chat/${chatHrefConstructor(connection.user.id, user.id)}`}>
                                <MessageSquare className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button size="sm" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Network Insights */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Network Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{transformedConnections.length}</div>
                    <div className="text-sm text-gray-600">Total Connections</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{transformedConnections.filter(c => new Date(c.connectedDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}</div>
                    <div className="text-sm text-gray-600">New This Month</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">85%</div>
                    <div className="text-sm text-gray-600">Response Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}