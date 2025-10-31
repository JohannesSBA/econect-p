import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Header from "../../(protected)/components/Header";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { User } from "@/../types/prisma";
import { FeedClient } from "../../(protected)/components/posts/FeedClient";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ lang: "en" | "am"; id: string }>;
}) {
  const { lang, id } = await params;
  const viewer = (await getCurrentUser()) as unknown as User | null;

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, image: true, headline: true } },
      likes: { select: { id: true, userId: true } },
      comments: {
        select: {
          id: true,
          content: true,
          createdAt: true,
          user: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      bookmarks: { select: { id: true, userId: true } },
      _count: { select: { likes: true, comments: true, bookmarks: true } },
    },
  });

  if (!post) return notFound();

  // Visibility enforcement
  if (post.visibility === "PRIVATE") {
    if (!viewer) return notFound();
    // Only allow if viewer is connected with author; fallback: allow author
    const isAuthor = viewer.id === post.authorId;
    const connection = await prisma.connection.findFirst({
      where: {
        status: "ACCEPTED",
        OR: [
          { senderId: viewer.id, receiverId: post.authorId },
          { senderId: post.authorId, receiverId: viewer.id },
        ],
      },
    });
    if (!isAuthor && !connection) return notFound();
  }

  if (post.visibility === "UNLISTED") {
    // Unlisted is accessible only via direct link - which we are using.
    // No extra check required beyond not exposing it in feeds.
  }

  const user = viewer as User | null;
  const initialPosts = [
    {
      id: post.id,
      title: post.title,
      content: post.content,
      type: post.type,
      linkUrl: post.linkUrl,
      videoUrl: post.videoUrl,
      imageUrl: post.imageUrl,
      images: post.images,
      author: post.author as any,
      createdAt: post.createdAt.toISOString(),
      likes: post.likes as any,
      comments: post.comments as any,
      bookmarks: post.bookmarks as any,
      _count: post._count as any,
      visibility: post.visibility,
      eventDate: post.eventDate ? post.eventDate.toISOString() : null,
      eventTime: post.eventTime,
    },
  ];

  return (
    <div className="min-h-screen">
      <Header lang={lang} user={user as any} />
      <div className="container mx-auto px-4 max-w-screen py-6">
        <FeedClient
          initialPosts={initialPosts as any}
          user={(user as any) || ({} as any)}
          initialCursor={null}
          trendingPosts={[]}
        />
      </div>
    </div>
  );
}
