"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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

export type FeedClientProps = {
  initialPosts: PostShape[]
  user: User
  initialCursor?: string | null
  trendingPosts?: PostShape[]
}

export function FeedClient({ initialPosts, user, initialCursor, trendingPosts = [] }: FeedClientProps) {
  const [posts, setPosts] = useState<PostShape[]>(initialPosts)
  const [cursor, setCursor] = useState<string | null | undefined>(initialCursor)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState<boolean>(Boolean(initialCursor))
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const [trending, setTrending] = useState<PostShape[]>(trendingPosts)

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

  // Infinite scroll using IntersectionObserver
  useEffect(() => {
    if (!hasMore) return
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver((entries) => {
      const [entry] = entries
      if (entry.isIntersecting && !loading) {
        void loadMore()
      }
    }, { rootMargin: '200px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [hasMore, loading])

  async function loadMore() {
    if (!cursor) { setHasMore(false); return }
    try {
      setLoading(true)
      const res = await fetch(`/api/posts?limit=8&cursor=${encodeURIComponent(cursor)}`, { cache: 'no-store' })
      if (!res.ok) { setHasMore(false); return }
      const data = await res.json()
      const nextPosts: PostShape[] = data.posts || []
      setPosts(prev => {
        const ids = new Set(prev.map(p => p.id))
        const merged = [...prev, ...nextPosts.filter(p => !ids.has(p.id))]
        return merged
      })
      setCursor(data.nextCursor || null)
      setHasMore(Boolean(data.nextCursor))
    } finally {
      setLoading(false)
    }
  }

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

  const trendingMapped = useMemo(() => trending.map((post) => ({
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
    likes: Array.isArray((post as any).likes) ? (post as any).likes.length : ((post as any)._count?.likes || 0),
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
    isBookmarked: false,
  })), [trending])

  const showTrending = mapped.length === 0 && trendingMapped.length > 0

  return (
    <div className="space-y-6">
      {mapped.map((p) => (
        <FeedPostCard key={p.id} post={p as any} user={user as any} />
      ))}
      {showTrending && (
        <>
          <div className="flex items-center gap-3 my-6">
            <div className="h-px bg-gray-200 flex-1" />
            <span className="text-xs uppercase tracking-wider text-gray-500">Trending Posts</span>
            <div className="h-px bg-gray-200 flex-1" />
          </div>
          {trendingMapped.map((p) => (
            <FeedPostCard key={`tr-${p.id}`} post={p as any} user={user as any} />
          ))}
        </>
      )}
      {!showTrending && (
        <>
          <div ref={sentinelRef} />
          {loading && <div className="text-center text-sm text-gray-500">Loading…</div>}
          {!hasMore && <div className="text-center text-xs text-gray-400">No more posts</div>}
        </>
      )}
    </div>
  )
}

function updateLikes(likes: Array<{ id: string; userId?: string }> | undefined, liked: boolean) {
  const count = Array.isArray(likes) ? likes.length : 0
  const next = Math.max(0, count + (liked ? 1 : -1))
  return new Array(next).fill(0).map((_, i) => ({ id: `temp-${i}` }))
}
