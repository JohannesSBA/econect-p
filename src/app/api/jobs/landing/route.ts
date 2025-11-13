
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

const paidListingFilter = {
  isPublished: true,
  status: 'OPEN' as const,
  payments: {
    some: {
      status: 'PAID' as const,
    },
  },
};

export async function GET(request: Request) {

    console.log(request.url);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    console.log(search);

    if (search) {
        try {
            const jobs = await prisma.jobListing.findMany({
                where: {
                    ...paidListingFilter,
                    title: {
                        contains: search,
                        mode: 'insensitive'
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: 3,
                select: {
                    id: true,
                    title: true,
                    company: true,
                    location: true,
                    salary: true,
                    createdAt: true
                }
            });

            return NextResponse.json(jobs);
        } catch (error) {
            console.error('Error fetching jobs:', error);
            return NextResponse.json(
                { error: 'Failed to fetch job listings' },
                { status: 500 }
            );
        }
    }

    try {
        const jobs = await prisma.jobListing.findMany({
            where: paidListingFilter,
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

    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job listings' },
      { status: 500 }
    );
  }
}
