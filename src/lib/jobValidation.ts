import { z } from "zod";

export const jobInputSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10),
  company: z.string().min(2).max(120),
  location: z.string().min(2).max(120),
  tags: z.array(z.string().min(1).max(40)).optional(),
  salary: z.string().max(120).optional(),
  jobType: z.enum([
    "FULL_TIME",
    "PART_TIME",
    "CONTRACT",
    "INTERN",
    "FREELANCE",
  ]),
});

export type JobInput = z.infer<typeof jobInputSchema>;

export function parseJobInput(body: unknown): JobInput {
  return jobInputSchema.parse(body);
}
