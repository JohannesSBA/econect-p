import { getCurrentUser } from "@/lib/getCurrentUser";
import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function EmployerDashboard({ params }: { params: Promise<{ lang: 'en' | 'am' | 'om' }> }) {
  const { lang } = await params
  const user = await getCurrentUser()
  if (!user || (user.role !== 'EMPLOYER' && user.role !== 'ADMIN' && user.role !== 'RECRUITER')) {
    return <div className="p-8">Unauthorized</div>
  }

  const jobs = await prisma.jobListing.findMany({ where: { employerId: user.id }, orderBy: { createdAt: 'desc' } })

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Employer Dashboard</h1>
        <Link className="px-4 py-2 rounded bg-blue-600 text-white" href={`/${lang}/employer/jobs/new`}>Post a job</Link>
      </div>
      <div className="space-y-2">
        {jobs.map(job => (
          <div key={job.id} className="border rounded p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{job.title}</div>
              <div className="text-sm text-gray-600">{job.company} • {job.location}</div>
            </div>
            <div className="text-sm">{job.isPublished ? 'Published' : 'Draft'}</div>
          </div>
        ))}
        {jobs.length === 0 && <div className="text-sm text-gray-600">No jobs yet</div>}
      </div>
    </div>
  )
}

