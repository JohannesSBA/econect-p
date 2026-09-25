import { getServerSession } from "next-auth/next";

import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { HttpError } from "@/lib/errors";
import { isAdminRole, isEmployerRole } from "@/lib/authz";
import prisma from "@/lib/prisma";

export type AuthUser = {
  id: string;
  email: string;
  role: string;
  name: string | null;
  phone: string | null;
};

const USER_SELECT = {
  id: true,
  email: true,
  role: true,
  name: true,
  phone: true,
  isSuspended: true,
} as const;

async function getSessionUser(): Promise<AuthUser> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new HttpError(401, "Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: USER_SELECT,
  });

  if (!user) throw new HttpError(401, "Unauthorized");
  if (user.isSuspended) throw new HttpError(403, "Account suspended");

  return user;
}

export async function requireUser(): Promise<AuthUser> {
  return getSessionUser();
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!isAdminRole(user.role)) throw new HttpError(403, "Forbidden");
  return user;
}

export async function requireEmployer(): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!isEmployerRole(user.role)) throw new HttpError(403, "Forbidden");
  return user;
}

export function requireRole(user: AuthUser, ...roles: string[]): void {
  if (!roles.includes(user.role)) throw new HttpError(403, "Forbidden");
}

export async function requireEmployerOwner(
  jobId: string,
  userId: string,
): Promise<void> {
  const job = await prisma.jobListing.findUnique({
    where: { id: jobId },
    select: { employerId: true },
  });
  if (!job) throw new HttpError(404, "Job not found");
  if (job.employerId !== userId) throw new HttpError(403, "Forbidden");
}
