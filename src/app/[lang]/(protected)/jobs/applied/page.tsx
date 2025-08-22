import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Header from "../../components/Header"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/getCurrentUser"
import Link from "next/link"

export default async function AppliedJobsPage({ params }: { params: Promise<{ lang: 'en' | 'am' }> }) {
  const { lang } = await params
  const user = await getCurrentUser()

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Not authenticated</h1>
          <p className="text-gray-600 mb-4">Please log in to view your applications.</p>
          <Link href={`/${lang}/auth/login`} className="text-blue-600 hover:underline">Go to Login</Link>
        </div>
      </div>
    )
  }

  const applications = await prisma.jobApplication.findMany({
    where: { userId: user.id },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          createdAt: true,
          jobType: true,
          status: true
        }
      }
    },
    orderBy: { appliedAt: 'desc' }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Header lang={lang} user={user as any} />
      <div className="container mx-auto px-4 py-6">
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Jobs you applied to</CardTitle>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <p className="text-gray-500">You haven\'t applied to any jobs yet.</p>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-4 border rounded-md">
                    <div>
                      <Link href={`/${lang}/jobs/${app.job.id}`} className="text-blue-600 hover:underline font-medium">
                        {app.job.title}
                      </Link>
                      <div className="text-sm text-gray-600">
                        <span>{app.job.company}</span>
                        {app.job.location && <span> • {app.job.location}</span>}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Applied on {new Date((app as any).appliedAt).toLocaleDateString()} • {app.job.jobType.replace('_', ' ')} • {app.job.status}
                      </div>
                    </div>
                    <Link href={`/${lang}/jobs/${app.job.id}`} className="text-sm text-blue-600 hover:underline">View</Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


