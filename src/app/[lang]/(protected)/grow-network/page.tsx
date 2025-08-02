import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Search,
  Users,
  UserPlus,
  MapPin,
  Building,
  Filter,
  Star,
  MessageSquare,
  Globe,
  GraduationCap,
  Briefcase,
} from "lucide-react"
import Link from "next/link"
import Header from "../components/Header"
import { getCurrentUser } from "@/lib/getCurrentUser"
import { User } from "@/../types/prisma"
import prisma from "@/lib/prisma"

export default async function GrowNetworkPage({ params }: { params: Promise<{ lang: 'en' | 'am' }> }) {
  const { lang } = await params
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

  // Fetch users who are not connected to the current user
  const suggestedUsers = await prisma.user.findMany({
    where: {
      AND: [
        { id: { not: user.id } },
        { role: 'JOB_SEEKER' },
        {
          OR: [
            {
              sentConnections: {
                none: {
                  OR: [
                    { receiverId: user.id },
                    { senderId: user.id }
                  ]
                }
              }
            },
            {
              receivedConnections: {
                none: {
                  OR: [
                    { receiverId: user.id },
                    { senderId: user.id }
                  ]
                }
              }
            }
          ]
        }
      ]
    },
    include: {
      profile: {
        include: {
          skills: {
            include: {
              skill: true
            }
          },
          education: true
        }
      }
    },
    take: 12
  })

  // Get users with similar education (alumni)
  const alumniUsers = await prisma.user.findMany({
    where: {
      AND: [
        { id: { not: user.id } },
        { role: 'JOB_SEEKER' },
        {
          profile: {
            education: {
              some: {
                school: {
                  in: user.profile?.education?.map((e: { school: string }) => e.school) || []
                }
              }
            }
          }
        }
      ]
    },
    include: {
      profile: {
        include: {
          education: true
        }
      }
    },
    take: 6
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Header lang={lang} user={user} />

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-white shadow-sm sticky top-20">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Grow Network</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Link href="/grow-network" className="flex items-center space-x-2 p-2 rounded-lg bg-blue-50 text-blue-700">
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-medium">Suggested for you</span>
                  </Link>
                  <Link href="/grow-network?type=alumni" className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 text-gray-700">
                    <GraduationCap className="h-4 w-4" />
                    <span className="text-sm">Alumni</span>
                  </Link>
                  <Link href="/grow-network?type=colleagues" className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 text-gray-700">
                    <Briefcase className="h-4 w-4" />
                    <span className="text-sm">Colleagues</span>
                  </Link>
                  <Link href="/grow-network?type=industry" className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 text-gray-700">
                    <Building className="h-4 w-4" />
                    <span className="text-sm">Industry</span>
                  </Link>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Filter by</h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-gray-300" />
                      <span className="text-sm text-gray-700">Same industry</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-gray-300" />
                      <span className="text-sm text-gray-700">Same location</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-gray-300" />
                      <span className="text-sm text-gray-700">High mutual connections</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-gray-300" />
                      <span className="text-sm text-gray-700">Recently active</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search and Actions */}
            <Card className="bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search people to connect with..."
                      className="pl-10 border-gray-200"
                    />
                  </div>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Suggested Connections */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">People you may know</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {suggestedUsers.map((person) => (
                    <div key={person.id} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={person.image || "/placeholder.svg?height=48&width=48"} />
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                          {person.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">{person.name}</h3>
                        <p className="text-gray-600 text-sm">{person.headline}</p>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                          {person.location && (
                            <>
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3" />
                                <span>{person.location}</span>
                              </div>
                              <span>•</span>
                            </>
                          )}
                          <span>0 mutual</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {person.profile?.skills?.slice(0, 2).map((skillOnProfile) => (
                            <Badge key={skillOnProfile.skill.id} variant="secondary" className="text-xs">
                              {skillOnProfile.skill.name}
                            </Badge>
                          ))}
                        </div>
                        {person.profile?.education?.[0] && (
                          <p className="text-xs text-gray-500 mt-1">{person.profile.education[0].school}</p>
                        )}
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <UserPlus className="h-4 w-4 mr-1" />
                          Connect
                        </Button>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Alumni Connections */}
            {alumniUsers.length > 0 && (
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Alumni from your school</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {alumniUsers.map((person) => (
                      <div key={person.id} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={person.image || "/placeholder.svg?height=48&width=48"} />
                          <AvatarFallback className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
                            {person.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900">{person.name}</h3>
                          <p className="text-gray-600 text-sm">{person.headline}</p>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                            {person.profile?.education?.[0] && (
                              <>
                                <div className="flex items-center space-x-1">
                                  <GraduationCap className="h-3 w-3" />
                                  <span>{person.profile.education[0].school} • {person.profile.education[0].EndYear}</span>
                                </div>
                                <span>•</span>
                              </>
                            )}
                            <span>0 mutual</span>
                          </div>
                          <div className="flex items-center space-x-1 mt-2">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span className="text-xs text-gray-600">Alumni connection</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            <UserPlus className="h-4 w-4 mr-1" />
                            Connect
                          </Button>
                          <Button size="sm" variant="outline">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Message
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Network Growth Tips */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Tips to grow your network</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">Connect with colleagues</h4>
                    <p className="text-sm text-gray-600">Build relationships with people you work with</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Globe className="h-6 w-6 text-green-600" />
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">Join industry groups</h4>
                    <p className="text-sm text-gray-600">Participate in discussions and connect with members</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <MessageSquare className="h-6 w-6 text-purple-600" />
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">Engage with content</h4>
                    <p className="text-sm text-gray-600">Like, comment, and share posts to increase visibility</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 