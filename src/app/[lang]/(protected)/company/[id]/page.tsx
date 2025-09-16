import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  MapPin,
  Clock,
  DollarSign,
  Building,
  Calendar,
  Users,
  ArrowLeft,
  ExternalLink,
  Globe,
  Mail,
  Phone,
  Share2,
} from "lucide-react"
import Link from "next/link"
import { chatHrefConstructor } from "@/lib/utils"
import Header from "../../components/Header"
import { getCurrentUser } from "@/lib/getCurrentUser"
import { User } from "@/../types/prisma"
import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import { getCompanyLogoUrl } from "@/lib/image-utils"
import FollowCompanyButton from "../../components/FollowCompanyButton"

export default async function CompanyPage({ 
  params 
}: { 
  params: Promise<{ lang: 'en' | 'am', id: string }> 
}) {
  const { lang, id } = await params
  const user = await getCurrentUser() as unknown as User

  // Handle case where user is not found
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">User not found</h1>
          <p className="text-gray-600 mb-4">Please log in with a valid account.</p>
          <Link href={`/${lang}/auth/login`}>
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Fetch company (employer) with all their job listings
  const company = await prisma.user.findUnique({
    where: { id },
    include: {
      jobListings: {
        where: {
          status: 'OPEN'
        },
        include: {
          applications: {
            select: {
              id: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  })

  if (!company || (company.role !== "EMPLOYER" && company.role !== "RECRUITER")) {
    notFound()
  }

  // Block visibility if either direction is blocked
  const blocked = await (prisma as any).userBlock.findFirst({
    where: {
      OR: [
        { blockerId: user.id, blockedId: id },
        { blockerId: id, blockedId: user.id },
      ]
    },
    select: { id: true }
  })
  if (blocked) {
    notFound()
  }

  // Determine if current user follows this company
  const follow = await (prisma as any).companyFollow.findFirst({
    where: { followerId: user.id, companyId: id },
    select: { id: true }
  })

  // Get company stats
  const companyStats = await prisma.jobListing.aggregate({
    where: {
      employerId: id,
      status: 'OPEN'
    },
    _count: {
      id: true
    }
  })

  const totalApplications = await prisma.jobApplication.count({
    where: {
      job: {
        employerId: id
      }
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Header lang={lang} user={user} />

      <div className="container mx-auto px-4 py-6">
        {/* Back Button */}
        <div className="mb-6">
          <Link href={`/${lang}/jobs`}>
            <Button variant="ghost" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Jobs</span>
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Company Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Header */}
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start space-x-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={getCompanyLogoUrl(company.image, company.name)} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-2xl">
                      {company.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{company.name}</h1>
                    {company.headline && (
                      <p className="text-lg text-gray-600 mb-4">{company.headline}</p>
                    )}
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      {company.location && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{company.location}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Building className="h-4 w-4" />
                        <span>{company.role === "EMPLOYER" ? "Employer" : "Recruiter"}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Member since {new Date(company.createdAt).getFullYear()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Company Stats */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Company Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{companyStats._count.id}</div>
                    <div className="text-sm text-gray-600">Active Jobs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{totalApplications}</div>
                    <div className="text-sm text-gray-600">Total Applications</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {company.jobListings.length > 0 
                        ? Math.round(totalApplications / company.jobListings.length) 
                        : 0}
                    </div>
                    <div className="text-sm text-gray-600">Avg. Applications</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {Math.round((new Date().getTime() - new Date(company.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 365))}
                    </div>
                    <div className="text-sm text-gray-600">Years Active</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Company Contact Info */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {company.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-700">{company.email}</span>
                  </div>
                )}
                {company.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-700">{company.phone}</span>
                  </div>
                )}
                {company.website && (
                  <div className="flex items-center space-x-3">
                    <Globe className="h-5 w-5 text-gray-400" />
                    <a 
                      href={company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {company.website}
                    </a>
                  </div>
                )}
                {company.location && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-700">{company.location}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Job Listings */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Open Positions ({company.jobListings.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {company.jobListings.length > 0 ? (
                  <div className="space-y-4">
                    {company.jobListings.map((job) => (
                      <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Link href={`/${lang}/jobs/${job.id}`}>
                              <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                                {job.title}
                              </h3>
                            </Link>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-4 w-4" />
                                <span>{job.location}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>{job.jobType.replace('_', ' ')}</span>
                              </div>
                              {job.salary && (
                                <div className="flex items-center space-x-1">
                                  <DollarSign className="h-4 w-4" />
                                  <span>{job.salary}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex flex-wrap gap-2">
                                {job.tags.slice(0, 3).map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {job.tags.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{job.tags.length - 3} more
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                {job.applications.length} applicants
                              </div>
                            </div>
                          </div>
                          <Link href={`/${lang}/jobs/${job.id}`}>
                            <Button size="sm" variant="outline">
                              View Job
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Building className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No open positions</h3>
                    <p className="text-gray-500">
                      This company doesn't have any open positions at the moment.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <FollowCompanyButton companyId={id} initiallyFollowing={Boolean(follow)} />
                <Link href={`/${lang}/chat/${chatHrefConstructor(user.id, id)}`}>
                  <Button variant="outline" className="w-full">
                    <Mail className="h-4 w-4 mr-2" />
                    Contact
                  </Button>
                </Link>
                <Button variant="outline" className="w-full">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Profile
                </Button>
              </CardContent>
            </Card>

            {/* Company Details */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Company Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Industry</h4>
                  <p className="text-sm text-gray-600">Technology</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Company Size</h4>
                  <p className="text-sm text-gray-600">50-200 employees</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Founded</h4>
                  <p className="text-sm text-gray-600">{new Date(company.createdAt).getFullYear()}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Type</h4>
                  <p className="text-sm text-gray-600">Private Company</p>
                </div>
              </CardContent>
            </Card>

            {/* Similar Companies */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Similar Companies</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Companies in similar industries and locations will appear here.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 
