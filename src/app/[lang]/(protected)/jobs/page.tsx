import { Button } from "@/components/ui/button";

import Link from "next/link";
import Header from "../components/Header";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { User } from "@/../types/prisma";
import prisma from "@/lib/prisma";
import JobsPageClient from "./components/JobsPageClient";

export default async function JobsPage({
  params,
}: {
  params: Promise<{ lang: "en" | "am" }>;
}) {
  const { lang } = await params;
  const user = (await getCurrentUser()) as unknown as User;

  // Handle case where user is not found
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
          <Link href={`/${lang}/auth/login`}>
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Fetch job listings with employer information and bookmarks
  const jobListings = await prisma.jobListing.findMany({
    include: {
      employer: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      applications: {
        select: {
          id: true,
        },
      },
      bookmarks: {
        where: {
          userId: user.id,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header lang={lang} user={user} />
      <JobsPageClient
        user={user}
        initialJobs={jobListings.map((job) => ({
          ...job,
          salary: job.salary ?? undefined,
          createdAt: job.createdAt.toISOString(),
          updatedAt: job.updatedAt.toISOString(),
          employer: {
            ...job.employer,
            image: job.employer.image ?? undefined,
          },
        }))}
      />
    </div>
  );
}
