import { getCurrentUser } from "@/lib/getCurrentUser";
import prisma from "@/lib/prisma";
import Link from "next/link";
import Header from "../../(protected)/components/Header";
import { redirect } from "next/navigation";
import { Briefcase, Archive, PlusCircle, Users, Building2, ChevronRight } from "lucide-react";

export default async function EmployerDashboard({ params }: { params: Promise<{ lang: 'en' | 'am' | 'om' }> }) {
  const { lang } = await params
  const user = await getCurrentUser()
  if (!user) redirect(`/${lang}/auth/login`)
  const isEmployer = user.role === 'EMPLOYER' || user.role === 'ADMIN' || user.role === 'RECRUITER'
  if (!isEmployer) redirect(`/${lang}/dashboard`)

  const jobs = await prisma.jobListing.findMany({
    where: { employerId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { applications: true } } },
  })

  const totalJobs = jobs.length
  const activeJobs = jobs.filter(j => j.isPublished && j.status === 'OPEN').length
  const totalApplicants = jobs.reduce((acc, j) => acc + (j._count as any).applications, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header lang={lang} user={{ id: user.id, name: user.name, email: user.email, image: user.image || undefined, headline: (user as any).headline || undefined, role: user.role }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">Welcome, {user.name?.split(' ')[0] || 'Employer'}</h1>
          <p className="mt-2 text-gray-600">Manage your job listings and applicants</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          <Link className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 p-6 shadow-lg transition-transform hover:scale-[1.02] hover:shadow-xl group" href={`/${lang}/employer/jobs/active`}>
            <div className="flex items-center">
              <span className="flex-shrink-0 rounded-full h-12 w-12 bg-white/20 text-white flex items-center justify-center mr-4 transition-colors group-hover:bg-white group-hover:text-blue-600">
                <Briefcase className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold text-white text-lg">Active Listings</h2>
                <p className="text-blue-100 text-sm mt-1">Manage current job postings</p>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 opacity-10 transform translate-x-4 translate-y-4">
              <Briefcase className="h-24 w-24" />
            </div>
          </Link>
          
          <Link className="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 p-6 shadow-lg transition-transform hover:scale-[1.02] hover:shadow-xl group" href={`/${lang}/employer/jobs/archived`}>
            <div className="flex items-center">
              <span className="flex-shrink-0 rounded-full h-12 w-12 bg-white/20 text-white flex items-center justify-center mr-4 transition-colors group-hover:bg-white group-hover:text-indigo-600">
                <Archive className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold text-white text-lg">Archived Jobs</h2>
                <p className="text-indigo-100 text-sm mt-1">View past job listings</p>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 opacity-10 transform translate-x-4 translate-y-4">
              <Archive className="h-24 w-24" />
            </div>
          </Link>
          
          <Link className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 shadow-lg transition-transform hover:scale-[1.02] hover:shadow-xl group" href={`/${lang}/employer/jobs/new`}>
            <div className="flex items-center">
              <span className="flex-shrink-0 rounded-full h-12 w-12 bg-white/20 text-white flex items-center justify-center mr-4 transition-colors group-hover:bg-white group-hover:text-emerald-600">
                <PlusCircle className="h-6 w-6" />
              </span>
              <div>
                <h2 className="font-semibold text-white text-lg">New Listing</h2>
                <p className="text-emerald-100 text-sm mt-1">Create a job posting</p>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 opacity-10 transform translate-x-4 translate-y-4">
              <PlusCircle className="h-24 w-24" />
            </div>
          </Link>
        </div>
        
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Dashboard Overview</h2>
          </div>
          
          <div className="p-6">
            <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { id: 1, name: 'Total Jobs posted', stat: totalJobs, icon: Building2 },
                { id: 2, name: 'Total Active Listings', stat: activeJobs, icon: Briefcase },
                { id: 3, name: 'Total applicants across all jobs', stat: totalApplicants, icon: Users },
              ].map((item) => (
                <div
                  key={item.id}
                  className="relative overflow-hidden rounded-lg bg-white border border-gray-100 px-6 py-5 shadow-sm hover:shadow transition duration-300"
                >
                  <dt className="flex items-center">
                    <div className="flex-shrink-0 rounded-md bg-indigo-600 p-3 shadow-sm">
                      <item.icon
                        className="h-6 w-6 text-white"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="ml-4 truncate text-sm font-medium text-gray-600">
                      {item.name}
                    </p>
                  </dt>
                  <dd className="mt-4">
                    <p className="text-3xl font-semibold text-gray-900">{item.stat}</p>
                    
                    <div className="mt-4">
                      <Link
                        href={`/${lang}/employer/jobs/active`}
                        className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        View details
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </div>
                  </dd>
                </div>
              ))}
            </dl>
            
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Recent Listings</h3>
            <Link href={`/${lang}/employer/jobs/active`} className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl divide-y">
            {jobs.slice(0,6).map(job => (
              <div key={job.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{job.title}</div>
                  <div className="text-sm text-gray-600">{job.company} • {job.location}</div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className={`text-xs px-2 py-1 rounded-full ${job.isPublished && job.status==='OPEN' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{job.isPublished && job.status==='OPEN' ? 'Active' : 'Archived'}</div>
                  <div className="text-sm text-gray-600 flex items-center"><Users className="h-4 w-4 mr-1" /> {(job._count as any).applications}</div>
                  <Link href={`/${lang}/employer/jobs/${job.id}/applicants`} className="text-blue-600 text-sm hover:underline">Applicants</Link>
                </div>
              </div>
            ))}
            {jobs.length === 0 && (
              <div className="p-6 text-sm text-gray-600">No jobs yet — <Link className="text-blue-600 hover:underline" href={`/${lang}/employer/jobs/new`}>create your first listing</Link>.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
