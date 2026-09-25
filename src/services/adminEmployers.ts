import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";

type EmployerAction = "verify" | "suspend";

export async function listEmployers(params: {
  search?: string;
  status?: "pending" | "verified" | "all";
  page: number;
  pageSize: number;
}) {
  const where: Prisma.EmployerProfileWhereInput = {};
  if (params.status === "pending") {
    where.isVerified = false;
  } else if (params.status === "verified") {
    where.isVerified = true;
  }
  if (params.search) {
    where.OR = [
      { companyName: { contains: params.search, mode: "insensitive" } },
      { user: { name: { contains: params.search, mode: "insensitive" } } },
      { user: { email: { contains: params.search, mode: "insensitive" } } },
    ];
  }

  const [employers, total] = await Promise.all([
    prisma.employerProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        verifiedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.employerProfile.count({ where }),
  ]);

  return { employers, total };
}

export async function updateEmployers(opts: {
  adminId: string;
  ids: string[];
  action: EmployerAction;
  reason?: string;
}) {
  const now = new Date();
  const updates = await prisma.$transaction(
    opts.ids.map((id) => {
      switch (opts.action) {
        case "verify":
          return prisma.employerProfile.update({
            where: { id },
            data: {
              isVerified: true,
              verifiedAt: now,
              verifiedById: opts.adminId,
              verificationNote: opts.reason || null,
            },
            include: { user: { select: { id: true, name: true, email: true } } },
          });
        case "suspend":
          return prisma.employerProfile.update({
            where: { id },
            data: {
              isVerified: false,
              verifiedAt: now,
              verifiedById: opts.adminId,
              verificationNote: opts.reason || null,
            },
            include: { user: { select: { id: true, name: true, email: true } } },
          });
      }
    }),
  );

  await prisma.adminAuditLog.createMany({
    data: opts.ids.map((id) => ({
      actorId: opts.adminId,
      action: `EMPLOYER_${opts.action.toUpperCase()}`,
      targetType: "employerProfile",
      targetId: id,
      details: opts.reason ? { reason: opts.reason } : undefined,
    })),
  });

  return updates;
}
