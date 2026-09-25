import prisma from "@/lib/prisma";
import { publishedJobWhere } from "@/lib/jobFilters";
import { getCached, setCached } from "@/lib/cache";
import { Logger } from "@/lib/logger";

const paidListingFilter = {
  ...publishedJobWhere,
};

export async function getLandingJobs(params: { search?: string | null; limit?: number; logger: Logger }) {
  const { search, limit = 3, logger } = params;

  const cacheKey = search
    ? `jobs:landing:search:${search.toLowerCase()}`
    : `jobs:landing:latest`;

  const cached = getCached<any[]>(cacheKey);
  if (cached) return cached;

  const where = search
    ? {
        ...paidListingFilter,
        title: { contains: search, mode: "insensitive" as const },
      }
    : paidListingFilter;

  const jobs = await prisma.jobListing.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      company: true,
      location: true,
      salary: true,
      createdAt: true,
    },
  });

  setCached(cacheKey, jobs, 60_000);
  logger.debug("jobs.landing", { search: search ?? "", count: jobs.length });
  return jobs;
}
