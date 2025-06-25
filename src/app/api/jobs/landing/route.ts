
import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    console.log('Fetching jobs...');
  try {
    const jobs = await prisma.jobListing.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 3,
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        salary: true,
        createdAt: true,
      },
    });

    console.log('Jobs fetched:', jobs);
    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job listings' },
      { status: 500 }
    );
  }
}
