import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { User } from "@/../types/prisma";
import { PostCard } from "../../components/posts/PostCard";
type DbPost = {
  id: string;
  title: string | null;
  content: string;
  type: "TEXT" | "IMAGE" | "LINK" | "ARTICLE";
  visibility: "PUBLIC" | "PRIVATE" | "UNLISTED";
  linkUrl: string | null;
  videoUrl: string | null;
  imageUrl: string | null;
  images: string[];
  eventDate: Date | null;
  eventTime: string | null;
  createdAt: Date;
  author: {
    id: string;
    name: string;
    image: string | null;
    headline: string | null;
  };
  likes: Array<{ id: string; userId: string }>;
  comments: Array<{
    id: string;
    content: string;
    createdAt: Date;
    user: { id: string; name: string; image: string | null };
  }>;
  bookmarks: Array<{ id: string; userId: string }>;
  _count: { likes: number; comments: number };
};

export default async function PostPage({
  params,
}: {
  params: Promise<{ postid: string }>;
}) {
  const { postid } = await params;
  const user = (await getCurrentUser()) as unknown as User | null;

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            User not found
          </h1>
          <p className="text-gray-600 mb-4">
            Please log in with a valid account.
          </p>
          <Link href="/auth/login">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Load single post with relations similar to feed
  const post = (await prisma.post.findUnique({
    where: { id: postid },
    include: {
      author: {
        select: { id: true, name: true, image: true, headline: true },
      },
      likes: { select: { id: true, userId: true } },
      comments: {
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "asc" },
      },
      bookmarks: {
        where: { userId: user.id },
        select: { id: true, userId: true },
      },
      _count: { select: { likes: true, comments: true } },
    },
  })) as DbPost | null;

  if (!post) {
    notFound();
  }

  const images: string[] = Array.isArray(post.images)
    ? post.images
    : post.imageUrl
      ? [post.imageUrl]
      : [];

  const postProp = {
    id: post.id,
    content: post.content,
    type: post.type,
    linkUrl: post.linkUrl || undefined,
    videoUrl: post.videoUrl || undefined,
    images,
    eventDate: post.eventDate ? post.eventDate.toISOString() : undefined,
    eventTime: post.eventTime || undefined,
    author: {
      id: post.author.id,
      name: post.author.name,
      image: post.author.image || undefined,
      headline: post.author.headline || undefined,
    },
    createdAt: post.createdAt,
    likes: post._count?.likes ?? post.likes.length,
    comments: post.comments.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      user: {
        id: c.user.id,
        name: c.user.name,
        image: c.user.image || undefined,
      },
    })),
    shares: 0,
    isLiked: post.likes.some((l) => l.userId === user.id),
    isBookmarked: post.bookmarks.some((b) => b.userId === user.id),
  };

  // Single post view layout matching dashboard spacing
  return (
    <div className="min-h-screen">
      <Header user={user} />

      <div className="container mx-auto px-4 max-w-screen py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
          {/* Center column for the post */}
          <div className="lg:col-start-2 lg:col-span-2 space-y-6">
            <Card className="bg-white shadow-sm">
              <CardContent className="p-4">
                <Link href="/dashboard">
                  <Button variant="ghost" className="text-gray-600">
                    Back to Feed
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <PostCard
              post={
                postProp as unknown as Parameters<typeof PostCard>[0]["post"]
              }
              user={user}
            />
          </div>

          {/* Right sidebar */}
          <Sidebar user={user} />
        </div>
      </div>
    </div>
  );
}
