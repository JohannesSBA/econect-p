"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  MapPin,
  Globe,
  Users,
  MessageSquare,
  MoreHorizontal,
  Mail,
  Phone,
  UserPlus,
  Check,
  Clock,
} from "lucide-react"
import Link from "next/link"
import { chatHrefConstructor } from "@/lib/utils"
import ConnectionButton from "@/components/ConnectionButton"
import { useRouter } from "next/navigation"
import { getAvatarUrl } from "@/lib/image-utils"

interface UserProfileClientProps {
  lang: string
  currentUser: any
  user: any
  connection: any
  isConnected: boolean
  hasPendingRequest: boolean
  isRequestSentByMe: boolean
  peopleAlsoViewed?: Array<{ id: string; name: string; image?: string | null; headline?: string | null; location?: string | null }>
  similarProfiles?: Array<{ id: string; name: string; image?: string | null; headline?: string | null; location?: string | null }>
  connectionCount?: number
}

export default function UserProfileClient({
  lang,
  currentUser,
  user,
  connection,
  isConnected,
  hasPendingRequest,
  isRequestSentByMe
  ,
  peopleAlsoViewed = [],
  similarProfiles = [],
  connectionCount
}: UserProfileClientProps) {
  const router = useRouter()
  const [connectionStatus, setConnectionStatus] = useState(connection?.status || "NONE")
  const [isRequestSentByMeState, setIsRequestSentByMeState] = useState(isRequestSentByMe)

  const handleStatusChange = (status: string, isRequestSentByMe: boolean) => {
    setConnectionStatus(status)
    setIsRequestSentByMeState(isRequestSentByMe)
    
    // Refresh the page after a short delay to update the UI
    setTimeout(() => {
      router.refresh()
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header */}
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start space-x-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={getAvatarUrl(user.image, user.name)} />
                    <AvatarFallback className="text-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                      {user.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-1">{user.name}</h1>
                        <p className="text-lg text-gray-600 mb-2">{user.headline || "Professional"}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          {user.location && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4" />
                              <span>{user.location}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{typeof connectionCount === 'number' ? `${connectionCount} connection${connectionCount === 1 ? '' : 's'}` : 'Connections'}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {connectionStatus === 'ACCEPTED' ? (
                            <Link href={`/${lang}/chat/${chatHrefConstructor(currentUser.id, user.id)}`}>
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Message
                              </Button>
                            </Link>
                          ) : (
                            <ConnectionButton 
                              userId={user.id} 
                              connectionStatus={connectionStatus as any}
                              isRequestSentByMe={isRequestSentByMeState}
                              onStatusChange={handleStatusChange}
                            />
                          )}
                          <Button size="sm" variant="outline">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* About Section */}
            {user.profile?.bio && (
              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold">About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {user.profile.bio}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Experience Section */}
            {user.profile?.experiences && user.profile.experiences.length > 0 && (
              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold">Experience</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {user.profile.experiences.map((experience: any) => (
                      <div key={experience.id} className="border-l-4 border-blue-500 pl-4">
                        <h4 className="font-semibold text-gray-900">{experience.jobTitle}</h4>
                        <p className="text-gray-600">{experience.company}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(experience.startDate).toLocaleDateString()} - 
                          {experience.current ? 'Present' : experience.endDate ? new Date(experience.endDate).toLocaleDateString() : ''}
                        </p>
                        {experience.description && (
                          <p className="text-gray-700 mt-2">{experience.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Education Section */}
            {user.profile?.education && user.profile.education.length > 0 && (
              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold">Education</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {user.profile.education.map((education: any) => (
                      <div key={education.id} className="border-l-4 border-green-500 pl-4">
                        <h4 className="font-semibold text-gray-900">{education.school}</h4>
                        <p className="text-gray-600">{education.fieldOfStudy} - {education.degreeType}</p>
                        <p className="text-sm text-gray-500">
                          {education.StartYear} - {education.EndYear}
                        </p>
                        {education.grade && (
                          <p className="text-sm text-gray-500">Grade: {education.grade}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Skills Section */}
            {user.profile?.skills && user.profile.skills.length > 0 && (
              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold">Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {user.profile.skills.map((skillOnProfile: any) => (
                      <Badge key={skillOnProfile.id} variant="secondary" className="bg-blue-100 text-blue-700">
                        {skillOnProfile.skill.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card className="bg-white shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">Contact info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{user.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{user.phone}</span>
                </div>
                {user.website && (
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-blue-600">{user.website}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Connection Status */}
            <Card className="bg-white shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">Connection</CardTitle>
              </CardHeader>
              <CardContent>
                {connectionStatus === 'ACCEPTED' ? (
                  <div className="flex items-center space-x-2 text-green-600">
                    <Check className="h-4 w-4" />
                    <span className="text-sm">Connected</span>
                  </div>
                ) : connectionStatus === 'PENDING' ? (
                  <div className="flex items-center space-x-2 text-yellow-600">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">
                      {isRequestSentByMeState ? "Request sent" : "Request received"}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <UserPlus className="h-4 w-4" />
                    <span className="text-sm">Not connected</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* People Also Viewed */}
            <Card className="bg-white shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">People also viewed</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {peopleAlsoViewed.length === 0 ? (
                  <p className="text-sm text-gray-500">No suggestions right now.</p>
                ) : (
                  peopleAlsoViewed.map((person) => (
                    <Link href={`/${lang}/user/${person.id}`} key={person.id} className="flex items-center space-x-3 hover:bg-gray-50 p-1 rounded-md">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={getAvatarUrl(person.image, person.name)} />
                        <AvatarFallback className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
                          {person.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{person.name}</p>
                        {person.headline && (
                          <p className="text-xs text-gray-500">{person.headline}</p>
                        )}
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Similar Profiles */}
            <Card className="bg-white shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">Similar profiles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {similarProfiles.length === 0 ? (
                  <p className="text-sm text-gray-500">No similar profiles found.</p>
                ) : (
                  similarProfiles.map((person) => (
                    <Link href={`/${lang}/user/${person.id}`} key={person.id} className="flex items-center space-x-3 hover:bg-gray-50 p-1 rounded-md">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={getAvatarUrl(person.image, person.name)} />
                        <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                          {person.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{person.name}</p>
                        {person.headline && (
                          <p className="text-xs text-gray-500">{person.headline}</p>
                        )}
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 