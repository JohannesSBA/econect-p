import prisma from "@/lib/prisma";
import { publishedJobWhere } from "@/lib/jobFilters";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { Prisma } from "@/generated/prisma";

export async function GET(req: Request) {
    console.log(req.url);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

  const session = await getServerSession(authOptions);
  let where: Prisma.JobListingWhereInput = {
    id: id as string,
    ...publishedJobWhere,
  };

  if (session?.user?.email) {
    const me = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });
    if (me?.role === "ADMIN") {
      where = { id: id as string };
    } else if (me?.id) {
      where = {
        id: id as string,
        OR: [{ employerId: me.id }, { ...publishedJobWhere }],
      };
    }
  }

  const listing = await prisma.jobListing.findFirst({
    where,
    select: {
      id: true,
      title: true,
      location: true,
      createdAt: true,
      description: true,
      jobType: true,
      company: true,
      salary: true,
      tags: true,
      applications: true,
      employer: true,
      employerId: true,
      status: true,
    },
  });

  if (!listing) {
    return new Response(JSON.stringify({ error: "Job not found or not available" }), { status: 404 });
  }

  return new Response(JSON.stringify(listing), { status: 200 });
}
