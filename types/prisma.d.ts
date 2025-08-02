export type UserRole = 'ADMIN' | 'MODERATOR' | 'EMPLOYER' | 'JOB_SEEKER' | 'RECRUITER'

export interface CreateUserInput {
  name: string
  phone: string
  language?: string
  role: UserRole
}

export interface JobListing {
  id: string
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

export interface User {
        id:           string,
      name:         string,
      email:        string,
      phone:        string,
      role:         UserRole,
      createdAt:    Date,
      applications: JobApplication[],
      friendOf:     User[],
      jobListings:  JobListing[],
      messagesRead: boolean,
      language:     string,
      friends:      User[],
      messagesReceived: boolean,
      messagesSent: boolean,
      password:     string,
      pendingFriendRequest: boolean,
      profile:      Profile,
      sentFriendRequest: boolean,
      sessions:     Session[],
}

export interface Experience {
  id: string
  title: string
  company: string
  startDate: string
  endDate: string
  description: string
  jobSeekerId: string
}

export interface Education {
  id: string
  school: string
  degreeType: string
  fieldOfStudy: string
  StartYear: string
  EndYear: string
  activites: string
  grade: number
  jobSeekerId: string
  skills: string[]
}