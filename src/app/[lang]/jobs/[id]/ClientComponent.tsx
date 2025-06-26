"use client"
import { JobListing } from "@/generated/prisma";
import { useEffect, useState, use, Suspense } from "react";
import axios from "axios";
import Header from "@/components/Header";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, Building2, Calendar, Clock, DollarSign, Link, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type JobPageProps = {
    id: string;
}

export default function JobPage({id}: JobPageProps) {

  console.log(id);
  const [job, setJob] = useState<JobListing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await axios.get(`/api/jobs/application?id=${id}`);
        const data = response.data;
        console.log(data);
        setJob(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load job');
        console.error('Fetch error:', err);
      }
    };

    fetchJob();
  }, [id]);

  console.log(job);

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  if (!job) {
    return (
        <div className="w-screen h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    )
  }

    function handleApply(event: React.MouseEvent<HTMLButtonElement>): void {
        throw new Error("Function not implemented.");
    }

  return (
    <div>
        <Suspense fallback={ <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                        <Image src="/icon1.png" alt="Econnect" width={32} height={32} />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Econnect
                    </span>
                </div>
            </div>
        </header> }>
        </Suspense>
        <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Job Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <Link href={`/employer/${job.employerId}`} className="shrink-0">
                {/* <Image
                  src={job.employerId as string || "/placeholder.svg"}
                  alt={`${job.company} logo`}
                  width={80}
                  height={80}
                  className="rounded-lg border hover:opacity-80 transition-opacity"
                /> */}
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{job.title}</CardTitle>
                    <div className="flex flex-wrap items-center gap-4 text-gray-600">
                      <div className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        <span className="font-medium">{job.company}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{job.jobType}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-end gap-2">
                    <div className="flex items-center gap-1 text-green-600 font-semibold">
                      <DollarSign className="w-4 h-4" />
                      <span>{job.salary}</span>
                    </div>
                    <div  className="w-fit border rounded-full text-xs px-2 py-1">
                      {job.status === "OPEN" ? <h1 className="text-green-600">Actively Hiring</h1> : <h1 className="text-red-600">Closed</h1>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Description */}
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-gray max-w-none">
                  <div className="whitespace-pre-line text-gray-700 leading-relaxed">{job.description}</div>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Skills & Technologies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {job.tags.map((tag, index) => (
                    <Badge key={index}  className="text-sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Application Card */}
            <Card>
              <CardHeader>
                <CardTitle>Apply for this position</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoggedIn ? (
                  <div className="space-y-4">
                    {hasApplied ? (
                      <div className="text-center py-4">
                        <div className="text-green-600 font-medium mb-2">Application Submitted!</div>
                        <p className="text-sm text-gray-600">We'll review your application and get back to you soon.</p>
                      </div>
                    ) : (
                      <Button onClick={handleApply} className="w-full" size="lg" disabled={job.status !== "OPEN"}>
                        Apply Now
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 text-center">Sign in to apply for this position</p>
                    <div className="space-y-2">
                      <Button className="w-full" size="lg" onClick={() => router.push('/auth/login')}>
                        Sign In
                      </Button>
                      <Button className="w-full" onClick={() => router.push('/auth/signup')}>
                        Sign Up
                      </Button>
                    </div>
                  </div>
                )}

                {/* <Separator /> */}

                <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
                  <Users className="w-4 h-4" />
                  <span>{job.applications.length} applications</span>
                </div>
              </CardContent>
            </Card>

            {/* Job Details */}
            <Card>
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Job Type</span>
                    <span className="font-medium">{job.jobType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Salary</span>
                    <span className="font-medium">{job.salary}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location</span>
                    <span className="font-medium">{job.location}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Posted</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-sm">{formatDate(new Date(job.createdAt).toISOString())}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle>About {job.company}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <Link href={`/employer/${job.employerId}`}>
                    {/* <Image
                      src={job.employerId as string || "/placeholder.svg"}
                      alt={`${job.company} logo`}
                      width={48}
                      height={48}
                      className="rounded-lg border hover:opacity-80 transition-opacity"
                    /> */}
                  </Link>
                  <div>
                    <h3 className="font-semibold">{job.company}</h3>
                    <p className="text-sm text-gray-600">Technology Company</p>
                  </div>
                </div>
                <Link href={`/employer/${job.employerId}`}>
                  <Button variant="outline" className="w-full">
                    View Company Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
        
    </div>
  );
}