import { ApplicationStatus } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import { HttpError } from "@/lib/errors";
import { publishedJobWhere } from "@/lib/jobFilters";

export async function applyToJob(params: {
  userId: string;
  userName: string;
  jobId: string;
  coverLetter?: string | null;
  resumeUrl: string;
}) {
  const job = await prisma.jobListing.findFirst({
    where: { id: params.jobId, ...publishedJobWhere },
  });
  if (!job) throw new HttpError(404, "Job not found or not open");

  const existing = await prisma.jobApplication.findUnique({
    where: { userId_jobId: { userId: params.userId, jobId: params.jobId } },
  });
  if (existing) throw new HttpError(409, "You have already applied for this job");

  const application = await prisma.$transaction(async (tx) => {
    const app = await tx.jobApplication.create({
      data: {
        userId: params.userId,
        jobId: params.jobId,
        coverLetter: params.coverLetter ?? null,
        resumeUrl: params.resumeUrl,
        status: "PENDING",
      },
    });

    await tx.notification.create({
      data: {
        userId: job.employerId,
        type: "APPLICATION_UPDATE",
        title: "New job application",
        message: `${params.userName} applied to ${job.title}`,
        data: {
          jobId: params.jobId,
          applicantId: params.userId,
          applicationId: app.id,
        },
      },
    });

    return app;
  });

  return application;
}

export async function updateApplicationStatus(params: {
  applicationId: string;
  status: ApplicationStatus;
  actorId: string;
  actorRole: string;
  notify?: boolean;
}) {
  const app = await prisma.jobApplication.findUnique({
    where: { id: params.applicationId },
  });
  if (!app) throw new HttpError(404, "Application not found");

  const job = await prisma.jobListing.findUnique({
    where: { id: app.jobId },
    select: { employerId: true, title: true, company: true },
  });
  if (!job) throw new HttpError(404, "Job not found");

  if (job.employerId !== params.actorId && params.actorRole !== "ADMIN") {
    throw new HttpError(403, "Forbidden");
  }

  const { application: updated, job: returnJob } = await prisma.$transaction(async (tx) => {
    const updated = await tx.jobApplication.update({
      where: { id: params.applicationId },
      data: { status: params.status },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (params.notify) {
      await tx.notification.create({
        data: {
          userId: updated.userId,
          type: "APPLICATION_UPDATE",
          title: `Application status: ${params.status}`,
          message: `Your application for ${job.title} at ${job.company ?? ""} is now ${params.status}.`,
          data: {
            jobId: app.jobId,
            applicationId: updated.id,
            status: params.status,
          },
        },
      });
    }

    return { application: updated, job };
  });

  return { application: updated, job: returnJob };
}
