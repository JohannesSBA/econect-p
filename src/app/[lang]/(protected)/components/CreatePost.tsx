"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  ImageIcon,
  Link as LinkIcon,
  Video,
  Calendar,
  Globe,
  Send,
  Smile,
} from "lucide-react"
import { User } from "@/../types/prisma"
import { getAvatarUrl } from "@/lib/image-utils"

interface CreatePostProps {
  user: User
}

export function CreatePost({ user }: CreatePostProps) {
  const [content, setContent] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content.trim(),
          type: "TEXT",
        }),
      })

      if (response.ok) {
        setContent("")
        setIsExpanded(false)
        // Optionally refresh the feed or add the post to the list
      }
    } catch (error) {
      console.error("Error creating post:", error)
    }
  }

  return (
    <Card className="bg-white shadow-sm">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="flex items-start space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={getAvatarUrl((user as any)?.image, user?.name)} />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="font-medium text-gray-900">{user.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {user.role}
                </Badge>
              </div>
              <Textarea
                placeholder="What do you want to talk about?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onFocus={() => setIsExpanded(true)}
                className="min-h-[60px] border-0 bg-gray-50 hover:bg-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-500 resize-none"
                rows={isExpanded ? 3 : 2}
              />
              
              {isExpanded && (
                <div className="mt-3 space-y-3">
                  {/* Privacy selector */}
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Anyone</span>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-blue-600"
                      >
                        <ImageIcon className="h-4 w-4 mr-1" />
                        Media
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-blue-600"
                      >
                        <LinkIcon className="h-4 w-4 mr-1" />
                        Link
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-blue-600"
                      >
                        <Video className="h-4 w-4 mr-1" />
                        Video
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-blue-600"
                      >
                        <Calendar className="h-4 w-4 mr-1" />
                        Event
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-blue-600"
                      >
                        <Smile className="h-4 w-4 mr-1" />
                      </Button>
                    </div>
                    
                    <Button
                      type="submit"
                      disabled={!content.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Post
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 