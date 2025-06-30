import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Home,
  MessageCircle,
  Briefcase,
  Link2,
  Search,
  Bell,
  Users,
  UserPlus,
  Clock,
  Heart,
  MessageSquare,
  Share2,
  ImageIcon,
  FileText,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Econnect
              </span>
              <Badge variant="secondary" className="ml-2 text-xs">
                Ethiopia
              </Badge>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                href="/dashboard"
                className="flex flex-col items-center space-y-1 text-blue-600 border-b-2 border-blue-600 pb-4"
              >
                <Home className="h-5 w-5" />
                <span className="text-sm font-medium">Dashboard</span>
              </Link>
              <Link
                href="/messaging"
                className="flex flex-col items-center space-y-1 text-gray-600 hover:text-blue-600 pb-4"
              >
                <div className="relative">
                  <MessageCircle className="h-5 w-5" />
                  <Badge className="absolute -top-2 -right-2 h-4 w-4 p-0 bg-blue-600 text-white text-xs flex items-center justify-center">
                    1
                  </Badge>
                </div>
                <span className="text-sm">Messaging</span>
              </Link>
              <Link
                href="/listings"
                className="flex flex-col items-center space-y-1 text-gray-600 hover:text-blue-600 pb-4"
              >
                <Briefcase className="h-5 w-5" />
                <span className="text-sm">Listings</span>
              </Link>
              <Link
                href="/connects"
                className="flex flex-col items-center space-y-1 text-gray-600 hover:text-blue-600 pb-4"
              >
                <Link2 className="h-5 w-5" />
                <span className="text-sm">Connects</span>
              </Link>
            </nav>

            {/* Search and Profile */}
            <div className="flex items-center space-x-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search"
                  className="pl-10 w-64 bg-gray-100 border-0 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="relative">
                <Bell className="h-5 w-5 text-gray-600" />
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 bg-blue-600 text-white text-xs flex items-center justify-center">
                  9
                </Badge>
              </div>
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" />
                  <AvatarFallback>JB</AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <div className="text-sm font-medium text-blue-600">Johannes Bekele</div>
                  <div className="text-xs text-gray-500">johannes@econnectpilot.com</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 sticky top-20">
            <Card className="bg-white shadow-sm">
              <CardHeader className="pb-4">
                <h2 className="text-lg font-semibold text-gray-900">Manage Connections</h2>
              </CardHeader>
              <CardContent className="space-y-1">
                <Link
                  href="/connections"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="text-gray-700">Connections</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      4
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </Link>
                <Link
                  href="/grow-network"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <UserPlus className="h-5 w-5 text-green-600" />
                    <span className="text-gray-700">Grow Network</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </Link>
                <Link
                  href="/pending-requests"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <span className="text-gray-700">Pending Requests</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Post */}
            <Card className="bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/placeholder.svg?height=40&width=40" />
                    <AvatarFallback>JB</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Input
                      placeholder="Create new post"
                      className="border-0 bg-gray-50 hover:bg-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-600">
                    <ImageIcon className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Posts Feed */}
            <div className="space-y-6">
              {/* Post 1 */}
              <Card className="bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3 mb-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/placeholder.svg?height=40&width=40" />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                        E
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">Econnect</h3>
                        <Badge variant="secondary" className="text-xs">
                          Company
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">2/11/2025</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-gray-800 mb-2">1</p>
                    <p className="text-gray-800">1</p>
                  </div>

                  <div className="flex items-center space-x-6 mb-4">
                    <button className="flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-colors">
                      <Heart className="h-5 w-5" />
                      <span className="text-sm">1</span>
                    </button>
                    <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors">
                      <MessageSquare className="h-5 w-5" />
                      <span className="text-sm">7</span>
                    </button>
                    <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors">
                      <Share2 className="h-5 w-5" />
                      <span className="text-sm">Share</span>
                    </button>
                  </div>

                  <Separator className="mb-4" />

                  {/* Comments */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs">
                          E
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">Econnect</span>
                          <span className="text-xs text-gray-500">2/12/2025</span>
                        </div>
                        <p className="text-sm text-gray-700">new comment</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs">
                          E
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">Econnect</span>
                          <span className="text-xs text-gray-500">2/12/2025</span>
                        </div>
                        <p className="text-sm text-gray-700">test?</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs">
                          E
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">Econnect</span>
                          <span className="text-xs text-gray-500">2/12/2025</span>
                        </div>
                        <p className="text-sm text-gray-700">test for author id</p>
                      </div>
                    </div>
                  </div>

                  <button className="text-blue-600 text-sm hover:text-blue-700 mb-4">Show more comments</button>

                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder.svg?height=32&width=32" />
                      <AvatarFallback>JB</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex space-x-2">
                      <Input placeholder="Add a comment..." className="flex-1 border-gray-200" />
                      <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                        Post
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Post 2 */}
              <Card className="bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3 mb-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/placeholder.svg?height=40&width=40" />
                      <AvatarFallback className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                        FU
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">Fordham University</h3>
                        <Badge variant="secondary" className="text-xs">
                          University
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">2/4/2025</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-gray-800 mb-2">hi there</p>
                    <p className="text-gray-800">just using this as a test</p>
                  </div>

                  <div className="flex items-center space-x-6">
                    <button className="flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-colors">
                      <Heart className="h-5 w-5" />
                      <span className="text-sm">Like</span>
                    </button>
                    <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors">
                      <MessageSquare className="h-5 w-5" />
                      <span className="text-sm">Comment</span>
                    </button>
                    <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors">
                      <Share2 className="h-5 w-5" />
                      <span className="text-sm">Share</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 space-y-6 sticky top-20">
            {/* Profile Card */}
            <Card className="bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="/placeholder.svg?height=48&width=48" />
                    <AvatarFallback>JB</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-600">Johannes Bekele</h3>
                    <p className="text-sm text-gray-500">johannes@econnectpilot.com</p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Your Connections</span>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700">4</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Your Posts</span>
                    </div>
                    <Badge className="bg-gray-100 text-gray-700">0</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Briefcase className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Open Job Applications</span>
                    </div>
                    <Badge className="bg-green-100 text-green-700">2</Badge>
                  </div>
                </div>

                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  View Your Profile
                </Button>
              </CardContent>
            </Card>

            {/* Footer Links */}
            <Card className="bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
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
        </div>
      </div>
    </div>
  )
}
