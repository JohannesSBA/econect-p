import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";

// POST /api/posts/[id]/bookmark - Save a post
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: postId } = await params;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Ensure post exists
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const db: any = prisma as any
  const existing = await db.postBookmark.findUnique({
    where: { userId_postId: { userId: user.id, postId } },
  });
  if (existing) return NextResponse.json({ saved: true });

  await db.postBookmark.create({ data: { userId: user.id, postId } });
  return NextResponse.json({ saved: true });
}

// DELETE /api/posts/[id]/bookmark - Remove saved post
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: postId } = await params;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const db: any = prisma as any
  await db.postBookmark.deleteMany({ where: { userId: user.id, postId } });
  return NextResponse.json({ saved: false });
}
