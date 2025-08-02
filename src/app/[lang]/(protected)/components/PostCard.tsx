"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  MoreHorizontal,
  ThumbsUp,
  MessageCircle,
  Share,
  Bookmark,
  Send,
  Link as LinkIcon,
} from "lucide-react"
import { User } from "@/../types/prisma"
import { getAvatarUrl } from "@/lib/image-utils"

interface PostAuthor {
  id: string
  name: string
  image?: string
  headline?: string
}

interface Post {
  id: string
  content: string
  type: "TEXT" | "IMAGE" | "LINK" | "ARTICLE"
  linkUrl?: string
  author: PostAuthor
  createdAt: Date
  likes: number
  comments: number
  shares: number
  isLiked: boolean
  isBookmarked: boolean
}

interface PostCardProps {
  post: Post
  user: User
}

export function PostCard({ post, user }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked)
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked)
  const [likeCount, setLikeCount] = useState(post.likes)
  const [showComments, setShowComments] = useState(false)
  const [comment, setComment] = useState("")

  const handleLike = async () => {
    try {
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: isLiked ? "DELETE" : "POST",
      })

      if (response.ok) {
        setIsLiked(!isLiked)
        setLikeCount(isLiked ? likeCount - 1 : likeCount + 1)
      }
    } catch (error) {
      console.error("Error toggling like:", error)
    }
  }

  const handleBookmark = async () => {
    try {
      const response = await fetch(`/api/posts/${post.id}/bookmark`, {
        method: isBookmarked ? "DELETE" : "POST",
      })

      if (response.ok) {
        setIsBookmarked(!isBookmarked)
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error)
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return

    try {
      const response = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: comment.trim() }),
      })

      if (response.ok) {
        setComment("")
        // Optionally refresh comments
      }
    } catch (error) {
      console.error("Error adding comment:", error)
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return date.toLocaleDateString()
  }

  return (
    <Card className="bg-white shadow-sm">
      <CardContent className="p-6">
        {/* Post Header */}
        <div className="flex items-start space-x-3 mb-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={getAvatarUrl(post.author.image, post.author.name)} />
            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              {post.author.name?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900">{post.author.name}</h3>
              {post.author.headline && (
                <Badge variant="secondary" className="text-xs">
                  {post.author.headline}
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
          </div>
          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Post Content */}
        <div className="mb-4">
          <p className="text-gray-800 mb-2 whitespace-pre-wrap">{post.content}</p>
          {post.type === "LINK" && post.linkUrl && (
            <div className="mt-3 p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <LinkIcon className="h-4 w-4 text-blue-600" />
                <span className="text-blue-600 text-sm">{post.linkUrl}</span>
              </div>
            </div>
          )}
        </div>

        {/* Post Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-4">
            <span>{likeCount} likes</span>
            <span>{post.comments} comments</span>
            <span>{post.shares} shares</span>
          </div>
        </div>

        <Separator className="mb-4" />

        {/* Action Buttons */}
        <div className="flex items-center space-x-6 mb-4">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-2 transition-colors ${
              isLiked ? "text-blue-600" : "text-gray-500 hover:text-blue-600"
            }`}
          >
            <ThumbsUp className="h-5 w-5" />
            <span className="text-sm">Like</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm">Comment</span>
          </button>
          <button className="flex items-center space-x-2 text-gray-500 hover:text-green-600 transition-colors">
            <Share className="h-5 w-5" />
            <span className="text-sm">Share</span>
          </button>
          <button
            onClick={handleBookmark}
            className={`flex items-center space-x-2 transition-colors ${
              isBookmarked ? "text-blue-600" : "text-gray-500 hover:text-blue-600"
            }`}
          >
            <Bookmark className="h-5 w-5" />
            <span className="text-sm">Save</span>
          </button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <>
            <Separator className="mb-4" />
            
            {/* Add Comment */}
            <div className="flex items-center space-x-3 mb-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src={getAvatarUrl((user as any)?.image, user?.name)} />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <form onSubmit={handleComment} className="flex-1 flex space-x-2">
                <Input
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="flex-1 border-gray-200"
                />
                <Button
                  type="submit"
                  disabled={!comment.trim()}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>

            {/* Sample Comments */}
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs">
                    E
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">Econnect</span>
                    <span className="text-xs text-gray-500">2h ago</span>
                  </div>
                  <p className="text-sm text-gray-700">Congratulations! Welcome to the team! 🎉</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs">
                    FU
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">Fordham University</span>
                    <span className="text-xs text-gray-500">1h ago</span>
                  </div>
                  <p className="text-sm text-gray-700">Great to see our alumni succeeding! #FordhamPride</p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
} 