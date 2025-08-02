import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, Building, Clock, DollarSign, Bookmark, ExternalLink } from "lucide-react"
import Link from "next/link"

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  jobType: string;
  salary: string;
  description: string;
  tags?: string[];
  employer?: {
    name: string;
    image: string | null;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
}

export default function JobCard({ job, user: _user }: { job: Job, user: User }) {
  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            {job.employer?.image ? (
              <AvatarImage src={job.employer.image} />
            ) : (
              <AvatarFallback>{job.company[0]}</AvatarFallback>
            )}
          </Avatar>
          <div>
            <CardTitle className="text-lg">{job.title}</CardTitle>
            <div className="text-sm text-gray-500 flex items-center space-x-2">
              <Building className="h-4 w-4" />
              <span>{job.company}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4 mb-2">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span className="text-sm">{job.location}</span>
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="text-sm">{job.jobType.replace("_", " ")}</span>
          <DollarSign className="h-4 w-4 text-gray-400" />
          <span className="text-sm">{job.salary}</span>
        </div>
        <div className="mb-2">
          {job.tags?.map((tag) => (
            <Badge key={tag} className="mr-2">{tag}</Badge>
          ))}
        </div>
        <p className="text-gray-700 mb-2">{job.description}</p>
        <div className="flex items-center space-x-4">
          <Link href={`/jobs/${job.id}`}>
            <button className="text-blue-600 hover:underline flex items-center">
              <ExternalLink className="h-4 w-4 mr-1" /> View
            </button>
          </Link>
          <button className="text-gray-500 hover:text-blue-600 flex items-center">
            <Bookmark className="h-4 w-4 mr-1" /> Bookmark
          </button>
        </div>
      </CardContent>
    </Card>
  )
} 