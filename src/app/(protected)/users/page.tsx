import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Search,
  Users,
  MessageSquare,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import Header from "../components/Header"
import { getCurrentUser } from "@/lib/getCurrentUser"
import prisma from "@/lib/prisma"
import { chatHrefConstructor } from "@/lib/utils"
import ConnectionButton, { type ConnectionStatus } from "@/components/ConnectionButton"
import type { Prisma } from "@/generated/prisma"

interface UsersPageProps {
  searchParams: Promise<{ page?: string; search?: string }>
}

const USERS_PER_PAGE = 12

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const { page = "1", search = "" } = await searchParams
  const currentPage = parseInt(page)
  const currentUserAuth = await getCurrentUser()

  if (!currentUserAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Not authenticated</h1>
          <p className="text-gray-600 mb-4">Please log in to view users.</p>
        </div>
      </div>
    )
  }

  // Fetch current user with full profile data
  const currentUser = await prisma.user.findUnique({
    where: { id: currentUserAuth.id }
  })

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">User not found</h1>
          <p className="text-gray-600 mb-4">Please log in with a valid account.</p>
        </div>
      </div>
    )
  }

  // Build where clause for filtering
  const whereClause: Prisma.UserWhereInput = {
    id: { not: currentUser.id },
    role: { not: "ADMIN" } // Exclude admin accounts
  }

  // Add search filter if provided
  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { headline: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
      {
        profile: {
          skills: {
            some: {
              skill: {
                name: { contains: search, mode: "insensitive" },
              },
            },
          },
        },
      },
    ]
  }

  // Get total count for pagination
  const totalUsers = await prisma.user.count({
    where: whereClause
  })

  const totalPages = Math.ceil(totalUsers / USERS_PER_PAGE)
  const skip = (currentPage - 1) * USERS_PER_PAGE

  // Fetch users with pagination
  const users = await prisma.user.findMany({
    where: whereClause,
    include: {
      profile: {
        include: {
          skills: {
            include: {
              skill: true
            }
          }
        }
      }
    },
    orderBy: {
      name: 'asc'
    },
    skip,
    take: USERS_PER_PAGE
  })

  // Fetch current user's connections to show connection status
  const currentUserConnections = await prisma.connection.findMany({
    where: {
      OR: [
        { senderId: currentUser.id },
        { receiverId: currentUser.id }
      ]
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={{
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        image: currentUser.image || undefined,
        headline: currentUser.headline || undefined,
        role: currentUser.role
      }} />

      <div className="container mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover People</h1>
          <p className="text-gray-600">Connect with professionals in your network</p>
        </div>

        {/* Search and Filters */}
        <Card className="bg-white shadow-sm mb-6">
          <CardContent className="p-6">
            <form className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    name="search"
                    placeholder="Search by name, company, or skills..."
                    className="pl-10"
                    defaultValue={search}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="outline" size="sm">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
                {search && (
                  <Link href="/users">
                    <Button variant="outline" size="sm">
                      Clear
                    </Button>
                  </Link>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Results Info */}
        <div className="mb-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Showing {skip + 1}-{Math.min(skip + users.length, totalUsers)} of {totalUsers} users
          </p>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {users.map((user) => {
            // Check connection status
            const connection = currentUserConnections.find(
              conn => (conn.senderId === user.id && conn.receiverId === currentUser.id) ||
                     (conn.senderId === currentUser.id && conn.receiverId === user.id)
            )
            
            const isConnected = connection?.status === 'ACCEPTED'
            const hasPendingRequest = connection?.status === 'PENDING'
            const isRequestSentByMe = hasPendingRequest && connection?.senderId === currentUser.id
            const connectionStatus: ConnectionStatus = connection ? connection.status as ConnectionStatus : "NONE"

            return (
              <Card key={user.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={user.image || "/placeholder.svg?height=64&width=64"} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                        {user.name?.split(" ").map(n => n[0]).join("").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <Link href={`/user/${user.id}`}>
                        <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors truncate">
                          {user.name}
                        </h3>
                      </Link>
                      <p className="text-gray-600 text-sm truncate">{user.headline || "Professional"}</p>
                      
                      {user.location && (
                        <div className="flex items-center space-x-1 mt-1 text-xs text-gray-500">
                          <MapPin className="h-3 w-3" />
                          <span>{user.location}</span>
                        </div>
                      )}

                      {/* Skills */}
                      {user.profile?.skills && user.profile.skills.length > 0 && (
                        <div className="mt-3">
                          <div className="flex flex-wrap gap-1">
                            {user.profile.skills.slice(0, 3).map((skillOnProfile) => (
                              <Badge key={skillOnProfile.id} variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                {skillOnProfile.skill.name}
                              </Badge>
                            ))}
                            {user.profile.skills.length > 3 && (
                              <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                                +{user.profile.skills.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Connection Status and Actions */}
                      <div className="flex items-center space-x-2 mt-4">
                        {isConnected ? (
                          <Link href={`/chat/${chatHrefConstructor(currentUser.id, user.id)}`}>
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Message
                            </Button>
                          </Link>
                        ) : (
                          <ConnectionButton 
                            userId={user.id} 
                            connectionStatus={connectionStatus}
                            isRequestSentByMe={isRequestSentByMe}
                          />
                        )}
                        
                        <Link href={`/user/${user.id}`}>
                          <Button size="sm" variant="outline">
                            View Profile
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  {currentPage > 1 && (
                    <Link href={`/users?page=${currentPage - 1}${search ? `&search=${search}` : ''}`}>
                      <Button variant="outline" size="sm">
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                    </Link>
                  )}
                  
                  {currentPage < totalPages && (
                    <Link href={`/users?page=${currentPage + 1}${search ? `&search=${search}` : ''}`}>
                      <Button variant="outline" size="sm">
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {users.length === 0 && (
          <Card className="bg-white shadow-sm">
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600">
                {search 
                  ? `No users match your search for "${search}". Try a different search term.`
                  : "There are no other users in the system yet."
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 
