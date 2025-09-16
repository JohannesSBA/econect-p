"use client"

import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Toast, useToast } from "@/components/ui/toast"
import {
  MoreHorizontal,
  ThumbsUp,
  MessageCircle,
  Share,
  Bookmark,
  Send,
  Link as LinkIcon,
  ShieldAlert,
  Ban,
} from "lucide-react"
import { User } from "@/../types/prisma"
import { getAvatarUrl } from "@/lib/image-utils"

interface PostAuthor {
  id: string
  name: string
  image?: string
  headline?: string
}

interface PostCommentUser {
  id: string
  name: string
  image?: string
}

interface PostComment {
  id: string
  content: string
  createdAt: Date | string
  user: PostCommentUser
}

interface Post {
  id: string
  content: string
  type: "TEXT" | "IMAGE" | "LINK" | "ARTICLE"
  linkUrl?: string
  author: PostAuthor
  createdAt: Date | string
  likes: number
  comments: PostComment[]
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
  const [comments, setComments] = useState<PostComment[]>(post.comments || [])
  const [commentCount, setCommentCount] = useState((post.comments || []).length)
  const [showComments, setShowComments] = useState(false)
  const [comment, setComment] = useState("")
  const [hidden, setHidden] = useState(false)

  // Image preview modal state
  const images: string[] = useMemo(() => (post as any)?.images ?? [], [post])
  const [activeImage, setActiveImage] = useState<string | null>(null)
  const [isImageOpen, setIsImageOpen] = useState(false)

  // Report dialog state
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const [reporting, setReporting] = useState(false)

  // Block confirm state
  const [blockOpen, setBlockOpen] = useState(false)
  const [blocking, setBlocking] = useState(false)

  const { toasts, showToast, removeToast } = useToast()

  const handleLike = async () => {
    try {
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json().catch(() => ({} as any))
        const nextLiked = typeof data?.liked === "boolean" ? data.liked : !isLiked
        setIsLiked(nextLiked)
        setLikeCount(nextLiked ? likeCount + 1 : likeCount - 1)
        try {
          // Broadcast like event
          const payload = { postId: post.id, liked: nextLiked }
          ;(await import('@/lib/socket')).socketManager.emit('post_liked', payload)
        } catch {}
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
      const response = await fetch(`/api/posts/${post.id}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: comment.trim() }),
      })

      if (response.ok) {
        const data = await response.json().catch(() => null as any)
        const created = (data?.comment ?? null) as PostComment | null
        if (created) {
          setComments(prev => [...prev, created])
          setCommentCount(prev => prev + 1)
          try {
            // Broadcast comment event
            const payload = { postId: post.id, comment: created }
            ;(await import('@/lib/socket')).socketManager.emit('post_commented', payload)
          } catch {}
        } else {
          setCommentCount(prev => prev + 1)
        }
        setComment("")
        if (!showComments) setShowComments(true)
      }
    } catch (error) {
      console.error("Error adding comment:", error)
    }
  }

  const formatDate = (dateInput: Date | string) => {
    const date = new Date(dateInput)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return date.toLocaleDateString()
  }

  if (hidden) return null

  return (
    <>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setReportOpen(true)}>
                <ShieldAlert className="h-4 w-4" />
                Report post
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setBlockOpen(true)} variant="destructive">
                <Ban className="h-4 w-4" />
                Block {post.author?.name?.split(" ")[0] || "user"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Post Content */}
        <div className="mb-4">
          <p className="text-gray-800 mb-2 whitespace-pre-wrap">{post.content}</p>
          {post.type === "IMAGE" && Array.isArray((post as any).images) && (post as any).images.length > 0 && (
            <div className={`grid ${((post as any).images.length === 2 ? 'grid-cols-2' : (post as any).images.length >= 3 ? 'grid-cols-3' : 'grid-cols-1')} gap-2 mt-2`}>
              {(post as any).images.slice(0,3).map((url: string, idx: number) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={idx}
                  src={url}
                  alt={`post-image-${idx+1}`}
                  className="w-full h-48 object-cover rounded-lg border cursor-pointer hover:opacity-95"
                  loading="lazy"
                  onClick={() => {
                    setActiveImage(url)
                    setIsImageOpen(true)
                  }}
                />
              ))}
            </div>
          )}
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
            <span>{commentCount} comments</span>
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
            <span className="text-sm">{isBookmarked ? 'Saved' : 'Save'}</span>
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

            {/* Real Comments */}
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={getAvatarUrl(c.user?.image, c.user?.name)} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs">
                      {c.user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">{c.user?.name || "User"}</span>
                      <span className="text-xs text-gray-500">{formatDate(c.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
      {/* Toasts */}
      {toasts.map(t => (
        <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
      ))}
    </Card>
    {/* Image Lightbox */}
    {isImageOpen && (
      <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
        <DialogContent className="max-w-xs sm:max-w-sm p-0" showCloseButton>
          <div className="w-full h-72 flex items-center justify-center bg-black/5 rounded">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImage || ""}
              alt="post-image-full"
              className="max-h-64 max-w-full object-contain rounded"
            />
          </div>
        </DialogContent>
      </Dialog>
    )}

    {/* Report Post Dialog */}
    <Dialog open={reportOpen} onOpenChange={(o) => !reporting && setReportOpen(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report this post</DialogTitle>
          <DialogDescription>
            Tell us briefly why you are reporting this post.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Input
            placeholder="Reason (e.g., Spam, Harassment, Misinformation, Other)"
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setReportOpen(false)} disabled={reporting}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!reportReason.trim()) {
                  showToast("Please provide a reason to report.", "info")
                  return
                }
                try {
                  setReporting(true)
                  const res = await fetch(`/api/posts/${post.id}/report`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reason: reportReason.trim() })
                  })
                  if (res.ok) {
                    showToast("Report submitted. Thank you.", "success")
                    setReportOpen(false)
                    setReportReason("")
                  } else {
                    const data = await res.json().catch(() => ({} as any))
                    showToast(data?.error || "Failed to submit report.", "error")
                  }
                } catch (e) {
                  console.error(e)
                  showToast("Network error while reporting.", "error")
                } finally {
                  setReporting(false)
                }
              }}
              disabled={reporting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {reporting ? "Submitting…" : "Submit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Block User Confirm */}
    <AlertDialog open={blockOpen} onOpenChange={(o) => !blocking && setBlockOpen(o)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Block {post.author?.name || "this user"}?
          </AlertDialogTitle>
        </AlertDialogHeader>
        <p className="text-sm text-gray-600">
          You won’t see content from this user. They won’t be notified.
        </p>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={blocking}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700"
            disabled={blocking}
            onClick={async () => {
              try {
                setBlocking(true)
                const res = await fetch(`/api/user/block`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ userId: post.author?.id })
                })
                if (res.ok) {
                  showToast("User blocked.", "success")
                  setHidden(true)
                  setBlockOpen(false)
                } else {
                  const data = await res.json().catch(() => ({} as any))
                  showToast(data?.error || "Failed to block user.", "error")
                }
              } catch (e) {
                console.error(e)
                showToast("Network error while blocking.", "error")
              } finally {
                setBlocking(false)
              }
            }}
          >
            {blocking ? "Blocking…" : "Block"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
