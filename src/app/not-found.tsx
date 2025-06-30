import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Home, Search, ArrowRight, Briefcase, Users, HelpCircle, Sparkles} from "lucide-react"
import Header from "@/components/Header"
export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
      {/* Header */}
      <Header lang="en" />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* 404 Visual */}
          <div className="relative mb-12">
            <div className="text-[12rem] md:text-[16rem] font-black leading-none">
              <span className="bg-gradient-to-r from-green-500 via-purple-500 to-blue-500 bg-clip-text text-transparent animate-pulse">
                4
              </span>
              <span className="bg-gradient-to-r from-blue-500 via-teal-500 to-green-500 bg-clip-text text-transparent animate-pulse delay-150">
                0
              </span>
              <span className="bg-gradient-to-r from-green-500 via-yellow-500 to-orange-500 bg-clip-text text-transparent animate-pulse delay-300">
                4
              </span>
            </div>

            {/* Floating Elements */}
            <div className="absolute top-1/2 left-1/4 transform -translate-y-1/2">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full opacity-20 animate-bounce"></div>
            </div>
            <div className="absolute top-1/3 right-1/4 transform -translate-y-1/2">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-teal-400 rounded-full opacity-30 animate-bounce delay-200"></div>
            </div>
            <div className="absolute bottom-1/4 left-1/3 transform translate-y-1/2">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full opacity-25 animate-bounce delay-500"></div>
            </div>
          </div>

          {/* Error Message */}
          <div className="space-y-6 mb-12">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Sparkles className="h-6 w-6 text-purple-500" />
              <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200">
                Oops! Page Not Found
              </Badge>
              <Sparkles className="h-6 w-6 text-pink-500" />
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                Lost in the Job Hunt?
              </span>
            </h1>

            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Don&apos;t worry! Even the best career paths have detours. The page you&apos;re looking for seems to have found a
              better opportunity elsewhere.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-md mx-auto mb-12">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Search className="h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search for jobs, companies, or pages..."
                    className="border-0 bg-transparent focus:ring-0 text-lg"
                  />
                  <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
              >
                <Home className="mr-2 h-5 w-5" />
                Back to Home
              </Button>
            </Link>
            <Link href="/jobs">
              <Button
                variant="outline"
                size="lg"
                className="bg-white/80 backdrop-blur-sm border-purple-200 text-purple-700 hover:bg-purple-50 px-8 py-3"
              >
                <Briefcase className="mr-2 h-5 w-5" />
                Browse Jobs
              </Button>
            </Link>
          </div>

          {/* Popular Links */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-blue-50 to-purple-50">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Briefcase className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Find Jobs</h3>
                <p className="text-gray-600 mb-4">Discover thousands of job opportunities across Ethiopia</p>
                <Link href="/jobs">
                  <Button variant="ghost" className="text-blue-600 hover:text-blue-700">
                    Explore Jobs <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-purple-50 to-pink-50">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Join Community</h3>
                <p className="text-gray-600 mb-4">Connect with professionals and expand your network</p>
                <Link href="/community">
                  <Button variant="ghost" className="text-purple-600 hover:text-purple-700">
                    Join Now <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-teal-50 to-green-50">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-teal-500 to-green-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <HelpCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Get Help</h3>
                <p className="text-gray-600 mb-4">Need assistance? Our support team is here to help</p>
                <Link href="/support">
                  <Button variant="ghost" className="text-teal-600 hover:text-teal-700">
                    Contact Support <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Fun Stats */}
          {/* <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
            {[
              { icon: Zap, number: "99.9%", label: "Uptime", color: "from-yellow-400 to-orange-400" },
              { icon: Users, number: "50K+", label: "Happy Users", color: "from-blue-400 to-purple-400" },
              { icon: Briefcase, number: "10K+", label: "Jobs Posted", color: "from-green-400 to-teal-400" },
              { icon: MessageCircle, number: "24/7", label: "Support", color: "from-pink-400 to-red-400" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div
                  className={`w-12 h-12 mx-auto mb-2 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center`}
                >
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.number}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div> */}
        </div>
      </div>

      {/* Background Decorative Elements */}
      <div className="fixed top-20 left-10 w-32 h-32 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full opacity-10 blur-3xl animate-pulse"></div>
      <div className="fixed top-1/2 right-10 w-40 h-40 bg-gradient-to-r from-blue-400 to-teal-400 rounded-full opacity-10 blur-3xl animate-pulse delay-1000"></div>
      <div className="fixed bottom-20 left-1/4 w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full opacity-10 blur-3xl animate-pulse delay-500"></div>
      <div className="fixed top-1/4 left-1/2 w-16 h-16 bg-gradient-to-r from-green-400 to-blue-400 rounded-full opacity-15 blur-2xl animate-pulse delay-2000"></div>

      {/* Floating Geometric Shapes */}
      <div className="fixed top-1/3 right-1/4 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg opacity-20 animate-bounce delay-700 rotate-45"></div>
      <div className="fixed bottom-1/3 left-1/3 w-6 h-6 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full opacity-25 animate-bounce delay-1500"></div>
      <div className="fixed top-2/3 left-1/5 w-10 h-10 bg-gradient-to-r from-yellow-500 to-red-500 rounded-lg opacity-20 animate-bounce delay-300 rotate-12"></div>
    </div>
  )
}
