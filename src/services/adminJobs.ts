import prisma from "@/lib/prisma";
import { JobStatus, Prisma } from "@/generated/prisma";

type UpdateAction = "approve" | "reject" | "feature" | "unfeature";

export async function listJobs(params: {
  search?: string;
  status?: JobStatus | "all";
  page: number;
  pageSize: number;
}) {
  const where: Prisma.JobListingWhereInput = {};
  if (params.status && params.status !== "all") {
    where.status = params.status;
  }
  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: "insensitive" } },
      { company: { contains: params.search, mode: "insensitive" } },
      { location: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [jobs, total] = await Promise.all([
    prisma.jobListing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      include: {
        employer: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.jobListing.count({ where }),
  ]);

  return { jobs, total };
}

export async function updateJobs(opts: {
  adminId: string;
  ids: string[];
  action: UpdateAction;
  reason?: string;
}) {
  const now = new Date();
  const updates = await prisma.$transaction(
    opts.ids.map((id) => {
      switch (opts.action) {
        case "approve":
          return prisma.jobListing.update({
            where: { id },
            data: {
              status: JobStatus.OPEN,
              isPublished: true,
              publishedAt: now,
              reviewedAt: now,
              reviewedById: opts.adminId,
              reviewNote: opts.reason || null,
            },
          });
        case "reject":
          return prisma.jobListing.update({
            where: { id },
            data: {
              status: JobStatus.PAUSED,
              isPublished: false,
              reviewedAt: now,
              reviewedById: opts.adminId,
              reviewNote: opts.reason || null,
            },
          });
        case "feature":
          return prisma.jobListing.update({
            where: { id },
            data: {
              isFeatured: true,
              reviewedAt: now,
              reviewedById: opts.adminId,
            },
          });
        case "unfeature":
          return prisma.jobListing.update({
            where: { id },
            data: {
              isFeatured: false,
              reviewedAt: now,
              reviewedById: opts.adminId,
            },
          });
      }
    }),
  );

  await prisma.adminAuditLog.createMany({
    data: opts.ids.map((id) => ({
      actorId: opts.adminId,
      action: `JOB_${opts.action.toUpperCase()}`,
      targetType: "job",
      targetId: id,
      details: opts.reason ? { reason: opts.reason } : undefined,
    })),
  });

  return updates;
}
