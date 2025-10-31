"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { socketManager } from "@/lib/socket";
import { PostCard as FeedPostCard } from "./PostCard";
import { User } from "@/../types/prisma";
import type { PostShape, UIMappedPost, PostComment } from "@/types/post";

export type FeedClientProps = {
  initialPosts: PostShape[];
  user: User;
  initialCursor?: string | null;
  trendingPosts?: PostShape[];
};

export function FeedClient({
  initialPosts,
  user,
  initialCursor,
  trendingPosts = [],
}: FeedClientProps) {
  const [posts, setPosts] = useState<PostShape[]>(initialPosts);
  const [cursor, setCursor] = useState<string | null | undefined>(
    initialCursor,
  );
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState<boolean>(Boolean(initialCursor));
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [trending] = useState<PostShape[]>(
    (trendingPosts || []).filter((p) => p.visibility === "PUBLIC"),
  );

  useEffect(() => {
    const onNewPost = (data: { post: PostShape }) => {
      const post = data?.post;
      if (!post?.id) return;
      setPosts((prev) => {
        if (prev.some((p) => p.id === post.id)) return prev;
        return [post, ...prev];
      });
    };
    const onLiked = (data: { postId: string; liked: boolean }) => {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === data.postId
            ? { ...p, likes: updateLikes(p.likes, data.liked, user.id) }
            : p,
        ),
      );
    };
    const onCommented = (data: { postId: string; comment: PostComment }) => {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === data.postId
            ? { ...p, comments: [...(p.comments || []), data.comment] }
            : p,
        ),
      );
    };
    socketManager.on("new_post", onNewPost);
    socketManager.on("post_liked", onLiked);
    socketManager.on("post_commented", onCommented);
    return () => {
      socketManager.off("new_post", onNewPost);
      socketManager.off("post_liked", onLiked);
      socketManager.off("post_commented", onCommented);
    };
  }, [user.id]);

  // [moved below] Infinite scroll using IntersectionObserver

  const loadMore = useCallback(async () => {
    if (!cursor) {
      setHasMore(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(
        `/api/posts?limit=8&cursor=${encodeURIComponent(cursor)}`,
        { cache: "no-store" },
      );
      if (!res.ok) {
        setHasMore(false);
        return;
      }
      const data = await res.json();
      const nextPosts: PostShape[] = data.posts || [];
      setPosts((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        const merged = [...prev, ...nextPosts.filter((p) => !ids.has(p.id))];
        return merged;
      });
      setCursor(data.nextCursor || null);
      setHasMore(Boolean(data.nextCursor));
    } finally {
      setLoading(false);
    }
  }, [cursor]);

  // Infinite scroll using IntersectionObserver
  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !loading) {
          void loadMore();
        }
      },
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, loadMore]);

  const mapped = useMemo<UIMappedPost[]>(
    () =>
      posts.map((post): UIMappedPost => {
        const imagesArr = Array.isArray(post.images)
          ? post.images
          : post.imageUrl
            ? [post.imageUrl]
            : [];
        const likeCount = Array.isArray(post.likes)
          ? post.likes.length
          : (post._count as { likes?: number } | undefined)?.likes || 0;
        const commentList = (post.comments || []).map((c) => ({
          id: c.id,
          content: c.content,
          createdAt: c.createdAt,
          user: {
            id: c.user?.id,
            name: c.user?.name,
            image: c.user?.image,
          },
        }));
        const isLikedByMe = Array.isArray(post.likes)
          ? post.likes.some((l) => l.userId === user.id)
          : false;
        const isBookmarkedByMe = Array.isArray(post.bookmarks)
          ? post.bookmarks.some((b) => b.userId === user.id)
          : false;

        return {
          id: post.id,
          content: post.content,
          type:
            (
              post as unknown as {
                type?: "TEXT" | "IMAGE" | "LINK" | "ARTICLE";
              }
            ).type || "TEXT",
          linkUrl: post.linkUrl || undefined,
          videoUrl: post.videoUrl || undefined,
          eventDate: post.eventDate || undefined,
          eventTime: post.eventTime || undefined,
          images: imagesArr,
          author: {
            id: post.author.id,
            name: post.author.name,
            image: post.author.image ?? undefined,
            headline: post.author.headline ?? undefined,
          },
          createdAt: post.createdAt,
          likes: likeCount,
          comments: commentList,
          shares: 0,
          isLiked: isLikedByMe,
          isBookmarked: isBookmarkedByMe,
        };
      }),
    [posts, user.id],
  );

  const trendingMapped = useMemo<UIMappedPost[]>(
    () =>
      trending.map((post): UIMappedPost => {
        const imagesArr = Array.isArray(post.images)
          ? post.images
          : post.imageUrl
            ? [post.imageUrl]
            : [];
        const likeCount = Array.isArray(post.likes)
          ? post.likes.length
          : (post._count as { likes?: number } | undefined)?.likes || 0;
        const commentList = (post.comments || []).map((c) => ({
          id: c.id,
          content: c.content,
          createdAt: c.createdAt,
          user: {
            id: c.user?.id,
            name: c.user?.name,
            image: c.user?.image,
          },
        }));

        return {
          id: post.id,
          content: post.content,
          type:
            (
              post as unknown as {
                type?: "TEXT" | "IMAGE" | "LINK" | "ARTICLE";
              }
            ).type || "TEXT",
          linkUrl: post.linkUrl || undefined,
          videoUrl: post.videoUrl || undefined,
          eventDate: post.eventDate || undefined,
          eventTime: post.eventTime || undefined,
          images: imagesArr,
          author: {
            id: post.author.id,
            name: post.author.name,
            image: post.author.image ?? undefined,
            headline: post.author.headline ?? undefined,
          },
          createdAt: post.createdAt,
          likes: likeCount,
          comments: commentList,
          shares: 0,
          isLiked: false,
          isBookmarked: false,
        };
      }),
    [trending],
  );

  const showTrending = mapped.length === 0 && trendingMapped.length > 0;

  return (
    <div className="space-y-6">
      {mapped.map((p) => (
        <FeedPostCard key={p.id} post={p} user={user} />
      ))}
      {showTrending && (
        <>
          <div className="flex items-center gap-3 my-6">
            <div className="h-px bg-gray-200 flex-1" />
            <span className="text-xs uppercase tracking-wider text-gray-500">
              Trending Posts
            </span>
            <div className="h-px bg-gray-200 flex-1" />
          </div>
          {trendingMapped.map((p) => (
            <FeedPostCard key={`tr-${p.id}`} post={p} user={user} />
          ))}
        </>
      )}
      {!showTrending && (
        <>
          <div ref={sentinelRef} />
          {loading && (
            <div className="text-center text-sm text-gray-500">Loading…</div>
          )}
          {!hasMore && (
            <div className="text-center text-xs text-gray-400">
              No more posts
            </div>
          )}
        </>
      )}
    </div>
  );
}

function updateLikes(
  likes: Array<{ id: string; userId?: string }> | undefined,
  liked: boolean,
  currentUserId: string,
) {
  const list = Array.isArray(likes) ? likes : [];
  const already = list.some((l) => l.userId === currentUserId);
  if (liked && !already) {
    return [...list, { id: `temp-${currentUserId}`, userId: currentUserId }];
  }
  if (!liked && already) {
    return list.filter((l) => l.userId !== currentUserId);
  }
  return list;
}
