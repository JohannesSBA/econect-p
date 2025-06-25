import {z} from "zod"

export const createUserSchema = z.object({
  name: z.string(),
  phone: z.string(),
  language: z.string().optional(),
  role: z.enum(['ADMIN', 'MODERATOR', 'EMPLOYER', 'JOB_SEEKER']),
})

export const createJobListingSchema = z.object({
  title: z.string(),
  description: z.string(),
  company: z.string(),
  location: z.string(),
  tags: z.array(z.string()),
  salary: z.string().optional(),
  jobType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'FREELANCE']).optional(),
  status: z.enum(['OPEN', 'CLOSED', 'PAUSED']).optional(),
  employerId: z.string(),
})

export const createProfileSchema = z.object({
  bio: z.string().optional(),
  experience: z.string().optional(),
  education: z.string().optional(),
  resumeUrl: z.string().optional(),
  skills: z.array(z.string()),
  jobSeekerId: z.string(),
})

export const applyToJobSchema = z.object({
  userId: z.string(),
  jobId: z.string(),
})

export const createJobApplicationSchema = z.object({
  jobId: z.string(),
  jobSeekerId: z.string(),
  status: z.enum(['APPLIED', 'VIEWED', 'INTERVIEWED', 'HIRED', 'REJECTED']),
})
