import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Clock,
  DollarSign,
  Bookmark,
  Share2,
  Building,
  Calendar,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import Header from "../../components/Header";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { User } from "@/../types/prisma";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import JobApplicationForm from "./components/JobApplicationForm";
import { getCompanyLogoUrl } from "@/lib/image-utils";

export default async function JobPage({
  params,
}: {
  params: Promise<{ lang: "en" | "am"; id: string }>;
}) {
  const { lang, id } = await params;
  const user = (await getCurrentUser()) as unknown as User;

  // Handle case where user is not found
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            User not found
          </h1>
          <p className="text-gray-600 mb-4">
            Please log in with a valid account.
          </p>
          <Link href={`/${lang}/auth/login`}>
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Fetch job listing with all related data
  const job = await prisma.jobListing.findUnique({
    where: { id },
    include: {
      employer: {
        select: {
          id: true,
          name: true,
          image: true,
          headline: true,
          location: true,
          website: true,
          createdAt: true,
        },
      },
      applications: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      bookmarks: {
        where: {
          userId: user.id,
        },
      },
    },
  });

  if (!job) {
    notFound();
  }

  // Check if user has already applied
  const hasApplied = job.applications.some((app) => app.user.id === user.id);
  const isBookmarked = job.bookmarks.length > 0;

  // Get company stats
  const companyStats = await prisma.jobListing.aggregate({
    where: {
      employerId: job.employerId,
      status: "OPEN",
    },
    _count: {
      id: true,
    },
  });

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
          {/* Main Job Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Link href={`/${lang}/company/${job.employer.id}`}>
                    <Avatar className="h-16 w-16">
                      <AvatarImage
                        src={getCompanyLogoUrl(
                          job.employer.image,
                          job.employer.name,
                        )}
                      />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg">
                        {job.employer.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>

                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                          {job.title}
                        </h1>
                        <Link href={`/${lang}/company/${job.employer.id}`}>
                          <p className="text-blue-600 font-medium text-lg hover:underline cursor-pointer">
                            {job.employer.name}
                          </p>
                        </Link>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 hover:text-blue-600"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`${isBookmarked ? "text-blue-600" : "text-gray-500"} hover:text-blue-600`}
                        >
                          <Bookmark className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 mt-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{job.jobType.replace("_", " ")}</span>
                      </div>
                      {job.salary && (
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-4 w-4" />
                          <span>{job.salary}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Posted {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Job Description */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {job.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Job Tags */}
            {job.tags.length > 0 && (
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle>Skills & Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {job.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Application Form */}
            {!hasApplied && user.role === "JOB_SEEKER" && (
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle>Apply for this position</CardTitle>
                </CardHeader>
                <CardContent>
                  <JobApplicationForm jobId={job.id} userId={user.id} />
                </CardContent>
              </Card>
            )}

            {hasApplied && (
              <Card className="bg-white shadow-sm border-green-200">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-green-600 text-lg font-medium mb-2">
                      ✓ Application Submitted
                    </div>
                    <p className="text-gray-600">
                      Your application has been successfully submitted for this
                      position.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Company Profile */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5" />
                  <span>About {job.employer.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={getCompanyLogoUrl(
                        job.employer.image,
                        job.employer.name,
                      )}
                    />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                      {job.employer.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {job.employer.name}
                    </h3>
                    {job.employer.headline && (
                      <p className="text-sm text-gray-600">
                        {job.employer.headline}
                      </p>
                    )}
                  </div>
                </div>

                {job.employer.location && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{job.employer.location}</span>
                  </div>
                )}

                {job.employer.website && (
                  <div className="flex items-center space-x-2 text-sm">
                    <ExternalLink className="h-4 w-4 text-gray-600" />
                    <a
                      href={job.employer.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Visit Website
                    </a>
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Active Jobs</span>
                    <span className="font-medium">
                      {companyStats._count.id}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Member Since</span>
                    <span className="font-medium">
                      {new Date(job.employer.createdAt).getFullYear()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Job Stats */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Job Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Applications</span>
                  <span className="font-medium">{job.applications.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Job Type</span>
                  <span className="font-medium">
                    {job.jobType.replace("_", " ")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Location</span>
                  <span className="font-medium">{job.location}</span>
                </div>
                {job.salary && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Salary</span>
                    <span className="font-medium">{job.salary}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Similar Jobs */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Similar Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  More jobs from {job.employer.name} and similar companies will
                  appear here.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
