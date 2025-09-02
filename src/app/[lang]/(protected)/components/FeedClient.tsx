"use client"

import { useEffect, useMemo, useState } from "react"
import { socketManager } from "@/lib/socket"
import { PostCard as FeedPostCard } from "./PostCard"
import { User } from "@/../types/prisma"

interface PostAuthor { id: string; name: string; image?: string | null; headline?: string | null }
interface PostCommentUser { id: string; name: string; image?: string | null }
interface PostComment { id: string; content: string; createdAt: string; user: PostCommentUser }
interface PostShape {
  id: string
  content: string
  type?: string
  linkUrl?: string | null
  author: PostAuthor
  createdAt: string
  likes?: Array<{ id: string; userId?: string }>
  comments?: Array<{ id: string; content: string; createdAt: string; user: PostCommentUser }>
  images?: string[]
  bookmarks?: Array<{ id: string }>
}

export function FeedClient({ initialPosts, user }: { initialPosts: PostShape[]; user: User }) {
  const [posts, setPosts] = useState<PostShape[]>(initialPosts)

  useEffect(() => {
    const onNewPost = (data: { post: PostShape }) => {
      const post = data?.post
      if (!post?.id) return
      setPosts(prev => {
        if (prev.some(p => p.id === post.id)) return prev
        return [post, ...prev]
      })
    }
    const onLiked = (data: { postId: string; liked: boolean }) => {
      setPosts(prev => prev.map(p => p.id === data.postId ? ({ ...p, likes: updateLikes(p.likes, data.liked) }) : p))
    }
    const onCommented = (data: { postId: string; comment: PostComment }) => {
      setPosts(prev => prev.map(p => p.id === data.postId ? ({ ...p, comments: [...(p.comments || []), data.comment] }) : p))
    }
    socketManager.on('new_post', onNewPost)
    socketManager.on('post_liked', onLiked as any)
    socketManager.on('post_commented', onCommented as any)
    return () => {
      socketManager.off('new_post', onNewPost)
      socketManager.off('post_liked', onLiked as any)
      socketManager.off('post_commented', onCommented as any)
    }
  }, [])

  const mapped = useMemo(() => posts.map((post) => ({
    id: post.id,
    content: (post as any).content,
    type: (post as any).type ?? "TEXT",
    linkUrl: (post as any).linkUrl ?? undefined,
    images: Array.isArray((post as any).images) ? (post as any).images : ((post as any).imageUrl ? [(post as any).imageUrl] : []),
    author: {
      id: post.author.id,
      name: post.author.name,
      image: post.author.image ?? undefined,
      headline: post.author.headline ?? undefined,
    },
    createdAt: (post as any).createdAt,
    likes: Array.isArray((post as any).likes) ? (post as any).likes.length : 0,
    comments: ((post as any).comments || []).map((c: any) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      user: {
        id: c.user?.id,
        name: c.user?.name,
        image: c.user?.image,
      }
    })),
    shares: 0,
    isLiked: false,
    isBookmarked: Array.isArray((post as any).bookmarks) ? ((post as any).bookmarks.length > 0) : false,
  })), [posts])

  return (
    <div className="space-y-6">
      {mapped.map((p) => (
        <FeedPostCard key={p.id} post={p as any} user={user as any} />
      ))}
    </div>
  )
}

function updateLikes(likes: Array<{ id: string; userId?: string }> | undefined, liked: boolean) {
  const count = Array.isArray(likes) ? likes.length : 0
  const next = Math.max(0, count + (liked ? 1 : -1))
  return new Array(next).fill(0).map((_, i) => ({ id: `temp-${i}` }))
}
