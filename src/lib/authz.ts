type Role =
  | "ADMIN"
  | "EMPLOYER"
  | "RECRUITER"
  | "JOB_SEEKER"
  | "CONTENT_REVIEWER"
  | "STUDENT"
  | string
  | undefined

export const adminRoles = new Set<Role>(["ADMIN"])
export const employerRoles = new Set<Role>(["EMPLOYER", "ADMIN", "RECRUITER"])
export const jobSeekerRoles = new Set<Role>(["JOB_SEEKER"])

export function isAdminRole(role: Role) {
  return adminRoles.has(role)
}

export function isEmployerRole(role: Role) {
  return employerRoles.has(role)
}

export function isJobSeekerRole(role: Role) {
  return jobSeekerRoles.has(role)
}

export function roleFromToken(token: unknown): Role {
  if (!token || typeof token !== "object") return undefined
  // next-auth JWT includes `role` we inject during login
  return (token as { role?: string }).role
}
