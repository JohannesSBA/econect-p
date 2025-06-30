import prisma from "@/app/lib/prisma";

export async function GET(req: Request) {
    console.log(req.url);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

  const listing = await prisma.jobListing.findUnique({
    where: {
      id: id as string,
    },
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

  return new Response(JSON.stringify(listing), { status: 200 });
}