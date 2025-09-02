"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MapPin, Check, X, MessageSquare, Clock } from "lucide-react"

type BasicUser = {
  id: string
  name: string
  image?: string | null
  headline?: string | null
  location?: string | null
}

type ReceivedRequest = {
  id: string
  createdAt: string | Date
  sender: BasicUser
}

type SentRequest = {
  id: string
  createdAt: string | Date
  receiver: BasicUser
}

interface PendingRequestsClientProps {
  lang: string
  receivedRequests: ReceivedRequest[]
  sentRequests: SentRequest[]
}

export default function PendingRequestsClient({ lang, receivedRequests, sentRequests }: PendingRequestsClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [received, setReceived] = useState<ReceivedRequest[]>(receivedRequests)
  const [sent] = useState<SentRequest[]>(sentRequests)

  async function acceptRequest(senderUserId: string) {
    await fetch("/api/connection/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: senderUserId }),
    })
    // Optimistically update and refresh server data
    setReceived(prev => prev.filter(r => r.sender.id !== senderUserId))
    startTransition(() => router.refresh())
  }

  async function declineRequest(senderUserId: string) {
    await fetch("/api/connection/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: senderUserId }),
    })
    setReceived(prev => prev.filter(r => r.sender.id !== senderUserId))
    startTransition(() => router.refresh())
  }

  return (
    <>
      {/* Received Requests */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Received Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {received.map((request) => (
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
                    disabled={isPending}
                    onClick={() => acceptRequest(request.sender.id)}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    disabled={isPending}
                    onClick={() => declineRequest(request.sender.id)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Decline
                  </Button>
                  <Button size="sm" variant="outline" disabled={isPending}>
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
          {sent.map((request) => (
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
                  <Button size="sm" variant="outline" disabled={isPending}>
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Message
                  </Button>
                  <Button size="sm" variant="outline" disabled>
                    <X className="h-4 w-4 mr-1" />
                    Withdraw
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  )
}


