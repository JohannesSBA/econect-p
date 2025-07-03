import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Briefcase, Users } from "lucide-react"
import Link from "next/link"
import { User } from "@/../types/prisma"
import { Separator } from "@/components/ui/separator"

export default function Sidebar({ user, lang }: { user: User, lang: 'en' | 'am' }) {
    return (
        <div className="lg:col-span-1 space-y-6 md:sticky top-20 self-start">
            {/* Profile Card */}
            <Card className="bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="/placeholder.svg?height=48&width=48" />
                    <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-600">{user?.name}</h3>
                    <p className="text-sm text-gray-500">{user?.email}</p>
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
                  <Link href={`/${lang}/profile`}>View Your Profile</Link>
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
    )
}