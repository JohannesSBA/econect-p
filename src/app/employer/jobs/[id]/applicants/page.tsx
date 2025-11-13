import { getCurrentUser } from "@/lib/getCurrentUser";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import Header from "../../../../(protected)/components/Header";
import ApplicantsClient from "./ApplicantsClient";

export default async function JobApplicantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params as any
  const user = await getCurrentUser()
  if (!user) redirect(`/auth/login`)
  const isEmployer = user.role === 'EMPLOYER' || user.role === 'ADMIN' || user.role === 'RECRUITER'
  if (!isEmployer) redirect(`/dashboard`)

  const job = await prisma.jobListing.findUnique({
    where: { id },
    include: {
      applications: {
        orderBy: { appliedAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        }
      }
    }
  })
  if (!job || job.employerId !== user.id) redirect(`/employer/dashboard`)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={{ id: user.id, name: user.name, email: user.email, image: user.image || undefined, headline: (user as any).headline || undefined, role: user.role }} />
      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Applicants — {job.title}</h1>
          <p className="text-gray-600">{job.company} • {job.location}</p>
        </div>

        <ApplicantsClient
          jobId={job.id}
          initialApplications={job.applications.map((a:any)=>({
            id: a.id,
            status: a.status,
            appliedAt: a.appliedAt,
            resumeUrl: a.resumeUrl,
            user: { id: a.user?.id, name: a.user?.name, email: a.user?.email }
          }))}
        />

        <div className="mt-6">
          <Link href="/employer/dashboard" className="text-blue-600 hover:underline">Back to dashboard</Link>
        </div>
      </div>
    </div>
  )
}
