"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Edit,
  MapPin,
  Globe,
  Users,
  MoreHorizontal,
  Mail,
  Phone,
  Settings,
  Briefcase,
  GraduationCap,
} from "lucide-react"
import Header from "../components/Header"
import { ProfileEditModal } from "../components/ProfileEditModal"
import ProfileImageUpload from "@/components/ProfileImageUpload"
import { getAvatarUrl } from "@/lib/image-utils"
import { useRouter } from "next/navigation"
import { EditContentModal } from "../components/EditContentModal"
import Link from "next/link"

interface ProfilePageClientProps {
  lang: 'en' | 'am'
  userWithProfile: any
  posts?: any[]
  peopleAlsoViewed?: Array<{ id: string; name: string; image?: string | null; headline?: string | null; location?: string | null }>
  similarProfiles?: Array<{ id: string; name: string; image?: string | null; headline?: string | null; location?: string | null }>
  connectionCount?: number
}

export default function ProfilePageClient({ lang, userWithProfile, posts = [], peopleAlsoViewed = [], similarProfiles = [], connectionCount }: ProfilePageClientProps) {
  const [currentUser, setCurrentUser] = useState(userWithProfile)
  const router = useRouter()

  const handleImageUpload = (imageUrl: string) => {
    // Update the local state
    setCurrentUser((prev: any) => ({
      ...prev,
      image: imageUrl
    }))
    
    // Refresh the page to get updated data from server
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header lang={lang} user={{
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        image: currentUser.image || undefined,
        headline: currentUser.headline || undefined,
        role: currentUser.role
      }} />

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header */}
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start space-x-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={getAvatarUrl(currentUser.image, currentUser.name)} />
                    <AvatarFallback className="text-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                      {currentUser.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-1">{currentUser.name}</h1>
                        <p className="text-lg text-gray-600 mb-2">{currentUser.headline || "Professional"}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          {currentUser.location && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4" />
                              <span>{currentUser.location}</span>
                            </div>
                          )}
                          <Link href={`/${lang}/connects`} className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{typeof connectionCount === 'number' ? `${connectionCount} connection${connectionCount === 1 ? '' : 's'}` : 'Connections'}</span>
                          </Link>
                        </div>
                        <div className="flex items-center space-x-2">
                          <ProfileEditModal user={currentUser}>
                            <Button size="sm" variant="outline">
                              <Settings className="h-4 w-4 mr-1" />
                              Edit Profile
                            </Button>
                          </ProfileEditModal>
                          
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Picture Upload Section */}
            <ProfileImageUpload
              currentImage={currentUser.image || undefined}
              onImageUpload={handleImageUpload}
              userId={currentUser.id}
              userName={currentUser.name}
            />

            {/* Posts Section */}
            <Card className="bg-white shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">Posts</CardTitle>
              </CardHeader>
              <CardContent>
                {posts && posts.length > 0 ? (
                  <div className="space-y-4">
                    {posts.map((post: any) => (
                      <div key={post.id} className="border rounded-md p-4">
                        <div className="flex items-center space-x-3 mb-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={getAvatarUrl(currentUser.image, currentUser.name)} />
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs">
                              {currentUser.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{currentUser.name}</p>
                            <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                        {post.title && (
                          <h4 className="font-semibold text-gray-900 mb-1">{post.title}</h4>
                        )}
                        <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
                        {/* Images */}
                        {(() => {
                          const imgs: string[] = (Array.isArray(post.images) && post.images.length > 0)
                            ? post.images
                            : (post.imageUrl ? [post.imageUrl] : [])
                          if (!imgs || imgs.length === 0) return null
                          if (imgs.length === 1) {
                            return (
                              <div className="mt-3">
                                <img
                                  src={imgs[0]}
                                  alt="Post image"
                                  className="w-1/2 max-h-[480px] object-cover rounded-lg border"
                                  loading="lazy"
                                />
                              </div>
                            )
                          }
                          const gridCols = imgs.length === 2 ? "grid-cols-2" : "grid-cols-3"
                          return (
                            <div className={`mt-3 grid ${gridCols} gap-2`}>
                              {imgs.map((url, idx) => (
                                <img
                                  key={url}
                                  src={url}
                                  alt={`Post image ${idx + 1}`}
                                  className="w-full h-56 object-cover rounded-lg border"
                                  loading="lazy"
                                />
                              ))}
                            </div>
                          )
                        })()}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center">No posts yet.</p>
                )}
              </CardContent>
            </Card>

            {/* About Section */}
            <Card className="bg-white shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">About</CardTitle>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {currentUser.profile?.bio || "Add a bio to tell others about yourself..."}
                </p>
              </CardContent>
            </Card>

            {/* Experience Section */}
            <Card className="bg-white shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Briefcase className="h-5 w-5 text-gray-600" />
                    <CardTitle className="text-lg font-semibold">Experience</CardTitle>
                  </div>
                  <EditContentModal type="experience" user={{...currentUser, skills: []}} />
                </div>
              </CardHeader>
              <CardContent>
                {currentUser.profile?.experiences && currentUser.profile.experiences.length > 0 ? (
                  <div className="space-y-4">
                    {currentUser.profile.experiences.map((experience: any) => (
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
                ) : (
                  <p className="text-gray-500 text-center">No experience added yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Education Section */}
            <Card className="bg-white shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="h-5 w-5 text-gray-600" />
                    <CardTitle className="text-lg font-semibold">Education</CardTitle>
                  </div>
                  <EditContentModal type="education" user={{...currentUser, skills: []}} />
                </div>
              </CardHeader>
              <CardContent>
                {currentUser.profile?.education && currentUser.profile.education.length > 0 ? (
                  <div className="space-y-4">
                    {currentUser.profile.education.map((education: any) => (
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
                ) : (
                  <p className="text-gray-500 text-center">No education entries yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Skills Section */}
            <Card className="bg-white shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Skills</CardTitle>
                  <EditContentModal type="skills" user={{...currentUser, skills: []}} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Technical Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {currentUser.profile?.skills && currentUser.profile.skills.length > 0 ? (
                        currentUser.profile.skills.map((skillOnProfile: any) => (
                          <Badge key={skillOnProfile.id} variant="secondary" className="bg-blue-100 text-blue-700">
                            {skillOnProfile.skill.name}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">Add your skills to showcase your expertise</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity Section */}
            <Card className="bg-white shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs">
                        {currentUser.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">{currentUser.name}</span> shared a post about new React features
                      </p>
                      <p className="text-xs text-gray-500">2 days ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs">
                        FU
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Fordham University</span> congratulated you on your work anniversary
                      </p>
                      <p className="text-xs text-gray-500">1 week ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                  <span className="text-sm text-gray-700">{currentUser.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{currentUser.phone}</span>
                </div>
                {currentUser.website && (
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-blue-600">{currentUser.website}</span>
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

            {/* Applications Link */}
            <Card className="bg-white shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">Your applications</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/${lang}/jobs/applied`} className="text-blue-600 hover:underline text-sm">
                  View all jobs you applied to
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 