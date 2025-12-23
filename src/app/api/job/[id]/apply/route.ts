import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";
import { publishedJobWhere } from "@/lib/jobFilters";

// POST /api/job/:id/apply
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.role !== "JOB_SEEKER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { coverLetter, resumeUrl } = await req.json();
  const { id } = await params;
  const job = await prisma.jobListing.findFirst({ where: { id, ...publishedJobWhere } });
  if (!job) return NextResponse.json({ error: "Job not found or not open" }, { status: 404 });
  const app = await prisma.jobApplication.create({
    data: {
      userId: user.id,
      jobId: id,
      coverLetter,
      resumeUrl,
    },
  });
  // Optionally: notify employer
  return NextResponse.json(app);
}
