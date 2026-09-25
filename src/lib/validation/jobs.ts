import { z } from "zod";

export const createJobSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10),
  company: z.string().min(2).max(120),
  location: z.string().min(2).max(120),
  tags: z.array(z.string().min(1).max(40)).optional(),
  salary: z.string().max(120).optional(),
  jobType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN", "FREELANCE"]),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;

export const jobQuerySchema = z.object({
  q: z.string().max(200).optional(),
  status: z.enum(["OPEN", "CLOSED", "PAUSED", "UNDER_REVIEW", "all"]).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(10),
});
