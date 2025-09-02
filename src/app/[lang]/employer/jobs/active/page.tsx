import { getCurrentUser } from "@/lib/getCurrentUser";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import Header from "../../../(protected)/components/Header";

export default async function ActiveJobsPage({ params }: { params: Promise<{ lang: 'en' | 'am' | 'om' }> }) {
  const { lang } = await params
  const user = await getCurrentUser()
  if (!user) redirect(`/${lang}/auth/login`)
  const isEmployer = user.role === 'EMPLOYER' || user.role === 'ADMIN' || user.role === 'RECRUITER'
  if (!isEmployer) redirect(`/${lang}/dashboard`)

  const jobs = await prisma.jobListing.findMany({
    where: { employerId: user.id, isPublished: true, status: 'OPEN' },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { applications: true } } },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Header lang={lang} user={{ id: user.id, name: user.name, email: user.email, image: user.image || undefined, headline: (user as any).headline || undefined, role: user.role }} />
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Active Listings</h1>
          <Link href={`/${lang}/employer/jobs/new`} className="px-4 py-2 rounded bg-blue-600 text-white">New job</Link>
        </div>
        <div className="bg-white border rounded-lg divide-y">
          {jobs.map(j => (
            <div key={j.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">{j.title}</div>
                <div className="text-sm text-gray-600">{j.company} • {j.location}</div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">Applicants: {(j._count as any).applications}</div>
                <Link href={`/${lang}/employer/jobs/${j.id}/applicants`} className="text-blue-600 text-sm hover:underline">View applicants</Link>
              </div>
            </div>
          ))}
          {jobs.length === 0 && <div className="p-6 text-sm text-gray-600">No active listings.</div>}
        </div>
      </div>
    </div>
  )
}
