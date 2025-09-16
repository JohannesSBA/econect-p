import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";

// POST /api/company/[id]/follow - Follow a company (employer/recruiter)
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const me = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
  if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { id: companyId } = await params
  if (me.id === companyId) return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 })

  const target = await prisma.user.findUnique({ where: { id: companyId }, select: { id: true, role: true } })
  if (!target) return NextResponse.json({ error: "Company not found" }, { status: 404 })
  const isCompany = ["EMPLOYER", "RECRUITER", "ADMIN"].includes(target.role as any)
  if (!isCompany) return NextResponse.json({ error: "Only employer pages can be followed" }, { status: 400 })

  try {
    await (prisma as any).companyFollow.create({
      data: {
        followerId: me.id,
        companyId,
      }
    })
  } catch {}

  return NextResponse.json({ ok: true })
}

// DELETE /api/company/[id]/follow - Unfollow
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const me = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
  if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 })
  const { id: companyId } = await params

  await (prisma as any).companyFollow.deleteMany({ where: { followerId: me.id, companyId } })
  return NextResponse.json({ ok: true })
}

