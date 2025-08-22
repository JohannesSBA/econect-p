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
  MapPin,
  Filter,
  Check,
  X,
  MessageSquare,
  Clock,
} from "lucide-react"
import Link from "next/link"
import Header from "../components/Header"
import { getCurrentUser } from "@/lib/getCurrentUser"
import { User } from "@/../types/prisma"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export default async function PendingRequestsPage({ params }: { params: Promise<{ lang: 'en' | 'am' }> }) {
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

  // Fetch received connection requests
  const receivedRequests = await prisma.connection.findMany({
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
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Fetch sent connection requests
  const sentRequests = await prisma.connection.findMany({
    where: {
      senderId: user.id,
      status: 'PENDING'
    },
    include: {
      receiver: {
        select: {
          id: true,
          name: true,
          image: true,
          headline: true,
          location: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  async function handleAcceptRequest(id: string): Promise<void> {
    await prisma.connection.update({
      where: { id },
      data: { status: 'ACCEPTED' }
    })
    revalidatePath('/en/pending-requests')
    }

  async function handleDeclineRequest(id: string): Promise<void> {
    await prisma.connection.update({
      where: { id },
      data: { status: 'REJECTED' }
    })
    revalidatePath('/en/pending-requests')
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
                <CardTitle className="text-lg font-semibold">Connection Requests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Link href="/pending-requests" className="flex items-center space-x-2 p-2 rounded-lg bg-blue-50 text-blue-700">
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-medium">Received</span>
                    <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-700">
                      {receivedRequests.length}
                    </Badge>
                  </Link>
                  <Link href="/pending-requests?type=sent" className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 text-gray-700">
                    <UserPlus className="h-4 w-4" />
                    <span className="text-sm">Sent</span>
                    <Badge variant="secondary" className="ml-auto bg-gray-100 text-gray-700">
                      {sentRequests.length}
                    </Badge>
                  </Link>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Filter by</h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-gray-300" />
                      <span className="text-sm text-gray-700">High mutual connections</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-gray-300" />
                      <span className="text-sm text-gray-700">Same industry</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-gray-300" />
                      <span className="text-sm text-gray-700">Recent requests</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-gray-300" />
                      <span className="text-sm text-gray-700">With messages</span>
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
                        placeholder="Search requests..."
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
                      Accept all
                    </Button>
                    <Button variant="outline" size="sm">
                      Decline all
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Received Requests */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Received Requests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {receivedRequests.map((request) => (
                  <div key={request.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={request.sender.image || "/placeholder.svg?height=48&width=48"} />
                      <AvatarFallback className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
                        {request.sender.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{request.sender.name}</h3>
                          <p className="text-gray-600 text-sm">{request.sender.headline}</p>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                            {request.sender.location && (
                              <>
                                <div className="flex items-center space-x-1">
                                  <MapPin className="h-3 w-3" />
                                  <span>{request.sender.location}</span>
                                </div>
                                <span>•</span>
                              </>
                            )}
                            <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 mt-4">
                        <Button 
                          variant="default" 
                          className="bg-blue-600 hover:bg-blue-700 text-white" 
                          onClick={() => handleAcceptRequest(request.id)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => handleDeclineRequest(request.id)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Sent Requests */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Sent Requests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {sentRequests.map((request) => (
                  <div key={request.id} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={request.receiver.image || "/placeholder.svg?height=48&width=48"} />
                      <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                        {request.receiver.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{request.receiver.name}</h3>
                          <p className="text-gray-600 text-sm">{request.receiver.headline}</p>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                            {request.receiver.location && (
                              <>
                                <div className="flex items-center space-x-1">
                                  <MapPin className="h-3 w-3" />
                                  <span>{request.receiver.location}</span>
                                </div>
                                <span>•</span>
                              </>
                            )}
                            <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-3 mt-4">
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                        <Button size="sm" variant="outline">
                          <X className="h-4 w-4 mr-1" />
                          Withdraw
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Tips for managing requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Accept strategically</h4>
                    <p className="text-sm text-blue-700">Connect with people who can help your career or share valuable insights</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">Send personalized messages</h4>
                    <p className="text-sm text-green-700">Include a brief note explaining why you want to connect</p>
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