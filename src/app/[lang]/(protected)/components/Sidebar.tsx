import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Briefcase, Users } from "lucide-react"
import Link from "next/link"
import { User } from "@/../types/prisma"
import { Separator } from "@/components/ui/separator"
import { getAvatarUrl } from "@/lib/image-utils"
import { getCurrentUser } from "@/lib/getCurrentUser"
import prisma from "@/lib/prisma"

export default async function Sidebar({ user, lang }: { user: any, lang: 'en' | 'am' | 'om' }) {
  const current = user ?? await getCurrentUser()

  let connectionsCount = 0
  let postsCount = 0
  let profileViewsCount = 0 // Profile views are not tracked yet
  let applicationsCount = 0
  let interviewsCount = 0
  let savedJobsCount = 0

  if (current?.id) {
    const [conn, posts, apps, interviews, saved] = await Promise.all([
      prisma.connection.count({
        where: {
          status: 'ACCEPTED',
          OR: [
            { senderId: current.id },
            { receiverId: current.id }
          ]
        }
      }),
      prisma.post.count({ where: { authorId: current.id } }),
      prisma.jobApplication.count({ where: { userId: current.id } }),
      prisma.jobApplication.count({ where: { userId: current.id, status: 'INTERVIEWED' } }),
      prisma.jobBookmark.count({ where: { userId: current.id } })
    ])

    connectionsCount = conn
    postsCount = posts
    applicationsCount = apps
    interviewsCount = interviews
    savedJobsCount = saved
  }
  return (
    <div className="lg:col-span-1 space-y-6 md:sticky top-20 self-start">
      {/* Profile Card */}
      <Card className="bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3 mb-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={getAvatarUrl((current as any)?.image, current?.name)} />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                {current?.name?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-600">{current?.name}</h3>
              <p className="text-sm text-gray-500">{current?.email}</p>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Profile Views</span>
              <span className="font-medium">{profileViewsCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Connections</span>
              <span className="font-medium">{connectionsCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Posts</span>
              <span className="font-medium">{postsCount}</span>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="space-y-2">
            <Link href={`/${lang}/profile`}>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                View Profile
              </Button>
            </Link>
            <Link href={`/${lang}/jobs`}>
              <Button variant="outline" className="w-full justify-start">
                <Briefcase className="h-4 w-4 mr-2" />
                Job Listings
              </Button>
            </Link>
            <Link href={`/${lang}/users`}>
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Find People
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card className="bg-white shadow-sm">
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Applications</span>
              <Badge variant="secondary">{applicationsCount}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Interviews</span>
              <Badge variant="secondary">{interviewsCount}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Saved Jobs</span>
              <Badge variant="secondary">{savedJobsCount}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      {current?.role && (current.role === 'EMPLOYER' || current.role === 'ADMIN' || current.role === 'RECRUITER') && (
        <div className="mt-4">
          <Link className="text-blue-600 hover:underline" href={`/${lang}/employer/dashboard`}>Employer Dashboard</Link>
        </div>
      )}
    </div>
  )
}