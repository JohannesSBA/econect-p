import { JobStatus, PaymentStatus, Prisma, UserRole } from "@/generated/prisma";

// Centralized filter for jobs that are allowed to be visible publicly.
export const publishedJobWhere: Prisma.JobListingWhereInput = {
  status: JobStatus.OPEN,
  isPublished: true,
  payments: { some: { status: PaymentStatus.PAID } },
  AND: [
    {
      OR: [
        { employer: { role: UserRole.ADMIN } },
        { employer: { employerProfile: { isVerified: true } } },
      ],
    },
  ],
};

export const isVisibleJobStatus = (status: JobStatus) =>
  status === JobStatus.OPEN;
