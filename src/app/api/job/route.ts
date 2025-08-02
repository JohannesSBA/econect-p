import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";

// GET /api/job
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const jobs = await prisma.jobListing.findMany({
    where: {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { company: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
      ],
    },
    include: { employer: true, applications: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json(jobs);
}

// POST /api/job
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user || (user.role !== "EMPLOYER" && user.role !== "RECRUITER" && user.role !== "ADMIN"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const data = await req.json();
  const job = await prisma.jobListing.create({
    data: {
      ...data,
      employerId: user.id,
    },
  });
  return NextResponse.json(job);
} 