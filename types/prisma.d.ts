export type UserRole = 'ADMIN' | 'MODERATOR' | 'EMPLOYER' | 'JOB_SEEKER'

export interface CreateUserInput {
  name: string
  phone: string
  language?: string
  role: UserRole
}

export interface JobListing {
  title: string
  description: string
  company: string
  location: string
  tags: string[]
  salary?: string
  jobType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN' | 'FREELANCE'
  status?: 'OPEN' | 'CLOSED' | 'PAUSED'
  employerId: string
}


export interface CreateProfileInput {
  bio?: string
  experience?: string
  education?: string
  resumeUrl?: string
  skills: string[]
  jobSeekerId: string
}

export interface ApplyToJobInput {
  userId: string
  jobId: string
}

export interface CreateJobApplicationInput {
  jobId: string
  jobSeekerId: string
  status: 'APPLIED' | 'VIEWED' | 'INTERVIEWED' | 'HIRED' | 'REJECTED'
}

export interface CreateJobApplicationInput {
  jobId: string
  jobSeekerId: string
  status: 'APPLIED' | 'VIEWED' | 'INTERVIEWED' | 'HIRED' | 'REJECTED'
}
