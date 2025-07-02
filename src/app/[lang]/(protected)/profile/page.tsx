import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Briefcase,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Eye,
  GraduationCap,
} from "lucide-react"
import Link from "next/link"
import Header from "../components/Header"
import { getCurrentUser } from "@/lib/getCurrentUser"
import { EditContentModal } from "../components/EditContentModal"
import { User as UserType } from "@/../types/prisma"
import { Experience } from "@/../types/prisma"
import DeleteExperience from "../components/DeleteExperience"
import ExperienceSection from "./ExperienceSection"
import EducationSection from "./EducationSection"

export default async function ProfilePage() {

    const user = await getCurrentUser() as unknown as UserType

    console.log(user.profile?.experiences)
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Same as Dashboard */}
      <Header lang="en" />

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Right Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card className="bg-white shadow-sm relative">
              <CardContent className="p-6 text-center">
                <div className="absolute top-2 right-2 hover:text-gray-700 cursor-pointer transition-colors hover:bg-blue-100 rounded-full p-1">
                  {/* <EditContentModal type="picture" /> */}
                </div>
                <Avatar className="h-32 w-32 mx-auto mb-4">
                  <AvatarImage src="/placeholder.svg?height=128&width=128" />
                  <AvatarFallback className="text-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                    {user?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{user?.name}</h2>
                <p className="text-lg text-gray-600 mb-6">Co-Founder of Econnect</p>

                <div className="space-y-3 text-left">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{user?.email}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{user?.phone}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">60123, Addis Ababa, Bole, Ethiopia</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                  <FileText className="mr-2 h-4 w-4" />
                  View Posts
                </Button>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                  <Eye className="mr-2 h-4 w-4" />
                  View Resume
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
                >
                  <EditContentModal type="resume" user={{...user, skills: []}} />
                  Upload Resume
                </Button>
              </CardContent>
            </Card>

            {/* Additional Info */}
            <Card className="bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <Link href="/about" className="text-gray-600 hover:text-blue-600">
                    About
                  </Link>
                  <Link href="/accessibility" className="text-gray-600 hover:text-blue-600">
                    Accessibility
                  </Link>
                  <Link href="/privacy" className="text-gray-600 hover:text-blue-600">
                    Privacy & Terms
                  </Link>
                  <Link href="/faq" className="text-gray-600 hover:text-blue-600">
                    FAQ&apos;s
                  </Link>
                  <Link href="/advertising" className="text-gray-600 hover:text-blue-600">
                    Advertising
                  </Link>
                  <Link href="/contact" className="text-gray-600 hover:text-blue-600">
                    Contact
                  </Link>
                </div>
                <Separator className="my-3" />
                <p className="text-xs text-gray-500 text-center">🇪🇹 Econnect Corporation © 2024</p>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2 space-y-6">
            {/* About Section */}
            <Card className="bg-white shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-gray-600" />
                  <CardTitle className="text-lg font-semibold">About</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                  <EditContentModal type="about" user={{...user, skills: []}} />
                </Button>
              </CardHeader>
              <CardContent>
                  {user?.profile?.bio === "" ? <p className="text-gray-700 text-start leading-relaxed">
                No bio yet! Press the edit button to add one.
                </p> : <p className="text-gray-700 leading-relaxed">
                {user?.profile?.bio}
                </p>}

                
              </CardContent>
            </Card>

            {/* Experience Section */}
            <ExperienceSection user={user} />

            {/* Education Section */}
            <EducationSection user={user} />

            <Card className="bg-white shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center space-x-2">
                  <GraduationCap className="h-5 w-5 text-gray-600" />
                  <CardTitle className="text-lg font-semibold">Skills</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                  <EditContentModal type="skills" user={{...user, skills: []}} />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {["React", "TypeScript", "Node.js", "Python", "JavaScript", "MongoDB", "AWS", "Git"].map(
                    (skill, index) => (
                      <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-700">
                        {skill}
                      </Badge>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          
        </div>
      </div>
    </div>
  )
}
