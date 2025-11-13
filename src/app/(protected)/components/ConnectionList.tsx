"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar"
import { Users, Badge, Search, MessageCircle, User, UserMinus } from "lucide-react"
import { useState } from "react"
import { User as Connection } from "@/../types/prisma"
import { useRouter } from "next/navigation"
import { chatHrefConstructor } from "@/lib/utils"
import { toast } from "sonner"

export function ConnectionsList({ friends, userId }: { friends: Connection[], userId: string }) {
  const [connections, setConnections] = useState<Connection[]>(friends)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"recent" | "lastName">("recent")

  const router = useRouter()

  const filteredConnections = connections
    .filter(
      (connection) =>
        connection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        connection.email.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortBy === "recent") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      } else {
        const aLastName = a.name.split(" ").pop() || ""
        const bLastName = b.name.split(" ").pop() || ""
        return aLastName.localeCompare(bLastName)
      }
    })

  const handleMessage = (connection: Connection) => {
    const chatHref = chatHrefConstructor(userId, connection.id)
    if (chatHref) {
      router.push(`/chat/${chatHref}`)
    } else {
      toast.error("Failed to generate chat link")
    }
  }

  const handleViewProfile = (connection: Connection) => {
    console.log("View profile", connection.name)
    // Navigate to user profile
  }

  const handleUnfriend = (connectionId: string) => {
    setConnections(connections.filter((conn) => conn.id !== connectionId))
    console.log("Unfriended connection")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{connections.length} Connections</h1>
        <Button variant="outline" className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50">
          <Users className="mr-2 h-4 w-4" />
          Requests
          <Badge className="ml-2 bg-blue-600 text-white">1</Badge>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search connections..."
          className="pl-10 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Sort Options */}
      <div className="flex items-center space-x-4">
        <span className="text-gray-700 font-medium">Sort by:</span>
        <div className="flex space-x-2">
          <Button
            variant={sortBy === "recent" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("recent")}
            className={
              sortBy === "recent"
                ? "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200"
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            }
          >
            Recent
          </Button>
          <Button
            variant={sortBy === "lastName" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("lastName")}
            className={
              sortBy === "lastName"
                ? "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200"
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            }
          >
            Last Name
          </Button>
        </div>
      </div>

      {/* Connections List */}
      <div className="space-y-4">
        {connections.length === 0 ? (
          <Card className="bg-white shadow-sm">
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No connections found</h3>
              <p className="text-gray-600">
                {searchQuery ? "Try adjusting your search terms." : "Start connecting with professionals in Ethiopia!"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredConnections.map((connection) => (
            <Card key={connection.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={connection.id || "/placeholder.svg"} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                        {connection.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{connection.name}</h3>
                      <p className="text-gray-600">{connection.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Button
                      onClick={() => handleMessage(connection)}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Message
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleViewProfile(connection)}
                      className="bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleUnfriend(connection.id)}
                      className="bg-white border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                    >
                      <UserMinus className="mr-2 h-4 w-4" />
                      Unfriend
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Connection Stats */}
      {filteredConnections.length > 0 && (
        <div className="text-center text-gray-500 text-sm">
          Showing {filteredConnections.length} of {connections.length} connections
        </div>
      )}
    </div>
  )
}
