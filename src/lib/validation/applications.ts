import { z } from "zod";

export const APPLICATION_STATUSES = [
  "PENDING",
  "REVIEWING",
  "SHORTLISTED",
  "INTERVIEWED",
  "ACCEPTED",
  "HIRED",
  "REJECTED",
  "WITHDRAWN",
] as const;

export const applyJobSchema = z.object({
  jobId: z.string().min(1),
  coverLetter: z.string().max(5000).optional(),
  resumeUrl: z.string().url("Invalid resume URL"),
});

export const updateApplicationStatusSchema = z.object({
  applicationId: z.string().min(1),
  status: z.enum(APPLICATION_STATUSES),
  notify: z.boolean().optional().default(false),
});

export type ApplyJobInput = z.infer<typeof applyJobSchema>;
export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;
